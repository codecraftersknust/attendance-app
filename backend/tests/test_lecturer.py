
def ensure_lecturer():
    from app.models.user import UserRole, User
    from app.services.security import get_password_hash
    from app.db.session import SessionLocal
    db = SessionLocal()
    try:
        lec = db.query(User).filter(User.role == UserRole.lecturer).first()
        if not lec:
            lec = User(email="lec@example.com", hashed_password=get_password_hash("pass"), role=UserRole.lecturer)
            db.add(lec)
            db.commit()
    finally:
        db.close()


def test_lecturer_create_and_list(client):
    ensure_lecturer()
    r = client.post("/api/v1/auth/login", data={"username": "lec@example.com", "password": "pass"})
    assert r.status_code == 200, r.text
    token = r.json()["access_token"]
    r = client.post("/api/v1/lecturer/sessions", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200, r.text
    r = client.get("/api/v1/lecturer/sessions", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    assert isinstance(r.json(), list)
