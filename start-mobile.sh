#!/bin/bash

# Start Mobile Development Environment
# This script starts the backend and mobile app together for full functionality

set -e

echo "====================================="
echo "  Absense Mobile Development Setup  "
echo "====================================="
echo ""

# Get the script directory (works even if called from another directory)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to get local IP address
get_local_ip() {
    # Try different methods to get local IP
    local ip=""
    
    # Method 1: hostname -I (Linux)
    if command -v hostname &> /dev/null; then
        ip=$(hostname -I 2>/dev/null | awk '{print $1}')
    fi
    
    # Method 2: ip route (Linux)
    if [ -z "$ip" ] && command -v ip &> /dev/null; then
        ip=$(ip route get 1 2>/dev/null | awk '{print $7; exit}')
    fi
    
    # Method 3: ifconfig (macOS/Linux)
    if [ -z "$ip" ] && command -v ifconfig &> /dev/null; then
        ip=$(ifconfig 2>/dev/null | grep -Eo 'inet (addr:)?([0-9]*\.){3}[0-9]*' | grep -Eo '([0-9]*\.){3}[0-9]*' | grep -v '127.0.0.1' | head -n1)
    fi
    
    echo "$ip"
}

# Function to check if a port is in use
check_port() {
    if command -v lsof &> /dev/null; then
        if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1; then
            return 1
        fi
    elif command -v ss &> /dev/null; then
        if ss -tuln | grep -q ":$1 "; then
            return 1
        fi
    fi
    return 0
}

# Function to cleanup processes on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}Stopping servers...${NC}"
    
    if [ -n "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
    
    if [ -n "$MOBILE_PID" ]; then
        kill $MOBILE_PID 2>/dev/null || true
    fi
    
    # Kill any child processes
    pkill -P $$ 2>/dev/null || true
    
    echo -e "${GREEN}Servers stopped${NC}"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

# Check if backend directory exists
if [ ! -d "backend" ]; then
    echo -e "${RED}Error: backend directory not found${NC}"
    exit 1
fi

# Check if mobile directory exists
if [ ! -d "mobile" ]; then
    echo -e "${RED}Error: mobile directory not found${NC}"
    exit 1
fi

# Check if Python venv exists
if [ ! -f "backend/.venv/bin/python" ]; then
    echo -e "${RED}Error: Python virtual environment not found at backend/.venv${NC}"
    echo "Please run: cd backend && python -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt"
    exit 1
fi

# Check if mobile node_modules exists
if [ ! -d "mobile/node_modules" ]; then
    echo -e "${YELLOW}Mobile dependencies not installed. Installing...${NC}"
    (cd mobile && npm install)
fi

# Get local IP
LOCAL_IP=$(get_local_ip)
if [ -z "$LOCAL_IP" ]; then
    LOCAL_IP="localhost"
    echo -e "${YELLOW}Warning: Could not detect local IP. Using localhost.${NC}"
    echo -e "${YELLOW}Mobile app on physical device may not connect. Update mobile/constants/config.ts manually.${NC}"
else
    echo -e "${GREEN}Detected local IP: ${LOCAL_IP}${NC}"
fi

# Check port availability
echo -e "${YELLOW}Checking port availability...${NC}"
if ! check_port 8000; then
    echo -e "${RED}Port 8000 is already in use. Please stop the service using it.${NC}"
    exit 1
fi
echo -e "${GREEN}Port 8000 is available${NC}"

# Display IP configuration info
echo ""
echo -e "${CYAN}=========================================${NC}"
echo -e "${CYAN}  IMPORTANT: Mobile API Configuration   ${NC}"
echo -e "${CYAN}=========================================${NC}"
echo ""
echo -e "Your local IP is: ${GREEN}${LOCAL_IP}${NC}"
echo ""
echo -e "Make sure ${YELLOW}mobile/constants/config.ts${NC} has:"
echo -e "  BASE_URL: '${GREEN}http://${LOCAL_IP}:8000/api/v1${NC}'"
echo ""
echo -e "Current config file content:"
grep -A2 "BASE_URL:" mobile/constants/config.ts 2>/dev/null || echo "  (unable to read config)"
echo ""
echo -e "${CYAN}=========================================${NC}"
echo ""

# Start backend
echo -e "${YELLOW}Starting backend server on port 8000...${NC}"
(cd backend && export PYTHONPATH=. && .venv/bin/python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000) &
BACKEND_PID=$!

# Wait for backend to start
echo -e "${YELLOW}Waiting for backend to be ready...${NC}"
sleep 3

# Check if backend started successfully
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo -e "${RED}Backend failed to start. Check the error messages above.${NC}"
    exit 1
fi
echo -e "${GREEN}Backend is running!${NC}"

# Start mobile app
echo -e "${YELLOW}Starting Expo development server...${NC}"
echo -e "${CYAN}Using LAN mode - ensure your phone is on the same WiFi as this machine${NC}"
echo -e "${YELLOW}(Use 'npx expo start --tunnel' in mobile/ if you need tunnel mode)${NC}"
(cd mobile && npx expo start) &
MOBILE_PID=$!

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  Both servers are starting up!             ${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "  ${CYAN}Backend API:${NC}      http://localhost:8000"
echo -e "  ${CYAN}API Docs:${NC}         http://localhost:8000/docs"
echo -e "  ${CYAN}For Mobile:${NC}       http://${LOCAL_IP}:8000/api/v1"
echo -e "  ${CYAN}Expo:${NC}             Scan QR code in terminal"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all servers${NC}"
echo ""

# Wait for both processes
wait
