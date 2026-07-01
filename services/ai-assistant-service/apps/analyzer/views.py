import io
import json
import logging

from django.conf import settings
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.utils.ai_client import get_ai_client, LEGAL_SYSTEM_PROMPT
from .models import DocumentAnalysis
from .serializers import DocumentAnalysisSerializer
from .tasks import analyze_document_task

logger = logging.getLogger(__name__)

DIRECT_ANALYSIS_SYSTEM = LEGAL_SYSTEM_PROMPT + """

When asked to analyse a document, respond ONLY with a JSON object using this exact schema:
{
  "summary": "2-3 sentence plain-language summary of the document",
  "key_points": ["key point 1", "key point 2", "key point 3"],
  "risks": ["legal risk 1", "legal risk 2"],
  "recommendations": ["recommended action 1", "recommended action 2"]
}
No markdown, no explanation outside the JSON object."""


def _extract_text(uploaded_file) -> str:
    name = (uploaded_file.name or "").lower()
    raw = uploaded_file.read()

    if name.endswith(".pdf"):
        try:
            import pdfplumber
            text = ""
            with pdfplumber.open(io.BytesIO(raw)) as pdf:
                for page in pdf.pages:
                    t = page.extract_text()
                    if t:
                        text += t + "\n"
            return text[:8000]
        except Exception:
            pass

    if name.endswith(".docx"):
        try:
            from docx import Document as DocxDocument
            doc = DocxDocument(io.BytesIO(raw))
            return "\n".join(p.text for p in doc.paragraphs)[:8000]
        except Exception:
            pass

    # Plain text or fallback
    return raw.decode("utf-8", errors="ignore")[:8000]


class DirectFileAnalysisView(APIView):
    """POST /api/v1/ai/analyze/direct/ — accepts a file upload and returns AI analysis synchronously."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        uploaded = request.FILES.get("file")
        context = (request.data.get("context") or "").strip()

        document_text = ""
        if uploaded:
            try:
                document_text = _extract_text(uploaded)
            except Exception as exc:
                logger.exception("text extraction failed")
                return Response({"error": f"Could not read document: {exc}"}, status=400)

        if not document_text and not context:
            return Response({"error": "Provide a file or a context description."}, status=400)

        parts = []
        if context:
            parts.append(f"Context provided by the lawyer:\n{context}")
        if document_text:
            parts.append(f"Document text:\n{document_text}")

        user_message = (
            "Analyse the following legal material and respond with the JSON schema specified in your instructions.\n\n"
            + "\n\n".join(parts)
        )

        try:
            ai = get_ai_client(settings)
            raw = ai.complete(user_message, system=DIRECT_ANALYSIS_SYSTEM, max_tokens=1024)
        except Exception as exc:
            logger.exception("AI call failed in DirectFileAnalysisView")
            return Response({"error": f"AI service error: {exc}"}, status=502)

        # Parse JSON — strip markdown fences if the model wrapped it
        cleaned = raw.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("```")[1]
            if cleaned.startswith("json"):
                cleaned = cleaned[4:]
            cleaned = cleaned.strip()

        try:
            result = json.loads(cleaned)
        except Exception:
            # Best-effort: return raw text as summary
            result = {
                "summary": raw[:500],
                "key_points": [],
                "risks": [],
                "recommendations": [],
            }

        # Normalise key_points / risks to flat string lists
        def to_strings(items):
            out = []
            for item in (items or []):
                if isinstance(item, str):
                    out.append(item)
                elif isinstance(item, dict):
                    out.append(item.get("point") or item.get("risk") or item.get("text") or str(item))
            return out

        return Response({
            "summary": result.get("summary", ""),
            "key_points": to_strings(result.get("key_points", [])),
            "risks": to_strings(result.get("risks", [])),
            "recommendations": to_strings(result.get("recommendations", [])),
        })


CONTRACT_ANALYSIS_SYSTEM = """You are a specialist contract review AI for Cameroonian law. You analyse legal contracts clause by clause, identifying risks under Cameroonian Civil Law, Common Law, and OHADA Uniform Acts.

When given a contract text, respond ONLY with a valid JSON object using this exact schema:
{
  "overall_risk_score": <integer 0-100, where 0=no risk, 100=extremely risky>,
  "risk_level": "<low|medium|high|critical>",
  "summary": "<2-3 sentence plain-language overview of this contract>",
  "missing_clauses": ["<standard clause that is absent e.g. 'Force Majeure clause'>", ...],
  "clauses": [
    {
      "title": "<clause name e.g. 'Payment Terms'>",
      "excerpt": "<first 100 chars of the clause text>",
      "risk_level": "<low|medium|high|critical>",
      "issue": "<what is legally problematic or ambiguous>",
      "recommendation": "<specific text to add or change>"
    }
  ]
}

Rules:
- Identify ALL clauses present, not just risky ones
- Apply OHADA Uniform Act on General Commercial Law (AUDCG) for commercial contracts
- Apply Cameroonian Civil Code Art. 1134 (pacta sunt servanda) principle
- Flag unfair terms under Cameroonian consumer protection norms
- Note any terms that would be unenforceable in Cameroonian courts
- missing_clauses must list standard clauses absent from this type of contract
- Do not include any text outside the JSON object"""


class ContractIntelligenceView(APIView):
    """POST /api/v1/ai/analyze/contract/ — clause-by-clause contract risk analysis."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        uploaded = request.FILES.get('file')
        if not uploaded:
            return Response({'error': 'A contract file (PDF, DOCX, or TXT) is required.'}, status=400)

        try:
            contract_text = _extract_text(uploaded)
        except Exception as exc:
            return Response({'error': f'Could not read file: {exc}'}, status=400)

        if not contract_text.strip():
            return Response({'error': 'Could not extract text from the uploaded file.'}, status=400)

        user_message = (
            f"Analyse this contract (first {len(contract_text)} characters extracted):\n\n"
            f"{contract_text[:7500]}"
        )

        try:
            ai = get_ai_client(settings)
            raw = ai.complete(user_message, system=CONTRACT_ANALYSIS_SYSTEM, max_tokens=2048)
        except Exception as exc:
            logger.exception("AI call failed in ContractIntelligenceView")
            return Response({'error': f'AI service error: {exc}'}, status=502)

        cleaned = raw.strip()
        if cleaned.startswith('```'):
            cleaned = cleaned.split('```')[1]
            if cleaned.startswith('json'):
                cleaned = cleaned[4:]
            cleaned = cleaned.strip()
        if cleaned.endswith('```'):
            cleaned = cleaned[:-3].strip()

        import re as _re
        json_match = _re.search(r'\{[\s\S]*\}', cleaned)
        if json_match:
            cleaned = json_match.group(0)

        try:
            result = json.loads(cleaned)
        except Exception:
            result = {
                'overall_risk_score': 50,
                'risk_level': 'medium',
                'summary': 'Analysis completed. See raw output for details.',
                'missing_clauses': [],
                'clauses': [],
            }

        return Response({
            'overall_risk_score': result.get('overall_risk_score', 50),
            'risk_level': result.get('risk_level', 'medium'),
            'summary': result.get('summary', ''),
            'missing_clauses': result.get('missing_clauses', []),
            'clauses': result.get('clauses', []),
        })


class DocumentAnalysisListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        analyses = DocumentAnalysis.objects.filter(requested_by=str(request.user.id))
        serializer = DocumentAnalysisSerializer(analyses, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = DocumentAnalysisSerializer(data=request.data)
        if serializer.is_valid():
            analysis = serializer.save(requested_by=str(request.user.id))
            analyze_document_task.delay(str(analysis.id))
            return Response(DocumentAnalysisSerializer(analysis).data, status=201)
        return Response(serializer.errors, status=400)


class DocumentAnalysisDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, analysis_id):
        try:
            analysis = DocumentAnalysis.objects.get(id=analysis_id, requested_by=str(request.user.id))
            serializer = DocumentAnalysisSerializer(analysis)
            return Response(serializer.data)
        except DocumentAnalysis.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)
