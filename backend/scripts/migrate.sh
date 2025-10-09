#!/bin/bash
set -e

echo "Running database migrations..."

# Set database URL if not provided
export DATABASE_URL=${DATABASE_URL:-"postgresql+psycopg2://postgres:postgres@localhost:5432/smavs"}

# Run migrations
cd "$(dirname "$0")/.."
python -m alembic upgrade head

echo "Migrations completed!"
