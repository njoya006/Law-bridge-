import json
import re
from typing import Any, Dict


def _strip_code_fence(text: str) -> str:
    t = text.strip()
    if t.startswith('```'):
        parts = t.split('```')
        if len(parts) >= 2:
            inner = parts[1]
            if inner.startswith('json'):
                inner = inner[4:]
            return inner.strip()
    return t


def _extract_first_json_obj(text: str) -> str | None:
    # Find the first balanced top-level JSON object by scanning braces
    start = text.find('{')
    if start == -1:
        return None
    depth = 0
    for i in range(start, len(text)):
        if text[i] == '{':
            depth += 1
        elif text[i] == '}':
            depth -= 1
            if depth == 0:
                return text[start:i + 1]
    return None


def parse_ai_response(raw_response: str) -> Dict[str, Any]:
    """Parse an LLM response trying several fallbacks and return a dict.

    Attempts:
    1. Strip markdown code fences and load JSON.
    2. Extract the first balanced JSON object and load it.
    3. Fallback: extract a loose `summary` string using regex.

    Raises ValueError if nothing sensible can be parsed.
    """
    if raw_response is None:
        raise ValueError('empty response')

    cleaned = _strip_code_fence(raw_response)

    # 1) direct JSON
    try:
        return json.loads(cleaned)
    except Exception:
        pass

    # 2) try to find first balanced JSON object
    obj_text = _extract_first_json_obj(cleaned)
    if obj_text:
        try:
            return json.loads(obj_text)
        except Exception:
            pass

    # 3) fallback: try to extract a summary string
    m = re.search(r'"?summary"?\s*[:=]\s*"([^"]{10,2000})"', raw_response, re.IGNORECASE)
    if m:
        return {'summary': m.group(1).strip()}

    # 4) very permissive: first sentence as summary
    s = re.split(r'\n{2,}|\.|\n', raw_response.strip())
    if s and len(s[0].strip()) >= 10:
        return {'summary': s[0].strip()}

    raise ValueError('Could not parse AI response')
