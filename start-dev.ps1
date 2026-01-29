# Start Development Servers Script (Windows PowerShell)
# This script starts both the backend and frontend development servers

Write-Host "Starting Absense App Development Servers..." -ForegroundColor Cyan

# Function to check if a port is in use
function Check-Port {
    param([int]$Port)
    $connection = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    if ($connection) {
        Write-Host "Port $Port is already in use" -ForegroundColor Red
        return $false
    } else {
        Write-Host "Port $Port is available" -ForegroundColor Green
        return $true
    }
}

# Check if ports are available
Write-Host "Checking port availability..." -ForegroundColor Yellow
if (-not (Check-Port -Port 8000)) {
    Write-Host "Please stop the service using port 8000 or change the backend port" -ForegroundColor Red
    exit 1
}

if (-not (Check-Port -Port 3000)) {
    Write-Host "Please stop the service using port 3000 or change the frontend port" -ForegroundColor Red
    exit 1
}

# Start backend
Write-Host "Starting backend server..." -ForegroundColor Yellow
$backendProcess = Start-Process -FilePath ".venv\Scripts\python.exe" `
    -ArgumentList "-m", "uvicorn", "app.main:app", "--reload", "--host", "0.0.0.0", "--port", "8000" `
    -WorkingDirectory "backend" `
    -Environment @{PYTHONPATH="."} `
    -PassThru `
    -NoNewWindow:$false

# Wait a moment for backend to start
Start-Sleep -Seconds 3

# Start frontend
Write-Host "Starting frontend server..." -ForegroundColor Yellow
$frontendProcess = Start-Process -FilePath "npm" `
    -ArgumentList "run", "dev" `
    -WorkingDirectory "web" `
    -PassThru `
    -NoNewWindow:$false

Write-Host ""
Write-Host "Both servers are starting up!" -ForegroundColor Green
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Backend API: http://localhost:8000" -ForegroundColor Cyan
Write-Host "API Docs: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop both servers" -ForegroundColor Yellow

# Function to cleanup processes on exit
function Cleanup {
    Write-Host ""
    Write-Host "Stopping servers..." -ForegroundColor Yellow
    if ($backendProcess -and -not $backendProcess.HasExited) {
        Stop-Process -Id $backendProcess.Id -Force -ErrorAction SilentlyContinue
    }
    if ($frontendProcess -and -not $frontendProcess.HasExited) {
        Stop-Process -Id $frontendProcess.Id -Force -ErrorAction SilentlyContinue
    }
    Write-Host "Servers stopped" -ForegroundColor Green
}

# Set up signal handlers
Register-EngineEvent PowerShell.Exiting -Action { Cleanup } | Out-Null
$null = Register-ObjectEvent -InputObject ([System.Console]) -EventName CancelKeyPress -Action { Cleanup; exit }

try {
    # Wait for both processes
    while ($true) {
        Start-Sleep -Seconds 1
        if ($backendProcess.HasExited -or $frontendProcess.HasExited) {
            Write-Host "One of the servers has stopped unexpectedly" -ForegroundColor Red
            Cleanup
            exit 1
        }
    }
} finally {
    Cleanup
}
