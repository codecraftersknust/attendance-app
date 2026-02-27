# Absense Backend (FastAPI)

A comprehensive attendance management system with multi-layered verification including QR codes, GPS geofencing, device ID binding (hashed), and facial recognition.

## 🚀 Quick Start

```bash
# 1. Setup environment
cd backend
python3 -m venv .venv
source .venv/bin/activate   # or .venv\Scripts\activate on Windows
pip install --upgrade pip
pip install -r requirements.txt

# 2. Configure .env (copy from .env.sample)
# Set DATABASE_URL, SECRET_KEY, etc.

# 3. Run development server
./scripts/dev.sh

# 4. Access API docs
# Swagger UI: http://localhost:8000/docs
# Health: GET /api/v1/health
```

## 🏗️ Core Features

### Multi-Layered Verification
- **QR Code Rotation**: Auto-rotating QR codes every **30 seconds** (enhanced security)
- **GPS Geofencing**: Auto-capture lecturer's location during session creation
- **Geofence Control**: Adjustable radius from 1m to 10km via API
- **Device ID Binding**: One device per student policy (device ID is hashed using SHA-256)
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
- `POST /api/v1/student/device/bind` - Bind device ID (hashed before storage)
- `GET /api/v1/student/device/status` - Check bound device status
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
- `POST /api/v1/lecturer/sessions` - Create session (**NEW**: accepts `latitude`, `longitude` for GPS auto-capture)
- `GET /api/v1/lecturer/sessions` - List sessions
- `GET /api/v1/lecturer/sessions/{id}/qr/status` - Get QR status (rotation window)
- `POST /api/v1/lecturer/sessions/{id}/qr/rotate` - Rotate QR code (**30s** default, was 60s)
- `GET /api/v1/lecturer/sessions/{id}/qr` - Get QR payload (raw)
- `GET /api/v1/lecturer/qr/{id}/display` - Get QR display data (qr_data, expires_at, remaining) **30s TTL**
- `PUT /api/v1/lecturer/sessions/{id}/geofence` - **NEW**: Update geofence radius (1-10,000m)
- `GET /api/v1/lecturer/sessions/{id}/geofence` - **NEW**: Get geofence settings
- `GET /api/v1/lecturer/sessions/{id}/attendance` - View attendance
- `GET /api/v1/lecturer/sessions/{id}/analytics` - Session analytics (web-optimized)
- `GET /api/v1/lecturer/dashboard` - Lecturer dashboard stats

### Admin
- `GET /api/v1/admin/flagged` - List flagged attendance
- `POST /api/v1/admin/device/approve-reset` - Approve device ID reset
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
- `Device` - Device ID binding (hashed using SHA-256)
- `VerificationLog` - Audit trail

## 🔧 Environment

### Development (.env)
```env
SECRET_KEY=change-me-in-production
DATABASE_URL=sqlite:///./absense_dev.db
CORS_ALLOW_ORIGINS=*
```

### Production (.env)
```env
SECRET_KEY=<strong-random-secret>
DATABASE_URL=postgresql+psycopg2://user:pass@host:5432/dbname
CORS_ALLOW_ORIGINS=https://your-frontend-domain.com
# Add SUPABASE_* vars if using Supabase
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

```bash
# Production deployment
cd backend
source .venv/bin/activate

# Run migrations
alembic upgrade head

# Seed data (optional)
python scripts/seed.py

# Start server with Gunicorn
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

For production, use a process manager like **systemd** to keep the backend running:

```ini
[Unit]
Description=Absense FastAPI Backend
After=network.target

[Service]
Type=simple
User=absense
WorkingDirectory=/path/to/attendance-app/backend
Environment="PATH=/path/to/attendance-app/backend/.venv/bin"
ExecStart=/path/to/attendance-app/backend/.venv/bin/gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 127.0.0.1:8000
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
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
2. Bind device ID via `POST /student/device/bind` (device ID is hashed before storage)
3. Scan classroom QR (contains `session_id` + `nonce`)
4. Submit attendance via `POST /student/attendance` with form fields:
   - `qr_session_id`, `qr_nonce`, `latitude`, `longitude`, `device_id`, `selfie`
5. Backend validates QR window, device, location, and matches selfie to reference
6. Response includes record id, status, and face verification diagnostics

### QR Display (Lecturer Web)
- Use `GET /lecturer/qr/{session_id}/display` to render the QR (`qr_data`)
- QR codes rotate every **30 seconds** (enhanced security)
- Poll every 3–5s; when `time_remaining_seconds` ≤ 5, re-fetch to re-render
- Background service auto-rotates 10 seconds before expiry

### Geofence Features
- **Auto-capture GPS**: Lecturer's location captured during session creation
- **Default radius**: 100 meters when GPS provided
- **Adjustable radius**: 1m to 10,000m via `PUT /lecturer/sessions/{id}/geofence`
- **Soft enforcement**: Students outside geofence are flagged, not rejected

## 🔒 Security

- JWT authentication with refresh tokens
- Role-based access control
- Comprehensive audit logging
- Security headers middleware
- File upload validation

---

**Built with FastAPI, SQLAlchemy, DeepFace, and PostgreSQL**