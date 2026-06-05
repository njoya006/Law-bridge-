# LAWBRIDGE — AGENT TASK FILE: PARTNER
## QA Engineer — Postman Testing & Documentation
### Read this every morning. Follow every step.

---

## YOUR ROLE

You are the QA Engineer for LawBridge. Your job is to test every
API endpoint that Praise builds, document the results clearly, and
report any failures immediately so they can be fixed before submission.

You do NOT write backend code. You do NOT touch Kubernetes.
Your tools are Postman, a browser, and a text editor.

Your laptop limitations are acknowledged — all your work runs
in Postman and a text editor, nothing more demanding than that.

---

## PHASE 0 — SETUP (Do Once)

### Step 0.1 — Install Postman

Download and install Postman from https://www.postman.com/downloads/
Create a free Postman account.
This is the only tool you need for testing.

### Step 0.2 — Create Postman Environment

In Postman, create a new Environment called LawBridge Local.
Add these variables:

| Variable | Initial Value | Current Value |
|---|---|---|
| base_url | http://localhost:80 | http://localhost:80 |
| client_token | (empty) | (fill after login) |
| lawyer_token | (empty) | (fill after login) |
| admin_token | (empty) | (fill after login) |
| case_id | (empty) | (fill after case creation) |
| lawyer_id | (empty) | (fill after lawyer creation) |
| document_id | (empty) | (fill after upload) |
| analysis_id | (empty) | (fill after AI analysis) |
| session_id | (empty) | (fill after chat) |

Save the environment and select it before running any tests.

### Step 0.3 — Clone the Repository

Clone the LawBridge repo that Praise sets up.
You only need to read the README.md and docs/ folder.
Do not edit any code files.

### Step 0.4 — Wait for Praise's Infrastructure

Do NOT start testing until Praise confirms:
"docker-compose up is running and all services are healthy"

Once confirmed, open http://localhost:80 in your browser.
You should see the LawBridge frontend loading.

---

## PHASE 1 — AUTH SERVICE TESTING
### Run after Praise completes Auth Service

### Step 1.1 — Registration Tests

Test 1: Register a client
```
POST {{base_url}}/api/v1/auth/register/
Body (JSON):
{
  "email": "client@test.com",
  "full_name": "Jean Dupont",
  "role": "client",
  "password": "TestPass123!",
  "password_confirm": "TestPass123!"
}
Expected: 201 Created with user data
```

Test 2: Register a lawyer
```
POST {{base_url}}/api/v1/auth/register/
Body (JSON):
{
  "email": "lawyer@test.com",
  "full_name": "Me. Ambe Martin",
  "role": "lawyer",
  "password": "TestPass123!",
  "password_confirm": "TestPass123!"
}
Expected: 201 Created
```

Test 3: Try to register as admin (must fail)
```
POST {{base_url}}/api/v1/auth/register/
Body: same but role: "admin"
Expected: 400 Bad Request
```

Test 4: Register with mismatched passwords (must fail)
```
password: "TestPass123!"
password_confirm: "WrongPass!"
Expected: 400 Bad Request
```

Test 5: Register with already-used email (must fail)
```
Use client@test.com again
Expected: 400 Bad Request with "email already exists" message
```

### Step 1.2 — Login Tests

Test 6: Login as client → save token
```
POST {{base_url}}/api/v1/auth/login/
Body: {"email": "client@test.com", "password": "TestPass123!"}
Expected: 200 with access + refresh tokens
Action: Copy access token → paste into client_token variable
```

Test 7: Login as lawyer → save token
```
Same but lawyer@test.com
Action: Save into lawyer_token variable
```

Test 8: Login with wrong password (must fail)
```
Expected: 401 Unauthorized
```

Test 9: Verify JWT contains correct fields
```
Go to https://jwt.io
Paste the client_token access token
Verify payload contains: user_id, email, role, full_name
```

Test 10: Get current user profile
```
GET {{base_url}}/api/v1/auth/me/
Header: Authorization: Bearer {{client_token}}
Expected: 200 with user profile
```

Test 11: Access protected endpoint without token (must fail)
```
GET {{base_url}}/api/v1/auth/me/
No Authorization header
Expected: 401 Unauthorized
```

Test 12: Logout
```
POST {{base_url}}/api/v1/auth/logout/
Header: Authorization: Bearer {{client_token}}
Body: {"refresh": "<refresh_token>"}
Expected: 200 success
```

---

## PHASE 2 — LAWYER DISCOVERY TESTING
### Run after Praise completes Lawyer Service

Test 13: Browse all lawyers (no auth needed)
```
GET {{base_url}}/api/v1/lawyers/
Expected: 200 with list (may be empty initially)
```

Test 14: Create lawyer profile
```
POST {{base_url}}/api/v1/lawyers/me/
Header: Authorization: Bearer {{lawyer_token}}
Body:
{
  "specialization": "Criminal Law",
  "qualifications": "LLB, BL",
  "bio": "10 years experience in criminal defense",
  "years_of_experience": 10,
  "consultation_fee": 50000,
  "bijural_flag": "common_law",
  "bar_number": "SW/2015/001"
}
Expected: 201 Created
Action: Save lawyer profile user_id as lawyer_id variable
```

Test 15: Filter lawyers by specialization
```
GET {{base_url}}/api/v1/lawyers/?specialization=Criminal Law
Expected: 200 with filtered list including our lawyer
```

Test 16: Smart lawyer matching algorithm
```
POST {{base_url}}/api/v1/lawyers/match/
Header: Authorization: Bearer {{client_token}}
Body:
{
  "case_type": "criminal",
  "circuit": "anglophone",
  "language_preference": "en",
  "urgency": "high"
}
Expected: 200 with top 3 ranked lawyers + scores
```

Test 17: Search lawyers by name
```
GET {{base_url}}/api/v1/lawyers/search/?q=Ambe
Expected: 200 with matching lawyer
```

---

## PHASE 3 — CASE SERVICE TESTING
### Run after Praise completes Case Service

Test 18: File a new case
```
POST {{base_url}}/api/v1/cases/
Header: Authorization: Bearer {{client_token}}
Body:
{
  "title": "Property dispute - Buea",
  "case_type": "civil",
  "circuit": "anglophone",
  "legal_tradition": "common_law",
  "description": "My neighbor has encroached on my land",
  "language": "en"
}
Expected: 201 Created
Action: Save case id as case_id variable
```

Test 19: View case status timeline
```
GET {{base_url}}/api/v1/cases/{{case_id}}/
Header: Authorization: Bearer {{client_token}}
Expected: 200 with case data including timeline array
```

Test 20: Conflict of interest detection
```
POST {{base_url}}/api/v1/cases/{{case_id}}/assign/
Header: Authorization: Bearer {{admin_token}} (need admin login)
Body: {"lawyer_id": "{{lawyer_id}}"}
Expected: Either 200 (assigned) or 409 (conflict detected)
Document what you see and report to Praise
```

Test 21: Client cannot see another client's case
```
Register a second client: client2@test.com
Login and get client2_token
GET {{base_url}}/api/v1/cases/{{case_id}}/
Header: Authorization: Bearer <client2_token>
Expected: 403 or 404 Forbidden
```

---

## PHASE 4 — DOCUMENT SERVICE TESTING
### Run after Praise completes Document Service

Test 22: Upload a legal document
```
POST {{base_url}}/api/v1/documents/
Header: Authorization: Bearer {{lawyer_token}}
Body (form-data):
  case_id: {{case_id}}
  document_type: affidavit
  file: [attach any PDF file]
Expected: 202 Accepted (async processing)
Action: Save document_id from response
```

Test 23: Check document processing status
```
GET {{base_url}}/api/v1/documents/{{document_id}}/
Header: Authorization: Bearer {{lawyer_token}}
Expected: 200 with status (pending → processing → completed)
Poll every 30 seconds until status is completed
```

Test 24: View audit log
```
GET {{base_url}}/api/v1/documents/{{document_id}}/audit/
Header: Authorization: Bearer {{lawyer_token}}
Expected: 200 with at least 1 audit entry (upload action)
```

Test 25: Download document (creates audit entry)
```
GET {{base_url}}/api/v1/documents/{{document_id}}/download/
Header: Authorization: Bearer {{client_token}}
Expected: 200 with PDF file
```

Test 26: Verify audit log has download entry
```
GET {{base_url}}/api/v1/documents/{{document_id}}/audit/
Expected: 2 entries now (upload + download)
Each entry must have: user_id, action, timestamp, ip_address
```

---

## PHASE 5 — AI ASSISTANT TESTING
### Run after Praise completes AI Assistant Service

Test 27: Chat in English
```
POST {{base_url}}/api/v1/ai/chat/
Header: Authorization: Bearer {{client_token}}
Body: {"message": "What is OHADA law?"}
Expected: 200 with streaming response tokens
Action: Save session_id from first SSE data event
```

Test 28: Chat in French
```
POST {{base_url}}/api/v1/ai/chat/
Body: {"message": "Qu'est-ce que la loi OHADA?"}
Expected: Response in French with French disclaimer
```

Test 29: Chat with case context
```
POST {{base_url}}/api/v1/ai/chat/
Body:
{
  "message": "What are my options for this case?",
  "case_id": "{{case_id}}",
  "session_id": "{{session_id}}"
}
Expected: Response that mentions the case details
```

Test 30: Request document analysis
```
POST {{base_url}}/api/v1/ai/analyze/
Header: Authorization: Bearer {{client_token}}
Body: {"document_id": "{{document_id}}", "case_id": "{{case_id}}"}
Expected: 202 with analysis_id
Action: Save analysis_id variable
```

Test 31: Poll for analysis result
```
GET {{base_url}}/api/v1/ai/analyze/{{analysis_id}}/
Poll every 30 seconds until status = completed
Expected completed response has:
  summary (text)
  key_points (array)
  risks (array)
  recommendations (array)
```

Test 32: Case outcome prediction
```
POST {{base_url}}/api/v1/ai/predict/
Header: Authorization: Bearer {{client_token}}
Body:
{
  "case_type": "civil",
  "circuit": "anglophone",
  "legal_tradition": "common_law",
  "evidence_summary": "Land title documents available, two witnesses"
}
Expected: 200 with:
  likely_outcome (favorable/unfavorable/uncertain)
  confidence (0-100)
  reasoning (text)
  recommended_actions (array)
```

---

## PHASE 6 — PAYMENT SERVICE TESTING

Test 33: Create an invoice
```
POST {{base_url}}/api/v1/payments/invoices/
Header: Authorization: Bearer {{lawyer_token}}
Body:
{
  "case_id": "{{case_id}}",
  "client_id": "<client user_id>",
  "amount": 150000,
  "currency": "XAF",
  "items": [{"description": "Legal consultation", "amount": 150000}]
}
Expected: 201 with invoice data
```

Test 34: Record cash payment (admin only)
```
POST {{base_url}}/api/v1/payments/
Header: Authorization: Bearer {{admin_token}}
Body (form-data):
  case_id: {{case_id}}
  amount: 150000
  method: cash
  receipt: [attach image file]
Expected: 201 with payment record
```

---

## PHASE 7 — NOTIFICATION TESTING

Test 35: View notifications (after all above actions)
```
GET {{base_url}}/api/v1/notifications/
Header: Authorization: Bearer {{client_token}}
Expected: 200 with list of notifications
Should include: case.assigned, doc.uploaded, ai.analysis_ready
```

Test 36: Mark notification as read
```
PATCH {{base_url}}/api/v1/notifications/<notif_id>/read/
Expected: 200 with is_read: true
```

---

## DOCUMENTING RESULTS

For every test, record in a results table:

| Test # | Endpoint | Method | Expected Status | Actual Status | Pass/Fail | Notes |
|---|---|---|---|---|---|---|
| 1 | /api/v1/auth/register/ | POST | 201 | 201 | ✅ Pass | |
| 2 | /api/v1/auth/register/ | POST | 201 | 201 | ✅ Pass | |
| 3 | /api/v1/auth/register/ | POST | 400 | 400 | ✅ Pass | Admin blocked |
...

Save this table in docs/postman/TEST_RESULTS.md

When a test FAILS, record:
- The exact error message from the response
- A screenshot of the Postman request + response
- Message Praise immediately with: Test #N failed — [endpoint] — [error]

---

## EXPORT POSTMAN COLLECTION

When all tests are done:
In Postman, right-click your collection → Export
Save as: docs/postman/LawBridge_API_Tests.postman_collection.json
Commit this file to the repository.

Also export the environment:
Postman → Environments → Export
Save as: docs/postman/LawBridge_Local.postman_environment.json
