#!/usr/bin/env bash
set -euo pipefail

COLLECTION="docs/postman/LawBridge_Tests.json"
ENV_FILE="docs/postman/staging-env.json"

if [ ! -f "$COLLECTION" ]; then
  echo "Postman collection not found at ${COLLECTION} — skipping integration tests."
  exit 0
fi

mkdir -p results
if command -v newman >/dev/null 2>&1; then
  ARGS=(run "$COLLECTION" --reporters cli,junit --reporter-junit-export results/integration-tests.xml)
  if [ -f "$ENV_FILE" ]; then
    ARGS+=(--environment "$ENV_FILE")
  fi
  newman "${ARGS[@]}"
else
  echo "newman not installed — skipping integration tests."
fi
