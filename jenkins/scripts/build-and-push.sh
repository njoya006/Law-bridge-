#!/usr/bin/env bash
set -euo pipefail

: "${REGISTRY:?REGISTRY is required}"
: "${IMAGE_PREFIX:=lawbridge}"
: "${GIT_COMMIT_SHORT:?GIT_COMMIT_SHORT is required}"
: "${CHANGED_SERVICES:?CHANGED_SERVICES is required}"

echo "$REGISTRY_PASSWORD" | docker login "$REGISTRY" -u "$REGISTRY_USER" --password-stdin

IFS=',' read -ra SERVICES <<< "$CHANGED_SERVICES"
for service in "${SERVICES[@]}"; do
  service=$(echo "$service" | xargs)
  [ -z "$service" ] && continue
  DIR="services/${service}"
  if [ ! -f "${DIR}/Dockerfile" ]; then
    echo "Skip ${service} — no Dockerfile"
    continue
  fi

  IMAGE="${REGISTRY}/${IMAGE_PREFIX}-${service}"
  echo "==> Build & push ${IMAGE}:${GIT_COMMIT_SHORT}"
  docker build -t "${IMAGE}:${GIT_COMMIT_SHORT}" -t "${IMAGE}:latest" "${DIR}"
  docker push "${IMAGE}:${GIT_COMMIT_SHORT}"
  docker push "${IMAGE}:latest"
done

docker logout "$REGISTRY" || true
