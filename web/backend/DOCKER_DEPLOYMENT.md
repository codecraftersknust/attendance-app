# Docker Deployment Guide

This guide explains how to deploy the Absense backend using Docker.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- At least 2GB RAM available
- Disk space: ~5GB for images and data

## Quick Start

### 1. Clone and Navigate

```bash
cd web/backend
```

### 2. Configure Environment

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and set your configuration:

```bash
# Critical: Change these in production!
SECRET_KEY=your-super-secret-key-min-32-characters-long
POSTGRES_PASSWORD=your-strong-database-password
CORS_ALLOW_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### 3. Build and Start

```bash
# Build and start all services
docker compose -f docker-compose.prod.yml up -d

# Run database migrations
docker compose -f docker-compose.prod.yml --profile migrate run --rm migrate

# Check logs
docker compose -f docker-compose.prod.yml logs -f app
```

### 4. Verify Deployment

```bash
# Check health
curl http://localhost:8000/api/v1/health

# Check API docs
open http://localhost:8000/docs
```

## Services

### Backend App (`app`)
- **Port**: 8000 (configurable via `APP_PORT`)
- **Image**: Built from `Dockerfile`
- **Health Check**: `/api/v1/health` endpoint
- **Workers**: 4 Gunicorn workers with Uvicorn

### PostgreSQL Database (`db`)
- **Port**: 5432 (configurable via `POSTGRES_PORT`)
- **Image**: `postgres:16-alpine`
- **Data**: Persisted in `absense_pg_data_prod` volume
- **Health Check**: `pg_isready`

### Migration Service (`migrate`)
- **Profile**: `migrate` (only runs when explicitly requested)
- **Purpose**: Runs Alembic migrations
- **Usage**: `docker compose -f docker-compose.prod.yml --profile migrate run --rm migrate`

## Common Operations

### Start Services

```bash
docker compose -f docker-compose.prod.yml up -d
```

### Stop Services

```bash
docker compose -f docker-compose.prod.yml down
```

### View Logs

```bash
# All services
docker compose -f docker-compose.prod.yml logs -f

# Specific service
docker compose -f docker-compose.prod.yml logs -f app
docker compose -f docker-compose.prod.yml logs -f db
```

### Run Migrations

```bash
docker compose -f docker-compose.prod.yml --profile migrate run --rm migrate
```

### Seed Database

```bash
# Enter the app container
docker compose -f docker-compose.prod.yml exec app bash

# Run seed script
python scripts/seed.py
```

### Backup Database

```bash
# Create backup
docker compose -f docker-compose.prod.yml exec db pg_dump -U postgres absense > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
docker compose -f docker-compose.prod.yml exec -T db psql -U postgres absense < backup.sql
```

### Update Application

```bash
# Pull latest code
git pull

# Rebuild and restart
docker compose -f docker-compose.prod.yml up -d --build

# Run migrations if needed
docker compose -f docker-compose.prod.yml --profile migrate run --rm migrate
```

## Production Considerations

### 1. Security

- **Change default passwords**: Update `POSTGRES_PASSWORD` and `SECRET_KEY` in `.env`
- **Use secrets management**: Consider Docker secrets or external secret managers
- **Limit CORS origins**: Set `CORS_ALLOW_ORIGINS` to your actual domains
- **Use HTTPS**: Deploy behind a reverse proxy (nginx/traefik) with SSL

### 2. Performance

- **Worker count**: Adjust Gunicorn workers in `Dockerfile` CMD based on CPU cores
- **Database connection pool**: Configure in `app/db/session.py` if needed
- **Resource limits**: Add to `docker-compose.prod.yml`:
  ```yaml
  deploy:
    resources:
      limits:
        cpus: '2'
        memory: 2G
      reservations:
        cpus: '1'
        memory: 1G
  ```

### 3. Monitoring

- **Health checks**: Already configured in `docker-compose.prod.yml`
- **Logging**: Use `docker logs` or integrate with logging services
- **Metrics**: Consider adding Prometheus metrics endpoint

### 4. Storage

- **Uploads volume**: Currently mounted as `./uploads:/app/uploads`
- **Database volume**: Persisted in Docker volume `absense_pg_data_prod`
- **Backup strategy**: Regular database backups (see Backup Database section)

### 5. Reverse Proxy

Recommended setup with nginx:

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Troubleshooting

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

# Rollback if needed (be careful!)
docker compose -f docker-compose.prod.yml exec app python -m alembic downgrade -1
```

### Out of memory

```bash
# Check resource usage
docker stats

# Reduce worker count in Dockerfile CMD
# Change: -w 4 to -w 2
```

## Development vs Production

### Development

Use `docker-compose.yml` (database only) or run locally:

```bash
./scripts/dev.sh
```

### Production

Use `docker-compose.prod.yml` with all services:

```bash
docker compose -f docker-compose.prod.yml up -d
```

## Environment Variables Reference

| Variable | Default | Description |
|----------|---------|-------------|
| `POSTGRES_USER` | `postgres` | Database user |
| `POSTGRES_PASSWORD` | `postgres` | Database password |
| `POSTGRES_DB` | `absense` | Database name |
| `SECRET_KEY` | `change-me` | JWT secret key |
| `DATABASE_URL` | Auto-generated | Full database connection string |
| `CORS_ALLOW_ORIGINS` | `*` | Allowed CORS origins |
| `FACE_VERIFICATION_ENABLED` | `true` | Enable face verification |
| `STORAGE_BACKEND` | `local` | Storage backend (local/s3) |

See `.env.example` for complete list.

## Next Steps

1. Set up reverse proxy (nginx/traefik)
2. Configure SSL certificates (Let's Encrypt)
3. Set up monitoring (Prometheus/Grafana)
4. Configure log aggregation (ELK/CloudWatch)
5. Set up CI/CD pipeline
6. Configure automated backups

