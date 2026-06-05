from unittest.mock import patch, MagicMock
from apps.analyzer.tasks import extract_text_from_pdf


def test_extract_text_from_pdf_single_page():
    fake_pdf = MagicMock()
    page = MagicMock()
    page.extract_text.return_value = "Hello PDF page 1"
    fake_pdf.pages = [page]

    cm = MagicMock()
    cm.__enter__.return_value = fake_pdf
    cm.__exit__.return_value = False

    with patch('pdfplumber.open', return_value=cm):
        text = extract_text_from_pdf(b'%PDF-1.4 fake')
        assert 'Hello PDF page 1' in text


def test_extract_text_from_pdf_multiple_pages_and_none():
    fake_pdf = MagicMock()
    p1 = MagicMock(); p1.extract_text.return_value = 'Page one'
    p2 = MagicMock(); p2.extract_text.return_value = None
    p3 = MagicMock(); p3.extract_text.return_value = 'Page three'
    fake_pdf.pages = [p1, p2, p3]

    cm = MagicMock()
    cm.__enter__.return_value = fake_pdf
    cm.__exit__.return_value = False

    with patch('pdfplumber.open', return_value=cm):
        text = extract_text_from_pdf(b'%PDF-1.4 fake')
        assert 'Page one' in text
        assert 'Page three' in text
