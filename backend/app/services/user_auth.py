"""
ユーザー認証関連のサービス
"""
from fastapi import Depends, HTTPException, status, Header, Request
from typing import Optional, Dict, Any
import logging
import firebase_admin
from firebase_admin import auth, credentials
from firebase_admin.auth import InvalidIdTokenError, ExpiredIdTokenError, RevokedIdTokenError

from app.database import db

# ロガーのセットアップ
logger = logging.getLogger(__name__)

async def verify_firebase_token(authorization: str = Header(None)) -> str:
    """
    Firebaseトークンを検証し、ユーザーIDを返す
    
    Args:
        authorization: Authorizationヘッダー (Bearer token)
        
    Returns:
        str: Firebase UID
        
    Raises:
        HTTPException: トークンが無効または期限切れの場合
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="認証トークンがありません",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    try:
        # Bearerトークンの形式を確認
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Bearerトークンの形式が不正です",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Firebaseトークンを検証
        try:
            decoded_token = auth.verify_id_token(token)
            uid = decoded_token.get("uid")
            if not uid:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="無効な認証トークンです",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            
            return uid
        except InvalidIdTokenError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="無効な認証トークンです",
                headers={"WWW-Authenticate": "Bearer"},
            )
        except ExpiredIdTokenError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="認証トークンの期限が切れています",
                headers={"WWW-Authenticate": "Bearer"},
            )
        except RevokedIdTokenError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="認証トークンが無効化されています",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except Exception as e:
        logger.error(f"トークン検証エラー: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="認証に失敗しました",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def get_current_user(firebase_uid: str = Depends(verify_firebase_token)) -> Dict[str, Any]:
    """
    認証済みのFirebase UIDからユーザー情報を取得する
    
    Args:
        firebase_uid: 検証済みのFirebase UID
    
    Returns:
        dict: ユーザー情報
        
    Raises:
        HTTPException: ユーザーが見つからない場合
    """
    try:
        # Firestoreでユーザー検索
        users_ref = db.collection('users')
        query = users_ref.where("firebase_uid", "==", firebase_uid).limit(1)
        users = list(query.stream())
        
        if not users:
            # ユーザーが見つからない場合は404エラー
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="ユーザーが見つかりません。アプリでユーザー登録を完了してください。"
            )
        
        # ユーザーデータを返す
        return users[0].to_dict()
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"ユーザー情報取得エラー: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="ユーザー情報の取得中にエラーが発生しました"
        )