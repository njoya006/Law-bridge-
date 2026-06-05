import pytest
from apps.analyzer.utils import parse_ai_response


def test_parse_ai_response_plain_json():
    raw = '{"summary": "This is a test.", "key_points": []}'
    parsed = parse_ai_response(raw)
    assert parsed['summary'] == 'This is a test.'


def test_parse_ai_response_code_fence_json():
    raw = '```json\n{"summary": "Fenced summary", "key_points": []}\n```'
    parsed = parse_ai_response(raw)
    assert parsed['summary'] == 'Fenced summary'


def test_parse_ai_response_embedded_json():
    raw = 'Intro text\n```json\n{"summary": "X","key_points": []}\n```\nFooter'
    parsed = parse_ai_response(raw)
    assert parsed['summary'] == 'X'


def test_parse_ai_response_fallback_summary():
    raw = 'Summary: "A short fallback summary." Some other text.'
    parsed = parse_ai_response(raw)
    assert 'summary' in parsed and 'fallback' not in parsed


def test_parse_ai_response_fail():
    with pytest.raises(ValueError):
        parse_ai_response('')
