import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithCredential, 
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  User,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  connectAuthEmulator
} from 'firebase/auth';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { getIdToken } from 'firebase/auth';
import { Platform } from 'react-native';

// Firebase WebブラウザのリダイレクトURIを登録
WebBrowser.maybeCompleteAuthSession();

// Firebaseコンソールから取得した最新の設定
const firebaseConfig = {
  apiKey: "AIzaSyC3sNaRH5ghgMeaT6666wOB5K7BfV6w6L4",
  authDomain: "mbti-diary-458111.firebaseapp.com",
  projectId: "mbti-diary-458111",
  storageBucket: "mbti-diary-458111.firebasestorage.app",
  messagingSenderId: "1028553810221",
  appId: "1:1028553810221:web:7e1dddd4ac9f829d3bb3a4",
  measurementId: "G-5CG7KJ095K"
};

// Google認証用のクライアントID（Google Cloud ConsoleのOAuth認証情報で取得）
const webClientId = '1028553810221-qsj3v747jkq78bdvb0t85mctj2mfgvh3.apps.googleusercontent.com';

// Firebase App初期化 - シングルトンとして初期化
let app;
try {
  // 既に初期化されているかチェック（重複初期化を避けるため）
  if (typeof window !== 'undefined' && window.firebase) {
    console.log('Firebase既に初期化済み');
    app = window.firebase.app();
  } else {
    app = initializeApp(firebaseConfig);
    // グローバルスコープに保存（重複初期化を避けるため）
    if (typeof window !== 'undefined') {
      window.firebase = { app: () => app };
    }
    console.log('Firebase初期化成功');
  }
} catch (error) {
  console.error('Firebase初期化エラー:', error);
}

// Firebase Authentication
const auth = app ? getAuth(app) : null;

// デバッグ用：現在の認証状態をログ出力
if (auth) {
  console.log('認証インスタンス初期化完了, 現在のユーザー:', auth.currentUser?.email || 'なし');
}

// Google認証プロバイダーの設定
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('profile');
googleProvider.addScope('email');

// 認証デバッグログ用のリスナー設定
if (auth) {
  auth.onAuthStateChanged((user) => {
    if (user) {
      console.log('認証状態の変更: ユーザーがログインしました', user.email);
    } else {
      console.log('認証状態の変更: ユーザーがログアウトしました');
    }
  });
}

/**
 * Google認証を使用してサインインするための関数
 */
export const signInWithGoogle = async (): Promise<User | null> => {
  if (!auth) {
    console.error('認証インスタンスが初期化されていません');
    throw new Error('認証サービスが利用できません');
  }

  // 既にログインしているかチェック
  if (auth.currentUser) {
    console.log('既にログイン済みのユーザーです:', auth.currentUser.email);
    return auth.currentUser;
  }

  try {
    console.log('プラットフォーム:', Platform.OS);

    // Web環境での認証
    if (Platform.OS === 'web') {
      console.log('Web環境でFirebase認証を実行します');

      try {
        // リダイレクト認証の結果を確認
        const redirectResult = await getRedirectResult(auth);
        if (redirectResult && redirectResult.user) {
          console.log('リダイレクト認証成功:', redirectResult.user.email);
          return redirectResult.user;
        }

        // ポップアップ認証
        const result = await signInWithPopup(auth, googleProvider);
        console.log('ポップアップ認証成功:', result.user.email);
        return result.user;
      } catch (webError: any) {
        console.error('Web認証エラー:', webError.code, webError.message);
        console.error('エラー詳細:', JSON.stringify(webError, null, 2));

        // ポップアップがブロックされた場合などはリダイレクトにフォールバック
        if (webError.code === 'auth/popup-blocked') {
          console.log('ポップアップがブロックされました。リダイレクトに切り替えます。');
          await signInWithRedirect(auth, googleProvider);
          return null;
        }

        throw webError;
      }
    }
    // ネイティブ環境（iOS/Android）の場合はExpo AuthSessionを使用
    else {
      console.log('ネイティブ環境でExpo AuthSessionを使用します');

      // Googleウェブ認証用のリダイレクトURI
      const redirectUri = AuthSession.makeRedirectUri({ useProxy: true });
      console.log('リダイレクトURI:', redirectUri);

      // Google OAuth用のエンドポイント
      const discovery = {
        authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenEndpoint: 'https://oauth2.googleapis.com/token',
      };

      // 認証リクエストの設定
      const request = new AuthSession.AuthRequest({
        clientId: webClientId,
        redirectUri,
        responseType: AuthSession.ResponseType.Token,
        scopes: ['openid', 'profile', 'email'],
      });

      // 認証プロンプトを表示
      const result = await request.promptAsync(discovery, { useProxy: true });
      console.log('認証結果タイプ:', result.type);

      if (result.type === 'success') {
        // アクセストークンを取得（Firebaseに渡す用）
        const { access_token } = result.params;

        if (!access_token) {
          console.error('アクセストークンがありません');
          throw new Error('認証に失敗しました: アクセストークンがありません');
        }

        // Firebaseでアクセストークンを使って認証
        const credential = GoogleAuthProvider.credential(null, access_token);
        const userCredential = await signInWithCredential(auth, credential);
        console.log('ネイティブ認証成功:', userCredential.user.email);
        return userCredential.user;
      } else {
        console.log('認証キャンセルまたは失敗:', result);
        return null;
      }
    }
  } catch (error) {
    console.error('Google認証エラー:', error);
    throw error;
  }
};

/**
 * 現在のユーザーを取得する関数（非同期版）
 */
export const getCurrentUserAsync = (): Promise<User | null> => {
  console.log('getCurrentUserAsync関数が呼び出されました');
  return new Promise((resolve) => {
    if (!auth) {
      console.warn('認証インスタンスが初期化されていません');
      resolve(null);
      return;
    }

    // 現在のユーザーが既に取得できる場合は直ちに返す
    const currentUser = auth.currentUser;
    if (currentUser) {
      console.log('現在のユーザーが既に利用可能:', currentUser.email);
      resolve(currentUser);
      return;
    }

    // ユーザーがまだ読み込まれていない場合は、一時的にステータス変更リスナーを設定
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('認証状態変更により取得したユーザー:', user ? user.email : 'なし');
      unsubscribe(); // リスナーを解除
      resolve(user);
    });
  });
};

/**
 * 現在のユーザーを取得する関数
 * 注意: 非同期的な初期化の問題により、この関数はアプリ起動直後には正しい値を返さない場合があります
 * 確実にユーザー情報を取得するには getCurrentUserAsync() を使用してください
 */
export const getCurrentUser = (): User | null => {
  console.log('getCurrentUser関数が呼び出されました');
  console.log(auth);
  if (auth?.currentUser) {
    console.log('現在のユーザー情報:', auth.currentUser.email);
  } else {
    console.log('ユーザー情報はまだ読み込まれていません');
  }
  return auth ? auth.currentUser : null;
};

/**
 * 認証状態の変更を監視する関数
 */
export const onAuthStateChange = (callback: (user: User | null) => void): (() => void) => {
  if (!auth) {
    console.warn('認証インスタンスが初期化されていないため、認証状態の変更を監視できません');
    return () => {}; // 空の関数を返す
  }
  return onAuthStateChanged(auth, callback);
};

/**
 * ユーザーの認証トークンを取得する関数
 */
export const getAuthToken = async (): Promise<string | null> => {
  const user = await getCurrentUserAsync();
  console.log('現在のユーザー:', user ? user.email : 'なし');
  if (!user) return null;
  
  try {
    return await getIdToken(user, true);
  } catch (error) {
    console.error('認証トークン取得エラー:', error);
    return null;
  }
};

/**
 * サインアウトする関数
 */
export const signOut = async (): Promise<void> => {
  if (!auth) {
    console.warn('認証インスタンスが初期化されていないため、サインアウトできません');
    return;
  }
  
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('サインアウトエラー:', error);
    throw new Error('サインアウトに失敗しました');
  }
};