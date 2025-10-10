## Absense Backend (FastAPI)

### Quickstart
1. Create and activate venv
```bash
cd backend
python3 -m venv .venv
./.venv/bin/pip install --upgrade pip
./.venv/bin/pip install -r requirements.txt
./.venv/bin/pip install "pydantic[email]==2.8.2"
```

2. Run dev server (uses SQLite by default)
```bash
./scripts/dev.sh
```

3. API Docs
- Swagger UI: http://localhost:8000/docs
- Health: GET /api/v1/health

### Environment
- `.env` (optional):
```
SECRET_KEY=change-me
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
DATABASE_URL=postgresql+psycopg2://postgres:postgres@localhost:5432/absense
```
- Dev script overrides `DATABASE_URL` to `sqlite:///./absense_dev.db`

### Main Endpoints
- Auth:
  - POST `/api/v1/auth/register`
  - POST `/api/v1/auth/login`
  - GET `/api/v1/auth/me`
- Lecturer:
  - POST `/api/v1/lecturer/sessions`
  - GET `/api/v1/lecturer/sessions`
  - GET `/api/v1/lecturer/sessions/{session_id}/attendance`
- Student:
  - POST `/api/v1/student/attendance` (multipart: code, imei, selfie?, presence?)
- Admin:
  - POST `/api/v1/admin/imei/approve-reset`

### Notes
- Simple mock current users are used for dev for lecturer/student/admin.
- File uploads are stored under `backend/uploads/`.
- Tables auto-create on startup in dev.

### Migrations (Alembic)


### Mobile Client Notes
- CORS is enabled for all origins for development.
- Use the base URL of your machine (e.g., http://<LAN-IP>:8000) in the mobile app.
- Auth uses OAuth2 password flow-compatible endpoints.

### Storage
- Default: Local, served at `/static` in dev.
- To use S3, set in `.env`:
```
STORAGE_BACKEND=s3
S3_BUCKET=your-bucket
S3_REGION=your-region
S3_ACCESS_KEY=...
S3_SECRET_KEY=...
```


## Deployment

### Docker (Recommended)

1. **Development with Docker Compose:**
```bash
cd backend
docker compose up -d
```

2. **Production with Docker Compose:**
```bash
cd backend
cp .env.production .env
# Edit .env with your production values
docker compose -f docker-compose.prod.yml up -d
```

3. **Run migrations and seed data:**
```bash
# Migrations
docker exec absense-backend-prod python -m alembic upgrade head

# Seed initial data
docker exec absense-backend-prod python scripts/seed.py
```

### Manual Deployment

1. **Setup PostgreSQL and Redis**
2. **Install dependencies:**
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

3. **Configure environment:**
```bash
cp .env.production .env
# Edit .env with your values
```

4. **Run migrations:**
```bash
./scripts/migrate.sh
```

5. **Seed initial data:**
```bash
python scripts/seed.py
```

6. **Start the application:**
```bash
# Development
./scripts/dev.sh

# Production
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Environment Variables

- `DATABASE_URL`: PostgreSQL connection string
- `SECRET_KEY`: JWT secret key (change in production!)
- `STORAGE_BACKEND`: "local" or "s3"
- `S3_*`: S3 configuration for file storage
- `CORS_*`: CORS configuration

### Default Users (after seeding)

- Admin: `admin@absense.com` / `admin123`
- Lecturer: `lecturer@absense.com` / `lecturer123`  
- Student: `student@absense.com` / `student123`

**⚠️ Change default passwords in production!**
