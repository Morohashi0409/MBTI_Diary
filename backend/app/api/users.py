from fastapi import APIRouter, HTTPException, status
from typing import List
import logging

from ..models.user import UserCreate, UserResponse, User

# メモリ内のユーザーデータベース (開発用)
users_db = {}

# ロガーのセットアップ
logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/users",
    tags=["users"],
    responses={404: {"description": "User not found"}},
)


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(user: UserCreate):
    """
    新しいユーザーを登録する
    """
    try:
        # 新しいユーザーを作成
        new_user = User.create(user)
        
        # メモリ内のDBにユーザーを保存（実際のアプリでは永続化する）
        users_db[new_user.id] = new_user
        
        logger.info(f"新しいユーザーを登録しました: {new_user.id}, {new_user.username}")
        
        # クライアントに返す応答を作成
        return UserResponse(
            userId=new_user.id,
            username=new_user.username,
            mbti=new_user.mbti,
            created_at=new_user.created_at
        )
        
    except Exception as e:
        logger.error(f"ユーザー登録中にエラーが発生しました: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="ユーザー登録に失敗しました"
        )


@router.get("/count", response_model=int)
async def get_user_count():
    """
    登録済みユーザー数を取得する
    """
    return len(users_db)