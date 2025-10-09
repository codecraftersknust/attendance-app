# Frontend Integration Guide
## Absense - Smart Multi-Layered Attendance Verification System

This guide provides essential information for frontend developers integrating with the Absense backend API.

---

## 🚀 Quick Start

### Backend Server
- **URL**: `http://localhost:8000` (development)
- **API Base**: `http://localhost:8000/api/v1`
- **Documentation**: `http://localhost:8000/docs` (Swagger UI)

### Start Backend
```bash
cd backend
source .venv/bin/activate
./scripts/dev.sh
```

---

## 🔐 Authentication Flow

### 1. User Registration
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "full_name": "John Doe",
  "role": "student" | "lecturer" | "admin"
}
```

### 2. Login
```http
POST /api/v1/auth/login
Content-Type: application/x-www-form-urlencoded

username=user@example.com&password=password123
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

### 3. Token Refresh
```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 4. Get Current User
```http
GET /api/v1/auth/me
Authorization: Bearer <access_token>
```

---

## 👨‍🏫 Lecturer Endpoints

### Create Session
```http
POST /api/v1/lecturer/sessions
Authorization: Bearer <token>
Content-Type: application/json

{
  "duration_minutes": 30
}
```

**Response:**
```json
{
  "id": 1,
  "code": "ABC123"
}
```

### Generate QR Code
```http
POST /api/v1/lecturer/sessions/{session_id}/qr/rotate
Authorization: Bearer <token>
Content-Type: application/json

{
  "ttl_seconds": 60
}
```

**Response:**
```json
{
  "session_id": 1,
  "nonce": "jRMAwta7nQBZgS8po2C7Ww4G",
  "expires_at": "2025-10-09T14:44:36.267172"
}
```

### Get QR Payload
```http
GET /api/v1/lecturer/sessions/{session_id}/qr
Authorization: Bearer <token>
```

### List Sessions
```http
GET /api/v1/lecturer/sessions
Authorization: Bearer <token>
```

### View Attendance
```http
GET /api/v1/lecturer/sessions/{session_id}/attendance
Authorization: Bearer <token>
```

### Close Session
```http
POST /api/v1/lecturer/sessions/{session_id}/close
Authorization: Bearer <token>
```

### Regenerate Session Code
```http
POST /api/v1/lecturer/sessions/{session_id}/regenerate
Authorization: Bearer <token>
```

---

## 🎓 Student Endpoints

### Bind Device (IMEI)
```http
POST /api/v1/student/device/bind?imei=123456789012345
Authorization: Bearer <token>
```

### Submit Attendance
```http
POST /api/v1/student/attendance
Authorization: Bearer <token>
Content-Type: multipart/form-data

code: ABC123
qr_session_id: 1
qr_nonce: jRMAwta7nQBZgS8po2C7Ww4G
latitude: 40.7128
longitude: -74.0060
imei: 123456789012345
selfie: <file>
presence_image: <file>
```

**Response:**
```json
{
  "record_id": 1,
  "status": "confirmed" | "flagged"
}
```

### Enroll Face Reference
```http
POST /api/v1/student/enroll-face
Authorization: Bearer <token>
Content-Type: multipart/form-data

face_image: <file>
```

### Verify Face (Standalone)
```http
POST /api/v1/student/verify-face
Authorization: Bearer <token>
Content-Type: multipart/form-data

face_image: <file>
```

---

## 👨‍💼 Admin Endpoints

### View Analytics
```http
GET /api/v1/admin/analytics
Authorization: Bearer <token>
```

**Response:**
```json
{
  "total_users": 150,
  "total_sessions": 25,
  "total_attendance_records": 1200,
  "flagged_records": 15
}
```

### List Flagged Attendance
```http
GET /api/v1/admin/flagged
Authorization: Bearer <token>
```

### Set Attendance Status
```http
POST /api/v1/admin/attendance/{record_id}/set-status?status=confirmed
Authorization: Bearer <token>
```

### Force Verify Attendance
```http
POST /api/v1/admin/attendance/{record_id}/verify
Authorization: Bearer <token>
```

---

## 🔄 QR Code Rotation System

### Overview
The QR code rotation system automatically generates new QR codes every 60 seconds to prevent sharing and ensure students must be physically present in the classroom.

### Key Features
- **Automatic Rotation**: QR codes rotate every 60 seconds
- **Real-time Status**: Check QR expiration and rotation timing
- **Security**: Prevents QR code sharing between students
- **User-Friendly**: Clear error messages for expired/invalid QR codes

### Lecturer Endpoints

#### Generate/Rotate QR Code
```http
POST /api/v1/lecturer/sessions/{session_id}/qr/rotate
Authorization: Bearer <token>
Content-Type: application/json

{
  "ttl_seconds": 60
}
```

**Response:**
```json
{
  "session_id": 1,
  "nonce": "iTKp886JbtVHawHK4FHVLJVJ",
  "expires_at": "2025-10-09T16:31:40.115050",
  "qr_payload": {
    "session_id": 1,
    "nonce": "iTKp886JbtVHawHK4FHVLJVJ",
    "expires_at": "2025-10-09T16:31:40.115050",
    "lecturer_name": "Sample Lecturer",
    "course_code": null,
    "course_name": "General Session",
    "location": null,
    "session_code": "YM5UHT"
  }
}
```

#### Get QR Status
```http
GET /api/v1/lecturer/sessions/{session_id}/qr/status
Authorization: Bearer <token>
```

**Response:**
```json
{
  "has_qr": true,
  "expires_at": "2025-10-09T16:31:40.115050",
  "seconds_remaining": 45,
  "is_expired": false,
  "next_rotation_in": 35
}
```

#### Get Current QR Payload
```http
GET /api/v1/lecturer/sessions/{session_id}/qr
Authorization: Bearer <token>
```

### Student Attendance with QR Rotation

#### Submit Attendance (QR-Only)
```http
POST /api/v1/student/attendance
Authorization: Bearer <token>
Content-Type: multipart/form-data

qr_session_id: 1
qr_nonce: iTKp886JbtVHawHK4FHVLJVJ
latitude: 40.7128
longitude: -74.0060
imei: 123456789012345
selfie: <file>
```

### Error Handling

#### QR Code Expired
```json
{
  "detail": "QR code has expired. Please scan the latest QR code."
}
```

#### Invalid QR Code
```json
{
  "detail": "Invalid QR code. Please scan the current QR code displayed in class."
}
```

#### QR Not Generated
```json
{
  "detail": "QR code not generated for this session"
}
```

### Frontend Implementation Tips

#### 1. QR Code Display
- **Auto-refresh**: Update QR display every 30-45 seconds
- **Countdown Timer**: Show seconds remaining until next rotation
- **Status Indicator**: Display QR validity status

#### 2. Student Scanning
- **Real-time Validation**: Check QR validity before submission
- **Error Handling**: Show clear messages for expired/invalid QR codes
- **Retry Mechanism**: Allow students to scan again if QR expires
- **Simplified Flow**: Only selfie required (no classroom photo needed)

#### 3. Lecturer Dashboard
- **QR Status**: Show current QR status and rotation timing
- **Manual Rotation**: Option to manually rotate QR if needed
- **Session Management**: Start/stop QR rotation with sessions

#### 4. Mobile App Flow
```javascript
// Example QR scanning flow
async function scanQRCode() {
  try {
    const qrData = await scanQR();
    const qrPayload = JSON.parse(qrData);
    
    // Validate QR expiration
    const expiresAt = new Date(qrPayload.expires_at);
    if (expiresAt < new Date()) {
      throw new Error('QR code has expired');
    }
    
    // Capture selfie only (no classroom photo needed)
    const selfie = await captureSelfie();
    
    // Submit attendance with GPS + QR + selfie
    await submitAttendance({
      qr_session_id: qrPayload.session_id,
      qr_nonce: qrPayload.nonce,
      latitude: currentLocation.lat,
      longitude: currentLocation.lng,
      imei: deviceIMEI,
      selfie: selfie
    });
  } catch (error) {
    showError(error.message);
  }
}
```

### Security Benefits
- **Prevents Sharing**: QR codes expire quickly, preventing sharing
- **Location Verification**: Students must be physically present
- **Time-bound**: Each QR code is valid for only 60 seconds
- **Audit Trail**: Complete tracking of QR generation and usage

---

### Camera Permissions
- **Front Camera**: For selfie capture and face verification
- **Back Camera**: For QR code scanning (classroom photo no longer required)

### Location Services
- **GPS**: Required for geofencing verification
- **Accuracy**: High accuracy recommended

### Device Information
- **IMEI**: Required for device binding and verification
- **Platform**: Android/iOS specific implementations

### File Uploads
- **Image Formats**: JPEG, PNG
- **Max Size**: 5MB per image
- **Compression**: Recommended for mobile uploads

---

## 🔄 Multi-Layer Verification Process

### 1. QR Code Verification
- Lecturer generates rotating QR code every 60 seconds
- Student scans QR code to get `session_id` and `nonce`
- QR codes expire automatically

### 2. GPS Verification
- Student location must be within geofence radius
- Coordinates sent with attendance submission
- Server validates against session location

### 3. IMEI Verification
- Device must be bound to student account
- IMEI sent with each attendance submission
- Prevents device sharing

### 4. Face Verification
- Student enrolls face reference image
- Selfie compared against reference using DeepFace
- Confidence threshold configurable

### 5. Session Code
- Lecturer provides 6-character session code
- Student enters code manually
- Code regenerates periodically

---

## 🛠️ Error Handling

### Common HTTP Status Codes
- **200**: Success
- **400**: Bad Request (validation errors)
- **401**: Unauthorized (invalid/expired token)
- **403**: Forbidden (insufficient permissions)
- **404**: Not Found
- **422**: Unprocessable Entity (missing required fields)
- **429**: Rate Limited

### Error Response Format
```json
{
  "detail": "Error message",
  "errors": [
    {
      "type": "missing",
      "loc": ["field_name"],
      "msg": "Field required"
    }
  ]
}
```

---

## 🔧 Configuration

### Environment Variables
```bash
# Backend
DATABASE_URL=sqlite:///./smavs_dev.db
SECRET_KEY=your-secret-key
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_MINUTES=10080

# Face Verification
FACE_VERIFICATION_ENABLED=true
FACE_MODEL=VGG-Face
FACE_THRESHOLD=0.4

# Storage
STORAGE_BACKEND=local  # or s3
MAX_UPLOAD_SIZE_MB=5
```

### CORS Configuration
- **Allowed Origins**: `http://localhost:3000`, `http://localhost:8081`
- **Methods**: GET, POST, PUT, DELETE, OPTIONS
- **Headers**: Authorization, Content-Type

---

## 📊 Data Models

### User Roles
- **student**: Can submit attendance, bind devices
- **lecturer**: Can create sessions, view attendance
- **admin**: Can manage all data, view analytics

### Attendance Status
- **confirmed**: Successfully verified
- **flagged**: Requires manual review
- **rejected**: Verification failed

### Session States
- **active**: Accepting attendance
- **closed**: No longer accepting attendance

---

## 🧪 Testing

### Test Users (Seeded)
```bash
# Admin
Email: admin@absense.com
Password: admin123

# Lecturer  
Email: lecturer@absense.com
Password: lecturer123

# Student
Email: student@absense.com
Password: student123
```

### Test Session
- **Code**: Generated automatically (6 characters)
- **Duration**: Configurable in minutes
- **QR**: Rotates every 60 seconds by default

---

## 🚨 Important Notes

### Security Considerations
1. **JWT Tokens**: Store securely, implement refresh logic
2. **IMEI**: Sensitive data, handle with care
3. **Images**: Compress before upload, validate file types
4. **GPS**: Request permission, handle location errors

### Performance Tips
1. **Image Compression**: Reduce file sizes before upload
2. **QR Scanning**: Implement efficient scanning libraries
3. **Offline Support**: Cache session codes and user data
4. **Background Sync**: Queue attendance submissions

### Common Issues
1. **QR Expiry**: Always check QR expiration time
2. **GPS Accuracy**: Handle location permission denials
3. **Network Timeouts**: Implement retry logic
4. **Token Refresh**: Handle refresh failures gracefully

---

## 📞 Support

### API Documentation
- **Swagger UI**: `http://localhost:8000/docs`
- **OpenAPI Spec**: `http://localhost:8000/openapi.json`

### Backend Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-10-09T14:30:00Z"
}
```

---

## 🔄 Workflow Examples

### Complete Student Attendance Flow
1. Student logs in
2. Student binds device (IMEI)
3. Student enrolls face reference
4. Lecturer creates session and generates QR
5. Student scans QR code
6. Student submits attendance with:
   - Session code
   - QR nonce
   - GPS coordinates
   - IMEI
   - Selfie
   - Presence image
7. Server verifies all layers
8. Returns confirmed/flagged status

### Lecturer Session Management
1. Lecturer logs in
2. Lecturer creates session with duration
3. Lecturer generates QR code
4. QR code rotates automatically
5. Lecturer monitors attendance in real-time
6. Lecturer closes session when done

---

*This guide covers the essential integration points for the Absense frontend. For detailed API specifications, refer to the Swagger documentation at `/docs`.*
