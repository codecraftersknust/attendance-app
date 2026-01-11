#!/bin/bash

# Start Development Servers Script
# This script starts the Docker backend and local frontend development server

echo "Starting Absense App Development Servers..."

# Function to check if a port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo "Port $1 is already in use"
        return 1
    else
        echo "Port $1 is available"
        return 0
    fi
}

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo "Error: Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if frontend port is available
echo "Checking port availability..."
if ! check_port 3000; then
    echo "Please stop the service using port 3000 or change the frontend port"
    exit 1
fi

# Navigate to backend directory
cd web/backend

# Check if Docker containers are already running
echo "Checking Docker container status..."
BACKEND_RUNNING=$(docker ps --filter "name=absense-backend-prod" --filter "status=running" -q)
DB_RUNNING=$(docker ps --filter "name=absense-postgres-prod" --filter "status=running" -q)
REDIS_RUNNING=$(docker ps --filter "name=absense-redis-prod" --filter "status=running" -q)

if [ -n "$BACKEND_RUNNING" ] && [ -n "$DB_RUNNING" ] && [ -n "$REDIS_RUNNING" ]; then
    echo "Backend containers are already running"
else
    echo "Starting backend Docker containers..."
    # Start containers (will restart stopped ones or create new ones)
    docker-compose -f docker-compose.prod.yml up -d --remove-orphans
    
    if [ $? -eq 0 ]; then
        echo "Backend containers started successfully"
    else
        echo "Failed to start backend containers"
        exit 1
    fi
fi

# Wait for backend to be healthy
echo "Waiting for backend to be ready..."
MAX_WAIT=60
COUNTER=0
while [ $COUNTER -lt $MAX_WAIT ]; do
    HEALTH=$(curl -s http://localhost:8001/api/v1/health 2>/dev/null)
    if [ $? -eq 0 ] && [ "$HEALTH" = '{"status":"ok"}' ]; then
        echo "Backend is ready!"
        break
    fi
    if [ $((COUNTER % 10)) -eq 0 ]; then
        echo "Waiting... ($COUNTER/$MAX_WAIT)"
    fi
    sleep 2
    COUNTER=$((COUNTER+2))
done

if [ $COUNTER -ge $MAX_WAIT ]; then
    echo "Warning: Backend may not be fully ready yet, but continuing..."
fi

# Start frontend
echo "Starting frontend server..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!

# Give frontend a moment to start
sleep 3

echo ""
echo "✅ Both servers are running!"
echo "Frontend: http://localhost:3000"
echo "Backend API: http://localhost:8001"
echo "API Docs: http://localhost:8001/docs"
echo ""
echo "Press Ctrl+C to stop both servers"

# Function to cleanup processes on exit
cleanup() {
    echo ""
    echo "Stopping servers..."
    kill $FRONTEND_PID 2>/dev/null
    echo "Stopping backend Docker containers..."
    cd "$(dirname "$0")/web/backend"
    docker-compose -f docker-compose.prod.yml stop
    echo "Servers stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Wait for frontend process
wait $FRONTEND_PID
