import json
import pytest


from apps.analyzer.models import DocumentAnalysis
from apps.analyzer.tasks import analyze_document_task


@pytest.mark.django_db
def test_analyze_document_task_happy_path(monkeypatch):
    # create a pending analysis record
    ana = DocumentAnalysis.objects.create(
        document_id='11111111-1111-1111-1111-111111111111',
        requested_by='1',
        status=DocumentAnalysis.Status.PENDING,
    )

    # Patch extractor to avoid pdf processing
    monkeypatch.setattr('apps.analyzer.tasks.extract_text_from_pdf', lambda b: "This is a contract between A and B.")

    # Patch ollama.generate to return a valid JSON response
    sample = json.dumps({
        "summary": "Test summary",
        "key_points": [{"point": "p1", "importance": "high"}],
        "risks": [],
        "recommendations": []
    })

    def fake_generate(model, prompt, stream=False):
        return {"response": sample}

    monkeypatch.setattr('apps.analyzer.tasks.ollama.generate', fake_generate)

    # Run the task synchronously
    analyze_document_task.run(str(ana.id))

    ana.refresh_from_db()
    assert ana.status == DocumentAnalysis.Status.COMPLETED
    assert ana.summary.startswith('Test summary')
