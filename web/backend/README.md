# Absense Backend (FastAPI)

A comprehensive attendance management system with multi-layered verification including QR codes, GPS geofencing, IMEI device binding, and facial recognition.

## 🚀 Quick Start

```bash
# 1. Setup environment
cd web/backend
python3 -m venv .venv
./.venv/bin/pip install --upgrade pip
./.venv/bin/pip install -r requirements.txt

# 2. Run development server
./scripts/dev.sh

# 3. Access API docs
# Swagger UI: http://localhost:8000/docs
# Health: GET /api/v1/health
```

## 🏗️ Core Features

### Multi-Layered Verification
- **QR Code Rotation**: Auto-rotating QR codes every 60 seconds
- **GPS Geofencing**: Location-based attendance verification
- **IMEI Device Binding**: One device per student policy
- **Facial Recognition**: DeepFace integration for biometric verification

### Role-Based Access
- **Student**: Submit attendance, enroll face, bind device
- **Lecturer**: Create sessions, manage QR codes, view reports
- **Admin**: Approve device resets, force verify attendance

## 📡 Key API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register user
- `POST /api/v1/auth/login` - Login (OAuth2 compatible)
- `GET /api/v1/auth/me` - Get current user

### Student
- `POST /api/v1/student/enroll-face` - Enroll reference face (required once)
- `POST /api/v1/student/device/bind` - Bind device IMEI
- `POST /api/v1/student/attendance` - Submit attendance (requires selfie when face verification enabled)
- `POST /api/v1/student/verify-face` - One-off verification test (dev; supports `?debug=true`)
- `GET /api/v1/student/courses/search` - Search active courses
- `GET /api/v1/student/courses` - List enrolled courses
- `POST /api/v1/student/courses/{course_id}/enroll` - Enroll in a course

### Lecturer (Web)
- `GET /api/v1/lecturer/courses` - List lecturer's courses
- `POST /api/v1/lecturer/courses` - Create new course
- `GET /api/v1/lecturer/courses/{id}` - Get course details
- `PUT /api/v1/lecturer/courses/{id}` - Update course
- `POST /api/v1/lecturer/sessions` - Create session for specific course
- `GET /api/v1/lecturer/sessions` - List sessions
- `GET /api/v1/lecturer/sessions/{id}/qr/status` - Get QR status (rotation window)
- `POST /api/v1/lecturer/sessions/{id}/qr/rotate` - Rotate QR code (60s default)
- `GET /api/v1/lecturer/sessions/{id}/qr` - Get QR payload (raw)
- `GET /api/v1/lecturer/qr/{id}/display` - Get QR display data (qr_data, expires_at, remaining)
- `GET /api/v1/lecturer/sessions/{id}/attendance` - View attendance
- `GET /api/v1/lecturer/sessions/{id}/analytics` - Session analytics (web-optimized)
- `GET /api/v1/lecturer/dashboard` - Lecturer dashboard stats

### Admin
- `GET /api/v1/admin/flagged` - List flagged attendance
- `POST /api/v1/admin/imei/approve-reset` - Approve IMEI reset
- `GET /api/v1/admin/sessions` - View all sessions
- `GET /api/v1/admin/sessions/{id}/attendance` - View session attendance
- `GET /api/v1/admin/users` - View all users
- `POST /api/v1/admin/attendance/manual-mark` - Manual attendance
- `GET /api/v1/admin/activity` - System activity
- `GET /api/v1/admin/dashboard` - Admin dashboard

## 🗄️ Database

- **SQLite** for development (`absense_dev.db`)
- **PostgreSQL** for production
- **Alembic** migrations included
- Auto-creates tables in dev mode

### Core Models
- `User` - User accounts with roles
- `Course` - Course management with lecturer assignment
- `AttendanceSession` - Class sessions with QR/geofence data (linked to courses)
- `AttendanceRecord` - Individual attendance submissions
- `Device` - IMEI device binding
- `VerificationLog` - Audit trail

## 🔧 Environment

Create `.env` (optional):
```env
SECRET_KEY=change-me-in-production
DATABASE_URL=postgresql+psycopg2://postgres:postgres@localhost:5432/absense
CORS_ALLOW_ORIGINS=*
STORAGE_BACKEND=local
```

## 🧪 Testing

```bash
pytest tests/

# Face verification (manual, with images)
./scripts/test_face_verification_curl.sh

# End-to-end QR + attendance demo
./scripts/qr_attendance_demo.sh  # uses test_images/verify_same.jpg as selfie
```

**Test Coverage**: Auth, lecturer, student, admin, face verification, health checks

## 🚀 Deployment

### Docker (Recommended)
```bash
# Development
docker compose up -d

# Production
docker compose -f docker-compose.prod.yml up -d
```

### Manual
```bash
# Migrations
alembic upgrade head

# Seed data
python scripts/seed.py

# Start server
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

## 👥 Default Users (after seeding)

### Login Options
All users can login with either **email** or **user_id**:

- **Admin**: 
  - Email: `admin@absense.com` / `admin123`
  - User ID: `ADM001` / `admin123`
- **Lecturer**: 
  - Email: `lecturer@absense.com` / `lecturer123`
  - User ID: `LEC001` / `lecturer123`
- **Student**: 
  - Email: `student@absense.com` / `student123`
  - User ID: `STU001` / `student123`

**⚠️ Change passwords in production!**

## 🌐 Web & Mobile Integration

### Web Frontend Support
- **Lecturer Web Dashboard**: Full web interface for lecturers
- **Admin Web Dashboard**: Complete admin management interface
- **CORS Enabled**: All origins allowed in development
- **RESTful APIs**: JSON responses for web frontend consumption

### Student Mobile Flow
1. Enroll reference face via `POST /student/enroll-face`
2. Bind device IMEI via `POST /student/device/bind`
3. Scan classroom QR (contains `session_id` + `nonce`)
4. Submit attendance via `POST /student/attendance` with form fields:
   - `qr_session_id`, `qr_nonce`, `latitude`, `longitude`, `imei`, `selfie`
5. Backend validates QR window, device, location, and matches selfie to reference
6. Response includes record id, status, and face verification diagnostics

### QR Display (Lecturer Web)
- Use `GET /lecturer/qr/{session_id}/display` to render the QR (`qr_data`)
- Poll every 3–5s; when `time_remaining_seconds` ≤ 0, re-fetch to re-render

## 🔒 Security

- JWT authentication with refresh tokens
- Role-based access control
- Comprehensive audit logging
- Security headers middleware
- File upload validation

---

**Built with FastAPI, SQLAlchemy, DeepFace, and PostgreSQL**