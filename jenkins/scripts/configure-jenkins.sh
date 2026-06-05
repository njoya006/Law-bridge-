#!/usr/bin/env bash
# Fast Jenkins setup for LawBridge — run from repo root on a machine with Docker.
set -euo pipefail

JENKINS_URL="${JENKINS_URL:-http://localhost:8080}"
CONTAINER="${JENKINS_CONTAINER:-lawbridge-jenkins}"
REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

echo "==> 1/5 Install Jenkins plugins"
docker exec "$CONTAINER" jenkins-plugin-cli --plugins \
  git workflow-aggregator pipeline-stage-view pipeline-github-lib \
  github github-branch-source credentials-binding junit \
  docker-workflow ws-cleanup timestamper || true

echo "==> 2/5 Install Python + Docker CLI in Jenkins container (for pytest stage)"
docker exec "$CONTAINER" bash -c "
  apt-get update -qq
  DEBIAN_FRONTEND=noninteractive apt-get install -y -qq \
    python3 python3-venv python3-pip git curl docker.io
"

echo "==> 3/5 Create pipeline jobs"
CRUMB_FIELD=$(curl -sf "${JENKINS_URL}/crumbIssuer/api/xml?xpath=concat(//crumbRequestField)" || echo Jenkins-Crumb)
CRUMB_VALUE=$(curl -sf "${JENKINS_URL}/crumbIssuer/api/xml?xpath=concat(//crumb)" || echo "")
CRUMB_HEADER=()
if [ -n "$CRUMB_VALUE" ]; then
  CRUMB_HEADER=(-H "${CRUMB_FIELD}:${CRUMB_VALUE}")
fi

create_job() {
  local name="$1"
  local xml="$2"
  if curl -sf "${JENKINS_URL}/job/${name}/config.xml" >/dev/null 2>&1; then
    echo "Job ${name} exists — updating config"
    curl -sf -X POST "${CRUMB_HEADER[@]}" -H "Content-Type: application/xml" \
      --data-binary "@${xml}" "${JENKINS_URL}/job/${name}/config.xml"
  else
    echo "Creating job ${name}"
    curl -sf -X POST "${CRUMB_HEADER[@]}" -H "Content-Type: application/xml" \
      --data-binary "@${xml}" "${JENKINS_URL}/createItem?name=${name}"
  fi
}

create_job "lawbridge-feature-ci" "${REPO_ROOT}/jenkins/jobs/lawbridge-feature-ci.xml"
create_job "lawbridge-main-ci" "${REPO_ROOT}/jenkins/jobs/lawbridge-main-ci.xml"

echo "==> 4/5 Trigger first build (feature pipeline)"
curl -sf -X POST "${CRUMB_HEADER[@]}" \
  "${JENKINS_URL}/job/lawbridge-feature-ci/buildWithParameters?SONAR_SKIP=true&delay=0sec" || true

echo "==> 5/5 Done"
echo "Jenkins UI: ${JENKINS_URL}"
echo "Feature CI: ${JENKINS_URL}/job/lawbridge-feature-ci/"
echo "Main CI:    ${JENKINS_URL}/job/lawbridge-main-ci/"
echo ""
echo "GitHub webhook (when Jenkins has a public URL):"
echo "  Payload URL: <YOUR_PUBLIC_URL>/github-webhook/"
echo "  Events: Push + Pull request"
