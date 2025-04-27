import Constants from 'expo-constants';

export type AnalyzeParams = {
  content: string;
};

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:8000/api/v1';
  }

  async analyzeDiary(params: AnalyzeParams): Promise<Response> {
    try {
      const response = await fetch(`${this.baseUrl}/diary/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });
      
      return response;
    } catch (error) {
      console.error('API Error:', error);
      throw new Error('サーバーへの接続に失敗しました。もう一度お試しください。');
    }
  }
}

export const apiClient = new ApiClient();