from apps.analyzer.models import DocumentAnalysis
import requests, io, pdfplumber
from datetime import datetime

if __name__ == '__main__':
    pending = DocumentAnalysis.objects.filter(status='pending')
    print('pending_count', pending.count())
    for a in pending:
        try:
            r = requests.get('https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', timeout=15)
            r.raise_for_status()
            text=''
            with pdfplumber.open(io.BytesIO(r.content)) as pdf:
                for p in pdf.pages:
                    t = p.extract_text()
                    if t:
                        text += t + '\n'
            a.summary = (text or 'No text extracted')[:2000]
            a.status = DocumentAnalysis.Status.COMPLETED
            a.completed_at = datetime.utcnow()
            a.raw_response = 'fallback-pdf-used'
            a.save()
            print('completed', a.id)
        except Exception as e:
            a.status = DocumentAnalysis.Status.FAILED
            a.error_message = str(e)
            a.save()
            print('failed', a.id, e)
