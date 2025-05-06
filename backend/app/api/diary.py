from fastapi import APIRouter, HTTPException, Depends, Query, Path
from typing import List, Optional, Dict, Any
import logging
from datetime import datetime
from firebase_admin import firestore

from app.models.diary import DiaryEntry, DiaryAnalysis, DiaryRecord, DiaryResponse
from app.database import db
from app.services.user_auth import verify_firebase_token, get_current_user
from app.services.dify_api import DifyAPIService
from app.config import settings

# ロガーのセットアップ
logger = logging.getLogger(__name__)

# Dify APIサービスのインスタンス化
dify_service = DifyAPIService(api_key=settings.DIFY_API_KEY)

router = APIRouter()

@router.post("/diary/analyze-and-save", response_model=DiaryResponse)
async def analyze_and_save_diary(entry: DiaryEntry, firebase_uid: str = Depends(verify_firebase_token)):
    """
    日記を分析して結果をデータベースに保存し、分析結果と保存情報を返す
    
    Args:
        entry: 日記の内容
        firebase_uid: 認証済みのFirebase UID
    """
    try:
        # Firebase UIDからユーザー情報を取得
        users_ref = db.collection('users')
        query = users_ref.where("firebase_uid", "==", firebase_uid).limit(1)
        users = list(query.stream())
        
        if not users:
            raise HTTPException(
                status_code=404,
                detail="ユーザーが見つかりません。アプリでユーザー登録を完了してください。"
            )
        
        user_data = users[0].to_dict()
        user_id = user_data["id"]
        
        # 日記のテキストをDify APIを使って分析
        logger.info(f"ユーザー {user_id} の日記を分析します（文字数: {len(entry.content)}）")
        mbti_data = dify_service.analyze_diary(entry.content)
        
        # 分析結果をモデルに変換
        analysis = DiaryAnalysis(
            dimensions=mbti_data["dimensions"],
            feedback=mbti_data["feedback"],
            summary=mbti_data["summary"]
        )
        
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
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"日記の分析・保存中にエラーが発生しました: {str(e)}")
        # スタックトレースを出力して詳細なデバッグ情報を提供
        import traceback
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"日記の分析・保存中にエラーが発生しました: {str(e)}")

# 後方互換性のために残しておく（非推奨）
@router.post("/diary/analyze", response_model=DiaryAnalysis, deprecated=True)
async def analyze_diary(entry: DiaryEntry, firebase_uid: str = Depends(verify_firebase_token)):
    """
    日記を分析してMBTIスコアを返す（非推奨：代わりにanalyze-and-saveを使用してください）
    """
    try:
        # Dify APIを使用して分析
        mbti_data = dify_service.analyze_diary(entry.content)
        
        analysis = DiaryAnalysis(
            dimensions=mbti_data["dimensions"],
            feedback=mbti_data["feedback"],
            summary=mbti_data["summary"]
        )
        
        logger.warning("非推奨の/diary/analyzeエンドポイントが使用されました。代わりにanalyze-and-saveを使用してください。")
        
        return analysis
    except Exception as e:
        logger.error(f"Error analyzing diary: {str(e)}")
        raise HTTPException(status_code=500, detail="分析中にエラーが発生しました")

@router.get("/diary/user", response_model=List[DiaryResponse])
async def get_current_user_diaries(limit: int = Query(10), firebase_uid: str = Depends(verify_firebase_token)):
    """
    現在認証されているユーザーの日記一覧を取得する
    
    Args:
        limit: 取得する日記の最大数
        firebase_uid: 認証済みのFirebase UID
    """
    try:
        # Firebase UIDからユーザー情報を取得
        users_ref = db.collection('users')
        query = users_ref.where("firebase_uid", "==", firebase_uid).limit(1)
        users = list(query.stream())
        
        if not users:
            raise HTTPException(
                status_code=404,
                detail="ユーザーが見つかりません。アプリでユーザー登録を完了してください。"
            )
        
        user_data = users[0].to_dict()
        user_id = user_data["id"]
        
        logger.info(f"ユーザー {user_id} の日記を取得します（上限: {limit}件）")
        
        try:
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
                    logger.debug(f"日記データ取得: ID={doc.id}, キー={list(diary_data.keys())}")
                    
                    # 必須フィールドの存在確認
                    required_fields = ['id', 'content', 'dimensions', 'feedback', 'summary']
                    missing_fields = [field for field in required_fields if field not in diary_data]
                    
                    if missing_fields:
                        logger.warning(f"日記データに不足フィールドがあります: {missing_fields}, ID={doc.id}")
                        # 不足フィールドを持つレコードは無視して次に進む
                        continue
                    
                    # Firestoreのタイムスタンプをdatetimeに変換
                    created_at = datetime.now()  # デフォルト値を設定
                    
                    if 'created_at' in diary_data:
                        timestamp_value = diary_data['created_at']
                        logger.debug(f"created_at の型: {type(timestamp_value)}")
                        
                        if isinstance(timestamp_value, datetime):
                            created_at = timestamp_value
                        elif hasattr(timestamp_value, 'timestamp'):
                            # Firestoreタイムスタンプ
                            try:
                                # タイムスタンプはすでに数値（秒）なので、そのままdatetimeに変換
                                timestamp_seconds = timestamp_value.timestamp()
                                created_at = datetime.fromtimestamp(timestamp_seconds)
                            except Exception as ts_error:
                                logger.warning(f"タイムスタンプ変換エラー: {str(ts_error)}")
                        elif isinstance(timestamp_value, (int, float)):
                            # UNIX タイムスタンプの場合
                            try:
                                created_at = datetime.fromtimestamp(timestamp_value)
                            except Exception as ts_error:
                                logger.warning(f"UNIXタイムスタンプ変換エラー: {str(ts_error)}")
                    
                    # 次元データの検証
                    dimensions = diary_data.get('dimensions', {})
                    if not isinstance(dimensions, dict):
                        logger.warning(f"dimensions が辞書型ではありません: {type(dimensions)}")
                        dimensions = {}
                    
                    # 欠損している次元を補完
                    dimension_keys = ['EI', 'SN', 'TF', 'JP']
                    for key in dimension_keys:
                        if key not in dimensions:
                            logger.warning(f"次元 {key} が欠損しています。デフォルト値 50 を設定します。")
                            dimensions[key] = 50.0
                    
                    # DiaryResponseオブジェクトの作成
                    diary_response = DiaryResponse(
                        id=diary_data.get('id', doc.id),  # IDがない場合はドキュメントIDを使用
                        content=diary_data.get('content', ''),
                        dimensions=dimensions,
                        feedback=diary_data.get('feedback', ''),
                        summary=diary_data.get('summary', ''),
                        created_at=created_at
                    )
                    
                    diaries.append(diary_response)
                    logger.debug(f"日記エントリーを追加しました: ID={diary_response.id}")
                    
                except Exception as item_error:
                    logger.warning(f"日記アイテム処理中にエラー: {str(item_error)}")
                    logger.warning(f"問題のあるデータ: {diary_data if 'diary_data' in locals() else 'データなし'}")
                    # 不正なアイテムはスキップして次へ
                    continue
            
            logger.info(f"取得完了: {len(diaries)}件の日記を取得しました")
            return diaries
                
        except Exception as query_error:
            error_msg = str(query_error)
            logger.error(f"クエリ実行エラー: {error_msg}")
            
            # Firestoreのインデックスエラーを検出
            if "The query requires an index" in error_msg and "https://console.firebase.google.com" in error_msg:
                # インデックスのURLを抽出
                import re
                index_url_match = re.search(r'(https://console\.firebase\.google\.com[^\s]+)', error_msg)
                index_url = index_url_match.group(1) if index_url_match else "Firebaseコンソールでインデックスを作成してください"
                
                raise HTTPException(
                    status_code=500, 
                    detail=f"Firestoreのインデックスが必要です。次のURLからインデックスを作成してください: {index_url}"
                )
            
            # インデックスエラー以外の場合は再スロー
            raise
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"日記の取得中にエラーが発生しました: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail="日記の取得中にエラーが発生しました")

# 認証済みユーザーのビスろ情報を取得するエンドポイント
@router.get("/diary/user/growth", response_model=Dict[str, Any])
async def get_current_user_growth_advice(firebase_uid: str = Depends(verify_firebase_token)):
    """
    現在認証されているユーザーののびしろ情報を取得する
    
    Args:
        firebase_uid: 認証済みのFirebase UID
    """
    try:
        # Firebase UIDからユーザー情報を取得
        users_ref = db.collection('users')
        query = users_ref.where("firebase_uid", "==", firebase_uid).limit(1)
        users = list(query.stream())
        
        if not users:
            raise HTTPException(
                status_code=404,
                detail="ユーザーが見つかりません。アプリでユーザー登録を完了してください。"
            )
        
        user_data = users[0].to_dict()
        user_id = user_data["id"]
        
        logger.info(f"ユーザー {user_id} ののびしろ情報を取得します")
        
        # Dify APIを使用してのびしろ情報を取得
        growth_data = dify_service.get_growth_advice(user_id)
        
        logger.info(f"のびしろ情報取得成功: ユーザー {user_id}")
        
        return growth_data
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"のびしろ情報の取得中にエラーが発生しました: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail="のびしろ情報の取得中にエラーが発生しました")

# 後方互換性のために古いエンドポイントも残しつつ、非推奨とマークする
@router.get("/diary/user/{user_id}", response_model=List[DiaryResponse], deprecated=True)
async def get_user_diaries_deprecated(user_id: str = Path(...), limit: int = Query(10)):
    """
    特定ユーザーの日記一覧を取得する（非推奨：代わりに認証付きの/diary/userを使用してください）
    """
    logger.warning(f"非推奨の/diary/user/{user_id}エンドポイントが使用されました。")
    try:
        # ユーザーが存在するか確認
        user_ref = db.collection('users').document(user_id)
        user_doc = user_ref.get()
        
        if not user_doc.exists:
            raise HTTPException(status_code=404, detail="ユーザーが見つかりません")
        
        logger.info(f"ユーザー {user_id} の日記を取得します（上限: {limit}件）")
        
        try:
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
                    logger.debug(f"日記データ取得: ID={doc.id}, キー={list(diary_data.keys())}")
                    
                    # 必須フィールドの存在確認
                    required_fields = ['id', 'content', 'dimensions', 'feedback', 'summary']
                    missing_fields = [field for field in required_fields if field not in diary_data]
                    
                    if missing_fields:
                        logger.warning(f"日記データに不足フィールドがあります: {missing_fields}, ID={doc.id}")
                        # 不足フィールドを持つレコードは無視して次に進む
                        continue
                    
                    # Firestoreのタイムスタンプをdatetimeに変換
                    created_at = datetime.now()  # デフォルト値を設定
                    
                    if 'created_at' in diary_data:
                        timestamp_value = diary_data['created_at']
                        logger.debug(f"created_at の型: {type(timestamp_value)}")
                        
                        if isinstance(timestamp_value, datetime):
                            created_at = timestamp_value
                        elif hasattr(timestamp_value, 'timestamp'):
                            # Firestoreタイムスタンプ
                            try:
                                # タイムスタンプはすでに数値（秒）なので、そのままdatetimeに変換
                                timestamp_seconds = timestamp_value.timestamp()
                                created_at = datetime.fromtimestamp(timestamp_seconds)
                            except Exception as ts_error:
                                logger.warning(f"タイムスタンプ変換エラー: {str(ts_error)}")
                        elif isinstance(timestamp_value, (int, float)):
                            # UNIX タイムスタンプの場合
                            try:
                                created_at = datetime.fromtimestamp(timestamp_value)
                            except Exception as ts_error:
                                logger.warning(f"UNIXタイムスタンプ変換エラー: {str(ts_error)}")
                    
                    # 次元データの検証
                    dimensions = diary_data.get('dimensions', {})
                    if not isinstance(dimensions, dict):
                        logger.warning(f"dimensions が辞書型ではありません: {type(dimensions)}")
                        dimensions = {}
                    
                    # 欠損している次元を補完
                    dimension_keys = ['EI', 'SN', 'TF', 'JP']
                    for key in dimension_keys:
                        if key not in dimensions:
                            logger.warning(f"次元 {key} が欠損しています。デフォルト値 50 を設定します。")
                            dimensions[key] = 50.0
                    
                    # DiaryResponseオブジェクトの作成
                    diary_response = DiaryResponse(
                        id=diary_data.get('id', doc.id),  # IDがない場合はドキュメントIDを使用
                        content=diary_data.get('content', ''),
                        dimensions=dimensions,
                        feedback=diary_data.get('feedback', ''),
                        summary=diary_data.get('summary', ''),
                        created_at=created_at
                    )
                    
                    diaries.append(diary_response)
                    logger.debug(f"日記エントリーを追加しました: ID={diary_response.id}")
                    
                except Exception as item_error:
                    logger.warning(f"日記アイテム処理中にエラー: {str(item_error)}")
                    logger.warning(f"問題のあるデータ: {diary_data if 'diary_data' in locals() else 'データなし'}")
                    # 不正なアイテムはスキップして次へ
                    continue
            
            logger.info(f"取得完了: {len(diaries)}件の日記を取得しました")
            return diaries
                
        except Exception as query_error:
            error_msg = str(query_error)
            logger.error(f"クエリ実行エラー: {error_msg}")
            
            # Firestoreのインデックスエラーを検出
            if "The query requires an index" in error_msg and "https://console.firebase.google.com" in error_msg:
                # インデックスのURLを抽出
                import re
                index_url_match = re.search(r'(https://console\.firebase\.google\.com[^\s]+)', error_msg)
                index_url = index_url_match.group(1) if index_url_match else "Firebaseコンソールでインデックスを作成してください"
                
                raise HTTPException(
                    status_code=500, 
                    detail=f"Firestoreのインデックスが必要です。次のURLからインデックスを作成してください: {index_url}"
                )
            
            # インデックスエラー以外の場合は再スロー
            raise
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"日記の取得中にエラーが発生しました: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail="日記の取得中にエラーが発生しました")

# 後方互換性のために古いエンドポイントも残しつつ、非推奨とマークする
@router.get("/diary/user/growth/{user_id}", response_model=Dict[str, Any], deprecated=True)
async def get_user_growth_advice_deprecated(user_id: str = Path(...)):
    """
    ユーザーののびしろ情報を取得する（非推奨：代わりに認証付きの/diary/user/growthを使用してください）
    """
    logger.warning(f"非推奨の/diary/user/growth/{user_id}エンドポイントが使用されました。")
    try:
        # ユーザーが存在するか確認
        user_ref = db.collection('users').document(user_id)
        user_doc = user_ref.get()
        
        if not user_doc.exists:
            raise HTTPException(status_code=404, detail="ユーザーが見つかりません")
        
        logger.info(f"ユーザー {user_id} ののびしろ情報を取得します")
        
        # Dify APIを使用してのびしろ情報を取得
        growth_data = dify_service.get_growth_advice(user_id)
        
        logger.info(f"のびしろ情報取得成功: ユーザー {user_id}")
        
        return growth_data
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"のびしろ情報の取得中にエラーが発生しました: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail="のびしろ情報の取得中にエラーが発生しました")

# 後方互換性のためにリダイレクト用のエンドポイント（非推奨）
@router.get("/growth/{user_id}", response_model=Dict[str, Any], deprecated=True)
async def legacy_get_growth_advice(user_id: str = Path(...)):
    """
    ユーザーののびしろ情報を取得する（非推奨: /diary/user/growthを使用してください）
    """
    logger.warning(f"非推奨の/growth/{user_id}エンドポイントが使用されました。")
    try:
        # ユーザーが存在するか確認
        user_ref = db.collection('users').document(user_id)
        user_doc = user_ref.get()
        
        if not user_doc.exists:
            raise HTTPException(status_code=404, detail="ユーザーが見つかりません")
        
        logger.info(f"ユーザー {user_id} ののびしろ情報を取得します")
        
        # Dify APIを使用してのびしろ情報を取得
        growth_data = dify_service.get_growth_advice(user_id)
        
        logger.info(f"のびしろ情報取得成功: ユーザー {user_id}")
        
        return growth_data
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"のびしろ情報の取得中にエラーが発生しました: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail="のびしろ情報の取得中にエラーが発生しました")
```