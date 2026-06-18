"""Security hardening tests: admin registration lockdown, programme
validation against the canonical list, and login rate limiting."""


def _register(client, **overrides):
    payload = {
        "email": "user@st.knust.edu.gh",
        "password": "pw123456",
        "full_name": "Some User",
        "role": "student",
        "user_id": "20880001",
        "level": 100,
        "programme": "Computer Engineering",
    }
    payload.update(overrides)
    return client.post("/api/v1/auth/register", json=payload)


def test_admin_registration_is_bootstrap_only(client):
    # First admin (bootstrap) is allowed
    r = _register(client, email="admin1@knust.edu.gh", role="admin", user_id=None, level=None, programme=None)
    assert r.status_code == 200, r.text

    # Once an admin exists, self-registration as admin is blocked
    r = _register(client, email="admin2@knust.edu.gh", role="admin", user_id=None, level=None, programme=None)
    assert r.status_code == 403
    assert "disabled" in r.json()["detail"].lower()


def test_student_registration_rejects_unknown_programme(client):
    r = _register(client, programme="Computer Enginering")  # typo
    assert r.status_code == 400
    assert "programme" in r.json()["detail"].lower()

    # Correct spelling works
    r = _register(client, programme="Computer Engineering")
    assert r.status_code == 200, r.text


def test_programmes_list_is_public(client):
    r = client.get("/api/v1/auth/programmes")
    assert r.status_code == 200
    names = r.json()
    assert "Computer Engineering" in names
    assert "Telecommunications Engineering" in names


def test_profile_update_rejects_unknown_programme(client):
    assert _register(client).status_code == 200
    r = client.post("/api/v1/auth/login", data={"username": "user@st.knust.edu.gh", "password": "pw123456"})
    headers = {"Authorization": f"Bearer {r.json()['access_token']}"}

    r = client.put("/api/v1/auth/profile", headers=headers, json={"programme": "Wizardry"})
    assert r.status_code == 400

    r = client.put("/api/v1/auth/profile", headers=headers, json={"programme": "Civil Engineering"})
    assert r.status_code == 200
    assert r.json()["programme"] == "Civil Engineering"


def test_login_rate_limited(client, monkeypatch):
    monkeypatch.setenv("RATE_LIMIT_ENABLED", "true")
    from app.services.rate_limit import rate_limiter
    rate_limiter.reset()

    # 10 attempts allowed per minute, the 11th is rejected
    for _ in range(10):
        r = client.post("/api/v1/auth/login", data={"username": "ghost@st.knust.edu.gh", "password": "wrong1234"})
        assert r.status_code == 401
    r = client.post("/api/v1/auth/login", data={"username": "ghost@st.knust.edu.gh", "password": "wrong1234"})
    assert r.status_code == 429

    rate_limiter.reset()
