# PowerShell script for Docker operations
# Usage: ./docker-ops.ps1 [build|start|stop|logs|shell]

param(
    [Parameter(Position=0)]
    [string]$Operation
)

# Function to show help
function Show-Help {
    Write-Host "Docker Operations Helper for HydroLog"
    Write-Host "-------------------------------------"
    Write-Host "Usage: ./docker-ops.ps1 [operation]"
    Write-Host ""
    Write-Host "Operations:"
    Write-Host "  build  - Build the Docker image"
    Write-Host "  start  - Start the containers with docker-compose"
    Write-Host "  stop   - Stop the containers"
    Write-Host "  logs   - Show container logs"
    Write-Host "  shell  - Open a shell inside the container"
    Write-Host "  secret - Generate a secure JWT secret"
    Write-Host ""
}

# Check if Docker is installed
function Test-Docker {
    try {
        docker --version >$null 2>&1
        return $true
    }
    catch {
        Write-Host "Docker is not installed or not in PATH." -ForegroundColor Red
        return $false
    }
}

# Generate a secure JWT secret
function Generate-JwtSecret {
    Write-Host "Generating a secure JWT secret..."
    node generate-jwt-secret.js
}

# Main execution
if (-not (Test-Docker)) {
    exit 1
}

switch ($Operation) {
    "build" {
        Write-Host "Building HydroLog Docker image..." -ForegroundColor Cyan
        docker build -t hydrolog .
    }
    "start" {
        Write-Host "Starting HydroLog containers..." -ForegroundColor Cyan
        docker-compose up -d
    }
    "stop" {
        Write-Host "Stopping HydroLog containers..." -ForegroundColor Cyan
        docker-compose down
    }
    "logs" {
        Write-Host "Showing HydroLog container logs..." -ForegroundColor Cyan
        docker-compose logs -f
    }
    "shell" {
        Write-Host "Opening a shell in the HydroLog container..." -ForegroundColor Cyan
        docker exec -it hydrolog sh
    }
    "secret" {
        Generate-JwtSecret
    }
    default {
        Show-Help
    }
}
