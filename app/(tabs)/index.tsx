import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Keyboard,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { router } from 'expo-router';
import { useDiaryAnalyze } from '@/hooks/useDiaryAnalyze';
import DiaryInput from '@/components/DiaryInput';
import LoadingIndicator from '@/components/LoadingIndicator';
import ErrorMessage from '@/components/ErrorMessage';
import { Theme } from '@/constants/theme';
import { Book, Send } from 'lucide-react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withTiming, 
  withSpring,
  Easing
} from 'react-native-reanimated';

export default function DiaryWriteScreen() {
  const { analyzeDiary, isLoading, error, result } = useDiaryAnalyze();
  const [showGuide, setShowGuide] = useState(false);
  const guideHeight = useSharedValue(0);
  
  const handleSubmitDiary = async (content: string) => {
    const analysisResult = await analyzeDiary(content);
    if (analysisResult) {
      router.push('/analysis');
    }
  };
  
  const toggleGuide = () => {
    setShowGuide(!showGuide);
    guideHeight.value = withTiming(
      showGuide ? 0 : 180, 
      { 
        duration: 300, 
        easing: Easing.inOut(Easing.ease) 
      }
    );
  };
  
  const guideStyle = useAnimatedStyle(() => {
    return {
      height: guideHeight.value,
      opacity: guideHeight.value === 0 ? 0 : withTiming(1, { duration: 200 }),
      overflow: 'hidden',
    };
  });

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerContainer}>
          <View style={styles.titleContainer}>
            <Book size={24} color={Theme.colors.primary} />
            <Text style={styles.title}>今日の日記を書く</Text>
          </View>
          <TouchableOpacity 
            style={styles.guideButton}
            onPress={toggleGuide}
          >
            <Text style={styles.guideButtonText}>
              {showGuide ? "ヒントを隠す" : "書き方のヒント"}
            </Text>
          </TouchableOpacity>
        </View>
        
        <Animated.View style={[styles.guideContainer, guideStyle]}>
          <Text style={styles.guideTitle}>意味のある日記を書くためのヒント：</Text>
          <View style={styles.guideTipContainer}>
            <Text style={styles.guideTip}>• あなたの考えや感情について書きましょう</Text>
            <Text style={styles.guideTip}>• 他の人との関わりについて振り返りましょう</Text>
            <Text style={styles.guideTip}>• 出来事に対するあなたの反応を描写しましょう</Text>
            <Text style={styles.guideTip}>• あなたの好みや決定について共有しましょう</Text>
            <Text style={styles.guideTip}>• 正直に、ありのままを書きましょう</Text>
          </View>
        </Animated.View>
        
        <Text style={styles.subtitle}>
          あなたの一日、考え、感情について自由に書いてください。AIがあなたの文章からMBTIの特徴を分析します。
        </Text>
        
        {error && (
          <ErrorMessage 
            message={error} 
            onRetry={() => {
              // Reset error state or retry last operation
            }} 
          />
        )}
        
        <DiaryInput 
          onSubmit={handleSubmitDiary}
          isLoading={isLoading}
        />
        
        {isLoading && <LoadingIndicator />}
        
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            あなたの日記はMBTIパーソナリティの特徴を識別するために分析されます。すべての内容は安全に処理されます。
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: Theme.spacing.md,
    paddingTop: Theme.spacing.lg,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontFamily: 'Inter-Bold',
    color: Theme.colors.text,
    marginLeft: Theme.spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: Theme.colors.textSecondary,
    marginBottom: Theme.spacing.md,
    lineHeight: 22,
  },
  guideButton: {
    backgroundColor: Theme.colors.primary + '20',
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.round,
  },
  guideButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: Theme.colors.primary,
  },
  guideContainer: {
    backgroundColor: Theme.colors.secondaryLight + '30',
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
  },
  guideTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: Theme.colors.secondaryDark,
    marginBottom: Theme.spacing.sm,
  },
  guideTipContainer: {
    marginLeft: Theme.spacing.xs,
  },
  guideTip: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Theme.colors.text,
    lineHeight: 22,
  },
  infoContainer: {
    marginTop: Theme.spacing.lg,
    padding: Theme.spacing.md,
    backgroundColor: Theme.colors.primary + '10',
    borderRadius: Theme.borderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: Theme.colors.primary,
  },
  infoText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Theme.colors.textSecondary,
    lineHeight: 20,
  },
});