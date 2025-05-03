from fastapi import APIRouter, HTTPException, Depends, Query, Path
from typing import List, Optional
import random
import logging
from datetime import datetime
from firebase_admin import firestore

from app.models.diary import DiaryEntry, DiaryAnalysis, DiaryRecord, DiaryResponse
from app.database import db
from app.services.user_auth import get_current_user

# ロガーのセットアップ
logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/diary/analyze-and-save", response_model=DiaryResponse)
async def analyze_and_save_diary(entry: DiaryEntry, user_id: str = Query(...)):
    """
    日記を分析して結果をデータベースに保存し、分析結果と保存情報を返す
    """
    try:
        # デモ用のランダムスコア生成
        analysis = DiaryAnalysis(
            dimensions={
                "EI": random.uniform(0, 100),
                "SN": random.uniform(0, 100),
                "TF": random.uniform(0, 100),
                "JP": random.uniform(0, 100)
            },
            feedback="あなたの日記からは、内向的な傾向が見られます。また、直感的な思考パターンも観察されます。感情に基づく意思決定を重視する傾向があり、柔軟な対応を好む特徴が示されています。",
            summary="あなたの文章からは、INFPタイプの特徴が見られます。内省的で、真摯さを重んじ、状況に応じて柔軟に対応できる傾向があります。"
        )
        
        # ユーザーが存在するか確認
        user_ref = db.collection('users').document(user_id)
        user_doc = user_ref.get()
        
        logger.info(f"ユーザー確認 - ID: {user_id}, 存在: {user_doc.exists}")
        
        if not user_doc.exists:
            # ユーザーが存在しない場合、まずユーザー情報を登録してから続行
            logger.warning(f"ユーザーが見つかりません（ID: {user_id}）。新しいユーザーとして登録します。")
            
            # シンプルなユーザー情報を作成
            temp_user_data = {
                "id": user_id,
                "username": f"User_{user_id[:8]}",  # IDの先頭8文字をデフォルトユーザー名として使用
                "mbti": "未設定",
                "created_at": firestore.SERVER_TIMESTAMP
            }
            
            # ユーザー情報を保存
            try:
                user_ref.set(temp_user_data)
                logger.info(f"仮ユーザーを作成しました: {user_id}")
            except Exception as user_error:
                logger.error(f"仮ユーザー作成に失敗しました: {str(user_error)}")
                # ユーザー作成に失敗した場合でもエラーにせず、日記の分析と保存を続行
        
        # 日記データを作成
        diary_record = DiaryRecord.create(
            user_id=user_id,
            content=entry.content,
            analysis=analysis
        )
        
        # Firestoreでのシリアル化のために、datetimeをFirestoreのタイムスタンプに変換
        diary_data = {
            "id": diary_record.id,
            "user_id": diary_record.user_id,
            "content": diary_record.content,
            "dimensions": diary_record.dimensions,
            "feedback": diary_record.feedback,
            "summary": diary_record.summary,
            "created_at": firestore.SERVER_TIMESTAMP  # サーバーサイドのタイムスタンプを使用
        }
        
        # Firestoreに保存
        db.collection('diaries').document(diary_record.id).set(diary_data)
        
        logger.info(f"日記を分析・保存しました - ID: {diary_record.id}, ユーザー: {user_id}")
        
        # レスポンスを作成 - クライアント側ではタイムスタンプが必要なので現在時刻を使用
        current_time = datetime.now()
        return DiaryResponse(
            id=diary_record.id,
            content=diary_record.content,
            dimensions=diary_record.dimensions,
            feedback=diary_record.feedback,
            summary=diary_record.summary,
            created_at=current_time
        )
    except Exception as e:
        logger.error(f"日記の分析・保存中にエラーが発生しました: {str(e)}")
        # スタックトレースを出力して詳細なデバッグ情報を提供
        import traceback
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"日記の分析・保存中にエラーが発生しました: {str(e)}")

# 後方互換性のために残しておく（非推奨）
@router.post("/diary/analyze", response_model=DiaryAnalysis, deprecated=True)
async def analyze_diary(entry: DiaryEntry, user_id: Optional[str] = Query(None)):
    """
    日記を分析してMBTIスコアを返す（非推奨：代わりにanalyze-and-saveを使用してください）
    """
    try:
        # デモ用のランダムスコア生成
        analysis = DiaryAnalysis(
            dimensions={
                "EI": random.uniform(0, 100),
                "SN": random.uniform(0, 100),
                "TF": random.uniform(0, 100),
                "JP": random.uniform(0, 100)
            },
            feedback="あなたの日記からは、内向的な傾向が見られます。また、直感的な思考パターンも観察されます。感情に基づく意思決定を重視する傾向があり、柔軟な対応を好む特徴が示されています。",
            summary="あなたの文章からは、INFPタイプの特徴が見られます。内省的で、真摯さを重んじ、状況に応じて柔軟に対応できる傾向があります。"
        )
        
        logger.warning("非推奨の/diary/analyzeエンドポイントが使用されました。代わりにanalyze-and-saveを使用してください。")
        
        return analysis
    except Exception as e:
        logger.error(f"Error analyzing diary: {str(e)}")
        raise HTTPException(status_code=500, detail="分析中にエラーが発生しました")

# 後方互換性のために残しておく（非推奨）
@router.post("/diary/save", response_model=DiaryResponse, deprecated=True)
async def save_diary(entry: DiaryEntry, user_id: str = Query(...)):
    """
    日記を分析して結果をデータベースに保存する（非推奨：代わりにanalyze-and-saveを使用してください）
    """
    try:
        # 新しいエンドポイントにリダイレクト
        return await analyze_and_save_diary(entry, user_id)
    except Exception as e:
        logger.error(f"日記の保存中にエラーが発生しました: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"日記の保存中にエラーが発生しました: {str(e)}")

@router.get("/diary/user/{user_id}", response_model=List[DiaryResponse])
async def get_user_diaries(user_id: str = Path(...), limit: int = Query(10)):
    """
    特定ユーザーの日記一覧を取得する
    """
    try:
        # ユーザーが存在するか確認
        user_ref = db.collection('users').document(user_id)
        user_doc = user_ref.get()
        
        if not user_doc.exists:
            raise HTTPException(status_code=404, detail="ユーザーが見つかりません")
        
        # 日記データを取得（作成日時の降順）
        diary_docs = db.collection('diaries')\
            .where('user_id', '==', user_id)\
            .order_by('created_at', direction='DESCENDING')\
            .limit(limit)\
            .stream()
        
        diaries = []
        for doc in diary_docs:
            try:
                diary_data = doc.to_dict()
                # Firestoreのタイムスタンプをdatetimeに変換
                created_at = None
                if 'created_at' in diary_data:
                    if isinstance(diary_data['created_at'], datetime):
                        created_at = diary_data['created_at']
                    else:
                        # Firestoreのタイムスタンプオブジェクトの場合
                        try:
                            created_at = diary_data['created_at'].datetime()
                        except AttributeError:
                            # SERVER_TIMESTAMPが処理されていない場合
                            created_at = datetime.now()
                else:
                    created_at = datetime.now()
                    
                diaries.append(DiaryResponse(
                    id=diary_data['id'],
                    content=diary_data['content'],
                    dimensions=diary_data['dimensions'],
                    feedback=diary_data['feedback'],
                    summary=diary_data['summary'],
                    created_at=created_at
                ))
            except Exception as item_error:
                logger.warning(f"日記アイテム処理中にエラー: {str(item_error)}, データ: {diary_data}")
                # 不正なアイテムはスキップして次へ
                continue
        
        return diaries
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"日記の取得中にエラーが発生しました: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail="日記の取得中にエラーが発生しました")