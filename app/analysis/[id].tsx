import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Share,
  ActivityIndicator
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { apiClient } from '@/services/apiClient';
import MBTIScoreCard from '@/components/MBTIScoreCard';
import FeedbackDisplay from '@/components/FeedbackDisplay';
import ErrorMessage from '@/components/ErrorMessage';
import { Theme } from '@/constants/theme';
import { Share2, ArrowLeft, RefreshCcw } from 'lucide-react-native';
import { AnalysisResult, MBTIDimension } from '@/types';
import { getUserProfile } from '@/services/userStorage';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withTiming, 
  FadeIn,
  FadeOut
} from 'react-native-reanimated';

export default function AnalysisDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  
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
        
        // 詳細データを取得する処理
        // 現時点では、詳細取得APIが無いため、一覧データから該当のデータを検索する形で実装
        const diaries = await apiClient.getUserDiaries(userProfile.userId);
        const diary = diaries.find(d => d.id === params.id);
        
        if (!diary) {
          throw new Error('指定された分析データが見つかりません');
        }
        
        // API結果を分析結果の形式に変換
        const result: AnalysisResult = {
          dimensions: [
            {
              name: 'Extraversion vs. Introversion',
              score: diary.dimensions.EI,
              label1: 'Extraversion (E)',
              label2: 'Introversion (I)',
            },
            {
              name: 'Sensing vs. Intuition',
              score: diary.dimensions.SN,
              label1: 'Sensing (S)',
              label2: 'Intuition (N)',
            },
            {
              name: 'Thinking vs. Feeling',
              score: diary.dimensions.TF,
              label1: 'Thinking (T)',
              label2: 'Feeling (F)',
            },
            {
              name: 'Judging vs. Perceiving',
              score: diary.dimensions.JP,
              label1: 'Judging (J)',
              label2: 'Perceiving (P)',
            },
          ],
          feedback: diary.feedback,
          summary: diary.summary,
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
      dimensions[0].score < 50 ? 'E' : 'I',
      dimensions[1].score < 50 ? 'S' : 'N',
      dimensions[2].score < 50 ? 'T' : 'F',
      dimensions[3].score < 50 ? 'J' : 'P',
    ].join('');
    
    return type;
  };

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.headerContainer}>
        <View style={styles.titleRow}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={20} color={Theme.colors.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>分析詳細</Text>
          {analysis && (
            <TouchableOpacity 
              style={styles.shareButton}
              onPress={handleShare}
            >
              <Share2 size={18} color={Theme.colors.primary} />
              <Text style={styles.shareText}>共有</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {analysis && (
          <Text style={styles.resultSummary}>
            あなたのパーソナリティタイプ: 
            <Text style={styles.mbtiType}>
              {" "}{getMBTIType(analysis.dimensions)}
            </Text>
          </Text>
        )}
        
        {analysis && (
          <Text style={styles.dateText}>
            分析日: {analysis.timestamp.toLocaleDateString('ja-JP')}
          </Text>
        )}
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
    marginBottom: Theme.spacing.lg,
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
    backgroundColor: Theme.colors.primary + '20',
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.round,
  },
  shareText: {
    marginLeft: 4,
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: Theme.colors.primary,
  },
  resultSummary: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: Theme.spacing.xs,
  },
  dateText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: Theme.spacing.xs,
  },
  mbtiType: {
    fontFamily: 'Inter-Bold',
    color: Theme.colors.primary,
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
});