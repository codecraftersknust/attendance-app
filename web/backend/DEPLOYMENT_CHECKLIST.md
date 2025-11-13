# Docker Deployment Checklist

## ✅ Pre-Deployment Checklist

### 1. Environment Configuration
- [x] `.env` file created and configured
- [ ] `SECRET_KEY` updated (currently: `deployversion123` - **CHANGE THIS!**)
- [ ] `POSTGRES_PASSWORD` updated (currently: `strongdatabase123` - **CHANGE THIS!**)
- [ ] `CORS_ALLOW_ORIGINS` set to your frontend domains (currently: `*` - **RESTRICT IN PRODUCTION!`)

### 2. Docker Installation
- [ ] Docker Engine installed
- [ ] Docker Compose installed
- [ ] Docker daemon running

### 3. System Requirements
- [ ] At least 2GB RAM available
- [ ] ~5GB disk space available
- [ ] Ports 8000 and 5432 available

## 🚀 Deployment Steps

### Step 1: Install Docker (if not installed)

**Ubuntu/Debian:**
```bash
# Install Docker
sudo apt update
sudo apt install docker.io docker-compose-plugin

# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Add your user to docker group (optional, to run without sudo)
sudo usermod -aG docker $USER
# Log out and back in for group changes to take effect
```

**Verify installation:**
```bash
docker --version
docker compose version
docker info
```

### Step 2: Update .env File

**Critical: Update these values before production deployment:**

```bash
# Generate a secure SECRET_KEY
python3 -c "import secrets; print(secrets.token_urlsafe(32))"

# Edit .env file
nano .env  # or use your preferred editor
```

**Required changes:**
- `SECRET_KEY`: Use the generated secure key (min 32 characters)
- `POSTGRES_PASSWORD`: Use a strong password
- `CORS_ALLOW_ORIGINS`: Set to your actual frontend domains (comma-separated)

### Step 3: Deploy Services

**Option A: Using the deployment script (recommended)**
```bash
cd web/backend
./scripts/deploy.sh start
```

**Option B: Manual deployment**
```bash
cd web/backend

# Build and start services
docker compose -f docker-compose.prod.yml up -d --build

# Run database migrations
docker compose -f docker-compose.prod.yml --profile migrate run --rm migrate

# Check logs
docker compose -f docker-compose.prod.yml logs -f app
```

### Step 4: Verify Deployment

```bash
# Check service status
docker compose -f docker-compose.prod.yml ps

# Test health endpoint
curl http://localhost:8000/api/v1/health

# Check API docs
curl http://localhost:8000/docs
# Or open in browser: http://localhost:8000/docs
```

### Step 5: Seed Database (Optional)

```bash
# Enter the app container
docker compose -f docker-compose.prod.yml exec app bash

# Run seed script
python scripts/seed.py

# Exit container
exit
```

## 📋 Post-Deployment Verification

- [ ] Backend API is accessible at `http://localhost:8000`
- [ ] Health endpoint returns 200: `GET /api/v1/health`
- [ ] API docs accessible at `http://localhost:8000/docs`
- [ ] Database connection working (check logs)
- [ ] Can create test user via API
- [ ] Can login and get JWT token

## 🔧 Common Commands

### View Logs
```bash
# All services
docker compose -f docker-compose.prod.yml logs -f

# Specific service
docker compose -f docker-compose.prod.yml logs -f app
docker compose -f docker-compose.prod.yml logs -f db
```

### Stop Services
```bash
docker compose -f docker-compose.prod.yml down
```

### Restart Services
```bash
docker compose -f docker-compose.prod.yml restart
```

### Run Migrations
```bash
docker compose -f docker-compose.prod.yml --profile migrate run --rm migrate
```

### Access Database
```bash
docker compose -f docker-compose.prod.yml exec db psql -U postgres -d absense
```

### Access App Container
```bash
docker compose -f docker-compose.prod.yml exec app bash
```

## ⚠️ Security Reminders

Before going to production:

1. **Change SECRET_KEY** - Generate a secure random key
2. **Change POSTGRES_PASSWORD** - Use a strong password
3. **Restrict CORS** - Set `CORS_ALLOW_ORIGINS` to your actual domains
4. **Use HTTPS** - Deploy behind reverse proxy (nginx/traefik) with SSL
5. **Firewall** - Only expose necessary ports
6. **Backup** - Set up regular database backups

## 🐛 Troubleshooting

### Container won't start
```bash
# Check logs
docker compose -f docker-compose.prod.yml logs app

# Check container status
docker compose -f docker-compose.prod.yml ps
```

### Database connection errors
```bash
# Verify database is running
docker compose -f docker-compose.prod.yml ps db

# Check database logs
docker compose -f docker-compose.prod.yml logs db

# Test connection
docker compose -f docker-compose.prod.yml exec db psql -U postgres -d absense
```

### Migration errors
```bash
# Check migration status
docker compose -f docker-compose.prod.yml exec app python -m alembic current

# View migration history
docker compose -f docker-compose.prod.yml exec app python -m alembic history
```

### Port already in use
```bash
# Check what's using the port
sudo lsof -i :8000
sudo lsof -i :5432

# Change port in .env file if needed
```

## 📚 Next Steps

After successful deployment:

1. Set up reverse proxy (nginx/traefik)
2. Configure SSL certificates (Let's Encrypt)
3. Set up monitoring (Prometheus/Grafana)
4. Configure log aggregation
5. Set up automated backups
6. Configure CI/CD pipeline

See [DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md) for detailed documentation.

