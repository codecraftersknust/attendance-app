import io


def test_enroll_and_verify_face_disabled(client, monkeypatch):
    # Disable verification so DeepFace isn't required for tests
    monkeypatch.setenv("FACE_VERIFICATION_ENABLED", "false")

    # Register and login as student
    r = client.post("/api/v1/auth/register", json={
        "email": "s1@st.knust.edu.gh",
        "password": "pw123456",
        "full_name": "S One",
        "role": "student",
        "user_id": "11111111",
        "level": 100,
        "programme": "Computer Engineering",
    })
    assert r.status_code == 200

    r = client.post("/api/v1/auth/login", data={
        "username": "s1@st.knust.edu.gh",
        "password": "pw123456"
    })
    assert r.status_code == 200
    token = r.json()["access_token"]

    headers = {"Authorization": f"Bearer {token}"}

    # Enroll face
    img_bytes = io.BytesIO(b"fakeimagecontent")
    files = {"file": ("selfie.jpg", img_bytes, "image/jpeg")}
    r = client.post("/api/v1/student/enroll-face", headers=headers, files=files)
    assert r.status_code == 200
    assert r.json()["message"].lower().startswith("reference face enrolled")

    # Verify face
    img_bytes2 = io.BytesIO(b"fakeimagecontent2")
    files = {"file": ("live.jpg", img_bytes2, "image/jpeg")}
    r = client.post("/api/v1/student/verify-face", headers=headers, files=files)
    assert r.status_code == 200
    body = r.json()
    assert "verified" in body

