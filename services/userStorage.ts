import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from 'firebase/auth';
import { getCurrentUser, onAuthStateChange } from './firebaseService';

// ストレージのキー定義
const USER_KEY = '@mbti_diary_user';
const MBTI_PROFILE_KEY = '@mbti_diary_mbti_profile';
const USER_ID_KEY = '@mbti_diary_user_id';
const AUTH_STATE_KEY = '@mbti_diary_auth_state'; // 認証状態保存用の新しいキー

export type UserProfile = {
  userId: string;
  username: string;
  mbti: string;
};

export type MBTIProfile = {
  mbti: string;
  username: string;
  userId?: string; // ユーザーIDもオプションで保存
};

/**
 * MBTIプロファイル情報を保存する
 */
export const saveMBTIProfile = async (profile: MBTIProfile): Promise<void> => {
  try {
    // 現在のFirebaseユーザーがあれば、そのIDもプロファイルに保存
    const user = getCurrentUser();
    if (user && !profile.userId) {
      profile = { ...profile, userId: user.uid };
    }

    const jsonValue = JSON.stringify(profile);
    await AsyncStorage.setItem(MBTI_PROFILE_KEY, jsonValue);
    
    // ユーザーIDも別途保存（冗長化のため）
    if (profile.userId) {
      await saveUserId(profile.userId);
    }

    // 認証済み状態を保存
    await saveAuthState(true);

    console.log('MBTIプロファイル情報を保存しました:', profile);
  } catch (error) {
    console.error('MBTIプロファイル情報の保存に失敗しました:', error);
    throw new Error('プロファイル情報の保存に失敗しました');
  }
};

/**
 * MBTIプロファイル情報を取得する
 */
export const getMBTIProfile = async (): Promise<MBTIProfile | null> => {
  try {
    const jsonValue = await AsyncStorage.getItem(MBTI_PROFILE_KEY);
    const profile = jsonValue !== null ? JSON.parse(jsonValue) : null;
    
    // 認証状態を確認
    const isAuthenticated = await getAuthState();
    
    // 認証済みかつプロファイルがある場合のみ返す
    if (isAuthenticated && profile) {
      console.log('保存済みのMBTIプロファイル情報を取得:', profile);
      return profile;
    } else if (profile) {
      console.log('プロファイル情報はあるが認証状態がない');
    }
    
    return null;
  } catch (error) {
    console.error('MBTIプロファイル情報の取得に失敗しました:', error);
    return null;
  }
};

/**
 * 認証状態を保存する
 */
export const saveAuthState = async (isAuthenticated: boolean): Promise<void> => {
  try {
    await AsyncStorage.setItem(AUTH_STATE_KEY, JSON.stringify(isAuthenticated));
    console.log('認証状態を保存しました:', isAuthenticated);
  } catch (error) {
    console.error('認証状態の保存に失敗しました:', error);
  }
};

/**
 * 認証状態を取得する
 */
export const getAuthState = async (): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem(AUTH_STATE_KEY);
    // Firebaseユーザーがいる場合は認証状態とみなす
    const user = getCurrentUser();
    if (user) {
      // Firebaseユーザーがいる場合は認証状態を更新しておく
      await saveAuthState(true);
      return true;
    }
    return value === 'true' || value === '"true"';
  } catch (error) {
    console.error('認証状態の取得に失敗しました:', error);
    return false;
  }
};

/**
 * ユーザーとプロファイル情報を結合して完全なプロファイルを作成
 */
export const getUserProfile = async (): Promise<UserProfile | null> => {
  const user = getCurrentUser();
  
  try {
    // MBTIプロファイル情報を取得
    const mbtiProfile = await getMBTIProfile();
    
    // Firebase認証されている場合
    if (user) {
      // プロファイル情報がない場合はnullを返す（初回登録前の状態）
      if (!mbtiProfile) {
        return null;
      }
      
      // 完全なプロファイル情報を返す
      return {
        userId: user.uid,
        username: mbtiProfile.username,
        mbti: mbtiProfile.mbti
      };
    } 
    // Firebase認証されていないが、保存されたプロファイルがある場合
    else if (mbtiProfile && mbtiProfile.userId) {
      return {
        userId: mbtiProfile.userId,
        username: mbtiProfile.username,
        mbti: mbtiProfile.mbti
      };
    }
    
    return null;
  } catch (error) {
    console.error('ユーザー情報の取得に失敗しました:', error);
    return null;
  }
};

/**
 * プロファイル情報を削除する（ログアウト時など）
 */
export const clearMBTIProfile = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(MBTI_PROFILE_KEY);
    await saveAuthState(false);
  } catch (error) {
    console.error('プロファイル情報の削除に失敗しました:', error);
  }
};

/**
 * ユーザーが登録済みかどうかを確認する
 * Firebase認証とMBTIプロファイルの両方が存在する場合、または
 * 認証状態が保存されており、MBTIプロファイルが存在する場合に登録済みと判断
 */
export const isUserRegistered = async (): Promise<boolean> => {
  // Firebase認証情報を確認
  const user = getCurrentUser();
  const isAuthenticated = await getAuthState();
  const mbtiProfile = await getMBTIProfile();
  
  console.log('登録確認: Firebase認証=', !!user, '認証状態=', isAuthenticated, 'MBTIプロファイル=', !!mbtiProfile);
  
  // Firebaseで認証済み、かつプロファイル情報がある場合
  if (user && mbtiProfile) {
    return true;
  }
  
  // 認証状態が保存されており、プロファイル情報もある場合
  if (isAuthenticated && mbtiProfile) {
    return true;
  }
  
  return false;
};

/**
 * ユーザーIDを保存する
 */
export const saveUserId = async (userId: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(USER_ID_KEY, userId);
    console.log('ユーザーIDを保存しました:', userId);
  } catch (error) {
    console.error('ユーザーIDの保存に失敗しました:', error);
  }
};

/**
 * ユーザーIDを取得する
 * Firebaseの認証情報を優先的に使用し、それがない場合はAsyncStorageから取得
 */
export const getUserId = async (): Promise<string | null> => {
  try {
    // 非同期認証関数を使用してFirebaseからユーザー情報を取得
    const { getCurrentUserAsync } = await import('./firebaseService');
    const user = await getCurrentUserAsync();
    
    if (user && user.uid) {
      console.log('Firebase認証(非同期)からユーザーIDを取得:', user.uid);
      // 認証されているユーザーのIDをAsyncStorageに保存（同期のため）
      await saveUserId(user.uid);
      return user.uid;
    }
    
    // Firebase認証からIDが取得できない場合、AsyncStorageから取得
    const storedUserId = await AsyncStorage.getItem(USER_ID_KEY);
    console.log('AsyncStorageからユーザーIDを取得:', storedUserId);
    return storedUserId;
  } catch (error) {
    console.error('ユーザーID取得エラー:', error);
    return null;
  }
};