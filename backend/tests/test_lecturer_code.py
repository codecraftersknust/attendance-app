def test_regenerate_and_expire(client):
    # Create lecturer
    r = client.post("/api/v1/auth/register", json={
        "email": "lect1@example.com",
        "password": "pw123456",
        "full_name": "Lect One",
        "role": "lecturer",
    })
    assert r.status_code == 200

    # Login
    r = client.post("/api/v1/auth/login", data={"username": "lect1@example.com", "password": "pw123456"})
    assert r.status_code == 200
    token = r.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create session
    r = client.post("/api/v1/lecturer/sessions", headers=headers, json={"duration_minutes": 5})
    assert r.status_code == 200
    sid = r.json()["id"]
    first_code = r.json()["code"]

    # Regenerate
    r = client.post(f"/api/v1/lecturer/sessions/{sid}/regenerate", headers=headers)
    assert r.status_code == 200
    new_code = r.json()["code"]
    assert new_code != first_code

    # Expire
    r = client.post(f"/api/v1/lecturer/sessions/{sid}/expire", headers=headers)
    assert r.status_code == 200
    assert r.json()["is_active"] is False

