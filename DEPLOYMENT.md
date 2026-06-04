# Absense — production deployment (local Postgres + local storage)

This guide replaces **Supabase** (remote DB + storage) with services running on the school server (`coe-attendance`).

## Architecture

| Component | Service | Role |
|-----------|---------|------|
| API | `absense-backend` | Gunicorn, 4 workers — login, attendance, QR (no DeepFace) |
| Face ML | `absense-face-worker` | Single process — DeepFace only |
| Web | `absense-web` | Next.js on port 3000 |
| Database | PostgreSQL on `127.0.0.1` | All app data |
| Files | `/var/lib/absense/uploads` | Selfies + reference faces (Nginx serves `/uploads/`) |

---

## Fresh install (no Supabase restore)

Use this path if you want an **empty database** and new uploads folder. Skip section 4 (Supabase migration) entirely.

### 1. Install PostgreSQL

```bash
sudo apt update
sudo apt install -y postgresql postgresql-contrib

sudo -u postgres psql <<'SQL'
CREATE USER absense WITH PASSWORD 'CHOOSE_A_STRONG_PASSWORD';
CREATE DATABASE absense OWNER absense;
GRANT ALL PRIVILEGES ON DATABASE absense TO absense;
SQL
```

### 2. Upload directory

```bash
sudo mkdir -p /var/lib/absense/uploads
sudo chown -R absense:absense /var/lib/absense
```

### 3. Deploy latest code first

The new `.env` variables only work after you **push and pull** the local-storage changes. On your laptop (where you develop):

```bash
cd ~/path/to/attendance-app
git add -A && git commit -m "Local Postgres, local storage, face worker"
git push origin main
```

On the server:

```bash
cd ~/attendance-app
git pull origin main
```

If `git pull` says "Already up to date" but you still see the error below, the laptop changes were not pushed yet.

### 4. Edit `.env` on the server

SSH in as the `absense` user, then:

```bash
cd ~/attendance-app/backend
nano .env
```

**Other editors:** `vim .env` works the same. In `nano`: edit, then `Ctrl+O` Enter to save, `Ctrl+X` to quit.

**Start from the sample** (if `.env` is missing or you want a clean file):

```bash
cp .env.sample .env
nano .env
```

**Remove** any old lines starting with `SUPABASE_` (they are ignored but clutter the file).

**Paste this template** and replace the placeholders:

```env
SECRET_KEY=paste-a-long-random-string-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

DATABASE_URL=postgresql+psycopg2://absense:YOUR_PASSWORD@127.0.0.1:5432/absense
UPLOAD_DIR=/var/lib/absense/uploads
UPLOAD_PUBLIC_URL_PREFIX=https://absense.knust.edu.gh/uploads
DB_POOL_SIZE=10
DB_MAX_OVERFLOW=10
CORS_ALLOW_ORIGINS=https://absense.knust.edu.gh
FACE_VERIFICATION_ENABLED=true
FACE_WORKER_POLL_SECONDS=1.0
```

**Password with `@` in it:** URL-encode `@` as `%40` in `DATABASE_URL` only.  
Example: password `Coe@attend26` → `Coe%40attend26` in the URL:

```env
DATABASE_URL=postgresql+psycopg2://absense:Coe%40attend26@127.0.0.1:5432/absense
```

**Test the database URL:**

```bash
cd ~/attendance-app/backend && source .venv/bin/activate
python -c "from app.db.session import engine; engine.connect(); print('Database OK')"
```

Lock down permissions (only `absense` should read secrets):

```bash
chmod 600 ~/attendance-app/backend/.env
```

### 5. Create empty database schema (fresh)

**Do not use `alembic upgrade head` on a brand-new database.** The old migration chain never creates base tables (`users`, etc.) — it only runs `ALTER` steps. Use the init script instead:

```bash
cd ~/attendance-app/backend
source .venv/bin/activate
python scripts/init_fresh_db.py
```

That creates all tables from the current models and runs `alembic stamp head`.

If you already ran `alembic upgrade head` and it failed partway (e.g. `relation "users" does not exist`), reset the database and start again:

```bash
sudo -u postgres psql <<'SQL'
DROP DATABASE IF EXISTS absense;
CREATE DATABASE absense OWNER absense;
GRANT ALL PRIVILEGES ON DATABASE absense TO absense;
SQL

cd ~/attendance-app/backend && source .venv/bin/activate
python scripts/init_fresh_db.py
```

If you see **“Multiple head revisions”**, pull the latest code (merge migration `d1e2f3a4b5c6`), then run `python scripts/init_fresh_db.py` again.

Create the first admin user (pick one):

```bash
# Production admin (edit scripts/create_admin.py first if you want different email/password)
python scripts/create_admin.py

# Or full reset script (wipes DB + uploads — only if DB is empty / you want to start over)
# python scripts/reset_production.py --confirm
```

Students and lecturers then **register again** through the app (or you add users via admin later). Old Supabase accounts are **not** copied.

### 6. Systemd units

```bash
sudo cp ~/attendance-app/deploy/absense-backend.service /etc/systemd/system/
sudo cp ~/attendance-app/deploy/absense-face-worker.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable absense-backend absense-face-worker
```

Update your existing `absense-backend.service` `ExecStart` to match `deploy/absense-backend.service` (`--timeout 120`).

### 7. Nginx

**Admin login HTTP 502** almost always means `/api/` is not proxied to the backend (requests hit Next.js or a dead upstream). Use the full example:

```bash
# Compare with your live config; you must have location /api/ → 127.0.0.1:8000
cat ~/attendance-app/deploy/nginx-absense.conf
```

Minimum required inside your HTTPS `server` block:

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:8000/api/;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 120s;
}
```

Also add uploads from `deploy/nginx-uploads-snippet.conf`, then:

```bash
curl -sf http://127.0.0.1:8000/api/v1/health
curl -sf https://absense.knust.edu.gh/api/v1/health
sudo nginx -t && sudo systemctl reload nginx
```

### 8. Rebuild web (after pull)

The web app calls `/api/v1` on the same host by default (no `NEXT_PUBLIC_API_URL` required). Rebuild so Next rewrites and `api.ts` changes apply:

```bash
cd ~/attendance-app/web
npm run build
sudo systemctl restart absense-web
```

---

## Optional: restore old data from Supabase

Only if you later need historical data. **Skip this for a fresh start.**

<details>
<summary>Supabase pg_dump / restore (click to expand)</summary>

On your laptop:

```bash
pg_dump "postgresql://postgres.xxx:PASSWORD@aws-1-eu-west-3.pooler.supabase.com:5432/postgres" \
  --no-owner --no-acl -Fc -f absense_backup.dump
scp absense_backup.dump absense@coe-attendance:~/
```

On the server:

```bash
pg_restore -d absense -U absense --no-owner --no-acl ~/absense_backup.dump
```

Copy files from Supabase Storage into `/var/lib/absense/uploads/` with the same paths (`faces/...`, `selfies/...`).

</details>

---

## Redeploy after code changes

```bash
cd ~/attendance-app
git pull

cd backend
source .venv/bin/activate
# After schema changes in a release: only if DB already exists and was set up with init_fresh_db
alembic upgrade head

sudo systemctl restart absense-face-worker
sudo systemctl restart absense-backend

cd ../web
npm run build
sudo systemctl restart absense-web
```

### Logs

```bash
sudo journalctl -u absense-backend -f
sudo journalctl -u absense-face-worker -f
sudo journalctl -u absense-web -f
```

### Health checks

```bash
curl -s http://127.0.0.1:8000/api/v1/health
# Face worker queue (optional): pending jobs should drain after attendance
sudo -u postgres psql -d absense -c "SELECT status, count(*) FROM face_verification_jobs GROUP BY status;"
```

---

## Test on your phone (before class)

1. Deploy using the steps above; confirm all three services are **active**:
   ```bash
   systemctl is-active absense-backend absense-face-worker absense-web
   ```

2. **Lecturer (web)** — phone browser: `https://absense.knust.edu.gh`
   - Log in — should complete in a few seconds (not spin forever).
   - Open dashboard — loads without long wait.

3. **Student (mobile app)** — ensure `mobile/constants/config.ts` points to:
   ```ts
   BASE_URL: 'https://absense.knust.edu.gh/api/v1'
   ```
   - Log in as a test student.
   - Profile / device status should load quickly.
   - Enroll reference face once (saved under `/var/lib/absense/uploads/faces/`).
   - Join a test session: scan QR → selfie → submit.
   - Expect **“Attendance Marked!”** within a few seconds.
   - Face verification may take 30–120s in the worker; record can show **flagged** briefly then stay confirmed if face matches.

4. **Verify worker processed jobs**:
   ```bash
   sudo journalctl -u absense-face-worker --since "5 min ago" --no-pager
   ls -la /var/lib/absense/uploads/selfies/ | tail
   ```

---

## Class-day checklist (~400 students)

- [ ] `absense-face-worker` is **running** (`systemctl status absense-face-worker`)
- [ ] `free -h` shows at least **1.5GB available** before class (restart services if swap is high)
- [ ] Lecturer opens QR **before** students submit
- [ ] Students enroll reference face **before** class (not during the rush)
- [ ] After class, spot-check flagged records in lecturer dashboard

During peak load, API stays fast; face verification queues in the worker (one at a time). Attendance is recorded immediately; face flags may appear up to a few minutes later for mismatches.

---

## Backend not responding

If `curl -s http://127.0.0.1:8000/api/v1/health` prints **nothing** (not `{"status":"ok"}`), Gunicorn is not running:

```bash
systemctl status absense-backend
sudo journalctl -u absense-backend -n 50 --no-pager
```

**Common fixes:**

1. **Upload directory permissions** (logs show `Permission denied: '/var/lib/absense'`):
   ```bash
   sudo mkdir -p /var/lib/absense/uploads
   sudo chown -R absense:absense /var/lib/absense
   ```

2. **Pull latest code** — older builds mounted `UPLOAD_PUBLIC_URL_PREFIX` as a full URL and could prevent the app from starting. After `git pull`, restart:
   ```bash
   sudo systemctl restart absense-backend
   curl -s http://127.0.0.1:8000/api/v1/health
   # expect: {"status":"ok"}
   ```

3. **Nginx** — only after local health works:
   ```bash
   curl -s https://absense.knust.edu.gh/api/v1/health
   ```
   If local works but HTTPS is 502, add `location /api/` from `deploy/nginx-absense.conf` and `sudo nginx -t && sudo systemctl reload nginx`.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| **HTTP 502 on login** | Backend not listening on 8000 or nginx missing `/api/` | See **Backend not responding** below |
| Empty `curl` to `:8000/health` | Gunicorn crashed at startup | `journalctl -u absense-backend -n 40`; fix upload dir permissions and pull latest `main.py` mount fix |
| Login spins forever | API saturated or DB unreachable | Check `journalctl -u absense-backend`; verify `DATABASE_URL` is `127.0.0.1` |
| “Invalid selfie type” | MIME from camera | Already fixed in app; redeploy mobile if needed |
| Selfies 404 | Nginx `/uploads` not configured | Add nginx snippet; check `UPLOAD_PUBLIC_URL_PREFIX` |
| All attendance flagged for face | Worker not running | `sudo systemctl start absense-face-worker` |
| High swap / slow server | DeepFace in API workers | Ensure only **face-worker** runs ML; restart backend |
