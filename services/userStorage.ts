import AsyncStorage from '@react-native-async-storage/async-storage';

// ストレージのキー定義
const USER_KEY = '@mbti_diary_user';

export type UserProfile = {
  userId: string;
  username: string;
  mbti: string;
};

/**
 * ユーザープロファイル情報を保存する
 */
export const saveUserProfile = async (profile: UserProfile): Promise<void> => {
  try {
    const jsonValue = JSON.stringify(profile);
    await AsyncStorage.setItem(USER_KEY, jsonValue);
  } catch (error) {
    console.error('ユーザー情報の保存に失敗しました:', error);
    throw new Error('ユーザー情報の保存に失敗しました');
  }
};

/**
 * 保存されているユーザープロファイル情報を取得する
 */
export const getUserProfile = async (): Promise<UserProfile | null> => {
  try {
    const jsonValue = await AsyncStorage.getItem(USER_KEY);
    return jsonValue !== null ? JSON.parse(jsonValue) : null;
  } catch (error) {
    console.error('ユーザー情報の取得に失敗しました:', error);
    return null;
  }
};

/**
 * ユーザープロファイル情報を削除する（ログアウト時など）
 */
export const clearUserProfile = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(USER_KEY);
  } catch (error) {
    console.error('ユーザー情報の削除に失敗しました:', error);
  }
};

/**
 * ユーザーが登録済みかどうかを確認する
 */
export const isUserRegistered = async (): Promise<boolean> => {
  const profile = await getUserProfile();
  return profile !== null;
};

/**
 * ユーザーIDのみを取得する
 */
export const getUserId = async (): Promise<string | null> => {
  try {
    const profile = await getUserProfile();
    return profile ? profile.userId : null;
  } catch (error) {
    console.error('ユーザーIDの取得に失敗しました:', error);
    return null;
  }
};