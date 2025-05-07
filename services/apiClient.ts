import Constants from 'expo-constants';
import { getAuthToken } from './firebaseService';

export type DiaryEntryParams = {
  content: string;
};

export type RegisterUserParams = {
  username: string;
  mbti: string;
  firebase_uid: string;  // firebaseUid から firebase_uid に変更
};

export type RegisterUserResponse = {
  userId: string;
  username: string;
  mbti: string;
};

export type DiaryAnalysisResponse = {
  id: string;
  content: string;
  dimensions: {
    EI: number;
    SN: number;
    TF: number;
    JP: number;
  };
  feedback: string;
  summary: string;
  created_at: string;
};

export type GrowthAdvice = {
  id: number;
  title: string;
  description: string;
};

export type GrowthAdviceResponse = {
  advice: GrowthAdvice[];
};

class ApiClient {
  private baseUrl: string;

  constructor() {
    // 環境に応じてAPIエンドポイントを選択
    if (__DEV__) {
      // 開発環境用 - ローカルのバックエンドを使用
      this.baseUrl = 'http://localhost:8000/api/v1';
      
      // 本番環境のエンドポイント
      // this.baseUrl = 'https://mbti-diary-backend-1028553810221.asia-northeast1.run.app/api/v1';
    } else {
      // 本番環境用
      this.baseUrl = 'https://mbti-diary-backend-1028553810221.asia-northeast1.run.app/api/v1';
    }
    
    console.log('APIクライアント初期化 - ベースURL:', this.baseUrl);
  }

  // 認証ヘッダーを生成する内部メソッド
  private async getAuthHeaders(): Promise<HeadersInit> {
    const token = await getAuthToken();
    console.log('認証トークン取得状態:', token ? '成功' : '失敗');
    
    // トークンが取得できた場合はその長さをログ出力（セキュリティのため一部のみ表示）
    if (token) {
      console.log(`認証トークンの長さ: ${token.length}文字, 先頭部分: ${token.substring(0, 10)}...`);
    } else {
      console.warn('認証トークンが取得できませんでした。未ログイン状態か、トークン取得に失敗した可能性があります。');
    }
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  async analyzeAndSaveDiary(params: DiaryEntryParams): Promise<DiaryAnalysisResponse> {
    try {
      const headers = await this.getAuthHeaders();
      const url = `${this.baseUrl}/diary/analyze-and-save`;
      
      console.log('API リクエスト送信:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ content: params.content }),
      });
      
      console.log('API レスポンスステータス:', response.status);
      
      // エラーレスポンスの詳細なハンドリング
      if (!response.ok) {
        if (response.status === 404) {
          console.error('APIエンドポイントが見つかりません (404):', url);
          throw new Error(`APIエンドポイントが見つかりません: ${url}`);
        }
        
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          console.error('エラーレスポンスの解析に失敗:', e);
          throw new Error(`API エラー (${response.status}): レスポンスを解析できませんでした`);
        }
        
        // サーバーからのエラーメッセージを保持
        const errorMessage = errorData.detail || '日記の分析・保存に失敗しました';
        console.error('サーバーエラー:', errorMessage);
        throw new Error(errorMessage);
      }
      
      return response.json();
    } catch (error) {
      console.error('日記分析エラー:', error);
      // エラーメッセージをそのまま再スロー
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('日記の分析・保存に失敗しました。もう一度お試しください。');
    }
  }

  async createUserAccount(params: RegisterUserParams): Promise<RegisterUserResponse> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}/users/register`, {
        method: 'POST',
        headers,
        body: JSON.stringify(params),
      });
      
      // 409 Conflictエラーの場合は、既存ユーザー情報を取得して返す
      if (response.status === 409) {
        console.log('ユーザーは既に登録されています。ユーザー情報を取得します。');
        return this.getUserProfile();
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.detail || 'ユーザー登録に失敗しました');
      }
      
      return response.json();
    } catch (error) {
      console.error('ユーザー登録エラー:', error);
      throw error instanceof Error ? error : new Error('ユーザー登録に失敗しました。もう一度お試しください。');
    }
  }
  
  // ユーザープロフィール情報を取得するメソッド
  async getUserProfile(): Promise<RegisterUserResponse> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}/users/me`, {
        headers
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'ユーザー情報の取得に失敗しました');
      }
      
      return response.json();
    } catch (error) {
      console.error('ユーザー情報取得エラー:', error);
      throw error instanceof Error ? error : new Error('ユーザー情報の取得に失敗しました。もう一度お試しください。');
    }
  }
  
  // 日記の履歴を取得するメソッド
  async getUserDiaries(limit: number = 10): Promise<DiaryAnalysisResponse[]> {
    try {
      const headers = await this.getAuthHeaders();
      console.log('API リクエスト送信:', limit);
      const response = await fetch(`${this.baseUrl}/diary/user?limit=${limit}`, {
        headers
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || '日記の取得に失敗しました');
      }
      
      return response.json();
    } catch (error) {
      console.error('日記取得エラー:', error);
      throw new Error('日記の取得に失敗しました。もう一度お試しください。');
    }
  }

  // のびしろ情報を取得するメソッド
  async getGrowthAdvice(): Promise<GrowthAdviceResponse> {
    try {
      const headers = await this.getAuthHeaders();
      console.log('のびしろ情報を取得します（認証ベースのエンドポイントを使用）');
      
      // 認証トークンを使用する新しいエンドポイントを使用
      const response = await fetch(`${this.baseUrl}/diary/user/growth`, {
        headers
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('のびしろ情報取得APIエラー:', response.status, errorData);
        throw new Error(errorData.detail || 'のびしろ情報の取得に失敗しました');
      }
      
      return response.json();
    } catch (error) {
      console.error('のびしろ情報取得エラー:', error);
      throw error instanceof Error ? error : new Error('のびしろ情報の取得に失敗しました。もう一度お試しください。');
    }
  }
}

export const apiClient = new ApiClient();