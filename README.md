# LawBridge — Legal Case Management System
## Cameroon LegalTech Platform | Microservices | Kubernetes | AI-Powered

> Bilingual (EN/FR) + Bijural (Common Law + Civil Law)
> Built with Django REST Framework + Next.js 15 + Kubernetes + Jenkins CI/CD

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Complete File Structure](#complete-file-structure)
4. [Quick Start — Local Dev](#quick-start-local-dev)
5. [Kubernetes Setup](#kubernetes-setup)
6. [AI Lawyer Assistant](#ai-lawyer-assistant)
7. [CI/CD Pipeline](#cicd-pipeline)
8. [Services Overview](#services-overview)
9. [Team](#team)

---

## Project Overview

LawBridge digitizes legal case management for Cameroon's bilingual,
bijural legal system. It solves opacity, missed deadlines,
unaccountable document handling, and zero client transparency
through 11 independent microservices with intelligent automation.

### Innovative Features
- Smart Lawyer-to-Case Matching Algorithm
- Conflict of Interest Auto-Detection
- Digital Evidence Chain of Custody
- Automated Deadline Escalation via RabbitMQ
- Real-Time Case Status Timeline (WebSockets)
- Legal Aid Eligibility Scoring
- Lawyer Discovery (client-facing search + profiles)
- AI Lawyer Assistant (Ollama + Mistral/LLaMA3, bilingual EN/FR)
  - Legal Q&A chatbot
  - Case document analysis (PDF upload → summary)
  - Case outcome prediction
  - Integrated into case workflow

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Django 5 + Django REST Framework |
| Frontend | Next.js 15 + Tailwind CSS + shadcn/ui |
| AI Assistant | Ollama (Mistral 7B / LLaMA3 8B) + LangChain |
| Databases | PostgreSQL 16 (one per service) |
| Cache | Redis 7 (cache + Pub/Sub) |
| Task Queue | RabbitMQ + Celery |
| Object Storage | MinIO |
| Container Runtime | Docker + Docker Compose (dev) |
| Orchestration | Kubernetes — Kind (local) + K3s (cloud) |
| API Gateway | Nginx |
| Load Balancer | HAProxy |
| CI/CD | Jenkins + GitHub Webhooks |
| Registry | Docker Hub / GitHub Container Registry |
| Secrets | Kubernetes Secrets + HashiCorp Vault |
| Monitoring | Prometheus + Grafana |
| Search | PostgreSQL tsvector (MVP) → Elasticsearch |

---

## Complete File Structure

```
lawbridge/
│
├── README.md                          ← This file
├── .env.example                       ← Environment variable template
├── .gitignore
│
├── ── AGENTS ──────────────────────────────────────────────
├── agents/
│   ├── praise/
│   │   ├── TASK_FILE.md               ← Master task runner (read daily)
│   │   ├── 00_CONTEXT.md              ← Ground rules + stack + rules
│   │   ├── 01_DEVOPS_SETUP.md         ← Docker + K8s + Jenkins setup
│   │   ├── 02_AUTH_SERVICE.md         ← Auth service full guide
│   │   ├── 03_CASE_SERVICE.md         ← Case service full guide
│   │   ├── 04_LAWYER_SERVICE.md       ← Lawyer + discovery guide
│   │   ├── 05_CLIENT_SERVICE.md       ← Client service full guide
│   │   ├── 06_DOCUMENT_SERVICE.md     ← Document + chain of custody
│   │   ├── 07_PAYMENT_SERVICE.md      ← Payment service full guide
│   │   ├── 08_NOTIFICATION_SERVICE.md ← Notification + RabbitMQ
│   │   ├── 09_CALENDAR_SERVICE.md     ← Calendar + reminders
│   │   ├── 10_MONITORING_SERVICE.md   ← Case monitoring + WebSockets
│   │   ├── 11_SEARCH_SERVICE.md       ← Search + bilingual index
│   │   ├── 12_AI_ASSISTANT.md         ← AI assistant full guide
│   │   └── 13_FRONTEND.md             ← Next.js 15 full guide
│   └── partner/
│       ├── TASK_FILE.md               ← Partner task runner
│       ├── 00_CONTEXT.md              ← Partner ground rules
│       └── 01_TESTING.md              ← Postman testing guide
│
├── ── DOCUMENTATION ────────────────────────────────────────
├── docs/
│   ├── 01_PROJECT_DESCRIPTION.md
│   ├── 02_SPECIFICATION.md
│   ├── 03_API_CONTRACTS.md
│   ├── sql/
│   │   └── *.sql                      ← Schema scripts per service
│   └── postman/
│       └── LawBridge_Tests.json
│
├── ── FRONTEND ─────────────────────────────────────────────
├── frontend/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                   ← Landing page
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   └── (dashboard)/
│   │       ├── layout.tsx
│   │       ├── dashboard/page.tsx
│   │       ├── cases/
│   │       │   ├── page.tsx
│   │       │   ├── [id]/page.tsx
│   │       │   └── new/page.tsx
│   │       ├── lawyers/
│   │       │   ├── page.tsx           ← Lawyer discovery
│   │       │   └── [id]/page.tsx
│   │       ├── documents/page.tsx
│   │       ├── payments/page.tsx
│   │       ├── calendar/page.tsx
│   │       ├── notifications/page.tsx
│   │       ├── ai-assistant/page.tsx  ← AI chat interface
│   │       └── admin/
│   │           ├── page.tsx
│   │           ├── users/page.tsx
│   │           └── cases/page.tsx
│   ├── components/
│   │   ├── ui/                        ← shadcn/ui components
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   └── Navbar.tsx
│   │   ├── cases/
│   │   │   ├── CaseCard.tsx
│   │   │   ├── CaseTimeline.tsx       ← Real-time status
│   │   │   └── CaseForm.tsx
│   │   ├── lawyers/
│   │   │   ├── LawyerCard.tsx         ← Discovery card
│   │   │   ├── LawyerSearch.tsx       ← Search + filter
│   │   │   └── LawyerProfile.tsx
│   │   ├── ai/
│   │   │   ├── ChatInterface.tsx      ← AI assistant UI
│   │   │   ├── DocumentAnalyzer.tsx   ← PDF upload + analysis
│   │   │   └── OutcomePredictor.tsx   ← Case outcome prediction
│   │   └── documents/
│   │       ├── DocumentUpload.tsx
│   │       └── AuditLog.tsx
│   ├── lib/
│   │   ├── api.ts                     ← Axios + JWT interceptors
│   │   ├── auth.ts
│   │   └── utils.ts
│   ├── context/
│   │   └── AuthContext.tsx
│   ├── types/index.ts
│   ├── Dockerfile
│   ├── package.json
│   └── next.config.js
│
├── ── MICROSERVICES ────────────────────────────────────────
├── services/
│   ├── auth-service/
│   │   ├── Dockerfile
│   │   ├── requirements.txt
│   │   ├── manage.py
│   │   ├── core/settings.py
│   │   └── apps/
│   │       ├── users/
│   │       └── authentication/
│   │
│   ├── client-service/
│   │   ├── Dockerfile
│   │   ├── requirements.txt
│   │   ├── manage.py
│   │   └── apps/clients/
│   │
│   ├── lawyer-service/
│   │   ├── Dockerfile
│   │   ├── requirements.txt
│   │   ├── manage.py
│   │   └── apps/
│   │       ├── lawyers/               ← Profiles + availability
│   │       └── discovery/             ← Search + matching algo
│   │
│   ├── case-service/
│   │   ├── Dockerfile
│   │   ├── requirements.txt
│   │   ├── manage.py
│   │   └── apps/
│   │       ├── cases/
│   │       ├── conflicts/             ← Conflict detection
│   │       └── deadlines/             ← Deadline escalation
│   │
│   ├── document-service/
│   │   ├── Dockerfile
│   │   ├── requirements.txt
│   │   ├── manage.py
│   │   └── apps/
│   │       ├── documents/
│   │       └── audit/                 ← Chain of custody
│   │
│   ├── notification-service/
│   │   ├── Dockerfile
│   │   ├── requirements.txt
│   │   ├── manage.py
│   │   └── apps/notifications/
│   │
│   ├── payment-service/
│   │   ├── Dockerfile
│   │   ├── requirements.txt
│   │   ├── manage.py
│   │   └── apps/
│   │       ├── payments/
│   │       └── invoices/
│   │
│   ├── calendar-service/
│   │   ├── Dockerfile
│   │   ├── requirements.txt
│   │   ├── manage.py
│   │   └── apps/calendar/
│   │
│   ├── monitoring-service/
│   │   ├── Dockerfile
│   │   ├── requirements.txt
│   │   ├── manage.py
│   │   └── apps/monitoring/
│   │
│   ├── search-service/
│   │   ├── Dockerfile
│   │   ├── requirements.txt
│   │   ├── manage.py
│   │   └── apps/search/
│   │
│   └── ai-assistant-service/
│       ├── Dockerfile
│       ├── requirements.txt
│       ├── manage.py
│       ├── apps/
│       │   ├── chat/                  ← Legal Q&A
│       │   ├── analyzer/              ← Document analysis
│       │   └── predictor/             ← Outcome prediction
│       └── ollama/
│           ├── Modelfile              ← Custom Mistral fine-tune
│           └── system_prompt.txt      ← Cameroon law context
│
├── ── GATEWAY ──────────────────────────────────────────────
├── gateway/
│   ├── nginx.conf                     ← API Gateway config
│   └── haproxy.cfg                    ← Load balancer config
│
├── ── KUBERNETES ───────────────────────────────────────────
├── k8s/
│   ├── base/                          ← Base manifests (all envs)
│   │   ├── namespace.yaml
│   │   ├── configmap.yaml
│   │   ├── services/
│   │   │   ├── auth-deployment.yaml
│   │   │   ├── auth-service.yaml
│   │   │   ├── client-deployment.yaml
│   │   │   ├── client-service.yaml
│   │   │   ├── lawyer-deployment.yaml
│   │   │   ├── lawyer-service.yaml
│   │   │   ├── case-deployment.yaml
│   │   │   ├── case-service.yaml
│   │   │   ├── document-deployment.yaml
│   │   │   ├── document-service.yaml
│   │   │   ├── notification-deployment.yaml
│   │   │   ├── notification-service.yaml
│   │   │   ├── payment-deployment.yaml
│   │   │   ├── payment-service.yaml
│   │   │   ├── calendar-deployment.yaml
│   │   │   ├── calendar-service.yaml
│   │   │   ├── monitoring-deployment.yaml
│   │   │   ├── monitoring-service.yaml
│   │   │   ├── search-deployment.yaml
│   │   │   ├── search-service.yaml
│   │   │   ├── ai-assistant-deployment.yaml
│   │   │   └── ai-assistant-service.yaml
│   │   ├── databases/
│   │   │   ├── postgres-statefulset.yaml  ← One per service
│   │   │   └── postgres-pvc.yaml
│   │   ├── infrastructure/
│   │   │   ├── redis-deployment.yaml
│   │   │   ├── rabbitmq-statefulset.yaml
│   │   │   ├── minio-statefulset.yaml
│   │   │   ├── nginx-deployment.yaml
│   │   │   └── ollama-deployment.yaml     ← AI model server
│   │   └── ingress/
│   │       └── ingress.yaml
│   │
│   ├── overlays/
│   │   ├── dev/                       ← Kind (local)
│   │   │   ├── kustomization.yaml
│   │   │   └── patches/
│   │   ├── staging/                   ← K3s cloud staging
│   │   │   ├── kustomization.yaml
│   │   │   └── patches/
│   │   └── production/                ← K3s cloud production
│   │       ├── kustomization.yaml
│   │       └── patches/
│   │
│   └── kind-config.yaml               ← Kind cluster config
│
├── ── CI/CD ────────────────────────────────────────────────
├── jenkins/
│   ├── Jenkinsfile                    ← Main pipeline
│   ├── Jenkinsfile.feature            ← Feature branch pipeline
│   └── scripts/
│       ├── build.sh
│       ├── test.sh
│       ├── deploy-staging.sh
│       └── deploy-production.sh
│
├── .github/
│   └── workflows/
│       └── pr-check.yml               ← GitHub Actions PR check
│
├── ── DOCKER ───────────────────────────────────────────────
├── docker-compose.yml                 ← Full local dev stack
├── docker-compose.test.yml            ← Test environment
│
└── ── MONITORING ───────────────────────────────────────────
    └── monitoring/
        ├── prometheus.yml
        └── grafana/
            └── dashboards/
```

---

## Quick Start — Local Dev

### Prerequisites
```bash
# Install required tools
brew install kind kubectl helm          # macOS
# OR
sudo apt install kind kubectl           # Ubuntu

# Verify
docker --version                        # Docker Desktop running
kind version
kubectl version --client
```

### 1. Clone and setup environment
```bash
git clone https://github.com/yourusername/lawbridge.git
cd lawbridge
cp .env.example .env
# Fill in .env values
```

### 2. Start with Docker Compose (fastest for dev)
```bash
docker-compose up --build
# All 11 services + databases + Redis + RabbitMQ + MinIO + Ollama
```

### 3. OR start with Kind (Kubernetes local)
```bash
# Create Kind cluster
kind create cluster --config k8s/kind-config.yaml --name lawbridge

# Apply all manifests
kubectl apply -k k8s/overlays/dev/

# Check everything is running
kubectl get pods -n lawbridge

# Access the app
kubectl port-forward svc/nginx-gateway 8080:80 -n lawbridge
# Open http://localhost:8080
```

### 4. Pull Ollama AI model
```bash
# Pull Mistral 7B (primary model)
docker exec -it lawbridge-ollama ollama pull mistral

# Pull LLaMA3 8B (backup/comparison)
docker exec -it lawbridge-ollama ollama pull llama3

# Verify models loaded
docker exec -it lawbridge-ollama ollama list
```

---

## Kubernetes Setup

### Local Dev — Kind
```bash
# Create cluster with config
kind create cluster --config k8s/kind-config.yaml --name lawbridge

# Load local Docker images into Kind
kind load docker-image lawbridge/auth-service:latest --name lawbridge
kind load docker-image lawbridge/case-service:latest --name lawbridge
# (repeat for all services)

# Deploy with Kustomize
kubectl apply -k k8s/overlays/dev/

# Watch pods start up
kubectl get pods -n lawbridge --watch
```

### Cloud Staging/Production — K3s
```bash
# On your VPS (DigitalOcean/Hetzner/AWS)
curl -sfL https://get.k3s.io | sh -

# Get kubeconfig
cat /etc/rancher/k3s/k3s.yaml

# Deploy staging
kubectl apply -k k8s/overlays/staging/

# Deploy production
kubectl apply -k k8s/overlays/production/
```

---

## AI Lawyer Assistant

### Architecture
```
Client (Next.js)
      ↓
AI Assistant Service (Django :8011)
      ↓
Ollama Server (port 11434)
      ↓
Mistral 7B / LLaMA3 8B
(fine-tuned with Cameroon law context)
```

### Models Used
| Model | Use Case | Size |
|---|---|---|
| Mistral 7B | Legal Q&A + chat | 4.1GB |
| LLaMA3 8B | Document analysis | 4.7GB |
| Phi-3 Mini | Fast responses | 2.3GB |

### Configuration
See `agents/praise/12_AI_ASSISTANT.md` for complete setup.

### Integration Points
- **Case creation** → AI suggests case category + relevant laws
- **Document upload** → AI generates summary + key points
- **Lawyer search** → AI matches based on case description
- **Chat** → Bilingual legal Q&A (EN/FR)
- **Outcome prediction** → Based on case type + evidence

---

## CI/CD Pipeline

### Branch Strategy
```
main          ← production deployments only
develop       ← integration, triggers staging deploy
feature/*     ← feature branches, triggers PR checks
hotfix/*      ← urgent fixes
```

### Jenkins Pipeline Stages
```
1. Checkout
2. Run unit tests (pytest per service)
3. SonarQube code quality scan
4. Docker build per changed service
5. Push to registry
6. Deploy to staging (develop branch)
7. Run integration tests
8. Manual approval gate
9. Deploy to production (main branch)
```

### Setup Jenkins
See `agents/praise/01_DEVOPS_SETUP.md` Section Jenkins.

---

## Services Overview

| Service | Port | DB | Owner |
|---|---|---|---|
| Auth Service | 8001 | auth_db | Praise |
| Client Service | 8002 | client_db | Praise |
| Lawyer Service | 8003 | lawyer_db | Praise |
| Case Service | 8004 | case_db | Praise |
| Document Service | 8005 | doc_db | Praise |
| Notification Service | 8006 | notification_db | Praise |
| Payment Service | 8007 | payment_db | Praise |
| Calendar Service | 8008 | calendar_db | Praise |
| Monitoring Service | 8009 | monitoring_db | Praise |
| Search Service | 8010 | search_db | Praise |
| AI Assistant Service | 8011 | ai_db | Praise |
| Frontend | 3000 | — | Praise |

---

## Team

| Member | Role | Responsibilities |
|---|---|---|
| Praise | System Architect + Lead Dev | All services, K8s, CI/CD, frontend |
| [Partner] | QA Engineer | Postman testing + test results documentation |
