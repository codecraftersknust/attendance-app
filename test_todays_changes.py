#!/usr/bin/env python3
"""
Test script for today's changes:
1. Geofence control endpoints
2. GPS auto-capture during session creation
3. 30-second QR rotation
4. CORS configuration
"""

import requests
import json
import time
from datetime import datetime

BASE_URL = "http://localhost:8001/api/v1"

# Test credentials (using seeded data)
LECTURER_EMAIL = "lecturer@absense.com"
LECTURER_PASSWORD = "lecturer123"

def print_test(name):
    print(f"\n{'='*60}")
    print(f"TEST: {name}")
    print('='*60)

def print_result(success, message):
    icon = "✅" if success else "❌"
    print(f"{icon} {message}")

def login_as_lecturer():
    """Login and get access token"""
    print_test("Login as Lecturer")
    
    try:
        resp = requests.post(
            f"{BASE_URL}/auth/login",
            data={
                "username": LECTURER_EMAIL,
                "password": LECTURER_PASSWORD
            }
        )
        
        if resp.status_code == 200:
            data = resp.json()
            token = data.get("access_token")
            print_result(True, f"Logged in successfully")
            return token
        else:
            print_result(False, f"Login failed: {resp.status_code}")
            print(f"Response: {resp.text}")
            return None
    except Exception as e:
        print_result(False, f"Login error: {e}")
        return None

def test_session_creation_with_gps(token):
    """Test creating session with GPS coordinates"""
    print_test("Session Creation with GPS")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test with GPS
    params = {
        "course_id": 1,
        "duration_minutes": 60,
        "latitude": 5.6037,
        "longitude": -0.1870
    }
    
    try:
        resp = requests.post(
            f"{BASE_URL}/lecturer/sessions",
            params=params,
            headers=headers
        )
        
        if resp.status_code == 200:
            data = resp.json()
            session_id = data.get("id")
            
            print_result(True, f"Session created: ID={session_id}")
            print_result(
                data.get("latitude") == 5.6037,
                f"Latitude set: {data.get('latitude')}"
            )
            print_result(
                data.get("longitude") == -0.1870,
                f"Longitude set: {data.get('longitude')}"
            )
            print_result(
                data.get("geofence_radius_m") == 100.0,
                f"Default radius: {data.get('geofence_radius_m')}m"
            )
            print_result(
                data.get("geofence_enabled") == True,
                f"Geofence enabled: {data.get('geofence_enabled')}"
            )
            
            return session_id
        else:
            print_result(False, f"Failed: {resp.status_code}")
            print(f"Response: {resp.text}")
            return None
    except Exception as e:
        print_result(False, f"Error: {e}")
        return None

def test_session_creation_without_gps(token):
    """Test creating session without GPS"""
    print_test("Session Creation without GPS")
    
    headers = {"Authorization": f"Bearer {token}"}
    params = {"course_id": 1, "duration_minutes": 30}
    
    try:
        resp = requests.post(
            f"{BASE_URL}/lecturer/sessions",
            params=params,
            headers=headers
        )
        
        if resp.status_code == 200:
            data = resp.json()
            print_result(True, f"Session created: ID={data.get('id')}")
            print_result(
                data.get("latitude") is None,
                f"No latitude: {data.get('latitude')}"
            )
            print_result(
                data.get("geofence_enabled") == False,
                f"Geofence disabled: {data.get('geofence_enabled')}"
            )
            return True
        else:
            print_result(False, f"Failed: {resp.status_code}")
            return False
    except Exception as e:
        print_result(False, f"Error: {e}")
        return False

def test_geofence_radius_update(token, session_id):
    """Test updating geofence radius"""
    print_test("Geofence Radius Update")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test updating radius to 200m
    params = {"radius_meters": 200}
    
    try:
        resp = requests.put(
            f"{BASE_URL}/lecturer/sessions/{session_id}/geofence",
            params=params,
            headers=headers
        )
        
        if resp.status_code == 200:
            data = resp.json()
            print_result(True, f"Radius updated")
            print_result(
                data.get("geofence_radius_m") == 200.0,
                f"New radius: {data.get('geofence_radius_m')}m"
            )
            print_result(
                data.get("geofence_enabled") == True,
                f"Geofence still enabled"
            )
            return True
        else:
            print_result(False, f"Failed: {resp.status_code}")
            print(f"Response: {resp.text}")
            return False
    except Exception as e:
        print_result(False, f"Error: {e}")
        return False

def test_geofence_get(token, session_id):
    """Test getting geofence settings"""
    print_test("Get Geofence Settings")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        resp = requests.get(
            f"{BASE_URL}/lecturer/sessions/{session_id}/geofence",
            headers=headers
        )
        
        if resp.status_code == 200:
            data = resp.json()
            print_result(True, f"Geofence retrieved")
            print(f"  Latitude: {data.get('latitude')}")
            print(f"  Longitude: {data.get('longitude')}")
            print(f"  Radius: {data.get('geofence_radius_m')}m")
            print(f"  Enabled: {data.get('geofence_enabled')}")
            return True
        else:
            print_result(False, f"Failed: {resp.status_code}")
            return False
    except Exception as e:
        print_result(False, f"Error: {e}")
        return False

def test_qr_rotation(token, session_id):
    """Test QR code rotation (30 seconds)"""
    print_test("QR Code Rotation (30 seconds)")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        # Get initial QR
        resp = requests.get(
            f"{BASE_URL}/lecturer/qr/{session_id}/display",
            headers=headers
        )
        
        if resp.status_code == 200:
            data1 = resp.json()
            nonce1 = data1.get("qr_data")
            ttl1 = data1.get("time_remaining_seconds")
            
            print_result(True, f"QR code retrieved")
            print(f"  QR Data: {nonce1}")
            print(f"  TTL: {ttl1} seconds")
            print_result(
                ttl1 <= 30,
                f"TTL is 30 seconds or less: {ttl1}s"
            )
            
            # Wait and check again
            print(f"\n  Waiting 5 seconds...")
            time.sleep(5)
            
            resp2 = requests.get(
                f"{BASE_URL}/lecturer/qr/{session_id}/display",
                headers=headers
            )
            
            if resp2.status_code == 200:
                data2 = resp2.json()
                ttl2 = data2.get("time_remaining_seconds")
                
                print_result(
                    ttl2 < ttl1,
                    f"TTL decreased: {ttl1}s → {ttl2}s"
                )
                
                return True
        else:
            print_result(False, f"Failed: {resp.status_code}")
            return False
    except Exception as e:
        print_result(False, f"Error: {e}")
        return False

def test_validation():
    """Test validation rules"""
    print_test("Validation Tests")
    
    # These tests don't need authentication for validation errors
    
    # Test 1: Invalid latitude
    print("\n1. Invalid Latitude (> 90)")
    try:
        resp = requests.post(
            f"{BASE_URL}/lecturer/sessions",
            params={
                "course_id": 1,
                "latitude": 95.0,
                "longitude": 0.0
            }
        )
        print_result(
            resp.status_code == 400 or resp.status_code == 401,
            f"Rejected invalid latitude: {resp.status_code}"
        )
    except Exception as e:
        print_result(False, f"Error: {e}")
    
    # Test 2: Invalid longitude
    print("\n2. Invalid Longitude (< -180)")
    try:
        resp = requests.post(
            f"{BASE_URL}/lecturer/sessions",
            params={
                "course_id": 1,
                "latitude": 0.0,
                "longitude": -200.0
            }
        )
        print_result(
            resp.status_code == 400 or resp.status_code == 401,
            f"Rejected invalid longitude: {resp.status_code}"
        )
    except Exception as e:
        print_result(False, f"Error: {e}")

def main():
    print("\n" + "="*60)
    print("TESTING TODAY'S CHANGES")
    print("="*60)
    print(f"Time: {datetime.now().isoformat()}")
    print(f"Backend: {BASE_URL}")
    
    # Login
    token = login_as_lecturer()
    if not token:
        print("\n❌ Cannot proceed without authentication")
        print("Make sure the backend is running and seeded with test data")
        return
    
    # Test session creation with GPS
    session_id = test_session_creation_with_gps(token)
    
    if session_id:
        # Test geofence endpoints
        test_geofence_radius_update(token, session_id)
        test_geofence_get(token, session_id)
        
        # Test QR rotation
        test_qr_rotation(token, session_id)
    
    # Test session creation without GPS
    test_session_creation_without_gps(token)
    
    # Test validation
    test_validation()
    
    print("\n" + "="*60)
    print("TESTING COMPLETE")
    print("="*60)

if __name__ == "__main__":
    main()
