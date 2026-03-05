
def test_register_login_me(client):
    r = client.post("/api/v1/auth/register", json={
        "email": "user1@st.knust.edu.gh",
        "password": "secret123",
        "full_name": "User One",
        "role": "student",
        "user_id": "12345678",
        "level": 100,
        "programme": "Computer Engineering",
    })
    assert r.status_code == 200, r.text
    r = client.post("/api/v1/auth/login", data={"username": "user1@st.knust.edu.gh", "password": "secret123"})
    assert r.status_code == 200
    token = r.json()["access_token"]
    r = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    me = r.json()
    assert me["email"] == "user1@st.knust.edu.gh"
