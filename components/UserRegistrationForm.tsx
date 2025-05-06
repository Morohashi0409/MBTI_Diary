import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Theme } from '@/constants/theme';
import { apiClient } from '@/services/apiClient';
import { saveUserProfile } from '@/services/userStorage';

// MBTIタイプのリスト
const MBTI_TYPES = [
  'INTJ', 'INTP', 'ENTJ', 'ENTP',
  'INFJ', 'INFP', 'ENFJ', 'ENFP',
  'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
  'ISTP', 'ISFP', 'ESTP', 'ESFP',
];

// プロパティの型定義
interface UserRegistrationFormProps {
  onRegistrationComplete: () => void;
}

const UserRegistrationForm: React.FC<UserRegistrationFormProps> = ({ onRegistrationComplete }) => {
  const [username, setUsername] = useState<string>('');
  const [selectedMBTI, setSelectedMBTI] = useState<string>(MBTI_TYPES[0]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 選択されたMBTIタイプに基づいてアクセントカラーを取得
  const getAccentColorForMBTI = (mbtiType: string): string => {
    // タイプの最初の文字に基づいてカラーを選択
    if (mbtiType.startsWith('E') || mbtiType.startsWith('I')) {
      return Theme.colors.mbti.EI; // 青色: #4298B4
    } else if (mbtiType.startsWith('S') || mbtiType.startsWith('N')) {
      return Theme.colors.mbti.SN; // 黄色: #E4AE3A
    } else if (mbtiType.startsWith('T') || mbtiType.startsWith('F')) {
      return Theme.colors.mbti.TF; // 緑色: #33A474
    } else {
      return Theme.colors.mbti.JP; // 紫色: #88619A
    }
  };

  const handleSubmit = async () => {
    // バリデーション
    if (!username.trim()) {
      Alert.alert('エラー', 'ユーザー名を入力してください');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // APIリクエスト
      const response = await apiClient.createUserAccount({
        username: username.trim(),
        mbti: selectedMBTI
      });

      // AsyncStorageに保存
      await saveUserProfile({
        userId: response.userId,
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
        <Text style={[styles.title, { color: accentColor }]}>MBTI日記へようこそ！</Text>
        <Text style={styles.subtitle}>まずはプロフィールを設定しましょう</Text>

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
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedMBTI}
              onValueChange={(itemValue) => setSelectedMBTI(itemValue)}
              style={styles.picker}
              dropdownIconColor={Theme.colors.text}
              itemStyle={{ color: Theme.colors.text }}
            >
              {MBTI_TYPES.map((type) => (
                <Picker.Item key={type} label={type} value={type} color={Theme.colors.text} />
              ))}
            </Picker>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: Theme.colors.white }, isLoading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={accentColor} />
          ) : (
            <Text style={[styles.buttonText, { color: accentColor }]}>登録</Text>
          )}
        </TouchableOpacity>

        <View style={styles.mbtiInfoContainer}>
          <Text style={styles.mbtiInfoText}>
            ※ MBTIを知らない方は、「自分のタイプがわかる気がする」ものを選んでください。後から変更できます。
          </Text>
        </View>

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
});

export default UserRegistrationForm;