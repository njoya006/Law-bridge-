#!/bin/sh
set -e

host="${DB_HOST:-localhost}"
port="${DB_PORT:-5432}"
timeout="${DB_WAIT_TIMEOUT:-60}"
elapsed=0

while [ "$elapsed" -lt "$timeout" ]; do
  if python - <<PY 2>/dev/null
import socket
import sys
try:
    sock = socket.socket()
    sock.settimeout(3)
    sock.connect(("${host}", int("${port}")))
    sock.close()
except Exception:
    sys.exit(1)
sys.exit(0)
PY
  then
    echo "Database ${host}:${port} is available"
    exit 0
  fi

  elapsed=$((elapsed + 1))
  echo "Waiting for database ${host}:${port} (${elapsed}/${timeout})..."
  sleep 1
done

echo "Database ${host}:${port} unreachable after ${timeout}s"
exit 1
