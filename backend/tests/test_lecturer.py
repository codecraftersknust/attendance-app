
def test_lecturer_create_and_list(client):
    # Create lecturer
    r = client.post("/api/v1/auth/register", json={
        "email": "lec@knust.edu.gh",
        "password": "pass1234",
        "full_name": "Test Lecturer",
        "role": "lecturer",
        "user_id": "12345678",
    })
    assert r.status_code == 200, r.text

    r = client.post("/api/v1/auth/login", data={"username": "lec@knust.edu.gh", "password": "pass1234"})
    assert r.status_code == 200, r.text
    token = r.json()["access_token"]
    r = client.post("/api/v1/lecturer/sessions", headers={"Authorization": f"Bearer {token}"}, json={"duration_minutes": 15})
    assert r.status_code == 200, r.text
    r = client.get("/api/v1/lecturer/sessions", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    assert isinstance(r.json(), list)
