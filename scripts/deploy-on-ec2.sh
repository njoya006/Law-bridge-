#!/usr/bin/env bash
#
# Reliable manual backend deploy — builds service images ON the EC2 host from the
# checked-out source, deploys them, runs migrations, and pushes the images to ECR
# so the state survives a reboot. Use this when the GitHub Actions pipeline is not
# producing images (the usual cause: expired AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY
# in the repo's Actions secrets).
#
# Run ON the EC2 host (or via: aws ssm send-command ... "bash /opt/lawbridge/scripts/deploy-on-ec2.sh <services>")
#
# Usage:
#   ./deploy-on-ec2.sh                       # build+deploy the default changed set
#   ./deploy-on-ec2.sh case-service          # one service
#   ./deploy-on-ec2.sh all                   # every Django service
#
set -euo pipefail

REG=820561684310.dkr.ecr.us-east-1.amazonaws.com
REGION=us-east-1
ROOT=/opt/lawbridge
cd "$ROOT"

ALL_SERVICES="auth-service client-service lawyer-service case-service document-service \
notification-service payment-service calendar-service monitoring-service search-service \
ai-assistant-service network-service"

# Default set = services that commonly carry migrations / recent features.
DEFAULT_SERVICES="case-service monitoring-service calendar-service lawyer-service document-service network-service"

case "${1:-default}" in
  all)     SERVICES="$ALL_SERVICES" ;;
  default) SERVICES="$DEFAULT_SERVICES" ;;
  *)       SERVICES="$*" ;;
esac

echo "==> git pull"
git pull origin main || echo "(git pull skipped/failed — continuing with current checkout)"

echo "==> ECR login"
aws ecr get-login-password --region "$REGION" | docker login --username AWS --password-stdin "$REG"

for svc in $SERVICES; do
  [ -f "services/$svc/Dockerfile" ] || { echo "!! no Dockerfile for $svc, skipping"; continue; }
  echo "==> build $svc"
  docker build -t "$REG/lawbridge/$svc:latest" "services/$svc/"
  echo "==> deploy $svc"
  docker compose up -d --no-deps "$svc"
  sleep 6
  echo "==> migrate $svc"
  docker compose exec -T "$svc" python manage.py migrate --noinput || echo "(migrate skipped for $svc)"
  echo "==> push $svc to ECR (durability)"
  docker push "$REG/lawbridge/$svc:latest" || echo "(ECR push failed for $svc — check EC2 role has ECR push)"
done

# Ensure worker containers are running (no-op if already up)
echo "==> ensure workers running"
docker compose up -d --no-deps deadline-checker monitoring-consumer network-consumer 2>/dev/null || true

echo "==> done. container status:"
docker compose ps --format "{{.Name}}\t{{.Status}}"
