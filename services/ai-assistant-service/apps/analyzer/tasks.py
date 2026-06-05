import io
import json
import logging

import pdfplumber
import requests
from celery import shared_task
from django.conf import settings
from django.utils import timezone
from langdetect import detect

from apps.utils.ollama_client import ollama
from .models import DocumentAnalysis
from .utils import parse_ai_response


ANALYSIS_PROMPT_EN = """
Analyze this Cameroonian legal document and provide a structured response
in valid JSON format only. Do not include any text outside the JSON.

Document text:
{document_text}

Respond with exactly this JSON structure:
{
  "summary": "2-3 sentence plain English summary of what this document is",
  "key_points": [
    {"point": "key point 1", "importance": "high"},
    {"point": "key point 2", "importance": "medium"}
  ],
  "risks": [
    {"risk": "identified legal risk 1", "severity": "high"},
    {"risk": "identified legal risk 2", "severity": "low"}
  ],
  "recommendations": [
    "recommended action 1",
    "recommended action 2"
  ],
  "document_type": "contract|affidavit|court_order|petition|other",
  "applicable_law": "common_law|civil_law|ohada|penal_code|other"
}
"""


ANALYSIS_PROMPT_FR = """
Analysez ce document juridique camerounais et fournissez une réponse
structurée en JSON valide uniquement. N'incluez aucun texte en dehors du JSON.

Texte du document:
{document_text}

Répondez avec exactement cette structure JSON:
{
  "summary": "Résumé en 2-3 phrases de ce document",
  "key_points": [
    {"point": "point clé 1", "importance": "high"},
    {"point": "point clé 2", "importance": "medium"}
  ],
  "risks": [
    {"risk": "risque juridique identifié 1", "severity": "high"}
  ],
  "recommendations": [
    "action recommandée 1"
  ],
  "document_type": "contract|affidavit|court_order|petition|other",
  "applicable_law": "common_law|civil_law|ohada|penal_code|other"
}
"""


def fetch_document_from_minio(document_id: str) -> bytes:
    """Fetch document bytes from Document Service internal endpoint with retries.

    Uses a requests Session with urllib3 Retry to handle transient network errors.
    """
    from requests.adapters import HTTPAdapter
    from urllib3.util.retry import Retry

    url = f"{settings.DOCUMENT_SERVICE_URL}/api/v1/documents/{document_id}/download/"
    session = requests.Session()
    retries = Retry(total=3, backoff_factor=2, status_forcelist=(429, 502, 503, 504))
    adapter = HTTPAdapter(max_retries=retries)
    session.mount('http://', adapter)
    session.mount('https://', adapter)

    resp = session.get(url, headers={"X-Internal-Api-Key": settings.INTERNAL_API_KEY}, timeout=30)
    resp.raise_for_status()
    return resp.content


def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """Extract text from PDF bytes using pdfplumber."""
    text = ""
    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
    return text[:8000]


@shared_task(bind=True, max_retries=3)
def analyze_document_task(self, analysis_id: str):
    try:
        analysis = DocumentAnalysis.objects.get(id=analysis_id)
        analysis.status = DocumentAnalysis.Status.PROCESSING
        analysis.save()

        try:
            pdf_bytes = fetch_document_from_minio(str(analysis.document_id))
        except Exception as exc:
            logging.exception("fetch_document_from_minio failed for analysis %s", analysis_id)
            raise RuntimeError(
                f"Unable to fetch document {analysis.document_id} for analysis {analysis_id}"
            ) from exc

        document_text = extract_text_from_pdf(pdf_bytes)
        if not document_text.strip():
            raise ValueError("Could not extract text from document")

        try:
            lang = detect(document_text[:500])
            detected_lang = "fr" if lang == "fr" else "en"
        except Exception:
            detected_lang = "en"

        analysis.language_detected = detected_lang
        prompt_template = ANALYSIS_PROMPT_FR if detected_lang == "fr" else ANALYSIS_PROMPT_EN
        prompt = prompt_template.replace("{document_text}", document_text)

        try:
            result = ollama.generate(
                model=settings.OLLAMA_ANALYSIS_MODEL,
                prompt=prompt,
                stream=False,
            )
            raw_response = result.get("response", "")
        except Exception as exc:
            raw_response = f"OllamaError: {exc}"
            analysis.raw_response = raw_response
            analysis.summary = document_text[:400].strip()
            analysis.status = DocumentAnalysis.Status.COMPLETED
            analysis.completed_at = timezone.now()
            analysis.save()
            return

        analysis.raw_response = raw_response

        try:
            parsed = parse_ai_response(raw_response)

            analysis.summary = parsed.get("summary", "")
            analysis.key_points = parsed.get("key_points", [])
            analysis.risks = parsed.get("risks", [])
            analysis.recommendations = parsed.get("recommendations", [])
            analysis.status = DocumentAnalysis.Status.COMPLETED
            analysis.completed_at = timezone.now()
            analysis.save()

        except ValueError as e:
            analysis.status = DocumentAnalysis.Status.FAILED
            analysis.error_message = f"Failed to parse AI response: {str(e)}"
            analysis.save()
            raise
    except Exception as exc:
        analysis = DocumentAnalysis.objects.filter(id=analysis_id).first()
        if analysis:
            analysis.status = DocumentAnalysis.Status.FAILED
            analysis.error_message = str(exc)
            analysis.save()
        raise
