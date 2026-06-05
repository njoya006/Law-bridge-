# LawBridge Jenkins fast setup (Windows)
# Run from repo root: powershell -ExecutionPolicy Bypass -File jenkins/scripts/fast-setup.ps1

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
Set-Location $RepoRoot

Write-Host "==> Ensuring Jenkins container is running..." -ForegroundColor Cyan
docker compose -f jenkins/docker-compose.jenkins.yml up -d

Write-Host "==> Waiting for Jenkins (up to 90s)..." -ForegroundColor Cyan
$ready = $false
for ($i = 0; $i - 18; $i++) {
    try {
        $r = Invoke-WebRequest -Uri "http://localhost:8080/login" -UseBasicParsing -TimeoutSec 5
        if ($r.StatusCode -eq 200) { $ready = $true; break }
    } catch {}
    Start-Sleep -Seconds 5
}
if (-not $ready) { throw "Jenkins did not become ready on http://localhost:8080" }

Write-Host "==> Running configure-jenkins.sh via Git Bash..." -ForegroundColor Cyan
& "C:\Program Files\Git\bin\bash.exe" jenkins/scripts/configure-jenkins.sh

Write-Host ""
Write-Host "SETUP COMPLETE" -ForegroundColor Green
Write-Host "Open: http://localhost:8080/job/lawbridge-feature-ci/"
Write-Host "First build should be running. Watch console output in the UI."
