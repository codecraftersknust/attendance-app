from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from ....schemas.auth import Token, UserCreate, UserRead, UserProfileRead, UserUpdate, PasswordChange
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
from ....services.face_verification import FaceVerificationService

router = APIRouter(prefix="/auth", tags=["auth"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")
face_service = FaceVerificationService()


@router.post("/register", response_model=UserRead)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    # Check if email already exists
    existing_email = db.query(User).filter(User.email == user_in.email).first()
    if existing_email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    
    # Check if user_id already exists (if provided)
    if user_in.user_id:
        existing_user_id = db.query(User).filter(User.user_id == user_in.user_id).first()
        if existing_user_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User ID already registered")
    
    try:
        role = UserRole(user_in.role)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid role")
    
    user = User(
        email=user_in.email,
        user_id=user_in.user_id,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        role=role,
        level=user_in.level,
        programme=user_in.programme,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # Try to find user by email first, then by user_id
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user:
        user = db.query(User).filter(User.user_id == form_data.username).first()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email/user ID or password")
    
    access = create_access_token(subject=str(user.id))
    refresh = create_refresh_token(subject=str(user.id))
    return {"access_token": access, "refresh_token": refresh, "token_type": "bearer"}


@router.get("/me", response_model=UserRead)
def read_me(current: User = Depends(get_current_user)):
    return current


@router.get("/profile", response_model=UserProfileRead)
def get_profile(current: User = Depends(get_current_user)):
    """Get the full profile of the current user."""
    has_face = bool(current.face_reference_path) or face_service.has_reference_face(current.id)
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
        current.programme = updates.programme

    db.commit()
    db.refresh(current)

    has_face = bool(current.face_reference_path) or face_service.has_reference_face(current.id)
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

    if len(payload.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")

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
