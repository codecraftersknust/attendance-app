def test_refresh_flow(client):
    # register
    r = client.post("/api/v1/auth/register", json={
        "email": "r1@example.com",
        "password": "pw123456",
        "full_name": "R One",
        "role": "student",
    })
    assert r.status_code == 200

    # login
    r = client.post("/api/v1/auth/login", data={"username": "r1@example.com", "password": "pw123456"})
    assert r.status_code == 200
    data = r.json()
    assert "refresh_token" in data

    # refresh
    headers = {"Authorization": f"Bearer {data['refresh_token']}"}
    r = client.post("/api/v1/auth/refresh", headers=headers)
    assert r.status_code == 200
    assert "access_token" in r.json()

