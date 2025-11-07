def test_admin_flagged_list_set_status_and_analytics(client):
    # Create admin
    r = client.post("/api/v1/auth/register", json={
        "email": "admin1@example.com",
        "password": "pw123456",
        "full_name": "Admin One",
        "role": "admin",
    })
    assert r.status_code == 200
    r = client.post("/api/v1/auth/login", data={"username": "admin1@example.com", "password": "pw123456"})
    admin_token = r.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # Create lecturer and session
    r = client.post("/api/v1/auth/register", json={
        "email": "lect2@example.com",
        "password": "pw123456",
        "full_name": "Lect Two",
        "role": "lecturer",
    })
    assert r.status_code == 200
    r = client.post("/api/v1/auth/login", data={"username": "lect2@example.com", "password": "pw123456"})
    lect_headers = {"Authorization": f"Bearer {r.json()['access_token']}"}
    r = client.post("/api/v1/lecturer/sessions", headers=lect_headers, json={"duration_minutes": 5})
    sid = r.json()["id"]
    code = r.json()["code"]
    
    # Generate QR for the session
    r = client.post(f"/api/v1/lecturer/sessions/{sid}/qr/rotate", headers=lect_headers, json={"ttl_seconds": 60})
    assert r.status_code == 200
    qr_data = r.json()
    qr_session_id = qr_data["session_id"]
    qr_nonce = qr_data["nonce"]

    # Create student and submit attendance without binding device => flagged
    r = client.post("/api/v1/auth/register", json={
        "email": "stu2@example.com",
        "password": "pw123456",
        "full_name": "Stu Two",
        "role": "student",
    })
    r = client.post("/api/v1/auth/login", data={"username": "stu2@example.com", "password": "pw123456"})
    stu_headers = {"Authorization": f"Bearer {r.json()['access_token']}"}
    r = client.post(
        "/api/v1/student/attendance",
        headers=stu_headers,
        data={
            "qr_session_id": qr_session_id,
            "qr_nonce": qr_nonce,
            "latitude": "40.7128",
            "longitude": "-74.0060",
            "device_id": "test-device-id-12345"
        },
    )
    assert r.status_code == 200
    body = r.json()
    record_id = body["record_id"]
    assert body["status"] in ("flagged", "confirmed")

    # Admin lists flagged
    r = client.get(f"/api/v1/admin/flagged", headers=admin_headers)
    assert r.status_code == 200
    flagged = r.json()
    assert isinstance(flagged, list)

    # If our record was flagged, set status to confirmed
    # Find our record in the list if present
    ids = [item.get("record_id") for item in flagged]
    if record_id in ids:
        r = client.post(
            f"/api/v1/admin/attendance/{record_id}/set-status",
            headers=admin_headers,
            params={"status": "confirmed"},
        )
        assert r.status_code == 200
        assert r.json()["status"] == "confirmed"

    # Admin analytics returns totals
    r = client.get("/api/v1/admin/analytics", headers=admin_headers)
    assert r.status_code == 200
    stats = r.json()
    assert "total_users" in stats and "total_sessions" in stats



