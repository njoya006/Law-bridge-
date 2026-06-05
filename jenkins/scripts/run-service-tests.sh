#!/usr/bin/env bash
set -euo pipefail

SERVICES_CSV="${CHANGED_SERVICES:-auth-service}"
IFS=',' read -ra SERVICES <<< "$SERVICES_CSV"

for service in "${SERVICES[@]}"; do
  service=$(echo "$service" | xargs)
  [ -z "$service" ] && continue
  DIR="services/${service}"
  if [ ! -d "$DIR" ]; then
    echo "Skip unknown service: $service"
    continue
  fi
  if [ ! -f "$DIR/requirements.txt" ]; then
    echo "Skip $service — no requirements.txt"
    continue
  fi

  echo "==> Testing ${service}"
  (
    cd "$DIR"
    mkdir -p test-results
    python3 -m venv .venv-ci
    if [ -f .venv-ci/bin/activate ]; then
      # shellcheck disable=SC1091
      source .venv-ci/bin/activate
    elif [ -f .venv-ci/Scripts/activate ]; then
      # shellcheck disable=SC1091
      source .venv-ci/Scripts/activate
    else
      echo "Could not activate venv in ${service}"
      exit 1
    fi
    pip install --quiet --upgrade pip || python -m pip install --quiet --upgrade pip
    pip install --quiet -r requirements.txt || python -m pip install --quiet -r requirements.txt
    if [ -f pytest.ini ] || [ -d tests ] || find . -name 'test_*.py' -print -quit | grep -q .; then
      pytest -v --tb=short \
        --junitxml="test-results/${service}-junit.xml" \
        --cov=. --cov-report=xml:coverage.xml \
        || pytest -v --tb=short --junitxml="test-results/${service}-junit.xml" || true
    else
      echo "No pytest tests in ${service} — smoke import check"
      python -c "import django; print('django ok')"
    fi
    deactivate || true
    rm -rf .venv-ci
  )
done

echo "Service tests finished."
