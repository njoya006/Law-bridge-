import requests
from django.conf import settings
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.auth_proxy import get_uuid_from_request, get_role_from_request
from .models import Thread, ThreadParticipant, Message, MessageReaction
from .serializers import ThreadSerializer, ThreadCreateSerializer, MessageSerializer


def _user_id(request):
    return get_uuid_from_request(request) or ''


def _role(request):
    return get_role_from_request(request)


def _display_name(request):
    p = getattr(request, 'auth_payload', {})
    return p.get('name') or p.get('email') or 'Unknown'


class ThreadListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        uid = _user_id(request)
        thread_ids = ThreadParticipant.objects.filter(
            user_id=uid, is_active=True
        ).values_list('thread_id', flat=True)
        threads = Thread.objects.filter(id__in=thread_ids).prefetch_related('participants', 'messages')
        serializer = ThreadSerializer(threads, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request):
        ser = ThreadCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        data = ser.validated_data

        uid = _user_id(request)
        role = _role(request)
        name = _display_name(request)

        # Support threads start as AI-assisted
        is_ai = data['thread_type'] == 'client_support'

        thread = Thread.objects.create(
            thread_type=data['thread_type'],
            case_id=data['case_id'],
            case_ref=data.get('case_ref', ''),
            case_title=data.get('case_title', ''),
            subject=data.get('subject', ''),
            is_ai_support=is_ai,
        )

        # Add requesting user as first participant
        ThreadParticipant.objects.create(
            thread=thread, user_id=uid, display_name=name, role=role,
        )

        # Add any extra participants passed in
        for p in data.get('participants', []):
            if p.get('user_id') and p['user_id'] != uid:
                ThreadParticipant.objects.get_or_create(
                    thread=thread,
                    user_id=p['user_id'],
                    defaults={
                        'display_name': p.get('display_name', 'Unknown'),
                        'role': p.get('role', 'lawyer'),
                        'firm_id': p.get('firm_id'),
                    },
                )

        # Welcome system message
        welcome = Message.objects.create(
            thread=thread,
            sender_id='system',
            sender_name='LawBridge',
            sender_role='system',
            content=_welcome_text(data['thread_type'], data.get('case_title', '')),
            is_system=True,
        )

        # For support threads, add an AI greeting
        if is_ai:
            Message.objects.create(
                thread=thread,
                sender_id='ai',
                sender_name='LawBridge AI',
                sender_role='support',
                content='Hello! I\'m the LawBridge AI assistant. I\'m here to help with your query. You can ask me anything about your case or legal process. If your issue requires a human support agent, tap "Escalate to human" at any time.',
                is_ai=True,
            )

        out = ThreadSerializer(thread, context={'request': request})
        return Response(out.data, status=status.HTTP_201_CREATED)


class ThreadDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_thread(self, request, pk):
        uid = _user_id(request)
        try:
            thread = Thread.objects.prefetch_related('participants', 'messages').get(pk=pk)
        except Thread.DoesNotExist:
            return None, None
        if not thread.participants.filter(user_id=uid, is_active=True).exists():
            return None, None
        return thread, uid

    def get(self, request, pk):
        thread, _ = self._get_thread(request, pk)
        if not thread:
            return Response({'error': 'Not found'}, status=404)
        return Response(ThreadSerializer(thread, context={'request': request}).data)


class MessageListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        uid = _user_id(request)
        role = _role(request)
        if role in ('admin', 'support'):
            if not Thread.objects.filter(pk=pk).exists():
                return Response({'error': 'Not found'}, status=404)
        elif not ThreadParticipant.objects.filter(thread_id=pk, user_id=uid, is_active=True).exists():
            return Response({'error': 'Not found'}, status=404)
        msgs = Message.objects.filter(thread_id=pk, is_deleted=False).prefetch_related('reactions')
        before_id = request.query_params.get('before')
        if before_id:
            msgs = msgs.filter(id__lt=before_id)
        msgs = msgs.order_by('-created_at')[:50]
        return Response(MessageSerializer(reversed(list(msgs)), many=True).data)

    def post(self, request, pk):
        """REST fallback for sending a message (WebSocket is preferred)."""
        uid = _user_id(request)
        role = _role(request)
        try:
            thread = Thread.objects.get(pk=pk)
        except Thread.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)
        if role not in ('admin', 'support'):
            if not thread.participants.filter(user_id=uid, is_active=True).exists():
                return Response({'error': 'Not found'}, status=404)

        content = request.data.get('content', '').strip()
        if not content:
            return Response({'error': 'content required'}, status=400)

        # Admin messages display as support-side bubbles in the client's chat
        sender_role = 'support' if role == 'admin' else role
        msg = Message.objects.create(
            thread=thread,
            sender_id=uid,
            sender_name=_display_name(request),
            sender_role=sender_role,
            content=content,
        )
        thread.updated_at = timezone.now()
        thread.save(update_fields=['updated_at'])

        # If AI support thread and not escalated, get AI reply
        if thread.is_ai_support and not thread.escalated_to_human:
            _fetch_ai_reply(thread, content)

        return Response(MessageSerializer(msg).data, status=201)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_read(request, pk):
    uid = _user_id(request)
    ThreadParticipant.objects.filter(thread_id=pk, user_id=uid).update(last_read_at=timezone.now())
    return Response({'status': 'ok'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def escalate_thread(request, pk):
    uid = _user_id(request)
    try:
        thread = Thread.objects.get(pk=pk)
    except Thread.DoesNotExist:
        return Response({'error': 'Not found'}, status=404)
    if not thread.participants.filter(user_id=uid, is_active=True).exists():
        return Response({'error': 'Not found'}, status=404)
    if not thread.is_ai_support:
        return Response({'error': 'Not a support thread'}, status=400)

    thread.escalated_to_human = True
    thread.save(update_fields=['escalated_to_human'])

    # Ensure support role participant exists
    ThreadParticipant.objects.get_or_create(
        thread=thread,
        user_id='support_team',
        defaults={'display_name': 'LawBridge Support', 'role': 'support'},
    )

    Message.objects.create(
        thread=thread,
        sender_id='system',
        sender_name='LawBridge',
        sender_role='system',
        content='Your request has been escalated to a human support agent. A member of our team will respond shortly during business hours.',
        is_system=True,
    )

    return Response({'status': 'escalated'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_reaction(request, pk, message_id):
    uid = _user_id(request)
    if not ThreadParticipant.objects.filter(thread_id=pk, user_id=uid, is_active=True).exists():
        return Response({'error': 'Not found'}, status=404)

    emoji = request.data.get('emoji', '')
    if not emoji:
        return Response({'error': 'emoji required'}, status=400)

    try:
        msg = Message.objects.get(pk=message_id, thread_id=pk)
    except Message.DoesNotExist:
        return Response({'error': 'Not found'}, status=404)

    obj, created = MessageReaction.objects.get_or_create(
        message=msg, user_id=uid, emoji=emoji,
        defaults={'display_name': _display_name(request)},
    )
    if not created:
        obj.delete()
        return Response({'added': False})
    return Response({'added': True})


# ── Helpers ────────────────────────────────────────────────────────────────────

class AdminSupportThreadsView(APIView):
    """GET /api/v1/messages/admin/threads/ — all client_support threads for support/admin roles."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        role = _role(request)
        if role not in ('support', 'admin'):
            return Response({'detail': 'Forbidden'}, status=403)
        threads = Thread.objects.filter(
            thread_type='client_support'
        ).prefetch_related('participants').order_by('-updated_at')
        serializer = ThreadSerializer(threads, many=True, context={'request': request})
        return Response(serializer.data)


def _welcome_text(thread_type, case_title):
    names = {
        'client_lawyer': 'lawyer',
        'client_firm': 'firm',
        'client_support': 'LawBridge Support',
        'firm_internal': 'your team',
    }
    recipient = names.get(thread_type, 'the other party')
    case_info = f' regarding "{case_title}"' if case_title else ''
    return f'This conversation{case_info} is now open. All messages are encrypted and kept confidential.'


def _fetch_ai_reply(thread, user_message):
    try:
        resp = requests.post(
            f'{settings.AI_SERVICE_URL}/api/v1/ai/support-reply/',
            json={'message': user_message, 'case_id': thread.case_id},
            headers={'X-Internal-Key': settings.INTERNAL_API_KEY},
            timeout=15,
        )
        if resp.status_code == 200:
            ai_content = resp.json().get('reply', '')
        else:
            ai_content = 'I\'m having trouble responding right now. A human agent will review your message soon.'
    except Exception:
        ai_content = 'I\'m having trouble responding right now. A human agent will review your message soon.'

    Message.objects.create(
        thread=thread,
        sender_id='ai',
        sender_name='LawBridge AI',
        sender_role='support',
        content=ai_content,
        is_ai=True,
    )
