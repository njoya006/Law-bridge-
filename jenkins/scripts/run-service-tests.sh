#!/usr/bin/env bash
set -euo pipefail

SERVICES_CSV="${CHANGED_SERVICES:-auth-service}"
IFS=',' read -ra SERVICES <<< "$SERVICES_CSV"

install_requirements() {
  if python3 -m venv .venv-ci 2>/dev/null && [ -f .venv-ci/bin/activate ]; then
    # shellcheck disable=SC1091
    source .venv-ci/bin/activate
    python -m pip install -q --upgrade pip
    python -m pip install -q -r requirements.txt
    return 0
  fi
  if python3 -m venv .venv-ci 2>/dev/null && [ -f .venv-ci/Scripts/activate ]; then
    # shellcheck disable=SC1091
    source .venv-ci/Scripts/activate
    python -m pip install -q --upgrade pip
    python -m pip install -q -r requirements.txt
    return 0
  fi
  echo "venv unavailable — installing with pip --user"
  python3 -m pip install -q --user --upgrade pip
  python3 -m pip install -q --user -r requirements.txt
  export PATH="${HOME}/.local/bin:${PATH}"
}

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
    install_requirements
    if [ -f pytest.ini ] || [ -d tests ] || find . -name 'test_*.py' -print -quit | grep -q .; then
      pytest -v --tb=short --junitxml="test-results/${service}-junit.xml" \
        || pytest -v --tb=short --junitxml="test-results/${service}-junit.xml"
    else
      echo "No pytest tests in ${service} — smoke import check"
      python3 -c "import django; print('django ok')"
    fi
    deactivate 2>/dev/null || true
    rm -rf .venv-ci
  )
done

echo "Service tests finished."
