import json
import logging
from datetime import datetime

from django.conf import settings
from django.http import StreamingHttpResponse
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.renderers import JSONRenderer, BaseRenderer
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import ChatSession, LegalDraft
from .serializers import ChatSessionSerializer
from apps.utils.ai_client import get_ai_client, LEGAL_SYSTEM_PROMPT

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

        # Determine portal from JWT role ('client' role -> client portal, everything else -> lawyer)
        portal = 'client' if (getattr(request.user, 'role', '') or '') == 'client' else 'lawyer'

        # Get or create session
        if session_id:
            try:
                session = ChatSession.objects.get(id=session_id, user_id=str(request.user.id), portal=portal)
            except ChatSession.DoesNotExist:
                return Response({'error': 'Session not found'}, status=404)
        else:
            session = ChatSession.objects.create(
                user_id=str(request.user.id),
                portal=portal,
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
        portal = 'client' if (getattr(request.user, 'role', '') or '') == 'client' else 'lawyer'
        sessions = ChatSession.objects.filter(user_id=str(request.user.id), portal=portal).values(
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


DRAFT_TYPE_PROMPTS = {
    'letter_to_client':    'Draft a formal letter from the lawyer to the client.',
    'letter_to_court':     'Draft a formal letter addressed to the court.',
    'motion':              'Draft a legal motion (requête) to be filed in court.',
    'contract_clause':     'Draft a specific contract clause or set of clauses.',
    'memorandum':          'Draft a legal memorandum (note de service / memo juridique).',
    'demand_letter':       'Draft a demand letter (lettre de mise en demeure).',
    'affidavit':           'Draft a sworn affidavit (déclaration sous serment).',
    'settlement_proposal': 'Draft a settlement proposal between the parties.',
    'appeal_brief':        'Draft an appeal brief (mémoire d\'appel) for court filing.',
    'other':               'Draft the legal document as described.',
}


class LegalDraftCreateView(APIView):
    """POST /api/v1/ai/drafts/ — generate a legal document draft using AI."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        draft_type = (request.data.get('draft_type') or 'other').strip()
        instructions = (request.data.get('instructions') or '').strip()
        case_id = request.data.get('case_id')
        title = (request.data.get('title') or '').strip()

        if not instructions:
            return Response({'error': 'instructions are required'}, status=400)

        valid_types = [t for t, _ in LegalDraft.DRAFT_TYPES]
        if draft_type not in valid_types:
            draft_type = 'other'

        # Optional case context
        case_context = ''
        if case_id:
            try:
                import requests as req
                r = req.get(
                    f"{settings.CASE_SERVICE_URL}/api/v1/cases/{case_id}/summary/",
                    headers={'X-Internal-Api-Key': getattr(settings, 'INTERNAL_API_KEY', '')},
                    timeout=4,
                )
                if r.status_code == 200:
                    d = r.json()
                    case_context = (
                        f"CASE CONTEXT:\nType: {d.get('case_type')} | "
                        f"Circuit: {d.get('circuit')} ({d.get('legal_tradition')}) | "
                        f"Status: {d.get('status')}\n"
                        f"Parties: {str(d.get('description', ''))[:300]}"
                    )
            except Exception:
                pass

        type_prompt = DRAFT_TYPE_PROMPTS.get(draft_type, DRAFT_TYPE_PROMPTS['other'])
        draft_prompt = (
            f"{LEGAL_SYSTEM_PROMPT}\n\n"
            "You are now in DOCUMENT DRAFTING MODE. Do not include explanations or commentary — "
            "output only the complete, professionally formatted legal document text.\n\n"
            f"Document type: {type_prompt}\n"
        )
        if case_context:
            draft_prompt += f"\n{case_context}\n"
        draft_prompt += f"\nLawyer's instructions:\n{instructions}\n\nDraft:"

        try:
            ai = get_ai_client(settings)
            full_content = ''
            for token in ai.stream(
                user_message=draft_prompt,
                history=[],
                case_context='',
            ):
                full_content += token
        except Exception as exc:
            logger.exception("AI draft generation error")
            return Response({'error': f'Draft generation failed: {exc}'}, status=502)

        draft = LegalDraft.objects.create(
            user_id=str(request.user.id),
            case_id=case_id,
            draft_type=draft_type,
            title=title or f"{dict(LegalDraft.DRAFT_TYPES).get(draft_type, 'Draft')}",
            instructions=instructions,
            content=full_content,
        )
        return Response({
            'id': str(draft.id),
            'draft_type': draft.draft_type,
            'title': draft.title,
            'instructions': draft.instructions,
            'content': draft.content,
            'case_id': draft.case_id,
            'created_at': draft.created_at.isoformat(),
        }, status=201)


def _default_clarify_questions(draft_type: str) -> list:
    common = [
        {"id": "party_name", "label": "Full legal name of the primary party / client", "placeholder": "e.g., Mr. Jean-Baptiste Kamga", "required": True},
        {"id": "date", "label": "Key date (event, hearing, signing, deadline)", "placeholder": "e.g., 15 June 2026", "required": True},
    ]
    extras: dict = {
        'letter_to_client': [
            {"id": "client_address", "label": "Client's full postal address", "placeholder": "e.g., BP 1234, Yaoundé, Centre Region", "required": True},
            {"id": "matter_ref", "label": "Matter reference or subject", "placeholder": "e.g., Advice re: property dispute at Lot 45 Bastos", "required": False},
        ],
        'demand_letter': [
            {"id": "amount", "label": "Amount demanded (with currency)", "placeholder": "e.g., XAF 2,500,000", "required": True},
            {"id": "response_deadline", "label": "Deadline for the opposing party to respond", "placeholder": "e.g., within 14 days of receipt", "required": True},
            {"id": "opposing_address", "label": "Opposing party's full address", "placeholder": "e.g., BP 9876, Douala, Littoral Region", "required": True},
        ],
        'motion': [
            {"id": "court_name", "label": "Full name of the court", "placeholder": "e.g., Tribunal de Grande Instance du Wouri, Douala", "required": True},
            {"id": "case_number", "label": "Dossier / case number", "placeholder": "e.g., No. 123/CIV/2026", "required": True},
            {"id": "relief_sought", "label": "Specific relief or order being sought", "placeholder": "e.g., dismissal of the claimant's motion for provisional measures", "required": True},
        ],
        'affidavit': [
            {"id": "deponent", "label": "Full name and occupation of the deponent", "placeholder": "e.g., Marie Ngo, Accountant", "required": True},
            {"id": "id_details", "label": "Deponent's ID / National ID number", "placeholder": "e.g., CNI No. 1234567890", "required": False},
            {"id": "sworn_facts", "label": "Key facts to be sworn to", "placeholder": "e.g., I witnessed the signing on 10 June 2026 at Douala", "required": True},
        ],
        'settlement_proposal': [
            {"id": "settlement_amount", "label": "Proposed settlement amount or terms", "placeholder": "e.g., XAF 5,000,000 payable in 3 instalments", "required": True},
            {"id": "opposing_party", "label": "Full name of the opposing party", "placeholder": "e.g., Société Acacia SARL", "required": True},
        ],
        'letter_to_court': [
            {"id": "court_name", "label": "Full name and location of the court", "placeholder": "e.g., Cour d'Appel du Littoral, Douala", "required": True},
            {"id": "case_ref", "label": "Case reference / dossier number", "placeholder": "e.g., Dossier No. 456/2025", "required": True},
        ],
        'appeal_brief': [
            {"id": "lower_court", "label": "Lower court that issued the decision", "placeholder": "e.g., TGI de Yaoundé", "required": True},
            {"id": "judgment_date", "label": "Date of the judgment being appealed", "placeholder": "e.g., 3 March 2026", "required": True},
            {"id": "grounds", "label": "Main grounds of appeal", "placeholder": "e.g., misapplication of Article 135 OHADA, insufficient evidence", "required": True},
        ],
    }
    return common + extras.get(draft_type, [
        {"id": "context", "label": "Additional context or specific facts to include", "placeholder": "Describe the situation in detail", "required": False},
    ])


class DraftClarifyView(APIView):
    """POST /api/v1/ai/drafts/clarify/ — AI generates specific follow-up questions before drafting."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        draft_type = (request.data.get('draft_type') or 'other').strip()
        instructions = (request.data.get('instructions') or '').strip()
        if not instructions:
            return Response({'error': 'instructions required'}, status=400)

        type_label = dict(LegalDraft.DRAFT_TYPES).get(draft_type, 'Legal Document')
        prompt = (
            f'A lawyer wants to draft a "{type_label}".\n\n'
            f'Their initial description:\n"{instructions}"\n\n'
            'Identify exactly 4–6 specific pieces of information that are missing from this description '
            'and without which you would have to write [PLACEHOLDER], [NAME], [DATE], [AMOUNT], or empty '
            f'brackets in the final {type_label}.\n\n'
            'Return ONLY a valid JSON array (no markdown, no prose, nothing else):\n'
            '[\n'
            '  {"id": "snake_case_id", "label": "Concise question label", "placeholder": "Example answer", "required": true}\n'
            ']\n\n'
            'Focus on: full party names, addresses, specific dates, monetary amounts, '
            'court/jurisdiction name, case/dossier reference numbers, deadlines, and key '
            f'facts specific to a {type_label}. Do NOT ask for anything already clearly stated.'
        )

        try:
            import re as _re
            ai = get_ai_client(settings)
            raw = ''
            for chunk in ai.stream(user_message=prompt, history=[], case_context=''):
                raw += chunk
            match = _re.search(r'\[.*\]', raw, _re.DOTALL)
            if not match:
                raise ValueError('No JSON array in response')
            questions = json.loads(match.group())
            if not isinstance(questions, list) or not questions:
                raise ValueError('Empty question list')
            return Response({'questions': questions[:6]})
        except Exception:
            logger.warning("Clarify question generation failed for %s, using defaults", draft_type)
            return Response({'questions': _default_clarify_questions(draft_type)})


class LegalDraftStreamView(APIView):
    """POST /api/v1/ai/drafts/stream/ — stream draft tokens, save on completion."""
    permission_classes = [IsAuthenticated]
    renderer_classes = [ServerSentEventRenderer, JSONRenderer]

    def post(self, request):
        draft_type = (request.data.get('draft_type') or 'other').strip()
        instructions = (request.data.get('instructions') or '').strip()
        answers = request.data.get('answers') or {}
        case_id = request.data.get('case_id')
        title = (request.data.get('title') or '').strip()

        if not instructions:
            return Response({'error': 'instructions are required'}, status=400)

        valid_types = [t for t, _ in LegalDraft.DRAFT_TYPES]
        if draft_type not in valid_types:
            draft_type = 'other'

        # Optional case context
        case_context = ''
        if case_id:
            try:
                import requests as req
                r = req.get(
                    f"{settings.CASE_SERVICE_URL}/api/v1/cases/{case_id}/summary/",
                    headers={'X-Internal-Api-Key': getattr(settings, 'INTERNAL_API_KEY', '')},
                    timeout=4,
                )
                if r.status_code == 200:
                    d = r.json()
                    case_context = (
                        f"CASE CONTEXT:\nType: {d.get('case_type')} | "
                        f"Circuit: {d.get('circuit')} ({d.get('legal_tradition')}) | "
                        f"Status: {d.get('status')}\n"
                        f"Parties: {str(d.get('description', ''))[:300]}"
                    )
            except Exception:
                pass

        type_prompt = DRAFT_TYPE_PROMPTS.get(draft_type, DRAFT_TYPE_PROMPTS['other'])
        draft_prompt = (
            f"{LEGAL_SYSTEM_PROMPT}\n\n"
            "You are now in DOCUMENT DRAFTING MODE. Output only the complete, "
            "professionally formatted legal document — no explanations, no commentary.\n\n"
            f"Document type: {type_prompt}\n"
        )
        if case_context:
            draft_prompt += f"\n{case_context}\n"

        draft_prompt += f"\nLawyer's instructions:\n{instructions}\n"

        if answers:
            filled = {k: v for k, v in answers.items() if str(v).strip()}
            if filled:
                answers_text = '\n'.join(
                    f"- {k.replace('_', ' ').title()}: {v}" for k, v in filled.items()
                )
                draft_prompt += (
                    f"\nSpecific details collected from the lawyer:\n{answers_text}\n\n"
                    "CRITICAL: Use every detail above in the document. "
                    "Do NOT write [PLACEHOLDER], [NAME], [DATE], [AMOUNT], or any empty brackets. "
                    "Every field must be filled with the provided information.\n"
                )

        draft_prompt += "\nDraft:"

        user_id = str(request.user.id)

        def generate():
            full_content = ''
            try:
                ai = get_ai_client(settings)
                for chunk in ai.stream(user_message=draft_prompt, history=[], case_context=''):
                    full_content += chunk
                    yield f"data: {json.dumps({'token': chunk})}\n\n"
            except Exception as exc:
                logger.exception("AI draft stream error")
                yield f"data: {json.dumps({'error': str(exc)})}\n\n"
                return

            try:
                draft = LegalDraft.objects.create(
                    user_id=user_id,
                    case_id=case_id,
                    draft_type=draft_type,
                    title=title or dict(LegalDraft.DRAFT_TYPES).get(draft_type, 'Draft'),
                    instructions=instructions,
                    content=full_content,
                )
                yield f"data: {json.dumps({'done': True, 'draft_id': str(draft.id), 'title': draft.title, 'created_at': draft.created_at.isoformat()})}\n\n"
            except Exception as exc:
                logger.exception("Failed to save streamed draft")
                yield f"data: {json.dumps({'error': f'Save failed: {exc}'})}\n\n"

        response = StreamingHttpResponse(generate(), content_type='text/event-stream')
        response['Cache-Control'] = 'no-cache'
        response['X-Accel-Buffering'] = 'no'
        return response


class LegalDraftListView(APIView):
    """GET /api/v1/ai/drafts/ — list user's saved drafts."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        drafts = LegalDraft.objects.filter(
            user_id=str(request.user.id)
        ).values('id', 'draft_type', 'title', 'case_id', 'created_at')
        return Response(list(drafts))


class LegalDraftDetailView(APIView):
    """GET/DELETE /api/v1/ai/drafts/{id}/"""
    permission_classes = [IsAuthenticated]

    def get(self, request, draft_id):
        try:
            draft = LegalDraft.objects.get(id=draft_id, user_id=str(request.user.id))
        except LegalDraft.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)
        return Response({
            'id': str(draft.id),
            'draft_type': draft.draft_type,
            'title': draft.title,
            'instructions': draft.instructions,
            'content': draft.content,
            'case_id': draft.case_id,
            'created_at': draft.created_at.isoformat(),
        })

    def delete(self, request, draft_id):
        try:
            draft = LegalDraft.objects.get(id=draft_id, user_id=str(request.user.id))
            draft.delete()
            return Response(status=204)
        except LegalDraft.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)
