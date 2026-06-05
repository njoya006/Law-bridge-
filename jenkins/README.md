# LawBridge Jenkins CI/CD

Pipeline definitions for the [Law-bridge-](https://github.com/njoya006/Law-bridge-) repository.

## Branch workflow

| Branch | Pipeline file | Behavior |
|--------|---------------|----------|
| `develop` | `jenkins/Jenkinsfile` | Test → SonarQube → Docker push → staging deploy → integration tests |
| `main` | `jenkins/Jenkinsfile` | Same through push → **manual approval** → production deploy |
| `praise/*`, `partner/*` | `jenkins/Jenkinsfile.feature` | Test → SonarQube → local Docker build (no push) |

Create the integration branch once:

```bash
git checkout main
git checkout -b develop
git push -u origin develop
```

Member branches (same pattern as partner):

```bash
git checkout main
git checkout -b praise/jenkins
# work...
git push -u origin praise/jenkins
# open PR into develop or main
```

## Quick start (local Jenkins)

```bash
# From repo root
docker compose -f jenkins/docker-compose.jenkins.yml up -d

# Initial admin password
docker exec lawbridge-jenkins cat /var/jenkins_home/secrets/initialAdminPassword
```

Open http://localhost:8080 and complete setup. Install plugins from `plugins.txt`.

### Jenkins job configuration

1. **New Item** → Pipeline → name: `lawbridge-ci`
2. **Pipeline** → Definition: *Pipeline script from SCM*
3. SCM: Git → `https://github.com/njoya006/Law-bridge-.git`
4. Branch: `*/develop` (add multibranch pipeline for `main` + `develop` + `praise/*`)
5. Script Path: `jenkins/Jenkinsfile`

For feature branches / PRs, create a second multibranch job with Script Path: `jenkins/Jenkinsfile.feature` and branch filter `praise/* partner/*`.

## Required Jenkins credentials

| ID | Type | Purpose |
|----|------|---------|
| `ghcr-credentials` | Username/password | GitHub PAT with `write:packages` for `ghcr.io/njoya006` |
| `kubeconfig-staging` | Secret file | Kubeconfig for staging cluster |
| `kubeconfig-production` | Secret file | Kubeconfig for production cluster |
| SonarQube server | SonarQube installation | Named `SonarQube` in Jenkins |

Optional: set job environment variable `SONAR_SKIP=true` until SonarQube is running.

## GitHub webhook

Repo → **Settings** → **Webhooks** → Add:

- **Payload URL**: `http://YOUR_JENKINS_HOST:8080/github-webhook/`
- **Content type**: `application/json`
- **Events**: Push, Pull requests

For local Jenkins use [ngrok](https://ngrok.com) or deploy Jenkins on a VPS with a public URL.

## Pipeline stages (main)

1. Checkout  
2. Detect changed services (`jenkins/scripts/detect-changed-services.sh`)  
3. Unit tests (`pytest` per changed service)  
4. Frontend build (when `lawbridge-frontend/` changes)  
5. SonarQube analysis  
6. Docker build & push to `ghcr.io/njoya006/lawbridge-<service>`  
7. Deploy staging (`k8s/overlays/staging/` — skipped until manifests exist)  
8. Integration tests (Postman — skipped until `docs/postman/` exists)  
9. Manual approval (main only)  
10. Deploy production  

## Scripts

| Script | Purpose |
|--------|---------|
| `scripts/detect-changed-services.sh` | Changed microservices since last commit |
| `scripts/detect-frontend-changed.sh` | Whether frontend changed |
| `scripts/run-service-tests.sh` | `pytest` in changed services |
| `scripts/build-and-push.sh` | Build & push to GHCR |
| `scripts/build-images-local.sh` | Feature branch local builds |
| `scripts/deploy-staging.sh` | `kubectl apply -k` staging |
| `scripts/deploy-production.sh` | `kubectl apply -k` production |
| `scripts/run-integration-tests.sh` | Newman Postman collection |

## Container images

Images are pushed as:

```
ghcr.io/njoya006/lawbridge-auth-service:<git-sha>
ghcr.io/njoya006/lawbridge-case-service:<git-sha>
...
```

Make packages public or grant Jenkins PAT access under GitHub → Packages.
