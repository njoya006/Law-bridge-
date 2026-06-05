# Create LawBridge Jenkins pipeline jobs (no auth required)
$JenkinsUrl = "http://localhost:8080"
$RepoRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent

function Get-JenkinsCrumb {
    try {
        $json = Invoke-RestMethod -Uri "$JenkinsUrl/crumbIssuer/api/json" -Method GET
        return @{ Field = $json.crumbRequestField; Value = $json.crumb }
    } catch {
        return $null
    }
}

function New-JenkinsJob($Name, $ConfigPath) {
    $crumb = Get-JenkinsCrumb
    $headers = @{ "Content-Type" = "application/xml" }
    if ($crumb) { $headers[$crumb.Field] = $crumb.Value }

    $exists = $false
    try {
        Invoke-WebRequest -Uri "$JenkinsUrl/job/$Name/config.xml" -UseBasicParsing -TimeoutSec 5 | Out-Null
        $exists = $true
    } catch {}

    $xml = Get-Content -Path $ConfigPath -Raw -Encoding UTF8
    if ($exists) {
        Write-Host "Updating job $Name"
        Invoke-WebRequest -Uri "$JenkinsUrl/job/$Name/config.xml" -Method POST -Headers $headers -Body $xml -UseBasicParsing | Out-Null
    } else {
        Write-Host "Creating job $Name"
        Invoke-WebRequest -Uri "$JenkinsUrl/createItem?name=$Name" -Method POST -Headers $headers -Body $xml -UseBasicParsing | Out-Null
    }
}

New-JenkinsJob "lawbridge-feature-ci" (Join-Path $RepoRoot "jenkins\jobs\lawbridge-feature-ci.xml")
New-JenkinsJob "lawbridge-main-ci" (Join-Path $RepoRoot "jenkins\jobs\lawbridge-main-ci.xml")

$crumb = Get-JenkinsCrumb
$headers = @{}
if ($crumb) { $headers[$crumb.Field] = $crumb.Value }
Invoke-WebRequest -Uri "$JenkinsUrl/job/lawbridge-feature-ci/buildWithParameters?SONAR_SKIP=true&delay=0sec" -Method POST -Headers $headers -UseBasicParsing | Out-Null
Write-Host "Triggered lawbridge-feature-ci build"
Write-Host "Open: $JenkinsUrl/job/lawbridge-feature-ci/"
