# Push LawBridge to GitHub

## First-time setup (run locally)

```powershell
cd C:\Users\njoya\Desktop\Lawbridge
git init
git add .
git commit -m "Initial LawBridge submission — microservices + frontend"
git branch -M main
git remote add origin https://github.com/njoya006/Law-bridge-.git
git push -u origin main
```

Repository: [njoya006/Law-bridge-](https://github.com/njoya006/Law-bridge-)

## What gets committed

- All `services/` microservices
- `lawbridge-frontend/` (not `node_modules` or `.next` — in `.gitignore`)
- `docker-compose.yml`, `gateway/`, `deploy/`
- `.env.example` and `.env.production.example` (templates only)

## What stays local (never commit)

- `.env` (secrets)
- `node_modules/`
- `.next/`
- `*.pem` SSH keys

## Branch for submission

If your school requires a specific branch:

```powershell
git checkout -b submission
git push -u origin submission
```

Provide the repo URL and branch name to your team / grader.
