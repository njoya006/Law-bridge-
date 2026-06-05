# LawBridge — AWS Backend Deployment (Submission)

Deploy all backend microservices on **one EC2 instance** using Docker Compose + Nginx gateway.
This is the fastest path for tomorrow's deadline. K8s/Jenkins come later.

## Architecture

```
Vercel (frontend)  --rewrite-->  EC2 Nginx :80  -->  11 Django services + Postgres + Redis + ...
```

## Prerequisites

- AWS account
- GitHub repo pushed (see `deploy/GIT_PUSH.md`)
- Domain optional (EC2 public IP works for demo)

## Step 1 — Launch EC2

| Setting | Value |
|---------|-------|
| AMI | Ubuntu 22.04 LTS |
| Instance type | **t3.2xlarge** (32 GB RAM) — required for 11 services + 11 DBs + Ollama |
| Storage | 80 GB gp3 minimum |
| Key pair | Create/download `.pem` |

**Security group inbound:**

| Port | Source | Purpose |
|------|--------|---------|
| 22 | Your IP | SSH |
| 80 | 0.0.0.0/0 | API gateway |
| 443 | 0.0.0.0/0 | HTTPS (optional, certbot) |

Do **not** expose 8001–8011 publicly; Vercel proxies through Nginx.

## Step 2 — SSH and bootstrap

```bash
ssh -i your-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
```

```bash
curl -fsSL https://raw.githubusercontent.com/YOUR_USER/YOUR_REPO/YOUR_BRANCH/deploy/aws/ec2-setup.sh | bash
```

Or clone manually:

```bash
sudo apt update && sudo apt install -y git docker.io docker-compose-plugin
sudo usermod -aG docker ubuntu
# log out and back in
git clone https://github.com/YOUR_USER/lawbridge.git
cd lawbridge
cp .env.production.example .env
# EDIT .env — set strong JWT_SECRET_KEY, DB_PASSWORD, INTERNAL_API_KEY
docker compose up -d --build
```

First build takes **30–60 minutes**.

## Step 3 — Verify backend

```bash
curl http://localhost/health/
curl http://localhost/api/v1/auth/health/  # if exposed
docker compose ps
```

From your laptop:

```bash
curl http://YOUR_EC2_PUBLIC_IP/
# Expected: "LawBridge API Gateway - All services routing configured"
```

## Step 4 — Connect Vercel

In Vercel project settings → Environment Variables:

| Variable | Value |
|----------|-------|
| `API_GATEWAY_URL` | `http://YOUR_EC2_PUBLIC_IP` |
| `NEXT_PUBLIC_AUTH_SERVICE_URL` | `/api/v1` |
| `NEXT_PUBLIC_CLIENT_SERVICE_URL` | `/api/v1/clients` |
| `NEXT_PUBLIC_LAWYER_SERVICE_URL` | `/api/v1/lawyers` |
| `NEXT_PUBLIC_FIRMS_SERVICE_URL` | `/api/v1/firms` |
| `NEXT_PUBLIC_CASE_SERVICE_URL` | `/api/v1/cases` |
| `NEXT_PUBLIC_DOCUMENT_SERVICE_URL` | `/api/v1/documents` |
| `NEXT_PUBLIC_NOTIFICATION_SERVICE_URL` | `/api/v1/notifications` |
| `NEXT_PUBLIC_PAYMENT_SERVICE_URL` | `/api/v1/payments` |
| `NEXT_PUBLIC_CALENDAR_SERVICE_URL` | `/api/v1/calendar` |
| `NEXT_PUBLIC_MONITORING_SERVICE_URL` | `/api/v1/monitoring` |
| `NEXT_PUBLIC_SEARCH_SERVICE_URL` | `/api/v1/search` |
| `NEXT_PUBLIC_AI_ASSISTANT_SERVICE_URL` | `/api/v1/ai` |

Redeploy Vercel after setting variables.

## Step 5 — HTTPS (optional but recommended)

```bash
sudo apt install -y certbot python3-certbot-nginx
# If using a domain pointing to EC2:
sudo certbot --nginx -d api.yourdomain.com
```

Then set `API_GATEWAY_URL=https://api.yourdomain.com` in Vercel.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `docker compose` OOM | Upgrade to t3.2xlarge or stop `ollama` + `ai-assistant-service` |
| Services restarting | `docker compose logs auth-service` |
| Vercel 502 on API | Check EC2 security group port 80; verify `API_GATEWAY_URL` |
| Migrations fail | Wait for DB healthchecks: `docker compose ps` |

## Cost estimate

- t3.2xlarge on-demand: ~$0.33/hr (~$8/day) — stop instance after submission to save money
- Elastic IP: free while attached

## After submission

- Migrate to ECS/EKS + RDS (planned)
- Add Jenkins CI/CD
- Split databases to RDS
