from fastapi import APIRouter, HTTPException, status, Depends
from typing import List, Dict, Any
import logging

from ..models.user import UserCreate, UserResponse, User
from ..database import db
from ..services.user_auth import verify_firebase_token

# ロガーのセットアップ
logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/users",
    tags=["users"],
    responses={404: {"description": "User not found"}},
)


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(user: UserCreate, firebase_uid: str = Depends(verify_firebase_token)):
    """
    新しいユーザーを登録する
    
    Args:
        user: ユーザー登録情報
        firebase_uid: 認証済みFirebase UID
    """
    try:
        # トークンから取得したIDと登録情報のIDが一致しているか確認
        if user.firebase_uid != firebase_uid:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="認証されたユーザーと登録情報が一致しません"
            )
        
        # すでに同じFirebase UIDのユーザーが存在するか確認
        users_ref = db.collection('users')
        query = users_ref.where("firebase_uid", "==", firebase_uid).limit(1)
        users = list(query.stream())
        
        if users:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="このFirebaseアカウントは既に登録されています"
            )
        
        # 新しいユーザーを作成
        new_user = User.create(user)
        
        # Firestoreにユーザーを保存
        user_data = {
            "id": new_user.id,
            "username": new_user.username,
            "mbti": new_user.mbti,
            "firebase_uid": new_user.firebase_uid,
            "created_at": new_user.created_at
        }
        
        # Firestoreの'users'コレクションにドキュメントを追加
        db.collection('users').document(new_user.id).set(user_data)
        
        logger.info(f"新しいユーザーを登録しました: {new_user.id}, Firebase UID: {new_user.firebase_uid}")
        
        # クライアントに返す応答を作成
        return UserResponse(
            userId=new_user.id,
            username=new_user.username,
            mbti=new_user.mbti,
            created_at=new_user.created_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"ユーザー登録中にエラーが発生しました: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="ユーザー登録に失敗しました"
        )


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(current_user: Dict[str, Any] = Depends(verify_firebase_token)):
    """
    認証済みユーザーの情報を取得する
    
    Args:
        current_user: 認証済みユーザーID
    """
    try:
        # Firebase UIDでユーザーを検索
        users_ref = db.collection('users')
        query = users_ref.where("firebase_uid", "==", current_user).limit(1)
        users = list(query.stream())
        
        if not users:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="ユーザーが見つかりません。アプリでユーザー登録を完了してください。"
            )
        
        user_data = users[0].to_dict()
        
        return UserResponse(
            userId=user_data["id"],
            username=user_data["username"],
            mbti=user_data["mbti"],
            created_at=user_data["created_at"]
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"ユーザー情報取得中にエラーが発生しました: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="ユーザー情報の取得に失敗しました"
        )


@router.get("/count", response_model=int)
async def get_user_count():
    """
    登録済みユーザー数を取得する
    """
    users_ref = db.collection('users')
    users = users_ref.stream()
    count = 0
    for _ in users:
        count += 1
    return count