import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  Modal,
  FlatList,
  Dimensions
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Theme } from '@/constants/theme';
import { apiClient } from '@/services/apiClient';
import { saveMBTIProfile } from '@/services/userStorage';
import { signInWithGoogle, getCurrentUser } from '@/services/firebaseService';
import { User } from 'firebase/auth';
import { Ionicons } from '@expo/vector-icons'; // Ioniconsをインポート

// MBTIタイプの詳細情報
const MBTI_TYPE_INFO = {
  'INTJ': { name: '建築家型', description: '戦略的で独立心の強い思考家' },
  'INTP': { name: '論理学者型', description: '論理と探究心に満ちた知識人' },
  'ENTJ': { name: '指揮官型', description: '目標に向かって突き進むリーダー' },
  'ENTP': { name: '討論者型', description: '発想力豊かな挑戦者' },
  'INFJ': { name: '提唱者型', description: '理想と直感に導かれる内省者' },
  'INFP': { name: '仲介者型', description: '共感力と理想を持つ夢想家' },
  'ENFJ': { name: '主人公型', description: '人を導くカリスマ的な支援者' },
  'ENFP': { name: '運動家型', description: '情熱的で自由な発想を持つ冒険者' },
  'ISTJ': { name: '管理者型', description: '責任感が強く信頼できる現実主義者' },
  'ISFJ': { name: '擁護者型', description: '献身的で思いやりに満ちた守護者' },
  'ESTJ': { name: '幹部型', description: '実行力に優れた統率者' },
  'ESFJ': { name: '領事官型', description: '周囲を支える思いやりのある協調者' },
  'ISTP': { name: '巨匠型', description: '冷静で柔軟な問題解決者' },
  'ISFP': { name: '冒険家型', description: '感受性豊かで自由を愛する芸術家' },
  'ESTP': { name: '起業家型', description: '行動的でリスクを恐れない実践家' },
  'ESFP': { name: 'エンターテイナー型', description: '明るく場を盛り上げるエンターテイナー' },
};

// MBTIタイプのリスト
const MBTI_TYPES = [
  '選択してください',
  'INTJ', 'INTP', 'ENTJ', 'ENTP',
  'INFJ', 'INFP', 'ENFJ', 'ENFP',
  'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
  'ISTP', 'ISFP', 'ESTP', 'ESFP',
];

// MBTIタイプに対応する画像
const MBTI_TYPE_IMAGES: { [key: string]: any } = {
  'INTJ': require('@/assets/images/hedgehog/INTJ.jpeg'),
  'INTP': require('@/assets/images/hedgehog/INTP.jpeg'),
  'ENTJ': require('@/assets/images/hedgehog/ENTJ.jpeg'),
  'ENTP': require('@/assets/images/hedgehog/ENTP.jpeg'),
  'INFJ': require('@/assets/images/hedgehog/INFJ.jpeg'),
  'INFP': require('@/assets/images/hedgehog/INFP.jpeg'),
  'ENFJ': require('@/assets/images/hedgehog/ENFJ.jpeg'),
  'ENFP': require('@/assets/images/hedgehog/ENFP.jpeg'),
  'ISTJ': require('@/assets/images/hedgehog/ISTJ.jpeg'),
  'ISFJ': require('@/assets/images/hedgehog/ISFJ.jpeg'),
  'ESTJ': require('@/assets/images/hedgehog/ESTJ.jpeg'),
  'ESFJ': require('@/assets/images/hedgehog/ESFJ.jpeg'),
  'ISTP': require('@/assets/images/hedgehog/ISTP.jpeg'),
  'ISFP': require('@/assets/images/hedgehog/ISFP.jpeg'),
  'ESTP': require('@/assets/images/hedgehog/ESTP.jpeg'),
  'ESFP': require('@/assets/images/hedgehog/ESFP.jpeg'),
};

// プロパティの型定義
interface UserRegistrationFormProps {
  onRegistrationComplete: () => void;
}

const UserRegistrationForm: React.FC<UserRegistrationFormProps> = ({ onRegistrationComplete }) => {
  const [username, setUsername] = useState<string>('');
  const [selectedMBTI, setSelectedMBTI] = useState<string>('選択してください');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(false);

  // プルダウンをモーダルで置き換えるための状態
  const [modalVisible, setModalVisible] = useState<boolean>(false);

  // Google認証済みのユーザー情報を取得
  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setFirebaseUser(user);
      // メールアドレスからユーザー名の初期値を設定
      if (user.displayName) {
        setUsername(user.displayName);
      } else if (user.email) {
        const emailUsername = user.email.split('@')[0];
        setUsername(emailUsername);
      }
    }
  }, []);

  // 選択されたMBTIタイプに基づいてアクセントカラーを取得
  const getAccentColorForMBTI = (mbtiType: string): string => {
    // 「選択してください」の場合は白を返す
    if (mbtiType === '選択してください') {
      return Theme.colors.white;
    }
    
    // MBTIタイプに直接対応する色を返す
    return Theme.colors.mbtiType[mbtiType] || Theme.colors.white;
  };

  // Google認証でサインイン
  const handleGoogleSignIn = async () => {
    setIsAuthLoading(true);
    setError(null);

    try {
      console.log('Google認証を開始します...', new Date().toISOString());
      // 認証前のFirebase状態をログ
      const beforeUser = getCurrentUser();
      console.log('認証前のユーザー状態:', beforeUser ? beforeUser.email : '未ログイン');
      
      const user = await signInWithGoogle();
      
      if (user) {
        console.log('Google認証成功:', user.email);
        console.log('認証タイプ:', user.providerData[0]?.providerId || '不明');
        console.log('認証ID:', user.uid);
        setFirebaseUser(user);
        
        // ユーザー名を設定
        if (user.displayName) {
          setUsername(user.displayName);
        } else if (user.email) {
          const emailUsername = user.email.split('@')[0];
          setUsername(emailUsername);
        }
      } else {
        console.log('Google認証：ユーザーが取得できませんでした');
        setError('Google認証に失敗しました。もう一度お試しください。');
      }
    } catch (err) {
      console.error('Google認証エラー詳細:', err);
      
      // より詳細なエラーメッセージを生成
      let errorMessage = 'Google認証中にエラーが発生しました';
      let errorDetails = '';
      
      if (err instanceof Error) {
        errorMessage = `認証エラー: ${err.message}`;
        errorDetails = err.stack || '';
        
        // Firebaseエラーコードの確認
        if ('code' in err) {
          const code = (err as any).code;
          console.error('Firebase エラーコード:', code);
          
          // よくある特定のエラーコードに対するユーザーフレンドリーなメッセージ
          if (code === 'auth/configuration-not-found') {
            errorMessage = 'Firebase認証設定が見つかりません。管理者に連絡してください。';
          } else if (code === 'auth/popup-blocked') {
            errorMessage = 'ポップアップがブロックされました。ブラウザの設定を確認してください。';
          } else if (code === 'auth/popup-closed-by-user') {
            errorMessage = '認証ウィンドウが閉じられました。もう一度お試しください。';
          } else if (code === 'auth/cancelled-popup-request') {
            errorMessage = '認証リクエストがキャンセルされました。もう一度お試しください。';
          } else if (code === 'auth/network-request-failed') {
            errorMessage = 'ネットワークエラーが発生しました。インターネット接続を確認してください。';
          }
        }
      }
      
      console.error('エラーの詳細:', errorDetails);
      setError(errorMessage);
      
      Alert.alert(
        '認証エラー',
        `${errorMessage}\n\n問題が解決しない場合は、ブラウザのCookieとキャッシュをクリアしてから再試行してください。`
      );
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleSubmit = async () => {
    // バリデーション
    if (!username.trim()) {
      Alert.alert('エラー', 'ユーザー名を入力してください');
      return;
    }

    // Firebaseで認証されているか確認
    if (!firebaseUser) {
      Alert.alert('エラー', 'Googleアカウントでログインしてください');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // APIリクエスト - Firebase UIDを含める
      const response = await apiClient.createUserAccount({
        username: username.trim(),
        mbti: selectedMBTI,
        firebaseUid: firebaseUser.uid
      });

      // MBTIプロファイル情報のみを保存
      await saveMBTIProfile({
        username: response.username,
        mbti: response.mbti
      });

      // 親コンポーネントに登録完了を通知
      onRegistrationComplete();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '登録中にエラーが発生しました';
      setError(errorMessage);
      Alert.alert('登録エラー', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const accentColor = getAccentColorForMBTI(selectedMBTI);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <View style={styles.formContainer}>
        <Text style={[styles.title, { color: Theme.colors.white }]}>MBTI日記へようこそ！</Text>
        <Text style={styles.subtitle}>まずはアカウントを連携しましょう</Text>

        {!firebaseUser ? (
          <View style={styles.authContainer}>
            <Text style={styles.authText}>続けるにはGoogleアカウントでログインしてください</Text>
            <TouchableOpacity
              style={styles.googleButton}
              onPress={handleGoogleSignIn}
              disabled={isAuthLoading}
            >
              {isAuthLoading ? (
                <ActivityIndicator color={Theme.colors.text} />
              ) : (
                <>
                  <Image 
                    source={require('@/assets/images/g-logo.png')} 
                    style={styles.googleLogo}
                  />
                  <Text style={styles.googleButtonText}>Googleでログイン</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.loggedInContainer}>
              <View style={styles.userInfoContainer}>
                {firebaseUser.photoURL && (
                  <Image
                    source={{ uri: firebaseUser.photoURL }}
                    style={styles.userAvatar}
                  />
                )}
                <Text style={styles.userEmail}>{firebaseUser.email}</Text>
              </View>
              <Text style={styles.loggedInText}>Googleアカウントでログイン中</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>ユーザー名</Text>
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                placeholder="ユーザー名を入力"
                placeholderTextColor={Theme.colors.textTertiary}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>あなたのMBTIタイプ</Text>
              <TouchableOpacity 
                style={styles.mbtiSelectButton}
                onPress={() => setModalVisible(true)}
              >
                <Text 
                  style={[
                    styles.mbtiSelectButtonText,
                    selectedMBTI !== '選択してください' && { color: getAccentColorForMBTI(selectedMBTI) }
                  ]}
                >
                  {selectedMBTI === '選択してください' ? 'MBTIタイプを選択' : selectedMBTI}
                </Text>
                
                {selectedMBTI !== '選択してください' && (
                  <Image 
                    source={MBTI_TYPE_IMAGES[selectedMBTI]}
                    style={styles.mbtiTypeImageSmall}
                  />
                )}
              </TouchableOpacity>
              
              {/* MBTIタイプ選択モーダル */}
              <Modal
                visible={modalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setModalVisible(false)}
              >
                <View style={styles.modalContainer}>
                  <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                      <Text style={styles.modalTitle}>MBTIタイプを選択</Text>
                    </View>
                    
                    <FlatList
                      data={MBTI_TYPES.filter(type => type !== '選択してください')}
                      keyExtractor={(item) => item}
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          style={styles.mbtiTypeItem}
                          onPress={() => {
                            setSelectedMBTI(item);
                            setModalVisible(false);
                          }}
                        >
                          <Image 
                            source={MBTI_TYPE_IMAGES[item]}
                            style={styles.mbtiTypeImageSmall}
                          />
                          <View style={styles.mbtiTypeInfo}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                              <Text style={styles.mbtiTypeText}>{item}</Text>
                              <Text style={styles.mbtiTypeName}>（{MBTI_TYPE_INFO[item]?.name}）</Text>
                            </View>
                            <Text style={styles.mbtiTypeDescription}>{MBTI_TYPE_INFO[item]?.description}</Text>
                          </View>
                          {selectedMBTI === item && (
                            <View style={styles.selectedIndicator}>
                              <View 
                                style={[
                                  styles.selectedIndicatorInner, 
                                  { backgroundColor: getAccentColorForMBTI(item) }
                                ]} 
                              />
                            </View>
                          )}
                        </TouchableOpacity>
                      )}
                    />
                    
                    <TouchableOpacity
                      style={styles.closeButton}
                      onPress={() => setModalVisible(false)}
                    >
                      <Text style={styles.closeButtonText}>閉じる</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Modal>
            </View>

            {selectedMBTI !== '選択してください' && (
              <View style={styles.mbtiSelectedContainer}>
                <Image 
                  source={MBTI_TYPE_IMAGES[selectedMBTI]}
                  style={[
                    styles.mbtiSelectedImage,
                    { borderColor: getAccentColorForMBTI(selectedMBTI) }
                  ]}
                />
                <Text style={styles.mbtiSelectedTitle}>{selectedMBTI}</Text>
                <Text style={styles.mbtiSelectedSubtitle}>{MBTI_TYPE_INFO[selectedMBTI]?.name}</Text>
                <Text style={styles.mbtiSelectedDescription}>{MBTI_TYPE_INFO[selectedMBTI]?.description}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.button, 
                { 
                  backgroundColor: Theme.colors.background,
                  borderWidth: 1,
                  borderColor: Theme.colors.white
                }, 
                (isLoading || selectedMBTI === '選択してください') && styles.buttonDisabled
              ]}
              onPress={handleSubmit}
              disabled={isLoading || selectedMBTI === '選択してください'}
            >
              {isLoading ? (
                <ActivityIndicator color={Theme.colors.white} />
              ) : (
                <Text style={styles.buttonText}>登録して始める</Text>
              )}
            </TouchableOpacity>

            <View style={styles.mbtiInfoContainer}>
              <Text style={styles.mbtiInfoText}>
                ※ 自分のMBTIを知らない方は、説明文を読み「自分のタイプっぽい気がする」と感じたものを選んでください。後から変更できます。
              </Text>
            </View>
          </>
        )}

        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  formContainer: {
    padding: Theme.spacing.lg,
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.borderRadius.lg,
    marginHorizontal: Theme.spacing.md,
    marginVertical: Theme.spacing.xl,
    ...Theme.shadows.md,
  },
  title: {
    fontSize: Theme.typography.fontSize.xxl,
    fontFamily: Theme.typography.fontFamily.bold,
    marginBottom: Theme.spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Theme.typography.fontSize.md,
    fontFamily: Theme.typography.fontFamily.regular,
    color: Theme.colors.textSecondary,
    marginBottom: Theme.spacing.xl,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: Theme.spacing.md,
  },
  label: {
    fontSize: Theme.typography.fontSize.md,
    fontFamily: Theme.typography.fontFamily.medium,
    color: Theme.colors.text,
    marginBottom: Theme.spacing.xs,
  },
  input: {
    height: 50,
    backgroundColor: Theme.colors.background,
    borderRadius: Theme.borderRadius.md,
    paddingHorizontal: Theme.spacing.md,
    fontSize: Theme.typography.fontSize.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    color: Theme.colors.text,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: Theme.colors.background,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
    color: Theme.colors.text,
    paddingHorizontal: Theme.spacing.md,
  },
  pickerPlaceholder: {
    color: Theme.colors.textTertiary,
  },
  button: {
    height: 50,
    borderRadius: Theme.borderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Theme.spacing.lg,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: Theme.colors.white,
    fontSize: Theme.typography.fontSize.md,
    fontFamily: Theme.typography.fontFamily.medium,
  },
  mbtiInfoContainer: {
    marginTop: Theme.spacing.md,
    padding: Theme.spacing.md,
    backgroundColor: Theme.colors.background,
    borderRadius: Theme.borderRadius.md,
  },
  mbtiInfoText: {
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.textSecondary,
    fontFamily: Theme.typography.fontFamily.regular,
  },
  errorText: {
    color: Theme.colors.error,
    marginTop: Theme.spacing.md,
    fontSize: Theme.typography.fontSize.sm,
    fontFamily: Theme.typography.fontFamily.regular,
    textAlign: 'center',
  },
  authContainer: {
    alignItems: 'center',
    marginVertical: Theme.spacing.lg,
  },
  authText: {
    fontSize: Theme.typography.fontSize.md,
    fontFamily: Theme.typography.fontFamily.medium,
    color: Theme.colors.textSecondary,
    marginBottom: Theme.spacing.lg,
    textAlign: 'center',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.white,
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.md,
    borderRadius: Theme.borderRadius.round,
    borderWidth: 1,
    borderColor: '#DADCE0', // Googleブランドガイドラインのボーダーカラー
    marginTop: Theme.spacing.md,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    minWidth: 220, // ボタンの最小幅を設定
  },
  googleLogo: {
    width: 18,
    height: 18,
    marginRight: Theme.spacing.md,
  },
  googleButtonText: {
    fontSize: Theme.typography.fontSize.md,
    fontFamily: Theme.typography.fontFamily.medium,
    color: 'rgba(0, 0, 0, 0.54)', // Googleブランドガイドラインのテキストカラー
    letterSpacing: 0.25,
  },
  loggedInContainer: {
    alignItems: 'center',
    marginBottom: Theme.spacing.lg,
    padding: Theme.spacing.md,
    backgroundColor: Theme.colors.success + '10',
    borderRadius: Theme.borderRadius.md,
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.xs,
  },
  userAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: Theme.spacing.sm,
  },
  userEmail: {
    fontSize: Theme.typography.fontSize.sm,
    fontFamily: Theme.typography.fontFamily.medium,
    color: Theme.colors.text,
  },
  loggedInText: {
    fontSize: Theme.typography.fontSize.sm,
    fontFamily: Theme.typography.fontFamily.regular,
    color: Theme.colors.success,
  },
  mbtiPreviewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Theme.spacing.md,
    backgroundColor: Theme.colors.background,
    borderRadius: Theme.borderRadius.md,
    marginBottom: Theme.spacing.sm,
  },
  mbtiPreviewTextContainer: {
    flex: 1,
  },
  mbtiPreviewText: {
    fontSize: Theme.typography.fontSize.lg,
    fontFamily: Theme.typography.fontFamily.bold,
    textAlign: 'center',
  },
  mbtiImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    overflow: 'hidden',
    marginLeft: Theme.spacing.md,
  },
  mbtiTypeImage: {
    width: '100%',
    height: '100%',
  },
  mbtiSelectButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.md,
    backgroundColor: Theme.colors.background,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: Theme.borderRadius.md,
  },
  mbtiSelectButtonText: {
    fontSize: Theme.typography.fontSize.md,
    color: Theme.colors.text,
    fontFamily: Theme.typography.fontFamily.medium,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '80%',
    maxHeight: '70%',
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalHeader: {
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
    paddingBottom: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
  },
  modalTitle: {
    fontSize: Theme.typography.fontSize.lg,
    fontFamily: Theme.typography.fontFamily.bold,
    color: Theme.colors.text,
    textAlign: 'center',
  },
  mbtiTypeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  mbtiTypeText: {
    fontSize: Theme.typography.fontSize.md,
    fontFamily: Theme.typography.fontFamily.medium,
    color: Theme.colors.text,
    marginRight: Theme.spacing.sm,
  },
  mbtiTypeName: {
    fontSize: Theme.typography.fontSize.sm,
    fontFamily: Theme.typography.fontFamily.medium,
    color: Theme.colors.textSecondary,
  },
  mbtiTypeDescription: {
    fontSize: Theme.typography.fontSize.xs,
    fontFamily: Theme.typography.fontFamily.regular,
    color: Theme.colors.textTertiary,
    marginTop: 2,
  },
  mbtiTypeInfo: {
    flex: 1,
  },
  mbtiTypeImageSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: Theme.spacing.md,
  },
  closeButton: {
    backgroundColor: Theme.colors.background,
    paddingVertical: Theme.spacing.sm,
    paddingHorizontal: Theme.spacing.md,
    borderRadius: Theme.borderRadius.round,
    alignSelf: 'center',
    marginTop: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  closeButtonText: {
    fontSize: Theme.typography.fontSize.md,
    color: Theme.colors.text,
    fontFamily: Theme.typography.fontFamily.medium,
  },
  mbtiSelectedContainer: {
    marginTop: Theme.spacing.md,
    padding: Theme.spacing.md,
    backgroundColor: 'rgba(60, 60, 60, 0.5)',
    borderRadius: Theme.borderRadius.lg,
    alignItems: 'center',
  },
  mbtiSelectedImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    marginBottom: Theme.spacing.md,
  },
  mbtiSelectedTitle: {
    fontSize: Theme.typography.fontSize.lg,
    fontFamily: Theme.typography.fontFamily.bold,
    color: Theme.colors.text,
    marginBottom: Theme.spacing.xs,
  },
  mbtiSelectedSubtitle: {
    fontSize: Theme.typography.fontSize.md,
    fontFamily: Theme.typography.fontFamily.medium,
    color: Theme.colors.textSecondary,
    marginBottom: Theme.spacing.sm,
  },
  mbtiSelectedDescription: {
    fontSize: Theme.typography.fontSize.sm,
    fontFamily: Theme.typography.fontFamily.regular,
    color: Theme.colors.textTertiary,
    textAlign: 'center',
  },
});

export default UserRegistrationForm;