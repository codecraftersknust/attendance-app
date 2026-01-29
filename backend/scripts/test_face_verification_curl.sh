#!/bin/bash
# Quick face verification test using curl commands
# This script demonstrates the face verification workflow

set -e

BASE_URL="http://localhost:8000/api/v1"
STUDENT_EMAIL="student@absense.com"
STUDENT_PASSWORD="student123"

echo "=================================="
echo "🧪 Face Verification Test (curl)"
echo "=================================="
echo ""

# Check backend
echo "🔍 Checking backend..."
if ! curl -sf http://localhost:8000/api/v1/health > /dev/null 2>&1; then
    echo "❌ Backend is not running!"
    echo "   Please start: cd backend && ./scripts/dev.sh"
    exit 1
fi
echo "✅ Backend is running"
echo ""

# Login
echo "🔐 Logging in as student..."
LOGIN_RESPONSE=$(curl -sSf -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "username=$STUDENT_EMAIL&password=$STUDENT_PASSWORD")

TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "❌ Login failed"
    echo "$LOGIN_RESPONSE"
    exit 1
fi

echo "✅ Logged in successfully"
echo ""

# Get user info
echo "👤 Getting user info..."
USER_INFO=$(curl -sSf -H "Authorization: Bearer $TOKEN" "$BASE_URL/auth/me")
echo "$USER_INFO" | python3 -m json.tool 2>/dev/null || echo "$USER_INFO"
echo ""

# Check for test images
TEST_DIR="../test_images"
REF_IMAGE="$TEST_DIR/reference_face.jpg"
VERIFY_IMAGE="$TEST_DIR/verify_same.jpg"

echo "📷 Checking for test images..."
if [ ! -f "$REF_IMAGE" ]; then
    echo "⚠️  Reference image not found: $REF_IMAGE"
    echo ""
    echo "📝 Instructions:"
    echo "   1. Create directory: mkdir -p $TEST_DIR"
    echo "   2. Place a face photo at: $REF_IMAGE"
    echo "   3. (Optional) Place same person photo at: $VERIFY_IMAGE"
    echo "   4. Run this script again"
    echo ""
    exit 1
fi

if [ ! -f "$VERIFY_IMAGE" ]; then
    echo "⚠️  Using reference image for verification (same person)"
    VERIFY_IMAGE="$REF_IMAGE"
fi

echo "✅ Test images found"
echo "   Reference: $REF_IMAGE"
echo "   Verify: $VERIFY_IMAGE"
echo ""

# Step 1: Enroll face
echo "📤 Enrolling face reference..."
ENROLL_RESPONSE=$(curl -sSf -X POST "$BASE_URL/student/enroll-face" \
    -H "Authorization: Bearer $TOKEN" \
    -F "file=@$REF_IMAGE")

if [ $? -eq 0 ]; then
    echo "✅ Face enrolled successfully"
    echo "$ENROLL_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$ENROLL_RESPONSE"
else
    echo "❌ Enrollment failed"
    exit 1
fi
echo ""

# Step 2: Verify face
echo "🔍 Verifying face..."
VERIFY_RESPONSE=$(curl -sSf -X POST "$BASE_URL/student/verify-face" \
    -H "Authorization: Bearer $TOKEN" \
    -F "file=@$VERIFY_IMAGE")

if [ $? -eq 0 ]; then
    echo "✅ Verification completed"
    echo "$VERIFY_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$VERIFY_RESPONSE"
    
    # Check if verified
    if echo "$VERIFY_RESPONSE" | grep -q '"verified":\s*true'; then
        echo ""
        echo "✅ SUCCESS: Face verification passed!"
    else
        echo ""
        echo "⚠️  Face verification failed (check images or DeepFace installation)"
    fi
else
    echo "❌ Verification request failed"
    echo "$VERIFY_RESPONSE"
fi

echo ""
echo "=================================="
echo "✅ Test completed!"
echo "=================================="

