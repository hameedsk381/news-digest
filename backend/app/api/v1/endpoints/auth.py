from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core import security
from app.core.config import settings
from app.db import models
from pydantic import BaseModel

router = APIRouter()

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    full_name: str

from app.core.audit import log_audit
from fastapi import Request

@router.post("/login", response_model=Token)
def login(request: Request, db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()) -> Any:
    """OAuth2 compatible token login, get an access token for future requests."""
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        log_audit(db, "LOGIN_FAILED", details=f"Attempted username: {form_data.username}", ip_address=request.client.host)
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    
    log_audit(db, "LOGIN_SUCCESS", user_id=user.id, ip_address=request.client.host)
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": security.create_access_token(user.id, expires_delta=access_token_expires),
        "token_type": "bearer",
        "role": user.role,
        "full_name": user.full_name
    }

class UserCreate(BaseModel):
    username: str
    password: str
    full_name: str
    role: str = "ANALYST"

@router.post("/signup")
def signup(user_in: UserCreate, db: Session = Depends(get_db)) -> Any:
    """Create new user (Register)."""
    user = db.query(models.User).filter(models.User.username == user_in.username).first()
    if user:
        raise HTTPException(status_code=400, detail="The user with this username already exists.")
    
    new_user = models.User(
        username=user_in.username,
        hashed_password=security.get_password_hash(user_in.password),
        full_name=user_in.full_name,
        role=user_in.role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"msg": "User created successfully"}
