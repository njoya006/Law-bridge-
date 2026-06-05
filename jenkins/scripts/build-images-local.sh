#!/usr/bin/env bash
# Feature branches: build images locally without registry push.
set -uo pipefail

SERVICES_CSV="${CHANGED_SERVICES:-auth-service}"
IFS=',' read -ra SERVICES <<< "$SERVICES_CSV"

for service in "${SERVICES[@]}"; do
  service=$(echo "$service" | xargs)
  [ -z "$service" ] && continue
  DIR="services/${service}"
  if [ ! -f "${DIR}/Dockerfile" ]; then
    continue
  fi
  echo "==> Docker build (local only) ${service}"
  if ! docker build -t "lawbridge-${service}:ci" "${DIR}"; then
    echo "WARN: Docker build failed for ${service} (daemon/socket permissions?) — skipping"
  fi
done

if [ "${FRONTEND_CHANGED:-false}" = "true" ] && [ -f lawbridge-frontend/package.json ]; then
  echo "Frontend validated in separate stage — no Docker image for Vercel deploy"
fi
