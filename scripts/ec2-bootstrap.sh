#!/bin/bash
# EC2 user-data bootstrap script for LawBridge single-server deployment.
# Variables substituted by the deploy-ec2.yml workflow before upload:
#   REPO   — GitHub repository (e.g., njoya006/Lawbridge)
#   REGION — AWS region (e.g., us-east-1)
set -e
exec > /var/log/lawbridge-init.log 2>&1
echo "=== LawBridge bootstrap starting at $(date) ==="

# Install Docker and tools
dnf install -y docker git aws-cli
systemctl enable --now docker
usermod -aG docker ec2-user

# Docker Compose v2 plugin
mkdir -p /usr/lib/docker/cli-plugins
curl -fsSL "https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64" \
  -o /usr/lib/docker/cli-plugins/docker-compose
chmod +x /usr/lib/docker/cli-plugins/docker-compose
echo "Docker Compose version: $(docker compose version)"

# Fetch secrets from SSM (instance role provides access)
echo "Fetching secrets from SSM..."
JWT_SECRET_KEY=$(aws ssm get-parameter \
  --name "/lawbridge/JWT_SECRET_KEY" --with-decryption \
  --query 'Parameter.Value' --output text --region REGION_PLACEHOLDER)
GROQ_API_KEY=$(aws ssm get-parameter \
  --name "/lawbridge/GROQ_API_KEY" --with-decryption \
  --query 'Parameter.Value' --output text --region REGION_PLACEHOLDER)
DB_PASSWORD=$(aws ssm get-parameter \
  --name "/lawbridge/DB_PASSWORD" --with-decryption \
  --query 'Parameter.Value' --output text --region REGION_PLACEHOLDER)
GH_TOKEN=$(aws ssm get-parameter \
  --name "/lawbridge/GH_TOKEN" --with-decryption \
  --query 'Parameter.Value' --output text --region REGION_PLACEHOLDER 2>/dev/null || echo "")

# Clone repo
echo "Cloning repo REPO_PLACEHOLDER..."
if [ -n "$GH_TOKEN" ]; then
  git clone "https://x-access-token:${GH_TOKEN}@github.com/REPO_PLACEHOLDER.git" /opt/lawbridge
else
  git clone "https://github.com/REPO_PLACEHOLDER.git" /opt/lawbridge
fi
cd /opt/lawbridge

# Write .env
cat > .env <<ENV_EOF
DEBUG=0
DJANGO_SETTINGS_MODULE=core.settings
SECRET_KEY=${JWT_SECRET_KEY}
JWT_SECRET_KEY=${JWT_SECRET_KEY}
DB_USER=lawbridge_user
DB_PASSWORD=${DB_PASSWORD}
GROQ_API_KEY=${GROQ_API_KEY}
AI_SERVICE_IMAGE=820561684310.dkr.ecr.us-east-1.amazonaws.com/lawbridge/ai-assistant-service:latest
INTERNAL_API_KEY=lawbridge-internal-key-2024
ALLOWED_HOSTS=*
CORS_ALLOWED_ORIGINS=https://law-bridge-two.vercel.app
ENV_EOF

# GHCR login for private packages
if [ -n "$GH_TOKEN" ]; then
  echo "$GH_TOKEN" | docker login ghcr.io -u njoya006 --password-stdin
fi

# ECR login for AI service image
aws ecr get-login-password --region REGION_PLACEHOLDER | \
  docker login --username AWS --password-stdin \
  820561684310.dkr.ecr.us-east-1.amazonaws.com

# Start all services
echo "Pulling images and starting Docker Compose stack..."
docker compose pull
docker compose up -d

# Wait for PostgreSQL to be healthy
echo "Waiting for PostgreSQL..."
for i in $(seq 1 30); do
  docker compose exec -T postgres pg_isready -U lawbridge_user -d auth_db && break
  echo "  attempt $i/30..."
  sleep 5
done

# Run migrations for every service
echo "Running migrations..."
for svc in auth-service client-service lawyer-service case-service \
           document-service notification-service payment-service \
           calendar-service monitoring-service search-service \
           ai-assistant-service; do
  echo "  Migrating $svc..."
  docker compose exec -T "$svc" python manage.py migrate --noinput 2>&1 | tail -3 \
    || echo "  WARNING: migration failed for $svc (continuing)"
done

echo ""
echo "=== LawBridge deployed successfully at $(date) ==="
echo "Running containers:"
docker compose ps
