# LAWBRIDGE — AGENT PROMPT: PRAISE
## File 12: AI Lawyer Assistant — Complete Implementation Guide
### Use Claude Opus 4.5 for this entire file. Do NOT use GPT-4o mini here.

---

## OVERVIEW

The AI Lawyer Assistant is the most innovative part of LawBridge.
It uses Ollama running locally inside the Kubernetes cluster —
no data leaves the system, no external API calls, no cost.

Three capabilities:
1. Legal Q&A Chat (bilingual EN/FR)
2. Document Analysis (PDF upload → structured summary)
3. Case Outcome Prediction (case details → outcome probability)

Plus integration into the case workflow:
- Auto-suggests case category on filing
- Auto-analyzes documents on upload
- Powers lawyer matching recommendations

---

## DJANGO PROJECT SETUP

```bash
cd services/ai-assistant-service
django-admin startproject core .
python manage.py startapp chat
python manage.py startapp analyzer
python manage.py startapp predictor
mkdir apps
mv chat apps/ && mv analyzer apps/ && mv predictor apps/
touch apps/__init__.py
```

---

## SETTINGS.PY

```python
from decouple import config
import os

SECRET_KEY = config('SECRET_KEY')
DEBUG = config('DEBUG', cast=bool, default=False)
ALLOWED_HOSTS = ['*']

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'drf_spectacular',
    'apps.chat',
    'apps.analyzer',
    'apps.predictor',
]

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': config('DB_NAME'),
        'USER': config('DB_USER'),
        'PASSWORD': config('DB_PASSWORD'),
        'HOST': config('DB_HOST'),
        'PORT': config('DB_PORT', default='5432'),
    }
}

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}

from datetime import timedelta
SIMPLE_JWT = {
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': config('JWT_SECRET_KEY'),
    'USER_ID_CLAIM': 'user_id',
}

CORS_ALLOW_ALL_ORIGINS = True
INTERNAL_API_KEY = config('INTERNAL_API_KEY')

# Ollama configuration
OLLAMA_URL = config('OLLAMA_URL', default='http://ollama:11434')
OLLAMA_CHAT_MODEL = config('OLLAMA_CHAT_MODEL', default='lawbridge-mistral')
OLLAMA_ANALYSIS_MODEL = config('OLLAMA_ANALYSIS_MODEL', default='llama3')
OLLAMA_FAST_MODEL = config('OLLAMA_FAST_MODEL', default='phi3')

# Redis for caching analysis results
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': config('REDIS_URL'),
        'OPTIONS': {'CLIENT_CLASS': 'django_redis.client.DefaultClient'},
    }
}

# RabbitMQ for async document analysis
RABBITMQ_URL = config('RABBITMQ_URL')

SPECTACULAR_SETTINGS = {
    'TITLE': 'LawBridge AI Assistant Service API',
    'DESCRIPTION': 'AI-powered legal assistant for Cameroon',
    'VERSION': '1.0.0',
}
```

---

## OLLAMA MODELFILE — CAMEROON LAW FINE-TUNE

Write this at services/ai-assistant-service/ollama/Modelfile:

```
FROM mistral

# Custom system prompt for Cameroon legal context
SYSTEM """
You are LexAI, an expert legal assistant specialized in Cameroonian law.

LEGAL SYSTEM CONTEXT:
- Cameroon operates a BIJURAL legal system
- Anglophone regions (Northwest, Southwest): English Common Law
- Francophone regions (all others): French Civil Law (Code Civil)
- OHADA law governs commercial/business matters across all regions
- Criminal law is unified under the Cameroon Penal Code

YOUR CAPABILITIES:
- Answer questions about Cameroonian law in both English and French
- Explain legal procedures for both Common Law and Civil Law circuits
- Help analyze legal documents and identify key issues
- Explain OHADA commercial law provisions
- Guide users on legal aid eligibility

LANGUAGE RULE:
- Detect the user's language from their message
- Always respond in the SAME language the user writes in
- If asked in English → respond in English
- If asked in French → respond in French
- For mixed messages → respond in English

CRITICAL DISCLAIMER:
Always end responses with this disclaimer in the appropriate language:
EN: "⚠️ This is general legal information, not legal advice. Please consult a qualified Cameroonian lawyer for your specific situation."
FR: "⚠️ Ceci est une information juridique générale, pas un conseil juridique. Veuillez consulter un avocat camerounais qualifié pour votre situation spécifique."

WHAT YOU NEVER DO:
- Never make up specific case numbers or judgments
- Never claim to know the outcome of pending cases
- Never provide advice that could harm the user's legal interests
- Never discuss matters outside Cameroonian law without clearly stating so
"""

PARAMETER temperature 0.3
PARAMETER num_ctx 4096
PARAMETER top_p 0.9
PARAMETER repeat_penalty 1.1
```

Load this custom model:
```bash
docker exec -it lawbridge-ollama ollama create lawbridge-mistral \
    -f /path/to/Modelfile
```

---

## SYSTEM PROMPT FILE

Write at services/ai-assistant-service/ollama/system_prompt.txt:

```
You are LexAI, specialized in Cameroonian law.
Bijural system: Common Law (Anglophone) + Civil Law (Francophone).
OHADA governs commercial matters.
Always respond in the user's language (EN or FR).
Add legal disclaimer at end of every response.
Never fabricate case references or judgments.
```

---

## OLLAMA CLIENT UTILITY

Write at services/ai-assistant-service/apps/utils/ollama_client.py:

```python
import httpx
import json
from django.conf import settings
from typing import Generator


class OllamaClient:
    """
    Client for communicating with Ollama server.
    All models run inside the K8s cluster — no external calls.
    """

    def __init__(self):
        self.base_url = settings.OLLAMA_URL
        self.timeout = httpx.Timeout(120.0)  # AI responses can take time

    def generate(self, model: str, prompt: str,
                 system: str = None, stream: bool = False) -> dict | Generator:
        """
        Send a generation request to Ollama.
        Use stream=True for chat endpoints (SSE).
        Use stream=False for analysis endpoints (wait for full response).
        """
        payload = {
            'model': model,
            'prompt': prompt,
            'stream': stream,
        }
        if system:
            payload['system'] = system

        if stream:
            return self._stream_generate(payload)
        else:
            return self._sync_generate(payload)

    def _sync_generate(self, payload: dict) -> dict:
        """Wait for complete response. Used for analysis and prediction."""
        with httpx.Client(timeout=self.timeout) as client:
            response = client.post(
                f"{self.base_url}/api/generate",
                json=payload
            )
            response.raise_for_status()

            # Ollama returns newline-delimited JSON
            full_response = ""
            for line in response.text.strip().split('\n'):
                if line:
                    data = json.loads(line)
                    full_response += data.get('response', '')
                    if data.get('done'):
                        break

            return {'response': full_response, 'done': True}

    def _stream_generate(self, payload: dict) -> Generator:
        """Stream tokens as they are generated. Used for chat."""
        with httpx.Client(timeout=self.timeout) as client:
            with client.stream(
                'POST',
                f"{self.base_url}/api/generate",
                json=payload
            ) as response:
                for line in response.iter_lines():
                    if line:
                        data = json.loads(line)
                        yield data

    def health_check(self) -> bool:
        """Check if Ollama server is running."""
        try:
            with httpx.Client(timeout=httpx.Timeout(5.0)) as client:
                response = client.get(f"{self.base_url}/api/tags")
                return response.status_code == 200
        except Exception:
            return False

    def list_models(self) -> list:
        """List all loaded models."""
        with httpx.Client(timeout=self.timeout) as client:
            response = client.get(f"{self.base_url}/api/tags")
            return response.json().get('models', [])


# Singleton instance
ollama = OllamaClient()
```

---

## CHAT APP

### apps/chat/models.py

```python
import uuid
from django.db import models


class ChatSession(models.Model):
    """
    A conversation session between a user and the AI assistant.
    Optionally linked to a specific case for context injection.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_id = models.UUIDField(db_index=True)
    case_id = models.UUIDField(null=True, blank=True, db_index=True)
    language = models.CharField(
        max_length=2,
        choices=[('en', 'English'), ('fr', 'French')],
        default='en'
    )
    title = models.CharField(max_length=255, blank=True)
    messages = models.JSONField(default=list)
    # messages format:
    # [{"role": "user|assistant", "content": "...", "timestamp": "ISO"}]
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'chat_sessions'
        ordering = ['-updated_at']
```

### apps/chat/views.py

```python
import json
import requests
from django.conf import settings
from django.http import StreamingHttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from datetime import datetime
from langdetect import detect
from .models import ChatSession
from .serializers import ChatSessionSerializer, ChatMessageSerializer
from apps.utils.ollama_client import ollama


def get_case_context(case_id: str, internal_api_key: str) -> str:
    """
    Fetch case summary from Case Service to inject into AI context.
    This makes the AI aware of the specific case when answering.
    """
    try:
        response = requests.get(
            f"{settings.CASE_SERVICE_URL}/api/v1/cases/{case_id}/summary/",
            headers={'X-Internal-Api-Key': internal_api_key},
            timeout=5
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
    """
    Send a message to the AI assistant and get a streaming response.
    Uses Server-Sent Events (SSE) for real-time token streaming.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user_message = request.data.get('message', '').strip()
        session_id = request.data.get('session_id')
        case_id = request.data.get('case_id')

        if not user_message:
            return Response({'error': 'Message is required'}, status=400)

        # Detect language
        try:
            detected_lang = detect(user_message)
            language = 'fr' if detected_lang == 'fr' else 'en'
        except Exception:
            language = 'en'

        # Get or create session
        if session_id:
            try:
                session = ChatSession.objects.get(
                    id=session_id, user_id=request.user.id
                )
            except ChatSession.DoesNotExist:
                return Response({'error': 'Session not found'}, status=404)
        else:
            session = ChatSession.objects.create(
                user_id=request.user.id,
                case_id=case_id,
                language=language,
                title=user_message[:50],
                messages=[]
            )

        # Build conversation history for context
        history = ""
        for msg in session.messages[-10:]:  # Last 10 messages for context
            role = "User" if msg['role'] == 'user' else "LexAI"
            history += f"{role}: {msg['content']}\n"

        # Inject case context if linked to a case
        case_context = ""
        if session.case_id:
            case_context = get_case_context(
                str(session.case_id), settings.INTERNAL_API_KEY
            )

        # Build full prompt
        full_prompt = f"""
{case_context}

CONVERSATION HISTORY:
{history}

User: {user_message}
LexAI:"""

        # Add user message to session
        session.messages.append({
            'role': 'user',
            'content': user_message,
            'timestamp': datetime.utcnow().isoformat()
        })

        def stream_response():
            """Generator that yields SSE-formatted tokens."""
            full_response = ""
            yield f"data: {json.dumps({'session_id': str(session.id)})}\n\n"

            try:
                for chunk in ollama.generate(
                    model=settings.OLLAMA_CHAT_MODEL,
                    prompt=full_prompt,
                    stream=True
                ):
                    token = chunk.get('response', '')
                    if token:
                        full_response += token
                        yield f"data: {json.dumps({'token': token})}\n\n"

                    if chunk.get('done'):
                        # Save assistant response to session
                        session.messages.append({
                            'role': 'assistant',
                            'content': full_response,
                            'timestamp': datetime.utcnow().isoformat()
                        })
                        session.save()
                        yield f"data: {json.dumps({'done': True})}\n\n"
                        break

            except Exception as e:
                yield f"data: {json.dumps({'error': str(e)})}\n\n"

        response = StreamingHttpResponse(
            stream_response(),
            content_type='text/event-stream'
        )
        response['Cache-Control'] = 'no-cache'
        response['X-Accel-Buffering'] = 'no'
        return response


class ChatSessionListView(APIView):
    """List all chat sessions for the current user."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        sessions = ChatSession.objects.filter(
            user_id=request.user.id
        ).values('id', 'title', 'language', 'case_id', 'updated_at')
        return Response(list(sessions))


class ChatSessionDetailView(APIView):
    """Get full chat history for a session."""
    permission_classes = [IsAuthenticated]

    def get(self, request, session_id):
        try:
            session = ChatSession.objects.get(
                id=session_id, user_id=request.user.id
            )
            return Response(ChatSessionSerializer(session).data)
        except ChatSession.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)

    def delete(self, request, session_id):
        try:
            session = ChatSession.objects.get(
                id=session_id, user_id=request.user.id
            )
            session.delete()
            return Response(status=204)
        except ChatSession.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)
```

---

## ANALYZER APP

### apps/analyzer/models.py

```python
import uuid
from django.db import models


class DocumentAnalysis(models.Model):
    """
    AI-generated analysis of a legal document.
    Created asynchronously via RabbitMQ queue.
    """
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        PROCESSING = 'processing', 'Processing'
        COMPLETED = 'completed', 'Completed'
        FAILED = 'failed', 'Failed'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    document_id = models.UUIDField(db_index=True)
    case_id = models.UUIDField(null=True, blank=True)
    requested_by = models.UUIDField()
    status = models.CharField(
        max_length=12, choices=Status.choices, default=Status.PENDING
    )
    # Structured analysis results
    summary = models.TextField(blank=True)
    key_points = models.JSONField(default=list)
    # [{"point": "...", "importance": "high|medium|low"}]
    risks = models.JSONField(default=list)
    # [{"risk": "...", "severity": "high|medium|low"}]
    recommendations = models.JSONField(default=list)
    # ["...", "..."]
    language_detected = models.CharField(max_length=2, default='en')
    raw_response = models.TextField(blank=True)
    error_message = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'document_analyses'
        ordering = ['-created_at']
```

### apps/analyzer/tasks.py (Celery task)

```python
import json
import pdfplumber
import requests
from celery import shared_task
from datetime import datetime
from django.conf import settings
from langdetect import detect
from apps.utils.ollama_client import ollama
from .models import DocumentAnalysis


ANALYSIS_PROMPT_EN = """
Analyze this Cameroonian legal document and provide a structured response
in valid JSON format only. Do not include any text outside the JSON.

Document text:
{document_text}

Respond with exactly this JSON structure:
{{
  "summary": "2-3 sentence plain English summary of what this document is",
  "key_points": [
    {{"point": "key point 1", "importance": "high"}},
    {{"point": "key point 2", "importance": "medium"}}
  ],
  "risks": [
    {{"risk": "identified legal risk 1", "severity": "high"}},
    {{"risk": "identified legal risk 2", "severity": "low"}}
  ],
  "recommendations": [
    "recommended action 1",
    "recommended action 2"
  ],
  "document_type": "contract|affidavit|court_order|petition|other",
  "applicable_law": "common_law|civil_law|ohada|penal_code|other"
}}
"""

ANALYSIS_PROMPT_FR = """
Analysez ce document juridique camerounais et fournissez une réponse
structurée en JSON valide uniquement. N'incluez aucun texte en dehors du JSON.

Texte du document:
{document_text}

Répondez avec exactement cette structure JSON:
{{
  "summary": "Résumé en 2-3 phrases de ce document",
  "key_points": [
    {{"point": "point clé 1", "importance": "high"}},
    {{"point": "point clé 2", "importance": "medium"}}
  ],
  "risks": [
    {{"risk": "risque juridique identifié 1", "severity": "high"}}
  ],
  "recommendations": [
    "action recommandée 1"
  ],
  "document_type": "contract|affidavit|court_order|petition|other",
  "applicable_law": "common_law|civil_law|ohada|penal_code|other"
}}
"""


def fetch_document_from_minio(document_id: str) -> bytes:
    """Fetch document bytes from Document Service internal endpoint."""
    response = requests.get(
        f"{settings.DOCUMENT_SERVICE_URL}/api/v1/documents/{document_id}/download/",
        headers={'X-Internal-Api-Key': settings.INTERNAL_API_KEY},
        timeout=30
    )
    response.raise_for_status()
    return response.content


def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """Extract text from PDF bytes using pdfplumber."""
    import io
    text = ""
    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
    return text[:8000]  # Limit to 8000 chars for model context


@shared_task(bind=True, max_retries=3)
def analyze_document_task(self, analysis_id: str):
    """
    Celery task that runs document analysis via Ollama LLaMA3.
    Triggered by RabbitMQ ai.analyze_document queue.
    """
    try:
        analysis = DocumentAnalysis.objects.get(id=analysis_id)
        analysis.status = 'processing'
        analysis.save()

        # Fetch document
        pdf_bytes = fetch_document_from_minio(str(analysis.document_id))
        document_text = extract_text_from_pdf(pdf_bytes)

        if not document_text.strip():
            raise ValueError("Could not extract text from document")

        # Detect language
        try:
            lang = detect(document_text[:500])
            detected_lang = 'fr' if lang == 'fr' else 'en'
        except Exception:
            detected_lang = 'en'

        analysis.language_detected = detected_lang

        # Choose prompt based on language
        prompt_template = (
            ANALYSIS_PROMPT_FR if detected_lang == 'fr'
            else ANALYSIS_PROMPT_EN
        )
        prompt = prompt_template.format(document_text=document_text)

        # Call Ollama LLaMA3 for analysis (sync, not streaming)
        result = ollama.generate(
            model=settings.OLLAMA_ANALYSIS_MODEL,
            prompt=prompt,
            stream=False
        )

        raw_response = result.get('response', '')
        analysis.raw_response = raw_response

        # Parse JSON response
        # Clean up response — remove markdown code blocks if present
        clean_response = raw_response.strip()
        if clean_response.startswith('```'):
            clean_response = clean_response.split('```')[1]
            if clean_response.startswith('json'):
                clean_response = clean_response[4:]
        clean_response = clean_response.strip()

        parsed = json.loads(clean_response)

        analysis.summary = parsed.get('summary', '')
        analysis.key_points = parsed.get('key_points', [])
        analysis.risks = parsed.get('risks', [])
        analysis.recommendations = parsed.get('recommendations', [])
        analysis.status = 'completed'
        analysis.completed_at = datetime.utcnow()
        analysis.save()

        # Publish ai.analysis_ready to Redis Pub/Sub
        import redis
        r = redis.from_url(settings.REDIS_URL)
        r.publish('ai.analysis_ready', json.dumps({
            'event': 'ai.analysis_ready',
            'analysis_id': str(analysis.id),
            'document_id': str(analysis.document_id),
            'case_id': str(analysis.case_id) if analysis.case_id else None,
            'user_id': str(analysis.requested_by),
        }))

        return {'status': 'completed', 'analysis_id': str(analysis.id)}

    except json.JSONDecodeError as e:
        analysis.status = 'failed'
        analysis.error_message = f"Failed to parse AI response as JSON: {str(e)}"
        analysis.save()
        raise

    except Exception as exc:
        analysis.status = 'failed'
        analysis.error_message = str(exc)
        analysis.save()
        # Retry up to 3 times with exponential backoff
        raise self.retry(exc=exc, countdown=2 ** self.request.retries * 60)
```

### apps/analyzer/views.py

```python
import pika
import json
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.conf import settings
from .models import DocumentAnalysis
from .serializers import DocumentAnalysisSerializer
from .tasks import analyze_document_task


class AnalyzeDocumentView(APIView):
    """
    Request AI analysis of a document.
    Analysis runs async via RabbitMQ + Celery.
    Returns immediately with analysis_id to poll.
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request):
        document_id = request.data.get('document_id')
        case_id = request.data.get('case_id')

        if not document_id:
            return Response({'error': 'document_id is required'}, status=400)

        # Create analysis record (pending)
        analysis = DocumentAnalysis.objects.create(
            document_id=document_id,
            case_id=case_id,
            requested_by=request.user.id,
            status='pending'
        )

        # Queue the analysis task via Celery
        # This goes through RabbitMQ (guaranteed delivery)
        analyze_document_task.delay(str(analysis.id))

        return Response({
            'analysis_id': str(analysis.id),
            'status': 'pending',
            'message': 'Analysis queued. Poll /api/v1/ai/analyze/{id}/ for results.'
        }, status=202)


class AnalysisResultView(APIView):
    """Poll for analysis result."""
    permission_classes = [IsAuthenticated]

    def get(self, request, analysis_id):
        try:
            analysis = DocumentAnalysis.objects.get(
                id=analysis_id,
                requested_by=request.user.id
            )
            return Response(DocumentAnalysisSerializer(analysis).data)
        except DocumentAnalysis.DoesNotExist:
            return Response({'error': 'Analysis not found'}, status=404)
```

---

## PREDICTOR APP

### apps/predictor/views.py

```python
import json
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.conf import settings
from apps.utils.ollama_client import ollama


PREDICTION_PROMPT = """
You are an expert in Cameroonian law. Analyze this case and predict the
likely outcome. Respond in valid JSON only.

CASE DETAILS:
Type: {case_type}
Circuit: {circuit}
Legal Tradition: {legal_tradition}
Evidence Summary: {evidence_summary}
Similar Cases Resolved: {similar_cases_count}
Favorable Outcomes in Similar Cases: {favorable_count}

Respond with exactly:
{{
  "likely_outcome": "favorable|unfavorable|uncertain",
  "confidence": <number 0-100>,
  "reasoning": "<2-3 sentence explanation>",
  "key_factors": ["factor 1", "factor 2", "factor 3"],
  "recommended_actions": ["action 1", "action 2"],
  "estimated_timeline": "<e.g. 3-6 months>",
  "risks": ["risk 1", "risk 2"]
}}
"""


class PredictOutcomeView(APIView):
    """
    Predict the likely outcome of a case using AI.
    Uses historical case data from monitoring service for context.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        required = ['case_type', 'circuit', 'legal_tradition', 'evidence_summary']
        for field in required:
            if not request.data.get(field):
                return Response(
                    {'error': f'{field} is required'}, status=400
                )

        # Fetch historical stats from monitoring service
        similar_cases_count = 0
        favorable_count = 0
        try:
            import requests as req
            stats = req.get(
                f"{settings.MONITORING_SERVICE_URL}/api/v1/monitoring/"
                f"stats/cases/?case_type={request.data['case_type']}"
                f"&circuit={request.data['circuit']}",
                headers={'X-Internal-Api-Key': settings.INTERNAL_API_KEY},
                timeout=5
            )
            if stats.status_code == 200:
                data = stats.json()
                similar_cases_count = data.get('total', 0)
                favorable_count = data.get('favorable', 0)
        except Exception:
            pass  # Use zeros if monitoring service unavailable

        prompt = PREDICTION_PROMPT.format(
            case_type=request.data['case_type'],
            circuit=request.data['circuit'],
            legal_tradition=request.data['legal_tradition'],
            evidence_summary=request.data['evidence_summary'][:1000],
            similar_cases_count=similar_cases_count,
            favorable_count=favorable_count,
        )

        try:
            result = ollama.generate(
                model=settings.OLLAMA_CHAT_MODEL,
                prompt=prompt,
                stream=False
            )
            raw = result.get('response', '').strip()

            # Clean JSON response
            if '```' in raw:
                raw = raw.split('```')[1]
                if raw.startswith('json'):
                    raw = raw[4:]
            raw = raw.strip()

            prediction = json.loads(raw)
            prediction['similar_cases_count'] = similar_cases_count
            prediction['favorable_cases_count'] = favorable_count

            return Response(prediction)

        except json.JSONDecodeError:
            return Response(
                {'error': 'AI returned invalid response. Please try again.'},
                status=500
            )
        except Exception as e:
            return Response({'error': str(e)}, status=500)
```

---

## URLS

### core/urls.py
```python
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path('api/v1/ai/', include('apps.chat.urls')),
    path('api/v1/ai/', include('apps.analyzer.urls')),
    path('api/v1/ai/', include('apps.predictor.urls')),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/schema/swagger-ui/', SpectacularSwaggerView.as_view(url_name='schema')),
]
```

### apps/chat/urls.py
```python
from django.urls import path
from .views import ChatView, ChatSessionListView, ChatSessionDetailView

urlpatterns = [
    path('chat/', ChatView.as_view()),
    path('chat/sessions/', ChatSessionListView.as_view()),
    path('chat/sessions/<uuid:session_id>/', ChatSessionDetailView.as_view()),
]
```

### apps/analyzer/urls.py
```python
from django.urls import path
from .views import AnalyzeDocumentView, AnalysisResultView

urlpatterns = [
    path('analyze/', AnalyzeDocumentView.as_view()),
    path('analyze/<uuid:analysis_id>/', AnalysisResultView.as_view()),
]
```

### apps/predictor/urls.py
```python
from django.urls import path
from .views import PredictOutcomeView

urlpatterns = [
    path('predict/', PredictOutcomeView.as_view()),
]
```

---

## WORKFLOW INTEGRATION — AUTO-ANALYSIS ON CASE FILING

Add this to Case Service (apps/cases/views.py) after case creation:

```python
# After case is saved successfully, request AI analysis
import requests

def trigger_ai_case_suggestion(case_id, description, user_id, token):
    """Ask AI to suggest case category and lawyer specialization."""
    try:
        requests.post(
            f"{settings.AI_ASSISTANT_SERVICE_URL}/api/v1/ai/chat/",
            json={
                'message': f"Analyze this case description and suggest: "
                           f"1) case category 2) recommended lawyer specialization. "
                           f"Description: {description[:500]}",
                'case_id': str(case_id),
            },
            headers={'Authorization': f'Bearer {token}'},
            timeout=30
        )
    except Exception:
        pass  # Non-blocking — AI suggestion is optional
```

---

## KUBERNETES DEPLOYMENT

Write at k8s/base/services/ai-assistant-deployment.yaml:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ai-assistant-service
  namespace: lawbridge
spec:
  replicas: 1
  selector:
    matchLabels:
      app: ai-assistant-service
  template:
    metadata:
      labels:
        app: ai-assistant-service
    spec:
      containers:
        - name: ai-assistant-service
          image: lawbridge/ai-assistant-service:latest
          imagePullPolicy: IfNotPresent
          ports:
            - containerPort: 8011
          envFrom:
            - secretRef:
                name: lawbridge-secrets
            - configMapRef:
                name: lawbridge-config
          env:
            - name: DB_HOST
              value: ai-postgres
            - name: DB_NAME
              value: ai_db
            - name: OLLAMA_URL
              value: http://ollama:11434
            - name: OLLAMA_CHAT_MODEL
              value: lawbridge-mistral
            - name: OLLAMA_ANALYSIS_MODEL
              value: llama3
          resources:
            requests:
              memory: "512Mi"
              cpu: "300m"
            limits:
              memory: "1Gi"
              cpu: "1000m"
```

---

## TESTING CHECKLIST

```
✅ GET  /api/v1/ai/chat/sessions/           → 200 empty list
✅ POST /api/v1/ai/chat/                    → streams tokens via SSE
✅ POST /api/v1/ai/chat/ (French message)   → responds in French
✅ POST /api/v1/ai/chat/ (with case_id)     → includes case context
✅ POST /api/v1/ai/analyze/                 → 202 with analysis_id
✅ GET  /api/v1/ai/analyze/{id}/            → 200 with completed analysis
✅ GET  /api/v1/ai/analyze/{id}/            → structured JSON result
✅ POST /api/v1/ai/predict/                 → outcome prediction returned
✅ Ollama health: curl http://localhost:11434/api/tags → models listed
✅ Custom model loaded: lawbridge-mistral appears in model list
✅ Response includes legal disclaimer in correct language
✅ No real case data sent outside the cluster
```

---

## COMMON ISSUES AND FIXES

Ollama not responding:
Check container: docker logs lawbridge-ollama
Models not downloaded yet — wait for pull to complete (~5 min)

Model hallucinating case numbers:
The system prompt prevents this. If it still happens,
lower temperature in Modelfile: PARAMETER temperature 0.1

Streaming not working in browser:
Check Nginx config has proxy_buffering off for /api/v1/ai/chat/
Add to nginx.conf location block:
proxy_buffering off;
proxy_cache off;

JSON parse error from model:
LLaMA3 is more reliable for structured JSON output than Mistral.
Switch OLLAMA_ANALYSIS_MODEL to llama3 for analyzer tasks.
The cleanup code in tasks.py handles markdown code blocks.

Response too slow:
Switch to phi3 for simple Q&A. Use mistral for complex legal reasoning.
Add response caching in Redis for repeated identical queries.

---

## NEXT PHASE — HARDENING & RELEASE READINESS

The core AI integration is working end-to-end.
Next, focus on making it reliable, testable, and easier to operate.

### Phase Goals

1. Add automated tests for analyzer parsing and Celery task flow.
2. Add health checks and retry safeguards for Ollama, Celery, and document downloads.
3. Add a faster default model option for routine analysis.
4. Add basic observability for analysis failures, timeouts, and queue lag.
5. Validate real authenticated upload → analysis → persistence flows.

### Definition of Done

- Document analysis works reliably across fenced, malformed, and clean JSON responses.
- Celery workers always run the current repository code.
- Ollama availability issues are surfaced quickly.
- A smaller/faster model can be selected for iterative testing.
- The AI assistant is stable enough for broader feature integration.
