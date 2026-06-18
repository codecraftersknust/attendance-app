import re

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from ....schemas.auth import Token, UserCreate, UserRead, UserProfileRead, UserUpdate, PasswordChange, AuthResponse
from ....services.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
    is_refresh_token,
)
from ....db.deps import get_db
from ....api.deps.auth import get_current_user
from ....models.user import User, UserRole
from ....models.student_course_enrollment import StudentCourseEnrollment
from ....models.attendance_session import AttendanceSession
from ....models.device import Device
from ....models.course import Course, CourseLecturer
from ....services.face_storage import has_face_enrolled
from ....services.audit import write_audit
from ....services.rate_limit import rate_limit
from ....services.programmes import is_valid_programme, list_programme_names
from ....services.user_deletion import delete_user_uploads

router = APIRouter(prefix="/auth", tags=["auth"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


# KNUST validation patterns
STUDENT_EMAIL_PATTERN = r"^[a-zA-Z0-9._%+-]+@st\.knust\.edu\.gh$"
LECTURER_EMAIL_PATTERN = r"^[a-zA-Z0-9._%+-]+@knust\.edu\.gh$"
STUDENT_ID_PATTERN = r"^\d{8}$"
LECTURER_ID_PATTERN = r"^\d{7}$"


@router.get("/programmes", response_model=list)
def list_programmes(db: Session = Depends(get_db)):
    """Public list of valid programme names (for registration/profile forms)."""
    return list_programme_names(db)


@router.post("/register", response_model=UserRead)
def register(
    user_in: UserCreate,
    db: Session = Depends(get_db),
    _rl: None = Depends(rate_limit("register", limit=10, window_seconds=60)),
):
    # Check if email already exists
    existing_email = db.query(User).filter(User.email == user_in.email).first()
    if existing_email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    try:
        role = UserRole(user_in.role)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid role")

    # KNUST email validation by role
    if role == UserRole.student:
        if not re.match(STUDENT_EMAIL_PATTERN, user_in.email):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Students must use a KNUST student email (e.g. username@st.knust.edu.gh)",
            )
        if not user_in.user_id or not re.match(STUDENT_ID_PATTERN, user_in.user_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Student ID is required and must be exactly 8 digits",
            )
        if not user_in.full_name or not user_in.full_name.strip():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Full name is required")
        if not user_in.level:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Level is required")
        if not user_in.programme or not user_in.programme.strip():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Programme is required")
        if not is_valid_programme(db, user_in.programme):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unknown programme. Please select a programme from the official list.",
            )
    elif role == UserRole.lecturer:
        if not re.match(LECTURER_EMAIL_PATTERN, user_in.email):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Lecturers must use a KNUST lecturer email (e.g. lecturer@knust.edu.gh)",
            )
        if not user_in.full_name or not user_in.full_name.strip():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Full name is required")
        if not user_in.user_id or not re.match(LECTURER_ID_PATTERN, user_in.user_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Lecturer ID is required and must be exactly 7 digits",
            )
    elif role == UserRole.admin:
        # Admin self-registration is bootstrap-only: allowed while no admin
        # exists. After that, new admins are created by an existing admin
        # (e.g. scripts/create_admin.py on the server).
        if db.query(User.id).filter(User.role == UserRole.admin).first() is not None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin registration is disabled. Ask an existing administrator to create your account.",
            )
        if not re.match(LECTURER_EMAIL_PATTERN, user_in.email):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Admins must use a KNUST institutional email (e.g. admin@knust.edu.gh)",
            )
        if not user_in.full_name or not user_in.full_name.strip():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Full name is required")

    # Password strength: min 8 chars, at least one letter and one number
    if len(user_in.password) < 8:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Password must be at least 8 characters")
    if not re.search(r"[a-zA-Z]", user_in.password):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Password must contain at least one letter")
    if not re.search(r"\d", user_in.password):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Password must contain at least one number")

    # Check if user_id already exists (if provided)
    if user_in.user_id:
        existing_user_id = db.query(User).filter(User.user_id == user_in.user_id).first()
        if existing_user_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User ID already registered")
    
    user = User(
        email=user_in.email,
        user_id=user_in.user_id,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        role=role,
        level=user_in.level,
        programme=user_in.programme.strip() if user_in.programme else None,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=AuthResponse)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
    _rl: None = Depends(rate_limit("login", limit=10, window_seconds=60)),
):
    # Try to find user by email first, then by user_id
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user:
        user = db.query(User).filter(User.user_id == form_data.username).first()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email/user ID or password")

    access = create_access_token(subject=str(user.id))
    refresh = create_refresh_token(subject=str(user.id))
    user_read = UserRead.from_orm(user)
    return {"access_token": access, "refresh_token": refresh, "token_type": "bearer", "user": user_read}


@router.get("/me", response_model=UserRead)
def read_me(current: User = Depends(get_current_user)):
    return current


@router.get("/profile", response_model=UserProfileRead)
def get_profile(
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    """Get the full profile of the current user."""
    has_face = has_face_enrolled(current)
    if not has_face and current.face_reference_path:
        current.face_reference_path = None
        db.commit()
    return UserProfileRead(
        id=current.id,
        email=current.email,
        full_name=current.full_name,
        user_id=current.user_id,
        role=current.role.value if hasattr(current.role, "value") else current.role,
        level=current.level,
        programme=current.programme,
        is_active=current.is_active,
        has_face_enrolled=has_face,
        created_at=current.created_at,
        updated_at=current.updated_at,
    )


@router.put("/profile", response_model=UserProfileRead)
def update_profile(
    updates: UserUpdate,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    """Update the current user's profile fields."""
    if updates.email and updates.email != current.email:
        existing = db.query(User).filter(User.email == updates.email).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already in use")
        current.email = updates.email

    if updates.user_id is not None and updates.user_id != current.user_id:
        if updates.user_id:
            existing = db.query(User).filter(User.user_id == updates.user_id).first()
            if existing:
                raise HTTPException(status_code=400, detail="User ID already in use")
        current.user_id = updates.user_id

    if updates.full_name is not None:
        current.full_name = updates.full_name
    if updates.level is not None:
        current.level = updates.level
    if updates.programme is not None:
        if not is_valid_programme(db, updates.programme):
            raise HTTPException(
                status_code=400,
                detail="Unknown programme. Please select a programme from the official list.",
            )
        current.programme = updates.programme.strip()

    db.commit()
    db.refresh(current)

    has_face = has_face_enrolled(current)
    if not has_face and current.face_reference_path:
        current.face_reference_path = None
        db.commit()
        db.refresh(current)
    return UserProfileRead(
        id=current.id,
        email=current.email,
        full_name=current.full_name,
        user_id=current.user_id,
        role=current.role.value if hasattr(current.role, "value") else current.role,
        level=current.level,
        programme=current.programme,
        is_active=current.is_active,
        has_face_enrolled=has_face,
        created_at=current.created_at,
        updated_at=current.updated_at,
    )


@router.post("/change-password", response_model=dict)
def change_password(
    payload: PasswordChange,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    """Change the current user's password."""
    if not verify_password(payload.current_password, current.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    if len(payload.new_password) < 8:
        raise HTTPException(status_code=400, detail="New password must be at least 8 characters")
    if not re.search(r"[a-zA-Z]", payload.new_password):
        raise HTTPException(status_code=400, detail="New password must contain at least one letter")
    if not re.search(r"\d", payload.new_password):
        raise HTTPException(status_code=400, detail="New password must contain at least one number")

    current.hashed_password = get_password_hash(payload.new_password)
    db.commit()
    return {"message": "Password changed successfully"}


@router.post("/refresh", response_model=Token)
def refresh_token(token: str = Depends(oauth2_scheme)):
    if not is_refresh_token(token):
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    sub = decode_token(token)
    if not sub:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    access = create_access_token(subject=sub)
    return Token(access_token=access)


@router.post("/logout", response_model=dict)
def logout():
    # Stateless JWT: instruct client to delete tokens. For stateful revoke, add a denylist store.
    return {"message": "Logged out"}


@router.delete("/me", response_model=dict)
def delete_account(
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    """
    Permanently delete the current user's account and all associated data.
    This action cannot be undone.
    """
    user_id = current.id
    role = current.role
    email = current.email

    delete_user_uploads(db, current)

    db.query(StudentCourseEnrollment).filter(StudentCourseEnrollment.student_id == user_id).delete(
        synchronize_session=False
    )

    if role == UserRole.lecturer:
        db.query(CourseLecturer).filter(CourseLecturer.lecturer_id == user_id).delete(
            synchronize_session=False
        )
        db.query(AttendanceSession).filter(AttendanceSession.lecturer_id == user_id).delete(
            synchronize_session=False
        )

    db.query(Device).filter(Device.user_id == user_id).delete(synchronize_session=False)

    write_audit(db, "auth.delete_account", user_id, f"email={email}", auto_commit=False)
    db.delete(current)
    db.commit()

    return {"message": "Account deleted successfully"}
