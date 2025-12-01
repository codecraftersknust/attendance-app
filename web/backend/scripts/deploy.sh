#!/usr/bin/env bash
set -euo pipefail

# Docker deployment helper script for Absense backend

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="${SCRIPT_DIR%/scripts}"
cd "$BACKEND_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

echo_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

echo_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if .env exists
if [ ! -f .env ]; then
    echo_warn ".env file not found. Creating from .env.example if it exists..."
    if [ -f .env.example ]; then
        cp .env.example .env
        echo_info ".env file created. Please edit it with your configuration."
        exit 0
    else
        echo_error ".env.example not found. Please create .env manually."
        exit 1
    fi
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo_error "docker-compose is not installed. Please install Docker Compose."
    exit 1
fi

# Function to start services
start() {
    echo_info "Building and starting services..."
    docker-compose -f docker-compose.prod.yml up -d --build
    
    echo_info "Waiting for database to be ready..."
    sleep 5
    
    echo_info "Running database migrations..."
    docker-compose -f docker-compose.prod.yml --profile migrate run --rm migrate
    
    echo_info "Services started successfully!"
    echo_info "Backend API: http://localhost:8000"
    echo_info "API Docs: http://localhost:8000/docs"
    echo_info "Health Check: http://localhost:8000/api/v1/health"
}

# Function to stop services
stop() {
    echo_info "Stopping services..."
    docker-compose -f docker-compose.prod.yml down
    echo_info "Services stopped."
}

# Function to view logs
logs() {
    docker-compose -f docker-compose.prod.yml logs -f "${1:-}"
}

# Function to run migrations
migrate() {
    echo_info "Running database migrations..."
    docker-compose -f docker-compose.prod.yml --profile migrate run --rm migrate
    echo_info "Migrations completed!"
}

# Function to seed database
seed() {
    echo_info "Seeding database..."
    docker-compose -f docker-compose.prod.yml exec app python scripts/seed.py
    echo_info "Database seeded!"
}

# Function to show status
status() {
    echo_info "Service status:"
    docker-compose -f docker-compose.prod.yml ps
}

# Function to restart services
restart() {
    echo_info "Restarting services..."
    docker-compose -f docker-compose.prod.yml restart
    echo_info "Services restarted!"
}

# Function to show help
help() {
    cat << EOF
Absense Backend Docker Deployment Helper

Usage: $0 <command> [options]

Commands:
    start       Build and start all services
    stop        Stop all services
    restart     Restart all services
    logs        View logs (optionally specify service: app, db)
    migrate     Run database migrations
    seed        Seed database with initial data
    status      Show service status
    help        Show this help message

Examples:
    $0 start
    $0 logs app
    $0 migrate
    $0 seed

EOF
}

# Main command handler
case "${1:-help}" in
    start)
        start
        ;;
    stop)
        stop
        ;;
    restart)
        restart
        ;;
    logs)
        logs "${2:-}"
        ;;
    migrate)
        migrate
        ;;
    seed)
        seed
        ;;
    status)
        status
        ;;
    help|--help|-h)
        help
        ;;
    *)
        echo_error "Unknown command: $1"
        help
        exit 1
        ;;
esac

