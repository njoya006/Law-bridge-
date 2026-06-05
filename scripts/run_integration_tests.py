#!/usr/bin/env python3
"""Simple integration smoke tests for LawBridge services.

Uses only the Python stdlib so it can run without extra deps.
Checks health endpoints for all services and runs auth flows.
"""
import json
import sys
import uuid
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError


def request(method, url, data=None, headers=None):
    headers = headers or {}
    if data is not None:
        body = json.dumps(data).encode("utf-8")
        headers.setdefault("Content-Type", "application/json")
    else:
        body = None
    req = Request(url, data=body, headers=headers, method=method)
    try:
        with urlopen(req, timeout=10) as resp:
            raw = resp.read().decode("utf-8")
            try:
                return resp.getcode(), json.loads(raw)
            except Exception:
                return resp.getcode(), raw
    except HTTPError as e:
        try:
            return e.code, json.loads(e.read().decode())
        except Exception:
            return e.code, e.reason
    except URLError as e:
        return None, str(e)


SERVICES = {
    "auth-service": 8001,
    "client-service": 8002,
    "lawyer-service": 8003,
    "case-service": 8004,
    "document-service": 8005,
    "notification-service": 8006,
    "payment-service": 8007,
    "calendar-service": 8008,
    "monitoring-service": 8009,
    "search-service": 8010,
    "ai-assistant-service": 8011,
}

# Per-service candidate health paths (checked in order). Only 2xx is considered healthy.
HEALTH_PATHS = {
    name: ["/api/v1/health/", "/health/", "/"] for name in SERVICES.keys()
}


def check_health(host, port, service_name=None):
    base = f"http://{host}:{port}"
    candidates = HEALTH_PATHS.get(service_name) if service_name else ["/api/v1/health/", "/health/", "/"]
    for path in candidates:
        code, body = request("GET", base + path)
        if isinstance(code, int) and 200 <= code < 300:
            return True, path, code, body
    # none returned 2xx; return last seen code for debugging
    return False, candidates[0] if candidates else None, None, None


def run_auth_tests(host="localhost", port=8001):
    base = f"http://{host}:{port}"
    results = []

    # Register
    email = f"test-{uuid.uuid4().hex[:8]}@example.com"
    data = {"email": email, "full_name": "IT Test", "password": "TestPass123!", "role": "client"}
    code, body = request("POST", base + "/api/v1/auth/register/", data=data)
    results.append(("register", code, body))
    if code != 201:
        return False, results

    # Login
    code, body = request("POST", base + "/api/v1/auth/login/", data={"email": email, "password": "TestPass123!"})
    results.append(("login", code, body))
    if code != 200 or not isinstance(body, dict):
        return False, results

    access = body.get("access")
    refresh = body.get("refresh")
    if not access:
        return False, results

    # Me
    code, body = request("GET", base + "/api/v1/auth/me/", headers={"Authorization": f"Bearer {access}"})
    results.append(("me", code, body))
    if code != 200:
        return False, results

    # Refresh
    if refresh:
        code, body = request("POST", base + "/api/v1/auth/token/refresh/", data={"refresh": refresh})
        results.append(("refresh", code, body))
        if code != 200:
            return False, results

    return True, results


def main():
    host = "localhost"
    all_ok = True
    summary = {"health": {}, "auth": None}

    for name, port in SERVICES.items():
        ok, path, code, body = check_health(host, port, service_name=name)
        summary["health"][name] = {"ok": ok, "path": path, "code": code}
        print(f"{name}: health ok={ok} (checked {path}) code={code}")
        if not ok:
            all_ok = False

    print("\nRunning auth flow tests...")
    ok, auth_results = run_auth_tests(host, 8001)
    summary["auth"] = {"ok": ok, "results": auth_results}
    print("Auth tests ok=" + str(ok))
    for step, code, body in auth_results:
        print(f" - {step}: code={code} body={repr(body)[:200]}")
        if code is None or (isinstance(code, int) and code >= 400):
            all_ok = False

    print("\nSummary:")
    print(json.dumps(summary, indent=2, default=str))
    sys.exit(0 if all_ok else 2)


if __name__ == "__main__":
    main()
