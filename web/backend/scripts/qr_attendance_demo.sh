#!/usr/bin/env bash
set -euo pipefail

BASE="http://localhost:8000/api/v1"
LECTURER_EMAIL="lecturer@absense.com"
LECTURER_PASS="lecturer123"
STUDENT_EMAIL="student@absense.com"
STUDENT_PASS="student123"

die(){ echo "[ERROR] $*" >&2; exit 1; }

echo "== QR + Attendance Demo =="

echo "Checking backend..."
curl -sf "$BASE/health" >/dev/null || die "Backend not running"

echo "Login as lecturer..."
LECT_TOKEN=$(curl -sSf -X POST "$BASE/auth/login" -H "Content-Type: application/x-www-form-urlencoded" -d "username=$LECTURER_EMAIL&password=$LECTURER_PASS" | grep -o '"access_token":"[^"]*"' | cut -d '"' -f4)
[ -n "$LECT_TOKEN" ] || die "Lecturer login failed"

COURSE_ID=${COURSE_ID:-1}
DURATION=${DURATION_MINUTES:-15}

echo "Create session for course_id=$COURSE_ID..."
SESSION_ID=$(curl -sSf -X POST "$BASE/lecturer/sessions?course_id=$COURSE_ID&duration_minutes=$DURATION" -H "Authorization: Bearer $LECT_TOKEN" | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)
[ -n "$SESSION_ID" ] || die "Failed to create session"
echo "Session ID: $SESSION_ID"

echo "Rotate QR (generate nonce)..."
curl -sSf -X POST "$BASE/lecturer/sessions/$SESSION_ID/qr/rotate?ttl_seconds=60" -H "Authorization: Bearer $LECT_TOKEN" >/dev/null

echo "Fetch display data..."
DISPLAY_JSON=$(curl -sSf "$BASE/lecturer/qr/$SESSION_ID/display" -H "Authorization: Bearer $LECT_TOKEN")
echo "$DISPLAY_JSON" | python3 -m json.tool | sed -e 's/^/  /'

QR_PAYLOAD=$(echo "$DISPLAY_JSON" | python3 -c 'import sys, json; d=json.load(sys.stdin); print(json.dumps(d["qr_payload"]))')
QR_SESSION_ID=$(echo "$DISPLAY_JSON" | grep -o '"session_id":[0-9]*' | head -1 | cut -d: -f2)
QR_NONCE=$(echo "$DISPLAY_JSON" | grep -o '"nonce":"[^"]*"' | head -1 | cut -d '"' -f4)

echo "Login as student..."
STU_TOKEN=$(curl -sSf -X POST "$BASE/auth/login" -H "Content-Type: application/x-www-form-urlencoded" -d "username=$STUDENT_EMAIL&password=$STUDENT_PASS" | grep -o '"access_token":"[^"]*"' | cut -d '"' -f4)
[ -n "$STU_TOKEN" ] || die "Student login failed"

IMEI=${IMEI:-356938035643809}
LAT=${LAT:-0}
LON=${LON:-0}
SELFIE_PATH=${SELFIE_PATH:-test_images/verify_same.jpg}
[ -f "$SELFIE_PATH" ] || die "Selfie file not found: $SELFIE_PATH"

echo "Submit attendance with selfie..."
curl -sS -w "\nHTTP:%{http_code}\n" -H "Authorization: Bearer $STU_TOKEN" \
  -F "qr_session_id=$QR_SESSION_ID" \
  -F "qr_nonce=$QR_NONCE" \
  -F "latitude=$LAT" \
  -F "longitude=$LON" \
  -F "imei=$IMEI" \
  -F "selfie=@$SELFIE_PATH" \
  "$BASE/student/attendance" | python3 -m json.tool || true

echo "== Done =="


