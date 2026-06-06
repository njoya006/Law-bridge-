import json
import logging
from datetime import datetime

from django.conf import settings
from django.http import StreamingHttpResponse
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.renderers import JSONRenderer, BaseRenderer
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import ChatSession
from .serializers import ChatSessionSerializer
from apps.utils.ai_client import get_ai_client

logger = logging.getLogger(__name__)


class ServerSentEventRenderer(BaseRenderer):
    """Allows DRF content negotiation to accept Accept: text/event-stream."""
    media_type = 'text/event-stream'
    format = 'text'
    charset = 'utf-8'

    def render(self, data, accepted_media_type=None, renderer_context=None):
        return data


class ChatView(APIView):
    permission_classes = [IsAuthenticated]
    renderer_classes = [ServerSentEventRenderer, JSONRenderer]

    def post(self, request):
        user_message = request.data.get('message', '').strip()
        session_id = request.data.get('session_id')
        case_id = request.data.get('case_id')

        if not user_message:
            return Response({'error': 'Message is required'}, status=400)

        # Detect language
        language = 'en'
        try:
            from langdetect import detect
            detected = detect(user_message)
            language = 'fr' if detected == 'fr' else 'en'
        except Exception:
            pass

        # Get or create session
        if session_id:
            try:
                session = ChatSession.objects.get(id=session_id, user_id=str(request.user.id))
            except ChatSession.DoesNotExist:
                return Response({'error': 'Session not found'}, status=404)
        else:
            session = ChatSession.objects.create(
                user_id=str(request.user.id),
                case_id=case_id,
                language=language,
                title=user_message[:60],
                messages=[],
            )

        # Append user message to history
        session.messages.append({
            'role': 'user',
            'content': user_message,
            'timestamp': datetime.utcnow().isoformat(),
        })
        session.save()

        # Optional case context from case-service
        case_context = ''
        if session.case_id:
            try:
                import requests as req
                r = req.get(
                    f"{settings.CASE_SERVICE_URL}/api/v1/cases/{session.case_id}/summary/",
                    headers={'X-Internal-Api-Key': getattr(settings, 'INTERNAL_API_KEY', '')},
                    timeout=4,
                )
                if r.status_code == 200:
                    d = r.json()
                    case_context = (
                        f"CASE CONTEXT:\nType: {d.get('case_type')} | "
                        f"Circuit: {d.get('circuit')} ({d.get('legal_tradition')}) | "
                        f"Status: {d.get('status')}\n"
                        f"Description: {str(d.get('description', ''))[:400]}"
                    )
            except Exception:
                pass

        def stream_response():
            yield f"data: {json.dumps({'session_id': str(session.id)})}\n\n"

            full_response = ''
            try:
                ai = get_ai_client(settings)
                for token in ai.stream(
                    user_message=user_message,
                    history=session.messages[:-1],  # exclude the message we just appended
                    case_context=case_context,
                ):
                    full_response += token
                    yield f"data: {json.dumps({'token': token})}\n\n"

                # Persist assistant reply
                session.messages.append({
                    'role': 'assistant',
                    'content': full_response,
                    'timestamp': datetime.utcnow().isoformat(),
                })
                session.save()
                yield f"data: {json.dumps({'done': True})}\n\n"

            except Exception as exc:
                logger.exception("AI generation error")
                err = str(exc)
                # Translate raw connection errors into friendly messages
                if 'Name or service not known' in err or 'Connection refused' in err or 'Connect call failed' in err:
                    friendly = (
                        "The AI model is not reachable right now. "
                        "Please contact support or try again later."
                    )
                elif 'api_key' in err.lower() or 'authentication' in err.lower():
                    friendly = "AI service is not configured yet. Contact your administrator."
                else:
                    friendly = f"AI error: {err}"
                yield f"data: {json.dumps({'error': friendly})}\n\n"

        response = StreamingHttpResponse(stream_response(), content_type='text/event-stream')
        response['Cache-Control'] = 'no-cache'
        response['X-Accel-Buffering'] = 'no'
        return response


class ChatSessionListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        sessions = ChatSession.objects.filter(user_id=str(request.user.id)).values(
            'id', 'title', 'language', 'case_id', 'updated_at'
        )
        return Response(list(sessions))


class ChatSessionDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, session_id):
        try:
            session = ChatSession.objects.get(id=session_id, user_id=str(request.user.id))
            return Response(ChatSessionSerializer(session).data)
        except ChatSession.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)

    def delete(self, request, session_id):
        try:
            session = ChatSession.objects.get(id=session_id, user_id=str(request.user.id))
            session.delete()
            return Response(status=204)
        except ChatSession.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)
