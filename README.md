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