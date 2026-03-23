def test_regenerate_and_expire(client):
    # Create lecturer
    r = client.post("/api/v1/auth/register", json={
        "email": "lect_code_test@knust.edu.gh",
        "password": "pw123456",
        "full_name": "Lect One",
        "role": "lecturer",
        "user_id": "88887777",
    })
    assert r.status_code == 200

    # Login
    r = client.post("/api/v1/auth/login", data={"username": "lect_code_test@knust.edu.gh", "password": "pw123456"})
    assert r.status_code == 200
    token = r.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create an admin and a course
    r = client.post("/api/v1/auth/register", json={
        "email": "admin_testcode@knust.edu.gh", "password": "pass1234", "full_name": "Admin", "role": "admin"
    })
    assert r.status_code == 200, r.text
    r = client.post("/api/v1/auth/login", data={"username": "admin_testcode@knust.edu.gh", "password": "pass1234"})
    assert r.status_code == 200, r.text
    admin_token = r.json()["access_token"]
    
    r = client.post("/api/v1/admin/courses", headers={"Authorization": f"Bearer {admin_token}"}, params={
        "code": "TEST111", "name": "Test", "semester": "Sem 1", "level": 100, "programmes": "Computer Engineering"
    })
    course_id = r.json()["id"]
    
    # Claim course
    client.post(f"/api/v1/lecturer/courses/{course_id}/claim", headers=headers)

    # Create session
    r = client.post("/api/v1/lecturer/sessions", headers=headers, params={"course_id": course_id, "duration_minutes": 5})
    assert r.status_code == 200
    sid = r.json()["id"]
    first_code = r.json()["code"]

    # Regenerate
    r = client.post(f"/api/v1/lecturer/sessions/{sid}/regenerate", headers=headers)
    assert r.status_code == 200
    new_code = r.json()["code"]
    assert new_code != first_code

    # Close session (not expire)
    r = client.post(f"/api/v1/lecturer/sessions/{sid}/close", headers=headers)
    assert r.status_code == 200
    assert r.json()["is_active"] is False

