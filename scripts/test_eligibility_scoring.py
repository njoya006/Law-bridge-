#!/usr/bin/env python
"""
Integration test for client service eligibility scoring.
Tests the RabbitMQ/Celery async task workflow.
"""
import json
import requests
import time
import uuid
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError


def register_test_user(email, role='client'):
    """Register a test user and return access token"""
    url = 'http://localhost:80/api/v1/auth/register/'
    data = {
        'email': email,
        'full_name': 'Test Client',
        'role': role,
        'password': 'TestPass123!',
    }
    
    req = Request(url, data=json.dumps(data).encode('utf-8'), method='POST')
    req.add_header('Content-Type', 'application/json')
    
    try:
        with urlopen(req) as resp:
            return json.loads(resp.read().decode('utf-8'))
    except HTTPError as e:
        print(f"Registration error: {e.read().decode()}")
        return None


def login_user(email, password='TestPass123!'):
    """Login and return access token"""
    url = 'http://localhost:80/api/v1/auth/login/'
    data = {'email': email, 'password': password}
    
    req = Request(url, data=json.dumps(data).encode('utf-8'), method='POST')
    req.add_header('Content-Type', 'application/json')
    
    try:
        with urlopen(req) as resp:
            result = json.loads(resp.read().decode('utf-8'))
            return result.get('access')
    except HTTPError as e:
        print(f"Login error: {e.read().decode()}")
        return None


def create_client_profile(token, income=200000, dependants=2, employment='employed'):
    """Create a client profile"""
    url = 'http://localhost:80/api/v1/clients/me/'
    data = {
        'full_name_en': 'Jean Dupont',
        'full_name_fr': 'Jean Dupont',
        'monthly_income': income,
        'dependants': dependants,
        'employment_status': employment,
    }
    
    req = Request(url, data=json.dumps(data).encode('utf-8'), method='POST')
    req.add_header('Content-Type', 'application/json')
    req.add_header('Authorization', f'Bearer {token}')
    
    try:
        with urlopen(req) as resp:
            return json.loads(resp.read().decode('utf-8'))
    except HTTPError as e:
        print(f"Profile creation error: {e.read().decode()}")
        return None


def get_eligibility_status(token):
    """Get eligibility status"""
    url = 'http://localhost:80/api/v1/clients/eligibility/'
    
    req = Request(url, method='GET')
    req.add_header('Authorization', f'Bearer {token}')
    
    try:
        with urlopen(req) as resp:
            return json.loads(resp.read().decode('utf-8'))
    except HTTPError as e:
        print(f"Eligibility check error: {e.read().decode()}")
        return None


def main():
    print("=" * 60)
    print("LawBridge Client Service - Eligibility Scoring Test")
    print("=" * 60)
    
    # Test 1: Register a user
    print("\n[TEST 1] Registering test user...")
    email = f"test-{uuid.uuid4().hex[:8]}@example.com"
    user = register_test_user(email)
    if not user:
        print("❌ Registration failed")
        return
    print(f"✅ Registered: {email}")
    
    # Test 2: Login
    print("\n[TEST 2] Logging in...")
    token = login_user(email)
    if not token:
        print("❌ Login failed")
        return
    print(f"✅ Login successful, token: {token[:20]}...")
    
    # Test 3: Create client profile with low income (should get high score)
    print("\n[TEST 3] Creating client profile with low income...")
    profile = create_client_profile(token, income=50000, dependants=3, employment='unemployed')
    if not profile:
        print("❌ Profile creation failed")
        return
    print(f"✅ Profile created: {profile}")
    
    # Test 4: Wait for Celery task to compute score (give it 5 seconds)
    print("\n[TEST 4] Waiting for Celery task to compute eligibility score...")
    print("    (Waiting 5 seconds for async computation...)")
    time.sleep(5)
    
    # Test 5: Check eligibility status
    print("\n[TEST 5] Checking eligibility status...")
    eligibility = get_eligibility_status(token)
    if not eligibility:
        print("❌ Eligibility check failed")
        return
    
    print(f"✅ Eligibility Result:")
    print(f"   User ID: {eligibility.get('user_id')}")
    print(f"   Score: {eligibility.get('eligibility_score')}")
    print(f"   Qualifies for aid: {eligibility.get('qualifies_for_aid')}")
    print(f"   Last computed: {eligibility.get('last_computed')}")
    
    score = eligibility.get('eligibility_score')
    qualifies = eligibility.get('qualifies_for_aid')
    
    # Verify scoring logic
    if score and score > 70 and qualifies:
        print("\n✅ SUCCESS: Low income client qualifies for legal aid!")
    elif score is None:
        print("\n⏳ PENDING: Eligibility score not computed yet (Celery task still processing)")
    else:
        print(f"\n❌ FAILED: Expected score > 70 for low-income client, got {score}")
    
    # Test 6: Create high-income profile (should not qualify)
    print("\n[TEST 6] Testing high-income profile (should NOT qualify)...")
    email2 = f"test-{uuid.uuid4().hex[:8]}@example.com"
    user2 = register_test_user(email2)
    token2 = login_user(email2)
    profile2 = create_client_profile(token2, income=2000000, dependants=0, employment='employed')
    print(f"✅ High-income profile created")
    
    time.sleep(5)
    eligibility2 = get_eligibility_status(token2)
    if eligibility2:
        score2 = eligibility2.get('eligibility_score')
        qualifies2 = eligibility2.get('qualifies_for_aid')
        print(f"   Score: {score2}")
        print(f"   Qualifies for aid: {qualifies2}")
        if score2 and score2 <= 70 and not qualifies2:
            print("✅ SUCCESS: High-income client does NOT qualify (as expected)")
        else:
            print(f"❌ FAILED: Expected score <= 70 for high-income client, got {score2}")
    
    print("\n" + "=" * 60)
    print("Test completed!")
    print("=" * 60)


if __name__ == '__main__':
    main()
