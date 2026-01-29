# Face Verification Testing Guide

## Quick Start

### Option 1: Using curl (Recommended for quick testing)

```bash
cd web/backend
./scripts/test_face_verification_curl.sh
```

### Option 2: Using Python script

```bash
cd web/backend
source .venv/bin/activate
python scripts/test_face_verification.py
```

## Prerequisites

1. **Backend must be running**
   ```bash
   cd web/backend
   ./scripts/dev.sh
   ```

2. **DeepFace must be installed** (for actual face verification)
   ```bash
   pip install deepface
   ```
   If not installed, face verification will be bypassed.

3. **Test images required**
   - Create directory: `mkdir -p test_images`
   - Place a face photo at: `test_images/reference_face.jpg`
   - (Optional) Same person photo: `test_images/verify_same.jpg`
   - (Optional) Different person photo: `test_images/verify_different.jpg`

## Test Workflow

The test script performs these steps:

1. **Login** as student (`student@absense.com` / `student123`)
2. **Enroll face** - Upload reference face image
3. **Verify face** - Upload verification image and compare
4. **Report results** - Show verification status, distance, threshold

## Endpoints Tested

- `POST /api/v1/student/enroll-face` - Enroll reference face
- `POST /api/v1/student/verify-face` - Verify face against enrolled reference

## Expected Results

- **Same person**: Should verify successfully (verified: true)
- **Different person**: Should fail verification (verified: false)
- **Distance**: Lower = more similar, Higher = less similar
- **Threshold**: Maximum distance for verification to pass

## Configuration

Face verification settings in `.env` or `app/core/config.py`:
- `FACE_VERIFICATION_ENABLED=true` - Enable/disable verification
- `FACE_MODEL=Facenet512` - Face recognition model
- `FACE_THRESHOLD=0.8` - Similarity threshold

## Troubleshooting

1. **"No reference image found"**: 
   - Ensure you enrolled a face first
   - Check `uploads/faces/{user_id}_reference.jpg` exists

2. **"DeepFace not available"**:
   - Install DeepFace: `pip install deepface`
   - Or disable verification: `FACE_VERIFICATION_ENABLED=false`

3. **Verification always fails**:
   - Check image quality (clear face, good lighting)
   - Try adjusting `FACE_THRESHOLD` value
   - Ensure same person in both images

4. **Backend not running**:
   ```bash
   cd web/backend
   ./scripts/dev.sh
   ```

