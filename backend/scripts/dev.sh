#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="${SCRIPT_DIR%/scripts}"
cd "$BACKEND_DIR"
export PYTHONPATH=app
export DATABASE_URL="sqlite:///./absense_dev.db"
exec "$BACKEND_DIR/.venv/bin/uvicorn" app.main:app --host 0.0.0.0 --port 8000 --reload
