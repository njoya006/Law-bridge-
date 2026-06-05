# LAWBRIDGE — AGENT TASK FILE: PRAISE
## Master Execution Plan — Read This Every Morning
### You have 1 month. Every step must be completed before the next.

---

## BEFORE ANYTHING ELSE

Read these files completely today before writing a single line of code:

    agents/praise/00_CONTEXT.md          ← Ground rules, stack, rules
    README.md                            ← Full file structure
    docs/01_PROJECT_DESCRIPTION.md       ← What you are building
    docs/02_SPECIFICATION.md             ← All requirements

---

# PHASE 1 — INFRASTRUCTURE, DOCKER & KUBERNETES
## Week 1, Days 1-2
## Reference: agents/praise/01_DEVOPS_SETUP.md

This phase must be done before any service code is written.
Your partner cannot start testing until services are running.
The CI/CD pipeline must be working before you start merging code.

---

### Step 1.1 — GitHub Repository Setup

Create a new GitHub repository named lawbridge.
Make it private.

Create the complete folder structure exactly as shown in the
README.md under Complete File Structure.
Every folder must exist even if empty — add a .gitkeep file
to keep empty folders tracked by git.

Create all branches immediately:
main, develop, praise/devops, praise/auth-service,
praise/case-service, praise/lawyer-service, praise/client-service,
praise/document-service, praise/payment-service,
praise/notification-service, praise/calendar-service,
praise/monitoring-service, praise/search-service,
praise/ai-assistant, praise/frontend,
partner/testing

Protect the main and develop branches on GitHub:
Go to Settings → Branches → Add rule.
Require pull request reviews before merging.
Require status checks to pass (Jenkins will set these).

Invite your partner with write access to partner/* branches.

---

### Step 1.2 — Docker Compose for Local Development

Open agents/praise/01_DEVOPS_SETUP.md and go to the
Docker Compose section.

Write the complete docker-compose.yml at the project root.
It must include all 11 Django services, 11 PostgreSQL databases,
Redis, RabbitMQ, MinIO, Nginx, and Ollama.

Write individual Dockerfiles for each service.
All Dockerfiles follow the same pattern — see 01_DEVOPS_SETUP.md.

Write .env.example with every required environment variable.
Copy it to .env and fill in development values.

Write gateway/nginx.conf routing all /api/v1/* prefixes
to the correct upstream service.

Test the full stack:
docker-compose up --build
docker-compose ps

All containers must show as running before you continue.

---

### Step 1.3 — Kind Kubernetes Setup (Local)

Install Kind and kubectl if not already installed.
Open agents/praise/01_DEVOPS_SETUP.md and go to the
Kubernetes Kind section.

Create k8s/kind-config.yaml with a 1 control-plane + 2 worker
node cluster configuration.

Create the Kind cluster:
kind create cluster --config k8s/kind-config.yaml --name lawbridge

Create the lawbridge namespace:
kubectl create namespace lawbridge

Write k8s/base/namespace.yaml and apply it.

Write k8s/base/configmap.yaml with non-secret shared config
(Redis URL, RabbitMQ URL, service URLs).

Write Kubernetes Secrets for all sensitive values:
kubectl create secret generic lawbridge-secrets \
  --from-env-file=.env \
  --namespace=lawbridge

Write the Kustomization files:
k8s/base/kustomization.yaml
k8s/overlays/dev/kustomization.yaml
k8s/overlays/staging/kustomization.yaml
k8s/overlays/production/kustomization.yaml

---

### Step 1.4 — Kubernetes Base Manifests for Infrastructure

Write these manifests in k8s/base/infrastructure/:

redis-deployment.yaml
Write a Redis 7 Deployment + Service.
1 replica for dev, 2 for production overlay.
Use redis:7-alpine image.

rabbitmq-statefulset.yaml
Write a RabbitMQ StatefulSet + Service.
Use rabbitmq:3-management image.
Add management UI on port 15672 for dev overlay only.

minio-statefulset.yaml
Write a MinIO StatefulSet + Service.
Use minio/minio:latest image.
Add a PersistentVolumeClaim for document storage.

ollama-deployment.yaml
Write an Ollama Deployment + Service.
Use ollama/ollama:latest image.
Port 11434.
Add a PersistentVolumeClaim for model storage.
NB: Ollama downloads models on first run.
Pre-pull Mistral 7B by running an init container or
a Job that runs ollama pull mistral after startup.

nginx-deployment.yaml
Write an Nginx Deployment + Service.
Mount gateway/nginx.conf as a ConfigMap volume.

---

### Step 1.5 — Jenkins CI/CD Setup

Open agents/praise/01_DEVOPS_SETUP.md and go to the
Jenkins section.

Install Jenkins either locally or on your VPS.
The recommended approach is to run Jenkins as a Docker container:
docker run -d -p 8080:8080 -p 50000:50000 \
  -v jenkins_home:/var/jenkins_home \
  jenkins/jenkins:lts

Install these Jenkins plugins:
GitHub Integration, Docker Pipeline, Kubernetes,
SonarQube Scanner, Blue Ocean, Pipeline.

Write jenkins/Jenkinsfile with these exact stages:
Stage 1: Checkout — pull code from GitHub
Stage 2: Detect changed services — only rebuild what changed
Stage 3: Run unit tests — pytest for each changed service
Stage 4: SonarQube scan — code quality gate
Stage 5: Docker build — build image for changed service
Stage 6: Push to registry — push to GitHub Container Registry
Stage 7: Deploy to staging — apply K8s manifests (develop branch)
Stage 8: Integration tests — run Postman collection
Stage 9: Manual approval — gate before production
Stage 10: Deploy to production — apply K8s manifests (main branch)

Write jenkins/Jenkinsfile.feature for feature branch PRs:
Stage 1: Checkout
Stage 2: Run unit tests
Stage 3: SonarQube scan
Stage 4: Docker build (do not push)
Stage 5: Report results back to GitHub PR

Configure GitHub webhook:
Go to GitHub repo Settings → Webhooks → Add webhook.
Payload URL: http://your-jenkins-url/github-webhook/
Content type: application/json
Events: Push + Pull Request

---

### Step 1.6 — Verify Everything

Run the full local stack with Docker Compose and verify:
All 11 services start without errors.
Nginx routes /api/v1/auth/ to auth-service correctly.
Redis is reachable from any service.
RabbitMQ management UI loads at http://localhost:15672.
MinIO console loads at http://localhost:9001.
Ollama responds at http://localhost:11434/api/tags.

Run the Kind cluster and verify:
kubectl get nodes -n lawbridge → 3 nodes Ready.
kubectl get pods -n lawbridge → Infrastructure pods running.
Nginx Ingress reachable at http://localhost:8080.

Verify Jenkins:
Jenkins dashboard loads at http://localhost:8080.
GitHub webhook test delivers successfully.
A test commit triggers the pipeline.

Phase 1 is complete when all three environments are running.

---

# PHASE 2 — AUTH SERVICE + CLIENT SERVICE + LAWYER SERVICE
## Week 1, Days 3-5
## Reference: agents/praise/02_AUTH_SERVICE.md
##             agents/praise/05_CLIENT_SERVICE.md
##             agents/praise/04_LAWYER_SERVICE.md

Before writing any code read:
diagrams/04_SEQUENCE_DIAGRAM.md → Sequence 1 (registration + login)
diagrams/01_ER_DIAGRAM.md → Auth, Client, Lawyer sections

---

### Step 2.1 — Auth Service

Switch to branch praise/auth-service.
Navigate to services/auth-service/.

Follow agents/praise/02_AUTH_SERVICE.md exactly.
Build in this order:
1. Django project setup (django-admin startproject core .)
2. settings.py with JWT config, CORS, drf-spectacular
3. Custom User model with UUID PK, email auth, role field
4. JWT CustomTokenObtainPairSerializer adding role + circuit_tag
5. Permission classes (IsPatient, IsLawyer, IsAdmin, IsInternalService)
6. Register, Login, Logout, VerifyToken, Me views
7. URLs + Swagger UI
8. Migrations + test admin user
9. Write unit tests with pytest (minimum 80% coverage)
10. Write K8s manifests: k8s/base/services/auth-deployment.yaml
11. Run SonarQube scan — fix any critical issues
12. Run all Postman tests — all must pass

Push: git commit -m "feat: auth service complete"
      git push origin praise/auth-service
Open PR into develop.

---

### Step 2.2 — Client Service

Switch to branch praise/client-service.
Navigate to services/client-service/.

Follow agents/praise/05_CLIENT_SERVICE.md exactly.
Key features to implement:
1. ClientProfile model (UUID PK, user_id cross-ref, bilingual fields)
2. Legal aid eligibility scoring algorithm
   - Inputs: monthly_income, dependants, case_type, employment_status
   - Score 0-100. Score > 70 = qualifies for free aid
   - Computed asynchronously via RabbitMQ eligibility.compute queue
   - Result cached in Redis with key client:eligibility:{user_id} TTL 1hr
3. InternalClientView secured by INTERNAL_API_KEY
4. Medical history equivalent → case history view
5. Unit tests (80% coverage minimum)
6. K8s manifest: k8s/base/services/client-deployment.yaml

Push and open PR into develop.

---

### Step 2.3 — Lawyer Service (with Discovery)

Switch to branch praise/lawyer-service.
Navigate to services/lawyer-service/.

Follow agents/praise/04_LAWYER_SERVICE.md exactly.
This service has TWO apps: lawyers/ and discovery/.

Key features in lawyers/ app:
1. LawyerProfile model (specialization, bijural_flag, bar_number,
   years_experience, consultation_fee, availability_status)
2. LawyerAvailability model (weekly schedule)
3. InternalLawyerView (INTERNAL_API_KEY secured)
4. Admin activate/deactivate lawyer accounts

Key features in discovery/ app:
This is the Lawyer Discovery feature for clients.
1. Public endpoint: GET /api/v1/lawyers/?specialization=X&circuit=Y
   - No authentication required
   - Returns active lawyers with profiles + availability
   - Results cached in Redis: lawyers:list:{filters} TTL 5 min
2. Smart matching algorithm endpoint:
   POST /api/v1/lawyers/match/
   - Input: case_type, circuit, language_preference, urgency
   - Scores all active lawyers 0-100 based on:
     specialization match (40 points)
     current caseload (30 points — fewer cases = higher score)
     years of experience (20 points)
     circuit match (10 points)
   - Returns top 3 ranked lawyers with scores
   - NB: This is the innovative feature — document the algorithm well
3. Search endpoint:
   GET /api/v1/lawyers/search/?q=keyword
   - Full text search on name, specialization, bio
   - Bilingual (EN + FR indexed fields)

Unit tests covering the matching algorithm edge cases.
K8s manifest: k8s/base/services/lawyer-deployment.yaml

Push and open PR into develop.

Phase 2 is complete when all 3 services pass tests and
their internal endpoints respond correctly to each other.

---

# PHASE 3 — CASE SERVICE + DOCUMENT SERVICE + PAYMENT SERVICE
## Week 2, Days 1-3
## Reference: agents/praise/03_CASE_SERVICE.md
##             agents/praise/06_DOCUMENT_SERVICE.md
##             agents/praise/07_PAYMENT_SERVICE.md

Before writing Case Service code re-read:
diagrams/04_SEQUENCE_DIAGRAM.md → Sequence 2 (case filing)
diagrams/04_SEQUENCE_DIAGRAM.md → Sequence 3 (document upload)

---

### Step 3.1 — Case Service

Switch to branch praise/case-service.
Navigate to services/case-service/.

This is the most complex service. Follow
agents/praise/03_CASE_SERVICE.md exactly.

Three apps: cases/, conflicts/, deadlines/

cases/ app:
1. Case model (legal_tradition, circuit_id, status, timeline JSONField)
2. CaseNote model (lawyer adds notes to case)
3. Status choices: draft, filed, assigned, in_progress,
   hearing_scheduled, verdict, closed, dismissed
4. Live timeline: every status change appends to timeline JSONField
   and publishes case.updated to Redis Pub/Sub
5. Case assignment: calls Lawyer Service matching algorithm internally
   then creates assignment

conflicts/ app:
1. ConflictCheck model (lawyer_id, opposing_party_ids JSONField)
2. Before any lawyer is assigned to a case, query ConflictCheck
   to see if that lawyer already represents the opposing party
3. If conflict found: return 409 Conflict with details
4. If clear: proceed with assignment
5. NB: This is the conflict of interest detection feature

deadlines/ app:
1. Deadline model (case_id, deadline_type, due_date, status)
2. Celery Beat task runs every 1 hour checking for missed deadlines
3. If deadline missed: publish deadline.missed to Redis Pub/Sub
4. Escalation: create escalation record + notify admin via RabbitMQ

Unit tests must cover:
- Conflict detection (test with conflicting and non-conflicting lawyers)
- Deadline escalation (test with past-due dates)
- Status timeline appending correctly

K8s manifest: k8s/base/services/case-deployment.yaml

---

### Step 3.2 — Document Service

Switch to branch praise/document-service.
Navigate to services/document-service/.

Follow agents/praise/06_DOCUMENT_SERVICE.md exactly.

Two apps: documents/ and audit/

documents/ app:
1. Document model (case_id, uploader_id, file path in MinIO,
   encryption_key_id, version, document_type)
2. Upload flow via RabbitMQ document.process queue:
   a. Receive file → save temporarily
   b. Celery worker picks up document.process task
   c. Run ClamAV virus scan (use clamd Python library)
   d. AES-256 encrypt using cryptography library
   e. Upload encrypted blob to MinIO
   f. Save metadata to doc_db
   g. Create audit log entry
   h. Publish doc.uploaded to Redis Pub/Sub
3. Download flow:
   a. Check user has permission for this case
   b. Fetch encrypted blob from MinIO
   c. Decrypt in-memory (never save decrypted to disk)
   d. Return as streaming response
   e. Create audit log entry for download

audit/ app:
1. AuditLog model with these constraints:
   - No UPDATE allowed (DB trigger + Django signal)
   - No DELETE allowed (DB trigger + Django signal)
   - Fields: document_id, user_id, action (view/download/upload/share),
     timestamp, ip_address, user_agent
2. Every document access must create an audit entry
3. AuditLog is write-once — this is enforced at model level

NB: The immutability of AuditLog is the chain of custody feature.
Test that update and delete operations raise exceptions.

K8s manifest: k8s/base/services/document-deployment.yaml

---

### Step 3.3 — Payment Service

Switch to branch praise/payment-service.
Navigate to services/payment-service/.

Follow agents/praise/07_PAYMENT_SERVICE.md.

Two apps: payments/ and invoices/

payments/ app:
1. Payment model (amount, currency, method, status, case_id,
   mtn_reference, orange_reference, cash_receipt_path)
2. MTN Mobile Money webhook handler:
   - Receives POST from MTN API
   - Pushes to RabbitMQ payment.verify queue
   - Celery worker verifies → updates ledger
   - Publishes payment.confirmed to Redis
3. Orange Money webhook handler (same pattern as MTN)
4. Cash payment endpoint (admin only):
   - Admin uploads receipt image to MinIO
   - Records payment manually with receipt reference
5. Transaction ledger view (read-only, sorted by date)

invoices/ app:
1. Invoice model (case_id, client_id, amount, items JSONField,
   issued_at, due_at, paid_at, status)
2. Generate invoice PDF (use reportlab or weasyprint)
3. Send invoice via RabbitMQ email.send queue

NB: RabbitMQ prevents duplicate payment processing.
If MTN webhook fires twice, the idempotency key prevents
double-recording. Test this case explicitly.

K8s manifest: k8s/base/services/payment-deployment.yaml

Phase 3 complete when all 3 services pass tests.

---

# PHASE 4 — NOTIFICATION + CALENDAR + SEARCH
## Week 2, Days 4-5
## Reference: agents/praise/08_NOTIFICATION_SERVICE.md
##             agents/praise/09_CALENDAR_SERVICE.md
##             agents/praise/11_SEARCH_SERVICE.md

---

### Step 4.1 — Notification Service

Follow agents/praise/08_NOTIFICATION_SERVICE.md.

This service has two consumers:
1. Redis Pub/Sub subscriber (real-time, instant)
   Subscribes to: case.updated, case.assigned, deadline.missed,
   hearing.scheduled, payment.confirmed, doc.uploaded, ai.analysis_ready
   For each event: create Notification record in DB

2. RabbitMQ consumer (guaranteed delivery)
   Consumes from: email.send, sms.send queues
   Dispatches to SendGrid / Africa's Talking
   Retries 3 times on failure before dead-lettering

Bilingual message templates:
Every notification type must have both EN and FR versions.
User's language preference is stored in auth_db and passed
in the JWT payload. Use that to pick the right template.

K8s manifest: k8s/base/services/notification-deployment.yaml

---

### Step 4.2 — Calendar Service

Follow agents/praise/09_CALENDAR_SERVICE.md.

Key models:
1. CalendarEvent (hearing or meeting, case_id, date, time, location)
2. EventApproval (both parties must approve — two approval records)
3. Alarm (linked to event, alarm_type: 48hr / 1hr, status: pending/sent)

Rescheduling workflow:
When a lawyer proposes a new time:
- Status → reschedule_proposed
- Other party gets notification (RabbitMQ email.send)
- Other party approves → status confirmed, Redis event fires
- Other party rejects → status reverted

Alarm dispatch via Celery Beat:
Every 15 minutes, check for alarms due in next window.
48hr alarms → RabbitMQ sms.send + email.send queues
1hr alarms → RabbitMQ sms.send + push notification

Conflict check before saving any event:
Use Python dateutil to verify lawyer has no other event
at the same time before confirming.

K8s manifest: k8s/base/services/calendar-deployment.yaml

---

### Step 4.3 — Search Service

Follow agents/praise/11_SEARCH_SERVICE.md.

This service federates search across multiple services.
It does NOT have its own data — it queries other services
via internal HTTP calls and merges results.

Search endpoints:
GET /api/v1/search/?q=murder&type=case&circuit=anglophone
GET /api/v1/search/?q=john+doe&type=lawyer&specialization=criminal
GET /api/v1/search/?q=property&type=document&case_id=uuid

Implementation:
1. Receive search query
2. Call relevant service internal search endpoints in parallel
   using asyncio or ThreadPoolExecutor
3. Merge and rank results by relevance score
4. Cache results in Redis: search:{query_hash} TTL 2 minutes
5. Return merged paginated results

Bilingual search:
Index both EN and FR versions of text fields.
PostgreSQL tsvector with french and english dictionaries.
When query is in French → use french tsvector config.
When query is in English → use english tsvector config.
Auto-detect language using langdetect Python library.

K8s manifest: k8s/base/services/search-deployment.yaml

Phase 4 complete when all notification, calendar, and search
services pass their tests.

---

# PHASE 5 — MONITORING SERVICE + AI ASSISTANT SERVICE
## Week 3, Days 1-2
## Reference: agents/praise/10_MONITORING_SERVICE.md
##             agents/praise/12_AI_ASSISTANT.md

---

### Step 5.1 — Monitoring Service

Follow agents/praise/10_MONITORING_SERVICE.md.

This service uses Django Channels + WebSockets for real-time updates.

Features:
1. Materialised case progress view (updated on every case.updated event)
2. Conflict of interest dashboard (reads from case-service conflicts)
3. Lawyer performance stats (cases per month, avg resolution time)
4. WebSocket endpoint for live case timeline push

WebSocket setup:
ASGI server: Daphne
Django Channels with Redis channel layer
WS endpoint: ws://api/v1/monitoring/cases/{case_id}/timeline/

When case.updated Redis event fires:
→ Monitoring service updates materialised view
→ Pushes update to all WebSocket clients watching that case_id

K8s manifest: k8s/base/services/monitoring-deployment.yaml

---

### Step 5.2 — AI Assistant Service

This is the most innovative part of the system.
Follow agents/praise/12_AI_ASSISTANT.md completely.
Use Claude Opus 4.5 on Copilot for this entire service.

Three apps: chat/, analyzer/, predictor/

Setup Ollama connection first:
The Ollama server runs as a separate Kubernetes Deployment.
AI Assistant Service communicates with it via HTTP at:
http://ollama:11434/api/generate

Model strategy:
Mistral 7B → Legal Q&A chat (fast, good reasoning)
LLaMA3 8B → Document analysis (better at long-form)
Phi-3 Mini → Quick autocomplete suggestions (smallest, fastest)

System prompt for Cameroon law context:
Write a comprehensive system prompt stored in
services/ai-assistant-service/ollama/system_prompt.txt
It must include:
- Context about Cameroon's bijural legal system
- OHADA law framework overview
- Common Law (Anglophone) procedures
- Civil Law (Francophone) procedures
- Bilingual instruction (respond in user's language)
- Disclaimer that AI advice is not a substitute for a real lawyer

chat/ app:
1. ChatSession model (user_id, case_id optional, messages JSONField)
2. POST /api/v1/ai/chat/ → sends message to Ollama Mistral
3. Stream response back to frontend using Server-Sent Events (SSE)
4. Save conversation to ChatSession
5. If case_id provided: inject case summary into system context
   so AI knows the case details when answering questions

analyzer/ app:
1. POST /api/v1/ai/analyze/ → accept document_id or upload PDF
2. Push to RabbitMQ ai.analyze_document queue
3. Celery worker:
   a. Fetch document from MinIO (or use uploaded file)
   b. Extract text with pdfplumber
   c. Send to Ollama LLaMA3 with document analysis prompt
   d. Parse structured response: summary, key_points, risks, recommendations
   e. Save analysis result to ai_db
   f. Publish ai.analysis_ready to Redis Pub/Sub
4. GET /api/v1/ai/analyze/{id}/ → return saved analysis

predictor/ app:
1. POST /api/v1/ai/predict/ → case_type, circuit, evidence_summary
2. Build prediction prompt with:
   - Historical case outcome patterns (from monitoring_db analytics)
   - Similar cases statistics
   - Legal precedents context
3. Send to Ollama Mistral
4. Return structured prediction:
   {
     "likely_outcome": "favorable|unfavorable|uncertain",
     "confidence": 0-100,
     "reasoning": "...",
     "recommended_actions": [...],
     "similar_cases_count": N
   }

Fine-tuning approach (no GPU needed):
Use Ollama Modelfile to customize base model behavior.
Create services/ai-assistant-service/ollama/Modelfile:
```
FROM mistral
SYSTEM """<content of system_prompt.txt>"""
PARAMETER temperature 0.3
PARAMETER num_ctx 4096
```
Load custom model: ollama create lawbridge-mistral -f Modelfile

Integration into case workflow:
When a new case is filed:
→ AI automatically analyzes the case description
→ Suggests case category if not provided
→ Suggests matching lawyer specialization
→ This suggestion appears in the admin assignment UI

When a document is uploaded to a case:
→ AI automatically queues analysis
→ Summary appears on case detail page alongside the document

K8s manifest: k8s/base/services/ai-deployment.yaml

Also write ollama K8s deployment with:
- PVC for model storage (models are large, need persistence)
- Init container to pull models on first deploy
- Resource limits: minimum 4GB RAM for Mistral 7B

Phase 5 complete when:
Chat responds in both EN and FR correctly.
Document analysis returns structured JSON summary.
Case prediction returns structured outcome prediction.
Ollama deployment runs in Kind cluster successfully.

---

# PHASE 6 — NEXT.JS FRONTEND
## Week 3, Days 3-5 and Week 4, Days 1-3
## Reference: agents/praise/13_FRONTEND.md

Before writing any frontend code re-read all sequence diagrams.

---

### Step 6.1 — Project Setup

Navigate to frontend/.
Run: npx create-next-app@latest . --typescript --tailwind --app

Install dependencies:
npm install axios @tanstack/react-query socket.io-client
npm install react-pdf pdfjs-dist
npm install react-markdown
npx shadcn@latest init

Create all folders as shown in README.md frontend section.

Write frontend/.env.local:
NEXT_PUBLIC_API_URL=http://localhost:80
NEXT_PUBLIC_WS_URL=ws://localhost:80

---

### Step 6.2 — API Client and Auth

Write lib/api.ts with:
- Axios instance pointing to NEXT_PUBLIC_API_URL
- JWT request interceptor (attach Bearer token)
- 401 response interceptor (auto-refresh token)
- All service API functions organized by domain

Write context/AuthContext.tsx:
- Login, logout, register functions
- Role-based redirects on login
- Persistent auth via localStorage

---

### Step 6.3 — Pages in Priority Order

Build in this exact order (highest impact first):

1. /login and /register — test auth flow immediately
2. /dashboard — role-based (client/lawyer/admin views)
3. /cases — list + status badges + real-time updates
4. /cases/new — file a new case with AI category suggestion
5. /cases/[id] — case detail with timeline + documents + AI analysis
6. /lawyers — lawyer discovery (search + filter + match)
7. /lawyers/[id] — lawyer profile + book consultation
8. /documents — upload + chain of custody audit log view
9. /ai-assistant — full chat interface + document analyzer
10. /payments — invoice list + payment status
11. /calendar — hearing schedule + alarm settings
12. /notifications — notification list + mark read
13. /admin/* — admin dashboard reading from Data Warehouse

---

### Step 6.4 — AI Assistant UI

Write components/ai/ChatInterface.tsx:
- Message list with user/assistant bubbles
- Streaming response display (SSE)
- Language selector (EN/FR)
- Case context selector (attach chat to a specific case)
- Copy message button

Write components/ai/DocumentAnalyzer.tsx:
- PDF upload drag-and-drop
- Progress indicator while analyzing
- Structured result display:
  Summary, Key Points, Risks, Recommendations
- Download analysis as PDF button

Write components/ai/OutcomePredictor.tsx:
- Case details form
- Prediction result with confidence meter (progress bar)
- Reasoning display
- Recommended actions checklist

---

### Step 6.5 — Real-Time Features

Wire WebSocket connection to monitoring-service:
Use native WebSocket in useEffect on case detail page.
On connection: send {case_id: uuid} to subscribe
On message: update case timeline in React state
On disconnect: attempt reconnect with exponential backoff

---

### Step 6.6 — Kubernetes Frontend Deployment

Write frontend/Dockerfile (multi-stage build):
Stage 1: node:20-alpine → npm install + npm build
Stage 2: node:20-alpine → copy .next/standalone → run server

Write k8s/base/services/frontend-deployment.yaml

Test full frontend in Kind cluster:
kubectl apply -k k8s/overlays/dev/
kubectl port-forward svc/nginx-gateway 8080:80 -n lawbridge
Open http://localhost:8080 → all pages must render

Phase 6 complete when all 13 pages load without errors
and all 3 AI features work end-to-end.

---

# PHASE 7 — INTEGRATION, TESTING & DEPLOYMENT
## Week 4, Days 4-5
## Reference: All agent files

---

### Step 7.1 — Full System Integration Test

Stop all containers. Remove all volumes. Start fresh:
docker-compose down -v
docker-compose up --build

Run the 5 key end-to-end flows:
1. Client registers → files case → lawyer assigned → case tracked live
2. Lawyer uploads document → AI analyzes → client notified
3. Client pays via MTN → webhook → ledger updated → invoice sent
4. Hearing scheduled → 48hr reminder sent → 1hr alarm fires
5. AI chat answers legal question in both EN and FR

---

### Step 7.2 — Kind Cluster Full Deploy

kind delete cluster --name lawbridge
kind create cluster --config k8s/kind-config.yaml --name lawbridge

Build and load all images:
for service in auth client lawyer case document notification \
  payment calendar monitoring search ai-assistant frontend; do
  docker build -t lawbridge/$service:latest services/$service/
  kind load docker-image lawbridge/$service:latest --name lawbridge
done

kubectl apply -k k8s/overlays/dev/
kubectl get pods -n lawbridge --watch

All pods must reach Running state.

---

### Step 7.3 — Jenkins Pipeline End-to-End

Make a test commit to develop branch.
Verify Jenkins pipeline triggers automatically via webhook.
Verify all stages pass including SonarQube quality gate.
Verify staging deployment succeeds.

Make a test PR into main.
Verify manual approval gate appears in Jenkins.
Approve it and verify production deployment succeeds.

---

### Step 7.4 — Final Handoff

Your partner runs the full 30-test Postman collection.
Fix any failing endpoints immediately.
Merge all branches into develop then main via PRs.
Tag the final commit: git tag -a v1.0.0 -m "LawBridge v1.0.0"
Push the tag: git push origin v1.0.0

Phase 7 complete. Project delivered.

---

# QUICK REFERENCE — FILE MAP

| What you need | File to open |
|---|---|
| Ground rules + stack | agents/praise/00_CONTEXT.md |
| Docker + K8s + Jenkins | agents/praise/01_DEVOPS_SETUP.md |
| Auth Service | agents/praise/02_AUTH_SERVICE.md |
| Case Service | agents/praise/03_CASE_SERVICE.md |
| Lawyer + Discovery | agents/praise/04_LAWYER_SERVICE.md |
| Client Service | agents/praise/05_CLIENT_SERVICE.md |
| Document + Custody | agents/praise/06_DOCUMENT_SERVICE.md |
| Payment Service | agents/praise/07_PAYMENT_SERVICE.md |
| Notification Service | agents/praise/08_NOTIFICATION_SERVICE.md |
| Calendar Service | agents/praise/09_CALENDAR_SERVICE.md |
| Monitoring + WebSockets | agents/praise/10_MONITORING_SERVICE.md |
| Search + Bilingual | agents/praise/11_SEARCH_SERVICE.md |
| AI Assistant (Ollama) | agents/praise/12_AI_ASSISTANT.md |
| Frontend (Next.js 15) | agents/praise/13_FRONTEND.md |
| ER Diagram | diagrams/01_ER_DIAGRAM.md |
| System Architecture | diagrams/02_SYSTEM_ARCHITECTURE.md |
| Sequence Diagrams | diagrams/04_SEQUENCE_DIAGRAM.md |
