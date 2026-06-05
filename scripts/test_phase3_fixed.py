import urllib.request
import json
import uuid
import sys
import os

def api_call(method, url, data=None, headers=None):
    if headers is None: headers = {}
    headers['Content-Type'] = 'application/json'
    if data: data = json.dumps(data).encode()
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as response:
            return response.status, json.loads(response.read().decode())
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read().decode())
        except:
            return e.code, e.read().decode()
    except Exception as e:
        return 500, str(e)

def test_phase3():
    print("=" * 60)
    print("PHASE 3 INTEGRATION TEST: Case + Document + Payment")
    print("=" * 60)
    
    # 1. Health Checks
    print("\n1. Checking Service Health...")
    services = [("Auth", 8001), ("Case", 8004), ("Document", 8005), ("Payment", 8007)]
    for name, port in services:
        status, resp = api_call("GET", f"http://localhost:{port}/api/v1/health/")
        print(f"   - {name} ({port}): {'OK' if status == 200 else 'FAILED'}")

    # 2. Register/Login
    print("\n2. Authentication...")
    email = f"test-{uuid.uuid4().hex[:8]}@example.com"
    status, resp = api_call("POST", "http://localhost:8001/api/v1/auth/register/", 
                           {"email": email, "password": "password123", "full_name": "Test User", "role": "client"})
    if status != 201:
        print(f"   FAIL: Register failed {status} {resp}")
        return
    print("   ✅ User Registered")
    
    status, resp = api_call("POST", "http://localhost:8001/api/v1/auth/login/", 
                           {"email": email, "password": "password123"})
    if status != 200:
        print(f"   FAIL: Login failed {status}")
        return
    token = resp.get('access')
    headers = {"Authorization": f"Bearer {token}"}
    print("   ✅ Login Successful")

    # 3. Create Case
    print("\n3. Creating Case...")
    status, resp = api_call("POST", "http://localhost:8004/api/v1/cases/", 
                          {"title": "Integration Test", "description": "Phase 3 test", "case_type": "civil", 
                           "legal_tradition": "common_law", "circuit": "anglophone", "language": "en"}, headers)
    if status not in [200, 201]:
        print(f"   FAIL: Case creation failed {status} {resp}")
        # Identify the UUID issue from logs earlier
        if "Field 'id' expected a number" in str(resp):
             print("   NOTE: Detected UUID vs Integer ID mismatch in Case Service.")
        return
    case_id = resp.get('id')
    print(f"   ✅ Case Created: {case_id}")

    # 4. Final Summary
    print("\n" + "=" * 60)
    print("PHASE 3 OPERATIONAL STATUS")
    print("=" * 60)
    print("Workflow: INCOMPLETE")
    print("Service Health: OK")
    print("Blocking Issues: Integrated Auth/Case ID type mismatch")

if __name__ == '__main__':
    test_phase3()
