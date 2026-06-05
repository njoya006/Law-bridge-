#!/usr/bin/env bash
set -euo pipefail

if ! git rev-parse HEAD~1 >/dev/null 2>&1; then
  echo "true"
  exit 0
fi

CHANGED=$(git diff --name-only HEAD~1 HEAD || true)
if echo "$CHANGED" | grep -q '^lawbridge-frontend/'; then
  echo "true"
else
  echo "false"
fi
