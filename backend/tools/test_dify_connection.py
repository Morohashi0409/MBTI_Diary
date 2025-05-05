#!/usr/bin/env python3
"""
Dify API接続テストスクリプト
"""
import requests
import json
import sys
import os
from dotenv import load_dotenv

# .env ファイルがあれば読み込む
load_dotenv()

# 環境変数からAPIキーを取得するか、デフォルト値を使用
DIFY_API_KEY = os.getenv("DIFY_API_KEY", "app-tfRmkpyv8gsTxJFpH9gOGR2H")

def test_dify_connection():
    """Dify APIへの接続テスト"""
    print(f"Dify API接続テストを開始します...")
    print(f"APIキー: {DIFY_API_KEY[:5]}...{DIFY_API_KEY[-4:]} (セキュリティのため一部のみ表示)")
    
    # 接続テスト用のシンプルなテキスト
    test_text = "今日は良い天気でした。散歩に行って気分転換しました。"
    
    # APIエンドポイント設定 - Difyの3つの主要エンドポイントをテスト
    base_url = "https://api.dify.ai/v1"
    endpoints = [
        "/chat-messages",
        "/completion-messages",
        "/workflows/run"
    ]
    
    # リクエストヘッダー
    headers = {
        "Authorization": f"Bearer {DIFY_API_KEY}",
        "Content-Type": "application/json"
    }
    
    # 各エンドポイントをテスト
    for endpoint in endpoints:
        full_url = f"{base_url}{endpoint}"
        print(f"\n==== エンドポイント {full_url} をテスト中... ====")
        
        # リクエストボディ - シンプルにテキストのみ
        if endpoint == "/chat-messages":
            payload = {
                "query": test_text,
                "response_mode": "blocking",
                "user": "test-user"
            }
        elif endpoint == "/completion-messages":
            payload = {
                "query": test_text,
                "response_mode": "blocking",
                "user": "test-user"
            }
        else:  # workflows/run
            payload = {
                "inputs": {
                    "text": test_text
                },
                "response_mode": "blocking",
                "user": "test-user"
            }
        
        try:
            print(f"リクエスト送信: {json.dumps(payload, ensure_ascii=False)}")
            response = requests.post(full_url, headers=headers, json=payload)
            
            print(f"ステータスコード: {response.status_code}")
            
            if response.status_code == 200:
                print("✅ 接続成功!")
                print(f"レスポンス: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
            else:
                print("❌ 接続失敗")
                print(f"エラーレスポンス: {response.text}")
        except Exception as e:
            print(f"❌ 例外が発生しました: {e}")
    
    print("\n===== すべてのテストが完了しました =====")
    print("問題がある場合は以下を確認してください:")
    print("1. APIキーの有効性 - Dify管理画面でキーが有効か確認")
    print("2. アプリ/ワークフローの設定 - 適切なエンドポイントが選択されているか確認")
    print("3. ネットワーク接続 - インターネット接続やプロキシ設定を確認")

if __name__ == "__main__":
    # コマンドライン引数からAPIキーを取得（指定されている場合）
    if len(sys.argv) > 1:
        DIFY_API_KEY = sys.argv[1]
        print(f"コマンドライン引数からAPIキーを取得しました")
    
    test_dify_connection()