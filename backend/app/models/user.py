from pydantic import BaseModel
from uuid import uuid4
from datetime import datetime
from typing import Optional


class UserBase(BaseModel):
    username: str
    mbti: str


class UserCreate(UserBase):
    firebase_uid: str  # Firebase認証によるユーザーID


class UserResponse(UserBase):
    userId: str
    created_at: datetime


class User(UserBase):
    id: str
    firebase_uid: str  # Firebase認証によるユーザーID
    created_at: datetime
    
    @classmethod
    def create(cls, user_create: UserCreate):
        """新しいユーザーを作成する"""
        return cls(
            id=str(uuid4()),
            username=user_create.username,
            mbti=user_create.mbti,
            firebase_uid=user_create.firebase_uid,
            created_at=datetime.now()
        )