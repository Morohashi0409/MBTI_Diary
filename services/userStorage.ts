import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from 'firebase/auth';
import { getCurrentUser, onAuthStateChange } from './firebaseService';

// ストレージのキー定義
const USER_KEY = '@mbti_diary_user';
const MBTI_PROFILE_KEY = '@mbti_diary_mbti_profile';

export type UserProfile = {
  userId: string;
  username: string;
  mbti: string;
};

export type MBTIProfile = {
  mbti: string;
  username: string;
};

/**
 * MBTIプロファイル情報を保存する
 */
export const saveMBTIProfile = async (profile: MBTIProfile): Promise<void> => {
  try {
    const jsonValue = JSON.stringify(profile);
    await AsyncStorage.setItem(MBTI_PROFILE_KEY, jsonValue);
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
    return jsonValue !== null ? JSON.parse(jsonValue) : null;
  } catch (error) {
    console.error('MBTIプロファイル情報の取得に失敗しました:', error);
    return null;
  }
};

/**
 * ユーザーとプロファイル情報を結合して完全なプロファイルを作成
 */
export const getUserProfile = async (): Promise<UserProfile | null> => {
  const user = getCurrentUser();
  
  // ユーザーが認証されていない場合はnullを返す
  if (!user) {
    return null;
  }
  
  try {
    // MBTIプロファイル情報を取得
    const mbtiProfile = await getMBTIProfile();
    
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
  } catch (error) {
    console.error('プロファイル情報の削除に失敗しました:', error);
  }
};

/**
 * ユーザーが登録済みかどうかを確認する
 * Firebase認証とMBTIプロファイルの両方が存在する場合に完全に登録済みと判断
 */
export const isUserRegistered = async (): Promise<boolean> => {
  const user = getCurrentUser();
  if (!user) return false;
  
  const mbtiProfile = await getMBTIProfile();
  return mbtiProfile !== null;
};

/**
 * ユーザーIDを取得する
 */
export const getUserId = (): string | null => {
  const user = getCurrentUser();
  return user ? user.uid : null;
};