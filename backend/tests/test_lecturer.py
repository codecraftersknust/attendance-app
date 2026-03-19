
def test_lecturer_create_and_list(client):
    # Create lecturer
    r = client.post("/api/v1/auth/register", json={
        "email": "lec_unique@knust.edu.gh",
        "password": "pass1234",
        "full_name": "Test Lecturer",
        "role": "lecturer",
        "user_id": "12344321",
    })
    assert r.status_code == 200, r.text

    r = client.post("/api/v1/auth/login", data={"username": "lec_unique@knust.edu.gh", "password": "pass1234"})
    assert r.status_code == 200, r.text
    token = r.json()["access_token"]
    
    # Create an admin to create a course
    r = client.post("/api/v1/auth/register", json={
        "email": "admin_testlec@knust.edu.gh", "password": "pass1234", "full_name": "Admin", "role": "admin"
    })
    assert r.status_code == 200, r.text
    r = client.post("/api/v1/auth/login", data={"username": "admin_testlec@knust.edu.gh", "password": "pass1234"})
    assert r.status_code == 200, r.text
    admin_token = r.json()["access_token"]
    
    # Create course
    r = client.post("/api/v1/admin/courses", headers={"Authorization": f"Bearer {admin_token}"}, params={
        "code": "TEST303", "name": "Test", "semester": "Sem 1", "level": 100, "programmes": "Computer Engineering"
    })
    course_id = r.json()["id"]
    
    # Claim course as lecturer
    client.post(f"/api/v1/lecturer/courses/{course_id}/claim", headers={"Authorization": f"Bearer {token}"})

    r = client.post("/api/v1/lecturer/sessions", headers={"Authorization": f"Bearer {token}"}, params={"course_id": course_id, "duration_minutes": 15})
    assert r.status_code == 200, r.text
    r = client.get("/api/v1/lecturer/sessions", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    assert isinstance(r.json(), list)
