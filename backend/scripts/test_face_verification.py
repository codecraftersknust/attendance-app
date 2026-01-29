#!/usr/bin/env python3
"""
Test script for face verification workflow.
This script tests the enroll-face and verify-face endpoints.
"""

import os
import sys
import requests
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

BASE_URL = "http://localhost:8000/api/v1"
STUDENT_EMAIL = "student@absense.com"
STUDENT_PASSWORD = "student123"

def check_backend():
    """Check if backend is running"""
    try:
        response = requests.get(f"{BASE_URL.replace('/api/v1', '')}/api/v1/health", timeout=2)
        if response.status_code == 200:
            print("✅ Backend is running")
            return True
    except Exception as e:
        print(f"❌ Backend is not running: {e}")
        print(f"   Please start the backend first: cd backend && ./scripts/dev.sh")
        return False
    return False

def login():
    """Login as student and get access token"""
    print("\n🔐 Logging in as student...")
    response = requests.post(
        f"{BASE_URL}/auth/login",
        data={
            "username": STUDENT_EMAIL,
            "password": STUDENT_PASSWORD
        }
    )
    
    if response.status_code != 200:
        print(f"❌ Login failed: {response.status_code}")
        print(f"   Response: {response.text}")
        return None
    
    token = response.json()["access_token"]
    print(f"✅ Logged in successfully")
    return token

def get_user_info(token):
    """Get current user info"""
    response = requests.get(
        f"{BASE_URL}/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    if response.status_code == 200:
        user = response.json()
        print(f"\n👤 User Info:")
        print(f"   ID: {user.get('id')}")
        print(f"   Email: {user.get('email')}")
        print(f"   Name: {user.get('full_name')}")
        print(f"   Role: {user.get('role')}")
        print(f"   User ID: {user.get('user_id')}")
        return user
    return None

def download_sample_image(url, save_path):
    """Download a sample face image for testing"""
    if os.path.exists(save_path):
        print(f"📷 Sample image already exists: {save_path}")
        return True
    
    print(f"📥 Downloading sample image from {url}...")
    try:
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            os.makedirs(os.path.dirname(save_path), exist_ok=True)
            with open(save_path, 'wb') as f:
                f.write(response.content)
            print(f"✅ Downloaded: {save_path}")
            return True
    except Exception as e:
        print(f"⚠️  Failed to download sample image: {e}")
        print(f"   You can manually place a face image at: {save_path}")
        return False

def create_test_images():
    """Create or download test images"""
    test_dir = Path(__file__).parent.parent / "test_images"
    test_dir.mkdir(exist_ok=True)
    
    # Try to download sample face images from a free API
    # Using placeholder.com or similar service - but these won't have faces
    # Instead, let's check if user has images or guide them
    
    ref_image = test_dir / "reference_face.jpg"
    verify_same_image = test_dir / "verify_same.jpg"
    verify_different_image = test_dir / "verify_different.jpg"
    
    print("\n📷 Test Images:")
    print(f"   Reference: {ref_image}")
    print(f"   Verify (same person): {verify_same_image}")
    print(f"   Verify (different person): {verify_different_image}")
    
    if not ref_image.exists():
        print("\n⚠️  No test images found!")
        print("   Please provide test images:")
        print(f"   1. Place a face photo at: {ref_image}")
        print(f"   2. Place the SAME person's photo at: {verify_same_image}")
        print(f"   3. (Optional) Place a DIFFERENT person's photo at: {verify_different_image}")
        print("\n   You can use photos of yourself or download from:")
        print("   - https://thispersondoesnotexist.com (AI-generated faces)")
        print("   - Or use your own photos")
        return None, None, None
    
    if not verify_same_image.exists():
        # Try to use reference as same for testing
        print(f"⚠️  Using reference image for verification (same person)")
        verify_same_image = ref_image
    
    return ref_image, verify_same_image, verify_different_image if verify_different_image.exists() else None

def enroll_face(token, image_path):
    """Enroll a reference face"""
    print(f"\n📤 Enrolling face reference from: {image_path}")
    
    if not os.path.exists(image_path):
        print(f"❌ Image not found: {image_path}")
        return False
    
    with open(image_path, 'rb') as f:
        files = {'file': (os.path.basename(image_path), f, 'image/jpeg')}
        response = requests.post(
            f"{BASE_URL}/student/enroll-face",
            headers={"Authorization": f"Bearer {token}"},
            files=files
        )
    
    if response.status_code == 200:
        result = response.json()
        print(f"✅ Face enrolled successfully")
        print(f"   Path: {result.get('path')}")
        return True
    else:
        print(f"❌ Enrollment failed: {response.status_code}")
        print(f"   Response: {response.text}")
        return False

def verify_face(token, image_path, expected_success=True):
    """Verify a face against enrolled reference"""
    expectation = "✅ (expected)" if expected_success else "❌ (expected)"
    print(f"\n🔍 Verifying face from: {image_path} {expectation}")
    
    if not os.path.exists(image_path):
        print(f"⚠️  Image not found: {image_path} - skipping")
        return None
    
    with open(image_path, 'rb') as f:
        files = {'file': (os.path.basename(image_path), f, 'image/jpeg')}
        response = requests.post(
            f"{BASE_URL}/student/verify-face",
            headers={"Authorization": f"Bearer {token}"},
            files=files
        )
    
    if response.status_code == 200:
        result = response.json()
        verified = result.get('verified', False)
        distance = result.get('distance')
        threshold = result.get('threshold')
        model = result.get('model')
        
        if verified == expected_success:
            print(f"✅ Verification result matches expectation")
        else:
            print(f"⚠️  Verification result differs from expectation")
        
        print(f"   Verified: {verified}")
        if distance is not None:
            print(f"   Distance: {distance:.4f}")
        if threshold is not None:
            print(f"   Threshold: {threshold:.4f}")
        if model:
            print(f"   Model: {model}")
        
        return result
    elif response.status_code == 400:
        result = response.json()
        error = result.get('detail', 'Face verification failed')
        print(f"❌ Verification failed (as expected): {error}")
        return result
    else:
        print(f"❌ Verification request failed: {response.status_code}")
        print(f"   Response: {response.text}")
        return None

def check_deepface():
    """Check if DeepFace is installed"""
    try:
        import deepface
        print("✅ DeepFace is installed")
        return True
    except ImportError:
        print("⚠️  DeepFace is NOT installed")
        print("   Face verification will be disabled/bypassed")
        print("   Install with: pip install deepface")
        return False

def main():
    print("=" * 60)
    print("🧪 Face Verification Test Script")
    print("=" * 60)
    
    # Check backend
    if not check_backend():
        return 1
    
    # Check DeepFace
    check_deepface()
    
    # Login
    token = login()
    if not token:
        return 1
    
    # Get user info
    user = get_user_info(token)
    if not user:
        return 1
    
    # Prepare test images
    ref_image, verify_same, verify_different = create_test_images()
    
    if not ref_image:
        print("\n💡 Tip: Create test images first, then run this script again")
        return 1
    
    # Step 1: Enroll face
    if not enroll_face(token, str(ref_image)):
        print("\n❌ Failed to enroll face. Cannot proceed with verification.")
        return 1
    
    # Step 2: Verify with same person's face
    verify_result = verify_face(token, str(verify_same), expected_success=True)
    
    if verify_result and verify_result.get('verified'):
        print("\n✅ SUCCESS: Same person verification passed!")
    elif verify_result:
        print("\n⚠️  WARNING: Same person verification failed (may need better images)")
    
    # Step 3: Verify with different person's face (if available)
    if verify_different:
        verify_result_diff = verify_face(token, str(verify_different), expected_success=False)
        if verify_result_diff and not verify_result_diff.get('verified'):
            print("\n✅ SUCCESS: Different person correctly rejected!")
        elif verify_result_diff and verify_result_diff.get('verified'):
            print("\n⚠️  WARNING: Different person was incorrectly accepted!")
    
    print("\n" + "=" * 60)
    print("✅ Face verification test completed!")
    print("=" * 60)
    return 0

if __name__ == "__main__":
    sys.exit(main())

