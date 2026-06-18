"""Account deletion removes user, devices, and related rows without ORM FK errors."""


def _register(client, email, **extra):
    payload = {
        "email": email,
        "password": "pw123456",
        "full_name": "Test User",
        "role": "student",
        "user_id": extra.pop("user_id", "20991234"),
        "level": 200,
        "programme": "Computer Engineering",
    }
    payload.update(extra)
    r = client.post("/api/v1/auth/register", json=payload)
    assert r.status_code == 200, r.text
    r = client.post("/api/v1/auth/login", data={"username": email, "password": "pw123456"})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


def test_delete_account_removes_user_and_device(client):
    headers = _register(client, "delete-me@st.knust.edu.gh", user_id="20991235")

    r = client.post(
        "/api/v1/student/device/bind",
        headers=headers,
        json={"device_id": "delete-test-device-001"},
    )
    assert r.status_code == 200, r.text

    r = client.delete("/api/v1/auth/me", headers=headers)
    assert r.status_code == 200, r.text
    assert r.json()["message"].lower().startswith("account deleted")

    r = client.get("/api/v1/auth/me", headers=headers)
    assert r.status_code == 401
