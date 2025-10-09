# SMAVS Backend - Deployment Checklist

## ✅ Pre-Deployment Verification

### Code Quality
- [x] All tests passing (3/3 tests ✓)
- [x] No linter errors
- [x] Code follows FastAPI best practices
- [x] All endpoints documented in OpenAPI
- [x] Error handling implemented
- [x] Input validation with Pydantic

### Security
- [x] JWT authentication configured
- [x] Password hashing (pbkdf2_sha256)
- [x] CORS configured
- [x] Security headers middleware
- [x] Rate limiting (60 req/min)
- [x] File upload validation
- [x] Audit logging enabled
- [ ] SECRET_KEY changed from default (⚠️ DO THIS!)

### Database
- [x] Models defined and tested
- [x] Relationships configured
- [x] Migrations created (Alembic)
- [x] Seed script available
- [x] Database URL configurable via env
- [x] SQLite for dev, ready for PostgreSQL

### Storage
- [x] Abstracted storage layer
- [x] Local storage working
- [x] S3 storage implementation ready
- [x] File upload directory created
- [x] Pre-signed URLs for S3

### API Endpoints
- [x] Health check: GET /health
- [x] Auth: POST /auth/register, /auth/login, GET /auth/me
- [x] Students: POST /students/attendance, /device/bind, /enroll-face
- [x] Lecturers: POST/GET /lecturers/sessions, /close, /export, /dashboard
- [x] Admin: POST /admin/approve-imei-reset

### Documentation
- [x] README.md with setup instructions
- [x] BACKEND_SUMMARY.md comprehensive guide
- [x] PROJECT_STATUS.md status report
- [x] API docs auto-generated (Swagger/ReDoc)
- [x] Environment variables documented
- [x] Deployment guide included

### Docker
- [x] Dockerfile created
- [x] .dockerignore configured
- [x] docker-compose.yml (dev)
- [x] docker-compose.prod.yml (production)
- [x] Multi-stage build (if applicable)
- [x] Health checks defined

### Configuration
- [x] .env for development
- [x] .env.production template
- [x] Environment-based settings
- [x] Configurable via environment variables
- [x] Sensible defaults

---

## 🚀 Production Deployment Steps

### 1. Environment Setup
```bash
# Copy production environment template
cp backend/.env.production backend/.env

# Edit with production values
nano backend/.env
```

**Required Changes:**
- [ ] Change SECRET_KEY to a strong random value
- [ ] Set DATABASE_URL to PostgreSQL connection string
- [ ] Configure S3_BUCKET, S3_REGION, S3_ACCESS_KEY, S3_SECRET_KEY
- [ ] Set CORS_ALLOW_ORIGINS to your mobile app domain
- [ ] Update other settings as needed

### 2. Database Setup
```bash
# Option A: Docker Compose (Recommended)
cd backend
docker-compose -f docker-compose.prod.yml up -d db
sleep 10  # Wait for PostgreSQL to start

# Option B: Manual PostgreSQL Setup
# Install PostgreSQL and create database
sudo apt-get install postgresql
sudo -u postgres createdb smavs
```

### 3. Build and Deploy
```bash
# Option A: Docker Compose
docker-compose -f docker-compose.prod.yml up -d

# Option B: Manual Deployment
cd backend
pip install -r requirements.txt
./scripts/migrate.sh
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### 4. Run Migrations
```bash
# Docker
docker exec smavs-backend-prod python -m alembic upgrade head

# Manual
cd backend
alembic upgrade head
```

### 5. Seed Initial Data
```bash
# Docker
docker exec smavs-backend-prod python scripts/seed.py

# Manual
python scripts/seed.py
```

### 6. Verify Deployment
```bash
# Check health
curl http://your-domain.com/health

# Check API docs
# Visit: http://your-domain.com/docs

# Test authentication
curl -X POST http://your-domain.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@smavs.com", "password": "admin123"}'
```

### 7. Security Hardening
- [ ] Change default user passwords
- [ ] Enable HTTPS (setup SSL certificate)
- [ ] Configure firewall rules
- [ ] Set up fail2ban or similar
- [ ] Enable database connection encryption
- [ ] Configure backup strategy
- [ ] Set up log rotation

### 8. Monitoring Setup
- [ ] Configure application logging
- [ ] Set up error tracking (e.g., Sentry)
- [ ] Enable metrics collection (Prometheus)
- [ ] Create dashboards (Grafana)
- [ ] Set up alerts for critical errors
- [ ] Monitor database performance
- [ ] Monitor API response times

### 9. CI/CD (Optional)
- [ ] Set up GitHub Actions / GitLab CI
- [ ] Configure automated testing
- [ ] Set up staging environment
- [ ] Configure automated deployments
- [ ] Set up rollback procedures

---

## 🧪 Testing in Production

### 1. Authentication
```bash
# Register new user
curl -X POST http://your-domain.com/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123","full_name":"Test User","role":"student"}'

# Login
curl -X POST http://your-domain.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'
# Save the access_token from response
```

### 2. Create Session (as Lecturer)
```bash
TOKEN="your-jwt-token-here"

curl -X POST http://your-domain.com/api/v1/lecturers/sessions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"course_name":"Test Course","session_code":"TEST123","latitude":40.7128,"longitude":-74.0060,"geofence_radius":100,"duration_minutes":60}'
```

### 3. Submit Attendance (as Student)
```bash
curl -X POST http://your-domain.com/api/v1/students/attendance \
  -H "Authorization: Bearer $TOKEN" \
  -F "session_code=TEST123" \
  -F "imei=123456789012345" \
  -F "latitude=40.7128" \
  -F "longitude=-74.0060" \
  -F "selfie=@path/to/selfie.jpg" \
  -F "presence_image=@path/to/classroom.jpg"
```

---

## 📊 Post-Deployment Monitoring

### Daily Checks
- [ ] Check application logs for errors
- [ ] Monitor API response times
- [ ] Check database performance
- [ ] Verify backup completion
- [ ] Review security logs

### Weekly Checks
- [ ] Review user activity
- [ ] Check storage usage
- [ ] Analyze attendance patterns
- [ ] Review audit logs
- [ ] Check for security updates

### Monthly Checks
- [ ] Review and update dependencies
- [ ] Database maintenance (vacuum, reindex)
- [ ] Review and optimize queries
- [ ] Test backup restoration
- [ ] Security audit

---

## 🔧 Troubleshooting

### Common Issues

#### 1. Database Connection Errors
```bash
# Check PostgreSQL is running
docker ps | grep postgres  # or systemctl status postgresql

# Test connection
psql -h localhost -U postgres -d smavs

# Check DATABASE_URL in .env
cat .env | grep DATABASE_URL
```

#### 2. File Upload Errors
```bash
# Check uploads directory exists and is writable
ls -la backend/uploads
chmod 755 backend/uploads

# Check S3 credentials (if using S3)
aws s3 ls s3://your-bucket-name
```

#### 3. Authentication Issues
```bash
# Verify SECRET_KEY is set
echo $SECRET_KEY

# Check token expiry settings
cat .env | grep ACCESS_TOKEN_EXPIRE_MINUTES

# Test user login
curl -X POST http://localhost:8000/api/v1/auth/login -d ...
```

#### 4. Docker Issues
```bash
# View logs
docker logs smavs-backend-prod
docker logs smavs-postgres-prod

# Restart services
docker-compose -f docker-compose.prod.yml restart

# Rebuild image
docker-compose -f docker-compose.prod.yml build --no-cache
```

---

## 📞 Support & Maintenance

### Logs Location
- Docker: `docker logs smavs-backend-prod`
- Manual: Check application stdout/stderr or log files

### Database Backups
```bash
# PostgreSQL backup
docker exec smavs-postgres-prod pg_dump -U postgres smavs > backup.sql

# Restore
docker exec -i smavs-postgres-prod psql -U postgres smavs < backup.sql
```

### Update Deployment
```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# Run migrations
docker exec smavs-backend-prod alembic upgrade head
```

---

## ✅ Final Checklist

Before going live:
- [ ] All production credentials configured
- [ ] SECRET_KEY changed
- [ ] Database migrations applied
- [ ] Initial data seeded
- [ ] Default passwords changed
- [ ] HTTPS enabled
- [ ] Firewall configured
- [ ] Monitoring set up
- [ ] Backups configured
- [ ] Documentation reviewed
- [ ] Load testing completed
- [ ] Security audit performed
- [ ] Team trained on system

**Status**: Ready for deployment! 🚀
