import json
from datetime import datetime

import requests
from django.conf import settings
from django.http import StreamingHttpResponse
from langdetect import detect
from rest_framework.permissions import IsAuthenticated
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import ChatSession
from .serializers import ChatSessionSerializer
from apps.utils.ollama_client import ollama


def get_case_context(case_id: str, internal_api_key: str) -> str:
    try:
        response = requests.get(
            f"{settings.CASE_SERVICE_URL}/api/v1/cases/{case_id}/summary/",
            headers={'X-Internal-Api-Key': internal_api_key},
            timeout=5,
        )
        if response.status_code == 200:
            data = response.json()
            return f"""
CASE CONTEXT (Use this to answer case-specific questions):
Case Type: {data.get('case_type')}
Circuit: {data.get('circuit')} ({data.get('legal_tradition')})
Status: {data.get('status')}
Description: {data.get('description', '')[:500]}
"""
    except Exception:
        pass
    return ""


class ChatView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user_message = request.data.get('message', '').strip()
        session_id = request.data.get('session_id')
        case_id = request.data.get('case_id')

        if not user_message:
            return Response({'error': 'Message is required'}, status=400)

        try:
            detected_lang = detect(user_message)
            language = 'fr' if detected_lang == 'fr' else 'en'
        except Exception:
            language = 'en'

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
                title=user_message[:50],
                messages=[],
            )

        history = ''
        for msg in session.messages[-10:]:
            role = 'User' if msg.get('role') == 'user' else 'LexAI'
            history += f"{role}: {msg.get('content')}\n"

        case_context = ''
        if session.case_id:
            case_context = get_case_context(str(session.case_id), settings.INTERNAL_API_KEY)

        full_prompt = f"""
{case_context}

CONVERSATION HISTORY:
{history}

User: {user_message}
LexAI:"""

        session.messages.append({
            'role': 'user',
            'content': user_message,
            'timestamp': datetime.utcnow().isoformat(),
        })
        session.save()

        def stream_response():
            full_response = ''
            yield f"data: {json.dumps({'session_id': str(session.id)})}\n\n"

            try:
                for chunk in ollama.generate(
                    model=settings.OLLAMA_CHAT_MODEL,
                    prompt=full_prompt,
                    stream=True,
                ):
                    token = chunk.get('response', '')
                    if token:
                        full_response += token
                        yield f"data: {json.dumps({'token': token})}\n\n"

                    if chunk.get('done'):
                        session.messages.append({
                            'role': 'assistant',
                            'content': full_response,
                            'timestamp': datetime.utcnow().isoformat(),
                        })
                        session.save()
                        yield f"data: {json.dumps({'done': True})}\n\n"
                        break
            except Exception as exc:
                yield f"data: {json.dumps({'error': str(exc)})}\n\n"

        response = StreamingHttpResponse(
            stream_response(),
            content_type='text/event-stream',
        )
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


class TestGenerateView(APIView):
    """Lightweight unauthenticated proxy endpoint for frontend development.
    POST payload: {"model": "phi3", "prompt": "..."}
    Returns: {"response": "..."}
    """
    permission_classes = [AllowAny]

    def post(self, request):
        model = request.data.get('model') or request.query_params.get('model')
        prompt = request.data.get('prompt') or request.query_params.get('prompt')
        if not model or not prompt:
            return Response({'error': 'model and prompt are required'}, status=400)

        try:
            result = ollama.generate(model=model, prompt=prompt, stream=False)
            return Response({'response': result.get('response', '')})
        except Exception as exc:
            return Response({'error': str(exc)}, status=500)

