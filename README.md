# Absense - Smart Multi-Layered Attendance Verification System

A comprehensive mobile attendance tracking system with biometric verification, geolocation, device binding, and role-based access control.

## Quick Start

### Option 1: Docker (Recommended)

The backend runs in Docker containers for production-like environment:

```bash
./start-dev.sh
```

This will start:
- **Frontend**: http://localhost:3000 (local npm dev server)
- **Backend API**: http://localhost:8001 (Docker container)
- **API Documentation**: http://localhost:8001/docs
- **Database**: PostgreSQL on port 5434 (Docker)
- **Redis**: On port 6379 (Docker)

Press `Ctrl+C` to stop all servers.

### Option 2: Manual Backend

See `web/backend/README.md` for manual setup instructions.

## Project Structure

### `/web/backend/`
FastAPI backend server with:
- **Authentication**: JWT-based auth with email/student ID login support
- **Database**: PostgreSQL (Docker) with SQLAlchemy and Alembic migrations
- **Features**: Face verification, 30-second QR rotation, GPS geofencing, device binding
- **API**: RESTful endpoints for students, lecturers, and admins
- **Deployment**: Docker Compose for production-ready setup

### `/web/frontend/`
Next.js frontend application with:
- **Authentication**: Login/signup forms with student ID support
- **Dashboard**: Role-based interfaces for students, lecturers, and admins
- **Components**: Face capture, QR scanner, geolocation check
- **UI**: Modern responsive design with Tailwind CSS

### `/app-frontend/`
React Native mobile application with:
- **Cross-platform**: iOS and Android support
- **Features**: Camera integration, QR scanning, biometric verification
- **Navigation**: Tab-based navigation with role-specific screens

### `/scripts/`
Development and deployment scripts:
- **start-dev.sh**: Starts both backend and frontend servers
- **Backend scripts**: Database migrations, seeding, development server

---

## Local Development Notes

### Docker Backend (Current Setup)
- **Frontend**: http://localhost:3000 (local npm)
- **Backend API**: http://localhost:8001 (Docker)
- **PostgreSQL**: localhost:5434 (Docker)
- **Redis**: localhost:6379 (Docker)

### Configuration

Frontend environment (`web/frontend/.env.local`):
```
NEXT_PUBLIC_API_URL=http://localhost:8001/api/v1
NEXT_PUBLIC_ADMIN_PORTAL_CODE=AdminPortal123!
```

Admin Portal (web) requires a second verification password set by `NEXT_PUBLIC_ADMIN_PORTAL_CODE`. Default is `AdminPortal123!` if not provided.

## Seeded Accounts (development)

The backend seed script creates the following users:

- Admin
  - Email: `admin@absense.com`
  - Password: `admin123`
- Lecturer
  - Email: `lecturer@absense.com`
  - Password: `lecturer123`
- Student
  - Email: `student@absense.com`
  - Student ID: `STU001`
  - Password: `student123`

Run the seed script if needed:

```
cd web/backend
python scripts/seed.py
```

## REST API Endpoints (v1)

Base URL: `http://localhost:8001/api/v1` (Docker deployment)

### New Features
- **GPS Geofencing**: Sessions can capture lecturer's GPS location automatically
- **30-Second QR Rotation**: QR codes rotate every 30 seconds for enhanced security
- **Geofence Control**: Lecturers can adjust the allowable radius (1-10,000m)

- Health
  - GET `/health`

- Auth
  - POST `/auth/register`
  - POST `/auth/login`
  - GET `/auth/me`
  - POST `/auth/refresh`
  - POST `/auth/logout`

- Student (requires role=student)
  - POST `/student/enroll-face` (enroll reference face)
  - POST `/student/device/bind` (bind IMEI)
  - GET `/student/device/status` (check bind status)
  - POST `/student/attendance` (submit with `qr_session_id`, `qr_nonce`, `latitude`, `longitude`, `imei`, `selfie`)
  - POST `/student/verify-face` (dev test; supports `?debug=true`)
  - GET `/student/courses/search`
  - GET `/student/courses`
  - POST `/student/courses/{course_id}/enroll`

- Lecturer (requires role=lecturer)
  - GET `/lecturer/courses`
  - POST `/lecturer/courses`
  - GET `/lecturer/courses/{course_id}`
  - PUT `/lecturer/courses/{course_id}`
  - POST `/lecturer/sessions` - **NEW**: Accepts `latitude` and `longitude` for GPS auto-capture
  - POST `/lecturer/sessions/{session_id}/qr/rotate` - **UPDATED**: 30-second TTL (was 60s)
  - GET `/lecturer/sessions/{session_id}/qr/status`
  - GET `/lecturer/sessions/{session_id}/qr`
  - POST `/lecturer/sessions/{session_id}/regenerate`
  - POST `/lecturer/sessions/{session_id}/close`
  - GET `/lecturer/sessions`
  - GET `/lecturer/sessions/{session_id}/attendance`
  - GET `/lecturer/sessions/{session_id}/flagged`
  - POST `/lecturer/attendance/{record_id}/confirm`
  - GET `/lecturer/dashboard`
  - GET `/lecturer/sessions/{session_id}/analytics`
  - GET `/lecturer/qr/{session_id}/display` - **UPDATED**: Returns 30-second TTL
  - **NEW** PUT `/lecturer/sessions/{session_id}/geofence` - Update geofence radius
  - **NEW** GET `/lecturer/sessions/{session_id}/geofence` - Get geofence settings

- Admin (requires role=admin)
  - POST `/admin/imei/approve-reset`
  - GET `/admin/flagged`
  - GET `/admin/sessions`
  - GET `/admin/sessions/{session_id}/attendance`
  - GET `/admin/users`
  - POST `/admin/attendance/manual-mark`
  - GET `/admin/activity`
  - GET `/admin/dashboard`
