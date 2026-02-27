# Absense

**Smart multi-layered attendance verification system** with biometric verification, geolocation, device binding, and role-based access control for educational institutions.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi)
![Expo](https://img.shields.io/badge/Expo-54-000020?logo=expo)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)

## Features

- **Multi-layered verification** — QR codes (30-second rotation), GPS geofencing, device ID binding, and facial recognition
- **Role-based access** — Separate dashboards and workflows for students, lecturers, and administrators
- **Cross-platform** — Web app (Next.js) and mobile app (React Native / Expo) for students
- **Lecturer tools** — Create sessions, display rotating QR codes, capture GPS location, manage geofence radius, view attendance reports
- **Admin oversight** — Manage courses, users, sessions, flagged records, device resets, and manual attendance overrides
- **Student check-in** — QR scan + selfie + geolocation on each attendance submission

## Tech Stack

- **Backend:** FastAPI, PostgreSQL, SQLAlchemy, Alembic
- **Web:** Next.js 16, React 19, Tailwind CSS, Radix UI
- **Mobile:** Expo (React Native), Expo Router
- **Verification:** DeepFace (facial), QR rotation, GPS geofencing
- **Language:** TypeScript (web, mobile), Python (backend)

## Prerequisites

- Node.js 18+
- Python 3.10+
- PostgreSQL (for production) or SQLite (for development)

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/your-username/attendance-app.git
cd attendance-app
```

**Backend:**
```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # or .venv\Scripts\activate on Windows
pip install -r requirements.txt
```

**Web:**
```bash
cd web
npm install
```

**Mobile (optional):**
```bash
cd mobile
npm install
```

### 2. Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| **Backend** (`backend/.env`) | | |
| `SECRET_KEY` | Yes | Secret for JWT signing |
| `DATABASE_URL` | Yes | `sqlite:///./absense_dev.db` (dev) or PostgreSQL URL (prod) |
| `CORS_ALLOW_ORIGINS` | Yes | `*` (dev) or allowed origins (prod) |
| **Web** (`web/.env.local`) | | |
| `NEXT_PUBLIC_API_URL` | Yes | `http://localhost:8000/api/v1` |
| `NEXT_PUBLIC_ADMIN_PORTAL_CODE` | No | Admin portal password (default: `AdminPortal123!`) |
| **Mobile** (`mobile/constants/config.ts`) | | |
| `BASE_URL` | Yes | `http://YOUR_LOCAL_IP:8000/api/v1` (use your machine's IP for device testing) |

### 3. Run the app

**Web development** (backend + Next.js):
```bash
./start-dev.sh
```

- **Web app:** http://localhost:3000
- **API:** http://localhost:8000
- **API docs:** http://localhost:8000/docs

**Mobile development** (backend + Expo):
```bash
./start-mobile.sh
```

Update `mobile/constants/config.ts` with your local IP. Scan the QR code with Expo Go.

See `backend/README.md` for migrations, seeding, and production deployment.

### 4. Seed development data

```bash
cd backend
python scripts/seed.py
```

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@absense.com | admin123 |
| Lecturer | lecturer@absense.com | lecturer123 |
| Student | student@absense.com | student123 |
| Student (ID) | — | STU001 / student123 |

## Project Structure

```
attendance-app/
├── backend/              # FastAPI backend
│   ├── app/              # Application code
│   └── scripts/          # Seed, migrations, dev scripts
├── web/                  # Next.js web application
│   ├── app/              # App router (student, lecturer, admin routes)
│   │   ├── admin/        # Admin dashboard & pages
│   │   ├── lecturer/     # Lecturer dashboard & pages
│   │   └── student/      # Student dashboard & mark-attendance
│   ├── components/      # Shared UI components
│   └── lib/              # API client, utilities
├── mobile/               # Expo React Native app (student-focused)
│   ├── app/              # Expo Router screens
│   ├── screens/          # Screen components
│   └── components/      # Reusable components
├── start-dev.sh          # Start web + backend
└── start-mobile.sh       # Start mobile + backend
```

## Scripts

| Command | Description |
|---------|-------------|
| `./start-dev.sh` | Start backend + web dev servers |
| `./start-mobile.sh` | Start backend + Expo for mobile |
| `cd backend && ./scripts/dev.sh` | Backend only (port 8000) |
| `cd web && npm run dev` | Web only (port 3000) |
| `cd mobile && npx expo start` | Mobile only |
| `cd backend && python scripts/seed.py` | Seed development accounts |

## Application Functionality

### Student

- **Web:** Dashboard with enrolled courses, attendance stats, mark attendance (QR scan + selfie + location), course enrollment
- **Mobile:** Same flow with camera-based QR scanning, face capture, and geolocation
- **Verification:** One-time face enrollment, device binding, QR + selfie + GPS on each check-in

### Lecturer

- **Web:** Create and manage courses, create attendance sessions with optional GPS capture, display rotating QR codes, set geofence radius, view attendance lists, confirm/flag records, session analytics

### Admin

- **Web:** Dashboard, manage courses and users, view all sessions and attendance, review flagged records, approve device resets, manual attendance override, activity logs

## API Overview

Base URL: `http://localhost:8000/api/v1`

| Area | Key Endpoints |
|------|---------------|
| **Auth** | `POST /auth/register`, `POST /auth/login`, `GET /auth/me` |
| **Student** | `POST /student/enroll-face`, `POST /student/device/bind`, `POST /student/attendance`, `GET /student/courses` |
| **Lecturer** | `GET/POST /lecturer/courses`, `POST /lecturer/sessions`, `GET /lecturer/qr/{id}/display`, `GET /lecturer/sessions/{id}/attendance` |
| **Admin** | `GET /admin/users`, `GET /admin/sessions`, `POST /admin/attendance/manual-mark`, `GET /admin/flagged` |

Full API documentation: http://localhost:8000/docs

## Deploy

The web app can be deployed to [Vercel](https://vercel.com) or any Node.js host. The backend can run on any Python host (e.g. systemd + Gunicorn). Add the same environment variables in your deployment platform. For production, use PostgreSQL and set `CORS_ALLOW_ORIGINS` to your frontend URL(s).

## License

Proprietary. All rights reserved.
