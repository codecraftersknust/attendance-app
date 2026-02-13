#!/bin/bash
set -e

echo "Running database migrations..."

cd "$(dirname "$0")/.."

# Load env vars from .env (DATABASE_URL etc.)
if [ -f .env ]; then
    set -a
    source .env
    set +a
fi

if [ -z "${DATABASE_URL:-}" ]; then
    echo "Error: DATABASE_URL is not set. Check your .env file."
    exit 1
fi

# Run migrations
python -m alembic upgrade head

echo "Migrations completed!"
