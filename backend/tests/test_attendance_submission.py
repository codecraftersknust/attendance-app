"""Coverage for the attendance submission path.

Covers: QR nonce/expiry validation, geofence confirmed/flagged outcomes,
device binding, duplicate (idempotent) submissions, and enrollment checks.

Face verification is disabled via env so no selfie/ML is needed; the
geofence + device logic is independent of it.
"""
import time

import pytest


@pytest.fixture(autouse=True)
def _disable_face_verification(monkeypatch):
    monkeypatch.setenv("FACE_VERIFICATION_ENABLED", "false")


def _register_and_login(client, email, role, user_id=None, level=None, programme=None):
    payload = {
        "email": email,
        "password": "pw123456",
        "full_name": email.split("@")[0],
        "role": role,
    }
    if user_id:
        payload["user_id"] = user_id
    if level:
        payload["level"] = level
    if programme:
        payload["programme"] = programme
    r = client.post("/api/v1/auth/register", json=payload)
    assert r.status_code == 200, r.text
    r = client.post("/api/v1/auth/login", data={"username": email, "password": "pw123456"})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


# Class location: KNUST College of Engineering
CLASS_LAT, CLASS_LNG = 6.67338, -1.56561


def _setup(client, with_geofence=True):
    """Admin + course + lecturer + enrolled student with a bound device."""
    admin = _register_and_login(client, "admin@knust.edu.gh", "admin")
    lecturer = _register_and_login(client, "lect@knust.edu.gh", "lecturer", user_id="1112223")
    student = _register_and_login(
        client, "stud@st.knust.edu.gh", "student",
        user_id="20990001", level=200, programme="Computer Engineering",
    )

    r = client.post("/api/v1/admin/courses", headers=admin, json={
        "code": "CE200", "name": "Data Structures", "semester": "1st Semester",
        "level": 200, "programmes": ["Computer Engineering"],
    })
    assert r.status_code == 200, r.text
    course_id = r.json()["id"]

    assert client.post(f"/api/v1/lecturer/courses/{course_id}/claim", headers=lecturer).status_code == 200
    assert client.post(f"/api/v1/student/courses/{course_id}/enroll", headers=student).status_code == 200

    session_payload = {"course_id": course_id, "duration_minutes": 10}
    if with_geofence:
        session_payload.update({
            "latitude": CLASS_LAT,
            "longitude": CLASS_LNG,
            "geofence_radius_m": 100,
        })
    r = client.post("/api/v1/lecturer/sessions", headers=lecturer, json=session_payload)
    assert r.status_code == 200, r.text
    session_id = r.json()["id"]

    # Bind the student's device (JSON body)
    r = client.post("/api/v1/student/device/bind", headers=student, json={"device_id": "device-abc-123"})
    assert r.status_code == 200, r.text

    # Get a fresh QR nonce
    r = client.post(f"/api/v1/lecturer/sessions/{session_id}/qr/rotate", headers=lecturer, params={"ttl_seconds": 60})
    assert r.status_code == 200, r.text
    nonce = r.json()["nonce"]

    return course_id, session_id, nonce, lecturer, student


def _submit(client, student, session_id, nonce, lat=CLASS_LAT, lng=CLASS_LNG, device="device-abc-123"):
    return client.post(
        "/api/v1/student/attendance",
        headers=student,
        data={
            "qr_session_id": session_id,
            "qr_nonce": nonce,
            "latitude": str(lat),
            "longitude": str(lng),
            "device_id": device,
        },
    )


def test_confirmed_when_inside_geofence_with_bound_device(client):
    _, session_id, nonce, _, student = _setup(client)
    r = _submit(client, student, session_id, nonce)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["status"] == "confirmed"
    assert body["within_geofence"] is True


def test_flagged_when_outside_geofence(client):
    _, session_id, nonce, _, student = _setup(client)
    # ~5km away from the class location
    r = _submit(client, student, session_id, nonce, lat=CLASS_LAT + 0.05, lng=CLASS_LNG)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["status"] == "flagged"
    assert body["within_geofence"] is False
    assert body["distance_m"] > 100


def test_flagged_when_device_not_bound(client):
    _, session_id, nonce, _, student = _setup(client)
    r = _submit(client, student, session_id, nonce, device="someone-elses-device")
    assert r.status_code == 200, r.text
    assert r.json()["status"] == "flagged"


def test_duplicate_submission_is_idempotent(client):
    _, session_id, nonce, _, student = _setup(client)
    first = _submit(client, student, session_id, nonce)
    assert first.status_code == 200
    record_id = first.json()["record_id"]

    second = _submit(client, student, session_id, nonce)
    assert second.status_code == 200
    assert second.json()["already_marked"] is True
    assert second.json()["record_id"] == record_id


def test_invalid_nonce_rejected(client):
    _, session_id, _, _, student = _setup(client)
    r = _submit(client, student, session_id, "not-the-real-nonce")
    assert r.status_code == 400
    assert "Invalid QR" in r.json()["detail"]


def test_expired_qr_rejected(client):
    _, session_id, _, lecturer, student = _setup(client)
    # Rotate with a zero TTL so the code is already expired
    r = client.post(
        f"/api/v1/lecturer/sessions/{session_id}/qr/rotate",
        headers=lecturer,
        params={"ttl_seconds": 0},
    )
    assert r.status_code == 200
    expired_nonce = r.json()["nonce"]
    time.sleep(1.1)

    r = _submit(client, student, session_id, expired_nonce)
    assert r.status_code == 400
    assert "expired" in r.json()["detail"].lower()


def test_not_enrolled_rejected(client):
    _, session_id, nonce, _, _ = _setup(client)
    outsider = _register_and_login(
        client, "other@st.knust.edu.gh", "student",
        user_id="20990002", level=200, programme="Computer Engineering",
    )
    r = _submit(client, outsider, session_id, nonce)
    assert r.status_code == 403
    assert "not enrolled" in r.json()["detail"].lower()
