# Absense - Smart Multi-Layered Attendance Verification System

A comprehensive mobile attendance tracking system with biometric verification, geolocation, device binding, and role-based access control.

## Quick Start

To test the system, simply run:

```bash
./start-dev.sh
```

This will start both the backend and frontend development servers:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

Press `Ctrl+C` to stop both servers.

## Project Structure

### `/web/backend/`
FastAPI backend server with:
- **Authentication**: JWT-based auth with email/student ID login support
- **Database**: SQLAlchemy with Alembic migrations
- **Features**: Face verification, QR codes, geolocation, device binding
- **API**: RESTful endpoints for students, lecturers, and admins

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

## Local Development Notes (updated)

- On this machine we are currently running the backend on port 8000.
  - Frontend: http://localhost:3000
  - Backend API: http://localhost:8000
  - Configure the frontend API base via: `web/frontend/.env.local`

Example `web/frontend/.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
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

Base URL: `http://localhost:8000/api/v1` (use `8001` if you choose an alternate port)

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
  - POST `/lecturer/sessions`
  - POST `/lecturer/sessions/{session_id}/qr/rotate`
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
  - GET `/lecturer/qr/{session_id}/display`

- Admin (requires role=admin)
  - POST `/admin/imei/approve-reset`
  - GET `/admin/flagged`
  - GET `/admin/sessions`
  - GET `/admin/sessions/{session_id}/attendance`
  - GET `/admin/users`
  - POST `/admin/attendance/manual-mark`
  - GET `/admin/activity`
  - GET `/admin/dashboard`
