import firebase_admin
from firebase_admin import credentials, firestore
import os
import logging
import sys
import google.api_core.exceptions
from pathlib import Path

from ..config import settings

# ロガーのセットアップを強化
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)  # デバッグレベルに設定

# コンソールへのハンドラを追加
handler = logging.StreamHandler(sys.stdout)
handler.setLevel(logging.DEBUG)
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)
logger.addHandler(handler)

def initialize_firebase():
    """Firebase Admin SDKの初期化"""
    try:
        # Firebase認証情報パスの取得
        cred_path = settings.FIREBASE_CREDENTIALS_PATH
        logger.debug(f"Firebase認証情報ファイルパス: {cred_path}")
        
        # 認証情報ファイルが存在するか確認
        if not os.path.exists(cred_path):
            logger.error(f"Firebase認証情報ファイルが見つかりません: {cred_path}")
            raise FileNotFoundError(f"Firebase認証情報ファイルが見つかりません: {cred_path}")
        
        logger.debug("認証情報ファイルが存在することを確認しました")
        
        # 認証情報を読み込み
        cred = credentials.Certificate(cred_path)
        logger.debug(f"認証情報を読み込みました: プロジェクトID={cred.project_id}")
        
        # Firebase初期化をシンプルに行う
        # 注: 複数のオプションを指定するとエラーが発生する可能性があるため、シンプルにする
        firebase_admin.initialize_app(cred)
        logger.debug("Firebase Admin SDKを初期化しました")
        
        # Firestoreクライアント
        db = firestore.client()
        logger.debug("Firestoreクライアントを取得しました")
        
        # 実際にデータを書き込むテストを行ってみる
        try:
            logger.debug("テストデータの書き込みを試みます")
            test_ref = db.collection('_test_connection').document('test_doc')
            test_ref.set({'timestamp': firestore.SERVER_TIMESTAMP})
            logger.info("テストデータの書き込みに成功しました！データベース接続は正常です")
            # テストデータを削除
            test_ref.delete()
            logger.debug("テストデータを削除しました")
        except Exception as e:
            logger.warning(f"テストデータの書き込みに失敗しました: {str(e)}")
            # 読み取りだけでも試してみる
            try:
                logger.debug("代わりに読み取りテストを試みます")
                db.collection('_test_connection').limit(1).get()
                logger.info("読み取りテストに成功しました！データベース接続は正常です")
            except google.api_core.exceptions.NotFound:
                # コレクションが見つからないのは問題なし
                logger.info("コレクションは存在しませんが、接続テストは成功しました")
            except Exception as read_error:
                logger.error(f"読み取りテストにも失敗しました: {str(read_error)}")
                raise
                
        return db
    except google.api_core.exceptions.PermissionDenied as pde:
        logger.error(f"Firestoreにアクセスする権限がありません: {str(pde)}")
        logger.error("サービスアカウントの権限を確認してください。")
        raise
    except google.api_core.exceptions.ResourceExhausted as ree:
        logger.error(f"Firestoreのクォータを超過しました: {str(ree)}")
        raise
    except google.api_core.exceptions.FailedPrecondition as fpe:
        logger.error(f"前提条件エラーの詳細: {str(fpe)}")
        if "The database (default) does not exist" in str(fpe):
            logger.critical(
                "Firestoreデータベースが存在しません。Firebaseコンソールで確認してください。\n"
                "1) https://console.firebase.google.com/project/mbti-diary-458111/firestore\n"
                "2) データベースが作成されていない場合は、「データベースの作成」ボタンをクリックしてください\n"
                "3) usersではなく「本番環境モード」でFirestoreデータベースを作成してください\n"
                "注意: プロジェクトID「mbti-diary-458111」で作成していることを確認してください"
            )
        else:
            logger.error(f"Firestoreの前提条件エラー: {str(fpe)}")
        raise
    except Exception as e:
        logger.error(f"Firebase初期化エラー: {type(e).__name__}: {str(e)}")
        raise

# Firebase初期化（モジュールインポート時に実行される）
db = None
try:
    logger.info("Firebase初期化を開始します")
    db = initialize_firebase()
    if db:
        logger.info("Firebase初期化に成功しました - データベース接続OK")
except Exception as e:
    logger.error(f"Firebase初期化に失敗しました: {str(e)}")
    # アプリケーション起動は続行（ただしFirestoreを使う機能は動作しない）