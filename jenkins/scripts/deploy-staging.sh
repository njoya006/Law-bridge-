#!/usr/bin/env bash
set -euo pipefail

: "${REGISTRY:=ghcr.io/njoya006}"
: "${IMAGE_PREFIX:=lawbridge}"
: "${GIT_COMMIT_SHORT:?GIT_COMMIT_SHORT is required}"
: "${CHANGED_SERVICES:?CHANGED_SERVICES is required}"

OVERLAY="k8s/overlays/staging"

export KUBECONFIG="${KUBECONFIG_FILE}"

# Pin each changed service to this exact commit SHA in the staging overlay.
cd "${OVERLAY}"
IFS=',' read -ra SERVICES <<< "${CHANGED_SERVICES}"
for service in "${SERVICES[@]}"; do
  service=$(echo "$service" | xargs)
  [ -z "$service" ] && continue
  IMAGE="${REGISTRY}/${IMAGE_PREFIX}-${service}"
  kustomize edit set image "${IMAGE}=${IMAGE}:${GIT_COMMIT_SHORT}"
done
cd - > /dev/null

kubectl apply -k "${OVERLAY}"
kubectl rollout status deployment -n lawbridge --timeout=5m || true
