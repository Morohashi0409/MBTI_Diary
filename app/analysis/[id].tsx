import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Share,
  ActivityIndicator,
  Image,
  Platform
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { apiClient } from '@/services/apiClient';
import MBTIScoreCard from '@/components/MBTIScoreCard';
import FeedbackDisplay from '@/components/FeedbackDisplay';
import ErrorMessage from '@/components/ErrorMessage';
import { Theme } from '@/constants/theme';
import { Share2, ArrowLeft, RefreshCcw, ChevronDown, ChevronUp } from 'lucide-react-native';
import { AnalysisResult, MBTIDimension } from '@/types';
import { getUserProfile } from '@/services/userStorage';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withTiming, 
  FadeIn,
  FadeOut
} from 'react-native-reanimated';

// カスタム戻るボタンコンポーネント
const BackButton = ({ onPress, color = Theme.colors.primary }) => {
  return (
    <TouchableOpacity 
      style={styles.backButton}
      onPress={onPress}
      accessibilityLabel="戻る"
      accessibilityRole="button"
    >
      <ArrowLeft size={20} color={color} />
    </TouchableOpacity>
  );
};

// MBTIタイプの説明
const MBTI_TYPE_DESCRIPTIONS = {
  'INTJ': '戦略家：独立心が強く、合理的で分析的。革新的なアイデアを持ち、目標達成に向けて努力する。',
  'INTP': '論理学者：理論的で抽象的な思考を好み、独創的なアイデアを生み出す。知的好奇心が旺盛。',
  'ENTJ': '指揮官：カリスマ的で決断力がある。効率的な組織づくりと目標達成を得意とする。',
  'ENTP': '討論者：機知に富み、好奇心旺盛。新しいアイデアやプロジェクトに情熱を注ぐ。',
  'INFJ': '提唱者：理想主義者で優れた洞察力を持つ。他者の可能性を引き出す力がある。',
  'INFP': '仲介者：理想主義者で誠実。自分の価値観に沿った生き方と自己表現を重視する。',
  'ENFJ': '主人公：温かく思いやりがあり、人々を導く力を持つ。コミュニケーション能力に優れている。',
  'ENFP': '広報運動家：熱狂的で創造的。好奇心が強く、可能性を見出すのが得意。',
  'ISTJ': '管理者：実践的で事実を重視する。責任感が強く、細部にも注意を払う。',
  'ISFJ': '擁護者：献身的で忠実。他者のニーズに敏感で、実践的なサポートを提供する。',
  'ESTJ': '幹部：組織的で責任感が強い。伝統的な価値観を持ち、目標達成に向けて効率的に行動する。',
  'ESFJ': '領事館：社交的で協力的。調和を重んじ、他者のニーズに敏感。',
  'ISTP': '巨匠：冷静で観察力に優れている。問題解決能力が高く、危機対応に長けている。',
  'ISFP': '冒険家：芸術的で感受性が豊か。現在を楽しみ、自分のペースで行動する。',
  'ESTP': '起業家：エネルギッシュでリスクを恐れない。問題解決能力が高く、実践的な思考を持つ。',
  'ESFP': 'エンターテイナー：自発的で明るく社交的。現在を楽しみ、人生を楽しむことを重視する。',
};

// MBTIタイプごとの画像を静的にインポート
const MBTI_TYPE_IMAGES = {
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

export default function AnalysisDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isDiaryExpanded, setIsDiaryExpanded] = useState(false);
  
  useEffect(() => {
    if (!params.id) {
      setError('分析IDが見つかりません');
      setIsLoading(false);
      return;
    }
    
    const fetchDiaryAnalysis = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const userProfile = await getUserProfile();
        if (!userProfile || !userProfile.userId) {
          throw new Error('ユーザープロフィールが見つかりません。再ログインしてください。');
        }
        
        const diaries = await apiClient.getUserDiaries(10);
        const diary = diaries.find(d => d.id === params.id);
        
        if (!diary) {
          throw new Error('指定された分析データが見つかりません');
        }
        
        const result: AnalysisResult = {
          id: diary.id,
          dimensions: [
            {
              name: '興味関心の方向',
              score: diary.dimensions.EI,
              label1: '外向型 (E)',
              label2: '内向型 (I)',
            },
            {
              name: 'ものの見方',
              score: diary.dimensions.SN,
              label1: '感覚型 (S)',
              label2: '直感型 (N)',
            },
            {
              name: '判断の仕方',
              score: diary.dimensions.TF,
              label1: '思考型 (T)',
              label2: '感情型 (F)',
            },
            {
              name: '外界への接し方',
              score: diary.dimensions.JP,
              label1: '判断型 (J)',
              label2: '知覚型 (P)',
            },
          ],
          feedback: diary.feedback,
          summary: diary.summary,
          content: diary.content, // 日記の内容を保存
          timestamp: new Date(diary.created_at),
        };
        
        setAnalysis(result);
        setIsLoading(false);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '不明なエラーが発生しました';
        setError(errorMessage);
        setIsLoading(false);
      }
    };
    
    fetchDiaryAnalysis();
  }, [params.id]);
  
  const handleShare = async () => {
    if (!analysis) return;
    
    try {
      const mbtiType = getMBTIType(analysis.dimensions);
      
      await Share.share({
        message: `私のMBTI分析結果: ${mbtiType}\n\n${analysis.summary}\n\nMBTI日記アプリで分析`,
        title: '私のMBTI分析結果',
      });
    } catch (error) {
      console.error('共有エラー:', error);
    }
  };
  
  const getMBTIType = (dimensions: MBTIDimension[]) => {
    if (!dimensions || dimensions.length < 4) return '不明';
    
    const type = [
      dimensions[0].score > 50 ? 'E' : 'I',
      dimensions[1].score > 50 ? 'S' : 'N',
      dimensions[2].score > 50 ? 'T' : 'F',
      dimensions[3].score > 50 ? 'J' : 'P',
    ].join('');
    
    return type;
  };

  // MBTIタイプに対応する色を取得する関数
  const getMBTITypeColor = (type: string): string => {
    return Theme.colors.mbtiType[type] || Theme.colors.white;
  };
  
  const getMBTIDescription = (type: string) => {
    return MBTI_TYPE_DESCRIPTIONS[type] || 'このタイプの説明はまだ準備されていません。';
  };

  const getMBTIImage = (type: string) => {
    return MBTI_TYPE_IMAGES[type] || null;
  };

  const formatDateForTitle = (date: Date) => {
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  const toggleDiaryExpand = () => {
    setIsDiaryExpanded(!isDiaryExpanded);
  };

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.headerContainer}>
        <View style={styles.titleRow}>
          <BackButton onPress={() => router.back()} />
          <Text style={styles.title}>
            {analysis ? formatDateForTitle(analysis.timestamp) : '分析詳細'}
          </Text>
          {analysis && (
            <TouchableOpacity 
              style={[
                styles.shareButton,
                { 
                  backgroundColor: getMBTITypeColor(getMBTIType(analysis.dimensions)) + '20',
                }
              ]}
              onPress={handleShare}
            >
              <Share2 size={18} color={getMBTITypeColor(getMBTIType(analysis.dimensions))} />
              <Text style={[styles.shareText, { color: getMBTITypeColor(getMBTIType(analysis.dimensions)) }]}>共有</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
          <Text style={styles.loadingText}>データを読み込み中...</Text>
        </View>
      )}
      
      {error && <ErrorMessage message={error} />}
      
      {analysis && !isLoading && (
        <>
          {/* パーソナリティタイプ表示 */}
          {analysis && (
            <View style={[
              styles.personalityTypeContainer,
              { backgroundColor: getMBTITypeColor(getMBTIType(analysis.dimensions)) + '15' }
            ]}>
              <View style={styles.personalityTypeHeader}>
                <View style={styles.typeTextContainer}>
                  <Text style={styles.personalityTypeLabel}>
                    あなたのパーソナリティタイプ:
                  </Text>
                  <Text 
                    style={[
                      styles.personalityTypeValue,
                      { color: getMBTITypeColor(getMBTIType(analysis.dimensions)) }
                    ]}
                  >
                    {getMBTIType(analysis.dimensions)}
                  </Text>
                </View>
                
                {/* 小さなアイコンとして画像を表示 */}
                {getMBTIImage(getMBTIType(analysis.dimensions)) && (
                  <View 
                    style={[
                      styles.smallImageContainer,
                      { borderColor: getMBTITypeColor(getMBTIType(analysis.dimensions)) + '50' }
                    ]}
                  >
                    <Image 
                      source={getMBTIImage(getMBTIType(analysis.dimensions))}
                      style={styles.smallTypeImage}
                      resizeMode="cover"
                    />
                  </View>
                )}
              </View>
              
              <Text style={styles.personalityTypeDescription}>
                {getMBTIDescription(getMBTIType(analysis.dimensions))}
              </Text>
            </View>
          )}
          
          {/* 日記内容（折りたたみ可能） */}
          <View style={styles.diaryContainer}>
            <TouchableOpacity 
              style={styles.diaryHeaderContainer}
              onPress={toggleDiaryExpand}
              activeOpacity={0.7}
            >
              <Text style={styles.diaryHeaderText}>日記の内容</Text>
              {isDiaryExpanded ? (
                <ChevronUp size={20} color={Theme.colors.text} />
              ) : (
                <ChevronDown size={20} color={Theme.colors.text} />
              )}
            </TouchableOpacity>
            
            {isDiaryExpanded && (
              <Animated.View
                entering={FadeIn.duration(200)}
                exiting={FadeOut.duration(200)}
                style={styles.diaryContentContainer}
              >
                <Text style={styles.diaryContent}>
                  {analysis.content}
                </Text>
              </Animated.View>
            )}
          </View>
          
          {/* 分析サマリー */}
          <View style={styles.summaryContainer}>
            <Text style={styles.summaryTitle}>分析サマリー</Text>
            <Text style={styles.summaryText}>
              {analysis.summary}
            </Text>
          </View>
          
          {/* MBTI分析結果 */}
          <Animated.View 
            style={styles.resultsContainer}
            entering={FadeIn.duration(300)}
            exiting={FadeOut.duration(300)}
          >
            <Text style={styles.sectionTitle}>MBTI次元</Text>
            
            {analysis.dimensions.map((dimension, index) => (
              <MBTIScoreCard 
                key={dimension.name} 
                dimension={dimension} 
                delay={index * 200}
              />
            ))}
            
            {analysis.feedback && (
              <>
                <Text style={styles.sectionTitle}>パーソナリティの洞察</Text>
                <FeedbackDisplay 
                  feedback={analysis.feedback}
                  summary={analysis.summary}
                  delay={800}
                />
              </>
            )}
          </Animated.View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  contentContainer: {
    padding: Theme.spacing.md,
    paddingTop: Theme.spacing.lg,
  },
  headerContainer: {
    marginBottom: Theme.spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.xs,
  },
  title: {
    fontSize: 22,
    fontFamily: 'Inter-Bold',
    color: Theme.colors.text,
    flex: 1,
    textAlign: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.round,
  },
  shareText: {
    marginLeft: 4,
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  personalityTypeContainer: {
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.lg,
    marginBottom: Theme.spacing.lg,
    ...Theme.shadows.sm,
  },
  personalityTypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  typeTextContainer: {
    flex: 1,
  },
  personalityTypeLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: Theme.colors.textSecondary,
    marginBottom: Theme.spacing.xs,
  },
  personalityTypeValue: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    marginBottom: Theme.spacing.xs,
  },
  personalityTypeDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Theme.colors.text,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: Theme.spacing.sm,
  },
  smallImageContainer: {
    width: 50,
    height: 50,
    borderRadius: Theme.borderRadius.round,
    overflow: 'hidden',
    marginLeft: Theme.spacing.md,
    borderWidth: 2,
  },
  smallTypeImage: {
    width: '100%',
    height: '100%',
  },
  resultSummary: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: Theme.spacing.xs,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Theme.spacing.xxl,
  },
  loadingText: {
    marginTop: Theme.spacing.md,
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: Theme.colors.textSecondary,
  },
  summaryContainer: {
    backgroundColor: Theme.colors.cardBackground,
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.lg,
    marginBottom: Theme.spacing.lg,
    ...Theme.shadows.sm,
  },
  summaryTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: Theme.colors.text,
    marginBottom: Theme.spacing.xs,
  },
  summaryText: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    color: Theme.colors.text,
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: Theme.colors.text,
    marginTop: Theme.spacing.md,
    marginBottom: Theme.spacing.sm,
  },
  resultsContainer: {
    marginTop: Theme.spacing.sm,
  },
  diaryContainer: {
    backgroundColor: Theme.colors.cardBackground,
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.lg,
    marginBottom: Theme.spacing.lg,
    ...Theme.shadows.sm,
  },
  diaryHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  diaryHeaderText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: Theme.colors.text,
  },
  diaryContentContainer: {
    marginTop: Theme.spacing.sm,
  },
  diaryContent: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    color: Theme.colors.text,
    lineHeight: 22,
  },
});