from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from ....schemas.auth import Token, UserCreate, UserRead
from ....services.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
    is_refresh_token,
)
from ....db.deps import get_db
from ....models.user import User, UserRole

router = APIRouter(prefix="/auth", tags=["auth"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


@router.post("/register", response_model=UserRead)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    # Check if email already exists
    existing_email = db.query(User).filter(User.email == user_in.email).first()
    if existing_email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    
    # Check if student_id already exists (if provided)
    if user_in.student_id:
        existing_student_id = db.query(User).filter(User.student_id == user_in.student_id).first()
        if existing_student_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Student ID already registered")
    
    try:
        role = UserRole(user_in.role)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid role")
    
    user = User(
        email=user_in.email,
        student_id=user_in.student_id,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        role=role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # Try to find user by email first, then by student_id
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user:
        user = db.query(User).filter(User.student_id == form_data.username).first()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email/student ID or password")
    
    access = create_access_token(subject=str(user.id))
    refresh = create_refresh_token(subject=str(user.id))
    return {"access_token": access, "refresh_token": refresh, "token_type": "bearer"}


@router.get("/me", response_model=UserRead)
def read_me(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    sub = decode_token(token)
    if not sub:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = db.get(User, int(sub))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


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
