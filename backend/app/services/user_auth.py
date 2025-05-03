"""
ユーザー認証関連のサービス
"""
from fastapi import Depends, HTTPException, status
from typing import Optional
import logging

from app.database import db

# ロガーのセットアップ
logger = logging.getLogger(__name__)

async def get_current_user(user_id: str) -> dict:
    """
    ユーザーIDからユーザー情報を取得する
    今後の拡張でトークン認証などを実装する際に拡張可能
    
    Returns:
        dict: ユーザー情報
    Raises:
        HTTPException: ユーザーが存在しない場合
    """
    try:
        user_ref = db.collection('users').document(user_id)
        user_doc = user_ref.get()
        
        if not user_doc.exists:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="ユーザーが見つかりません"
            )
        
        return user_doc.to_dict()
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"ユーザー認証エラー: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="認証中にエラーが発生しました"
        )