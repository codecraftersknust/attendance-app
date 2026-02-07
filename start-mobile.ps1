# Start Mobile Development Environment (Windows PowerShell)
# This script starts the backend and mobile app together for full functionality

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  Absense Mobile Development Setup  " -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Get the script directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

# Function to get local IP address
function Get-LocalIP {
    $ip = $null
    
    # Try to get the IP from network adapters
    $adapters = Get-NetIPAddress -AddressFamily IPv4 | 
        Where-Object { $_.IPAddress -ne "127.0.0.1" -and $_.PrefixOrigin -ne "WellKnown" } |
        Select-Object -First 1
    
    if ($adapters) {
        $ip = $adapters.IPAddress
    }
    
    # Fallback: try ipconfig
    if (-not $ip) {
        $ipconfigOutput = ipconfig | Select-String -Pattern "IPv4.*: (\d+\.\d+\.\d+\.\d+)" -AllMatches
        foreach ($match in $ipconfigOutput.Matches) {
            $foundIP = $match.Groups[1].Value
            if ($foundIP -ne "127.0.0.1") {
                $ip = $foundIP
                break
            }
        }
    }
    
    return $ip
}

# Function to check if a port is in use
function Test-PortInUse {
    param([int]$Port)
    $connection = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    return ($null -ne $connection)
}

# Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Yellow

# Check if backend directory exists
if (-not (Test-Path "backend")) {
    Write-Host "Error: backend directory not found" -ForegroundColor Red
    exit 1
}

# Check if mobile directory exists
if (-not (Test-Path "mobile")) {
    Write-Host "Error: mobile directory not found" -ForegroundColor Red
    exit 1
}

# Check if Python venv exists
if (-not (Test-Path "backend\.venv\Scripts\python.exe")) {
    Write-Host "Error: Python virtual environment not found at backend\.venv" -ForegroundColor Red
    Write-Host "Please run: cd backend && python -m venv .venv && .venv\Scripts\activate && pip install -r requirements.txt"
    exit 1
}

# Check if mobile node_modules exists
if (-not (Test-Path "mobile\node_modules")) {
    Write-Host "Mobile dependencies not installed. Installing..." -ForegroundColor Yellow
    Push-Location mobile
    npm install
    Pop-Location
}

# Get local IP
$LocalIP = Get-LocalIP
if (-not $LocalIP) {
    $LocalIP = "localhost"
    Write-Host "Warning: Could not detect local IP. Using localhost." -ForegroundColor Yellow
    Write-Host "Mobile app on physical device may not connect. Update mobile\constants\config.ts manually." -ForegroundColor Yellow
} else {
    Write-Host "Detected local IP: $LocalIP" -ForegroundColor Green
}

# Check port availability
Write-Host "Checking port availability..." -ForegroundColor Yellow
if (Test-PortInUse -Port 8000) {
    Write-Host "Port 8000 is already in use. Please stop the service using it." -ForegroundColor Red
    exit 1
}
Write-Host "Port 8000 is available" -ForegroundColor Green

# Display IP configuration info
Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  IMPORTANT: Mobile API Configuration   " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Your local IP is: " -NoNewline
Write-Host $LocalIP -ForegroundColor Green
Write-Host ""
Write-Host "Make sure " -NoNewline
Write-Host "mobile\constants\config.ts" -ForegroundColor Yellow -NoNewline
Write-Host " has:"
Write-Host "  BASE_URL: '" -NoNewline
Write-Host "http://${LocalIP}:8000/api/v1" -ForegroundColor Green -NoNewline
Write-Host "'"
Write-Host ""
Write-Host "Current config file content:"
if (Test-Path "mobile\constants\config.ts") {
    Get-Content "mobile\constants\config.ts" | Select-String -Pattern "BASE_URL" -Context 0,2
}
Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Store process references
$processes = @()

# Start backend
Write-Host "Starting backend server on port 8000..." -ForegroundColor Yellow

$backendProcess = Start-Process -FilePath "backend\.venv\Scripts\python.exe" `
    -ArgumentList "-m", "uvicorn", "app.main:app", "--reload", "--host", "0.0.0.0", "--port", "8000" `
    -WorkingDirectory "backend" `
    -PassThru `
    -NoNewWindow

$processes += $backendProcess

# Wait for backend to start
Write-Host "Waiting for backend to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Check if backend started successfully
if ($backendProcess.HasExited) {
    Write-Host "Backend failed to start. Check the error messages above." -ForegroundColor Red
    exit 1
}
Write-Host "Backend is running!" -ForegroundColor Green

# Start mobile app
Write-Host "Starting Expo development server..." -ForegroundColor Yellow
Write-Host "Using tunnel mode - works even if phone is on different network" -ForegroundColor Cyan

$mobileProcess = Start-Process -FilePath "npx" `
    -ArgumentList "expo", "start", "--tunnel" `
    -WorkingDirectory "mobile" `
    -PassThru `
    -NoNewWindow

$processes += $mobileProcess

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  Both servers are starting up!             " -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Backend API:      " -NoNewline -ForegroundColor Cyan
Write-Host "http://localhost:8000"
Write-Host "  API Docs:         " -NoNewline -ForegroundColor Cyan
Write-Host "http://localhost:8000/docs"
Write-Host "  For Mobile:       " -NoNewline -ForegroundColor Cyan
Write-Host "http://${LocalIP}:8000/api/v1"
Write-Host "  Expo:             " -NoNewline -ForegroundColor Cyan
Write-Host "Scan QR code in terminal"
Write-Host ""
Write-Host "Press Ctrl+C to stop all servers" -ForegroundColor Yellow
Write-Host ""

# Function to cleanup processes on exit
function Cleanup {
    Write-Host ""
    Write-Host "Stopping servers..." -ForegroundColor Yellow
    foreach ($proc in $processes) {
        if ($proc -and -not $proc.HasExited) {
            Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
        }
    }
    Write-Host "Servers stopped" -ForegroundColor Green
}

# Set up cleanup on exit
Register-EngineEvent PowerShell.Exiting -Action { Cleanup } | Out-Null

try {
    # Wait for processes
    while ($true) {
        Start-Sleep -Seconds 1
        
        $backendExited = $backendProcess.HasExited
        $mobileExited = $mobileProcess.HasExited
        
        if ($backendExited) {
            Write-Host "Backend server has stopped unexpectedly" -ForegroundColor Red
            Cleanup
            exit 1
        }
        
        if ($mobileExited) {
            Write-Host "Mobile server has stopped unexpectedly" -ForegroundColor Red
            Cleanup
            exit 1
        }
    }
} finally {
    Cleanup
}
