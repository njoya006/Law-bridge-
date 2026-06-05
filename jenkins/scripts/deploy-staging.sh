#!/usr/bin/env bash
set -euo pipefail

OVERLAY="k8s/overlays/staging"
if [ ! -f "${OVERLAY}/kustomization.yaml" ]; then
  echo "Staging overlay not found at ${OVERLAY} — skipping K8s deploy (add manifests later)."
  exit 0
fi

export KUBECONFIG="${KUBECONFIG_FILE}"
kubectl apply -k "${OVERLAY}"
kubectl rollout status deployment -n lawbridge --timeout=5m || true
