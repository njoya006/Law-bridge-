# Phase 4 Deployment Helper Script
# This script helps verify and deploy Phase 4 services

param(
    [string]$Action = "verify",
    [string]$Service = "all"
)

$ErrorActionPreference = "Stop"
$projectRoot = Get-Location

# Color output
function Write-Success { Write-Host $args -ForegroundColor Green }
function Write-Error { Write-Host $args -ForegroundColor Red }
function Write-Info { Write-Host $args -ForegroundColor Cyan }
function Write-Warning { Write-Host $args -ForegroundColor Yellow }

# Check if folders exist
function Test-Phase4Folders {
    Write-Info "Checking Phase 4 folder structure..."
    
    $services = @("notification-service", "calendar-service", "search-service", "monitoring-service")
    $allGood = $true
    
    foreach ($svc in $services) {
        $path = Join-Path "services" $svc
        if (Test-Path $path) {
            Write-Success "✓ $path"
        } else {
            Write-Error "✗ $path (missing)"
            $allGood = $false
        }
    }
    
    return $allGood
}

# Check requirements.txt
function Test-RequirementsTxt {
    Write-Info "Checking requirements.txt in each service..."
    
    $services = @("notification-service", "calendar-service", "search-service", "monitoring-service")
    $allGood = $true
    
    foreach ($svc in $services) {
        $reqFile = Join-Path "services" $svc "requirements.txt"
        if (Test-Path $reqFile) {
            $size = (Get-Item $reqFile).Length
            if ($size -gt 200) {
                Write-Success "✓ $svc requirements.txt ($size bytes)"
            } else {
                Write-Warning "⚠ $svc requirements.txt (too small, may need updates)"
            }
        } else {
            Write-Error "✗ $svc requirements.txt (missing)"
            $allGood = $false
        }
    }
    
    return $allGood
}

# Check code files
function Test-CodeFiles {
    Write-Info "Checking Phase 4 code files..."
    
    $coreFiles = @("settings.py", "urls.py", "wsgi.py")
    $appFiles = @("models.py", "views.py", "serializers.py", "urls.py", "admin.py", "apps.py")
    
    $services = @(
        @{name = "notification-service"; appName = "notifications"},
        @{name = "calendar-service"; appName = "calendar"},
        @{name = "search-service"; appName = "search"},
        @{name = "monitoring-service"; appName = "monitoring"}
    )
    
    $allGood = $true
    
    foreach ($svc in $services) {
        Write-Info "  Checking $($svc.name)..."
        
        # Check core files
        foreach ($file in $coreFiles) {
            $path = Join-Path "services" $svc.name "core" $file
            if (Test-Path $path) {
                Write-Success "    ✓ core/$file"
            } else {
                Write-Warning "    ? core/$file (optional)"
            }
        }
        
        # Check app files (except models for search)
        $filesToCheck = $appFiles
        if ($svc.name -eq "search-service") {
            $filesToCheck = $appFiles | Where-Object { $_ -ne "models.py" }
        }
        
        foreach ($file in $filesToCheck) {
            $path = Join-Path "services" $svc.name "apps" $svc.appName $file
            if (Test-Path $path) {
                Write-Success "    ✓ apps/$($svc.appName)/$file"
            } else {
                Write-Warning "    ? apps/$($svc.appName)/$file"
            }
        }
    }
    
    return $allGood
}

# Check Docker
function Test-Docker {
    Write-Info "Checking Docker..."
    
    try {
        $version = docker --version
        Write-Success "✓ Docker: $version"
        return $true
    } catch {
        Write-Error "✗ Docker not found. Please install Docker Desktop."
        return $false
    }
}

# Check docker-compose
function Test-DockerCompose {
    Write-Info "Checking Docker Compose..."
    
    try {
        $version = docker-compose --version
        Write-Success "✓ Docker Compose: $version"
        return $true
    } catch {
        Write-Error "✗ Docker Compose not found."
        return $false
    }
}

# Run full verification
function Verify-Phase4 {
    Write-Info "╔════════════════════════════════════════════════════╗"
    Write-Info "║  PHASE 4 DEPLOYMENT VERIFICATION                   ║"
    Write-Info "╚════════════════════════════════════════════════════╝"
    Write-Info ""
    
    $checks = @(
        (Test-Docker),
        (Test-DockerCompose),
        (Test-Phase4Folders),
        (Test-RequirementsTxt),
        (Test-CodeFiles)
    )
    
    Write-Info ""
    
    if ($checks -contains $false) {
        Write-Warning "⚠ Some checks failed. Please review above."
        return $false
    } else {
        Write-Success "✓ All checks passed! Ready for deployment."
        return $true
    }
}

# Build services
function Build-Phase4Services {
    Write-Info "Building Phase 4 services..."
    
    $services = @("notification-service", "calendar-service", "search-service", "monitoring-service")
    
    foreach ($svc in $services) {
        Write-Info "Building $svc..."
        docker-compose build $svc
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Failed to build $svc"
            return $false
        }
    }
    
    Write-Success "✓ All services built successfully"
    return $true
}

# Start services
function Start-Phase4Services {
    Write-Info "Starting Phase 4 services..."
    
    # Start databases first
    Write-Info "Starting databases..."
    docker-compose up -d notification-db calendar-db search-db monitoring-db
    
    Start-Sleep -Seconds 5
    
    # Start services
    Write-Info "Starting services..."
    docker-compose up -d notification-service calendar-service search-service monitoring-service
    
    Start-Sleep -Seconds 3
    
    Write-Info "Checking container status..."
    docker-compose ps
}

# Stop services
function Stop-Phase4Services {
    Write-Info "Stopping Phase 4 services..."
    docker-compose down
    Write-Success "✓ Services stopped"
}

# Show logs
function Show-ServiceLogs {
    param([string]$Service)
    
    Write-Info "Showing logs for $Service..."
    docker-compose logs -f $Service
}

# Show container status
function Show-ContainerStatus {
    Write-Info "╔════════════════════════════════════════════════════╗"
    Write-Info "║  CONTAINER STATUS                                  ║"
    Write-Info "╚════════════════════════════════════════════════════╝"
    Write-Info ""
    
    docker-compose ps
}

# Main switch
switch ($Action) {
    "verify" {
        Verify-Phase4
    }
    "build" {
        Build-Phase4Services
    }
    "start" {
        Start-Phase4Services
    }
    "stop" {
        Stop-Phase4Services
    }
    "logs" {
        if ($Service -eq "all") {
            docker-compose logs -f notification-service calendar-service search-service monitoring-service
        } else {
            Show-ServiceLogs $Service
        }
    }
    "status" {
        Show-ContainerStatus
    }
    default {
        Write-Info @"
Phase 4 Deployment Helper

Usage: .\phase4-deploy.ps1 -Action <action> [-Service <service>]

Actions:
  verify   - Verify folders, files, and Docker setup
  build    - Build all Phase 4 service Docker images
  start    - Start all Phase 4 services
  stop     - Stop all Phase 4 services
  logs     - Show service logs (use -Service for specific service)
  status   - Show container status

Examples:
  .\phase4-deploy.ps1 -Action verify
  .\phase4-deploy.ps1 -Action build
  .\phase4-deploy.ps1 -Action start
  .\phase4-deploy.ps1 -Action logs -Service notification-service
  .\phase4-deploy.ps1 -Action status

"@
    }
}
