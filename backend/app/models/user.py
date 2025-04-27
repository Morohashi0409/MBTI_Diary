from pydantic import BaseModel
from uuid import uuid4
from datetime import datetime
from typing import Optional


class UserBase(BaseModel):
    username: str
    mbti: str


class UserCreate(UserBase):
    pass


class UserResponse(UserBase):
    userId: str
    created_at: datetime


class User(UserBase):
    id: str
    created_at: datetime
    
    @classmethod
    def create(cls, user_create: UserCreate):
        """新しいユーザーを作成する"""
        return cls(
            id=str(uuid4()),
            username=user_create.username,
            mbti=user_create.mbti,
            created_at=datetime.now()
        )