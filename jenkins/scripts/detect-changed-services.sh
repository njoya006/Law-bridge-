#!/usr/bin/env bash
# Outputs comma-separated service folder names changed since previous commit.
# Falls back to all backend services on first commit or when jenkins/ root files change.
set -euo pipefail

ALL_SERVICES="auth-service,client-service,lawyer-service,case-service,document-service,notification-service,payment-service,calendar-service,monitoring-service,search-service,ai-assistant-service"

if git rev-parse HEAD~1 >/dev/null 2>&1; then
  CHANGED_FILES=$(git diff --name-only HEAD~1 HEAD || true)
else
  echo "$ALL_SERVICES"
  exit 0
fi

if echo "$CHANGED_FILES" | grep -qE '^(docker-compose|gateway/|\.github/)'; then
  echo "$ALL_SERVICES"
  exit 0
fi

# Jenkins-only commits: smoke-test auth-service (full stack not required for CI config changes)
if echo "$CHANGED_FILES" | grep -q '^jenkins/' && ! echo "$CHANGED_FILES" | grep -q '^services/'; then
  echo "auth-service"
  exit 0
fi

mapfile -t SERVICES < <(
  echo "$CHANGED_FILES" \
    | grep '^services/' \
    | cut -d/ -f2 \
    | grep -E '^(auth|client|lawyer|case|document|notification|payment|calendar|monitoring|search|ai-assistant)-service$' \
    | sort -u
)

if [ "${#SERVICES[@]}" -eq 0 ]; then
  echo ""
else
  IFS=,
  echo "${SERVICES[*]}"
fi
