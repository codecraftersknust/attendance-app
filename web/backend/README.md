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
- `POST /api/v1/student/attendance` - Submit attendance (QR-only)
- `POST /api/v1/student/enroll-face` - Enroll reference face
- `POST /api/v1/student/device/bind` - Bind device IMEI

### Lecturer (Web & Mobile Compatible)
- `GET /api/v1/lecturer/courses` - List lecturer's courses
- `POST /api/v1/lecturer/courses` - Create new course
- `GET /api/v1/lecturer/courses/{id}` - Get course details
- `PUT /api/v1/lecturer/courses/{id}` - Update course
- `POST /api/v1/lecturer/sessions` - Create session for specific course
- `GET /api/v1/lecturer/sessions` - List sessions
- `GET /api/v1/lecturer/sessions/{id}/qr/status` - Get QR status
- `POST /api/v1/lecturer/sessions/{id}/qr/rotate` - Rotate QR code
- `GET /api/v1/lecturer/sessions/{id}/qr` - Get QR payload
- `GET /api/v1/lecturer/qr/{id}/display` - Get QR display data (web-optimized)
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

- **Admin**: `admin@absense.com` / `admin123`
- **Lecturer**: `lecturer@absense.com` / `lecturer123`
- **Student**: `student@absense.com` / `student123`

**⚠️ Change passwords in production!**

## 🌐 Web & Mobile Integration

### Web Frontend Support
- **Lecturer Web Dashboard**: Full web interface for lecturers
- **Admin Web Dashboard**: Complete admin management interface
- **CORS Enabled**: All origins allowed in development
- **RESTful APIs**: JSON responses for web frontend consumption

### Mobile App Support
- **Student Mobile App**: QR scanning and attendance submission
- **OAuth2 Compatible**: Password flow for mobile authentication
- **QR Auto-Rotation**: Codes change every 60 seconds
- **LAN Testing**: Use `http://<LAN-IP>:8000` for mobile testing

## 🔒 Security

- JWT authentication with refresh tokens
- Role-based access control
- Comprehensive audit logging
- Security headers middleware
- File upload validation

---

**Built with FastAPI, SQLAlchemy, DeepFace, and PostgreSQL**