"""Tests for session duration/countdown and programme-scoped sessions.

Covers two bug fixes:
1. Session duration: a 5-minute session must actually last 5 minutes and the
   API must expose server-computed ``time_remaining_seconds`` so clients
   don't depend on their own clocks.
2. Programme scoping: when a course is shared by multiple programmes, a
   session created for one programme must not be visible to students of the
   other programmes.
"""
from datetime import datetime


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


def _setup_shared_course(client):
    """Course taken by two programmes, claimed by one lecturer, two students enrolled."""
    admin = _register_and_login(client, "admin@knust.edu.gh", "admin")
    lecturer = _register_and_login(client, "lect@knust.edu.gh", "lecturer", user_id="1234567")
    comp = _register_and_login(
        client, "comp@st.knust.edu.gh", "student",
        user_id="20890001", level=300, programme="Computer Engineering",
    )
    telecom = _register_and_login(
        client, "tele@st.knust.edu.gh", "student",
        user_id="20890002", level=300, programme="Telecommunication Engineering",
    )

    r = client.post(
        "/api/v1/admin/courses",
        params={
            "code": "EE301",
            "name": "EM Fields",
            "semester": "1st Semester",
            "level": 300,
            "programmes": "Computer Engineering,Telecommunication Engineering",
        },
        headers=admin,
    )
    assert r.status_code == 200, r.text
    course_id = r.json()["id"]

    r = client.post(f"/api/v1/lecturer/courses/{course_id}/claim", headers=lecturer)
    assert r.status_code == 200, r.text

    for student in (comp, telecom):
        r = client.post(f"/api/v1/student/courses/{course_id}/enroll", headers=student)
        assert r.status_code == 200, r.text

    return course_id, lecturer, comp, telecom


def test_session_duration_and_time_remaining(client):
    course_id, lecturer, comp, _ = _setup_shared_course(client)

    r = client.post(
        "/api/v1/lecturer/sessions",
        params={"course_id": course_id, "duration_minutes": 5},
        headers=lecturer,
    )
    assert r.status_code == 200, r.text
    data = r.json()

    # Duration must be exactly 5 minutes
    assert data["duration_minutes"] == 5
    assert data["time_remaining_seconds"] == 300
    starts = datetime.fromisoformat(data["starts_at"])
    ends = datetime.fromisoformat(data["ends_at"])
    assert (ends - starts).total_seconds() == 300
    # Timestamps must carry an explicit timezone so JS clients parse them as UTC
    assert starts.tzinfo is not None
    assert ends.tzinfo is not None

    # Student-facing active session carries a server-computed countdown
    r = client.get("/api/v1/student/sessions/active", headers=comp)
    assert r.status_code == 200, r.text
    sessions = r.json()
    assert len(sessions) == 1
    remaining = sessions[0]["time_remaining_seconds"]
    assert remaining is not None and 290 <= remaining <= 300

    # Lecturer QR display exposes the session countdown too
    r = client.get(f"/api/v1/lecturer/qr/{data['id']}/display", headers=lecturer)
    assert r.status_code == 200, r.text
    qr = r.json()
    assert qr["session_time_remaining_seconds"] is not None
    assert 290 <= qr["session_time_remaining_seconds"] <= 300


def test_invalid_duration_rejected(client):
    course_id, lecturer, _, _ = _setup_shared_course(client)
    r = client.post(
        "/api/v1/lecturer/sessions",
        params={"course_id": course_id, "duration_minutes": 0},
        headers=lecturer,
    )
    assert r.status_code == 400


def test_programme_scoped_session_visibility(client):
    course_id, lecturer, comp, telecom = _setup_shared_course(client)

    # Session for the Computer Engineering class only
    r = client.post(
        "/api/v1/lecturer/sessions",
        params={
            "course_id": course_id,
            "duration_minutes": 10,
            "programme": "Computer Engineering",
        },
        headers=lecturer,
    )
    assert r.status_code == 200, r.text
    assert r.json()["programme"] == "Computer Engineering"

    # Computer Engineering student sees it
    r = client.get("/api/v1/student/sessions/active", headers=comp)
    assert len(r.json()) == 1
    assert r.json()[0]["programme"] == "Computer Engineering"

    # Telecom student does NOT see it
    r = client.get("/api/v1/student/sessions/active", headers=telecom)
    assert r.json() == []

    # An open session (no programme) is visible to both
    r = client.post(
        "/api/v1/lecturer/sessions",
        params={"course_id": course_id, "duration_minutes": 10},
        headers=lecturer,
    )
    assert r.status_code == 200, r.text
    assert len(client.get("/api/v1/student/sessions/active", headers=comp).json()) == 2
    assert len(client.get("/api/v1/student/sessions/active", headers=telecom).json()) == 1


def test_programme_must_belong_to_course(client):
    course_id, lecturer, _, _ = _setup_shared_course(client)
    r = client.post(
        "/api/v1/lecturer/sessions",
        params={
            "course_id": course_id,
            "duration_minutes": 10,
            "programme": "Mechanical Engineering",
        },
        headers=lecturer,
    )
    assert r.status_code == 400
