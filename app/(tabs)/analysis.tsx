import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Share
} from 'react-native';
import { useDiaryAnalyze } from '@/hooks/useDiaryAnalyze';
import MBTIScoreCard from '@/components/MBTIScoreCard';
import FeedbackDisplay from '@/components/FeedbackDisplay';
import LoadingIndicator from '@/components/LoadingIndicator';
import ErrorMessage from '@/components/ErrorMessage';
import { Theme } from '@/constants/theme';
import { Share2, ArrowLeft, RefreshCcw } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withTiming, 
  FadeIn,
  FadeOut
} from 'react-native-reanimated';

export default function AnalysisResultScreen() {
  const { 
    result, 
    isLoading, 
    error, 
    isStreaming, 
    streamedResult,
    analyzeDiary 
  } = useDiaryAnalyze();
  
  const [lastContent, setLastContent] = useState<string | null>(null);
  const params = useLocalSearchParams<{ content?: string }>();

  // ページ読み込み時にAPIからデータを取得
  useEffect(() => {
    const content = params.content || lastContent;
    if (content && content !== lastContent) {
      setLastContent(content);
      analyzeDiary(content);
    } else if (!result && !isLoading && !error && !isStreaming && !streamedResult) {
      // 初回表示時、パラメータがない場合はローカルストレージから最後の日記を取得して分析
      const fetchLastDiaryContent = async () => {
        try {
          // 本来はローカルストレージからデータを取得する処理
          // 今回はサンプルテキストを使用
          const sampleContent = "今日は友人と会って楽しい時間を過ごした。人と話すとエネルギーがもらえる気がする。";
          setLastContent(sampleContent);
          analyzeDiary(sampleContent);
        } catch (err) {
          console.error('最後の日記の取得に失敗しました', err);
        }
      };
      
      fetchLastDiaryContent();
    }
  }, [params.content, analyzeDiary, result, isLoading, error, isStreaming, streamedResult, lastContent]);
  
  const handleShare = async () => {
    if (!result) return;
    
    try {
      const mbtiType = getMBTIType(result.dimensions);
      
      await Share.share({
        message: `私のMBTI分析結果: ${mbtiType}\n\n${result.summary}\n\nMBTI日記アプリで分析`,
        title: '私のMBTI分析結果',
      });
    } catch (error) {
      console.error('共有エラー:', error);
    }
  };
  
  const getMBTIType = (dimensions: any[]) => {
    if (!dimensions || dimensions.length < 4) return '不明';
    
    const type = [
      dimensions[0].score < 50 ? 'E' : 'I',
      dimensions[1].score < 50 ? 'S' : 'N',
      dimensions[2].score < 50 ? 'T' : 'F',
      dimensions[3].score < 50 ? 'J' : 'P',
    ].join('');
    
    return type;
  };
  
  const isEmpty = !result && !isLoading && !error && !isStreaming && !streamedResult;

  const handleRefreshAnalysis = () => {
    if (lastContent) {
      analyzeDiary(lastContent);
    }
  };

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.headerContainer}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>あなたのMBTI分析</Text>
          {(result || streamedResult) && (
            <View style={styles.headerActions}>
              <TouchableOpacity 
                style={[styles.iconButton, styles.refreshButton]}
                onPress={handleRefreshAnalysis}
                disabled={isLoading || isStreaming}
              >
                <RefreshCcw size={18} color={Theme.colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.shareButton}
                onPress={handleShare}
              >
                <Share2 size={18} color={Theme.colors.primary} />
                <Text style={styles.shareText}>共有</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        {(result || streamedResult) && (
          <Text style={styles.resultSummary}>
            あなたのパーソナリティタイプ: 
            <Text style={styles.mbtiType}>
              {" "}{getMBTIType(result?.dimensions || streamedResult?.dimensions || [])}
            </Text>
          </Text>
        )}
      </View>
      
      {/* APIからの返却値をページトップに表示 */}
      {(result || streamedResult) && !isLoading && !isStreaming && (
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>分析サマリー</Text>
          <Text style={styles.summaryText}>
            {result?.summary || streamedResult?.summary || '分析結果がまだありません。'}
          </Text>
        </View>
      )}
      
      {isEmpty && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>分析結果がありません</Text>
          <Text style={styles.emptyText}>
            日記を書いてMBTIパーソナリティ分析を見てみましょう
          </Text>
          <TouchableOpacity 
            style={styles.writeDiaryButton}
            onPress={() => router.push('/')}
          >
            <ArrowLeft size={16} color={Theme.colors.white} />
            <Text style={styles.writeDiaryButtonText}>
              日記を書く
            </Text>
          </TouchableOpacity>
        </View>
      )}
      
      {(isLoading || isStreaming) && (
        <LoadingIndicator text={
          isStreaming ? "分析を処理中..." : "日記を分析中..."
        } />
      )}
      
      {error && <ErrorMessage message={error} />}
      
      {(streamedResult || result) && (
        <Animated.View 
          style={styles.resultsContainer}
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(300)}
        >
          <Text style={styles.sectionTitle}>MBTI次元</Text>
          
          {(streamedResult?.dimensions || result?.dimensions || []).map((dimension, index) => (
            <MBTIScoreCard 
              key={dimension.name} 
              dimension={dimension} 
              delay={index * 200}
            />
          ))}
          
          {(streamedResult?.feedback || result?.feedback) && (
            <>
              <Text style={styles.sectionTitle}>パーソナリティの洞察</Text>
              <FeedbackDisplay 
                feedback={streamedResult?.feedback || result?.feedback || ''}
                summary={streamedResult?.summary || result?.summary || ''}
                delay={800}
              />
            </>
          )}
        </Animated.View>
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
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  refreshButton: {
    backgroundColor: Theme.colors.primary + '20',
    marginRight: Theme.spacing.xs,
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
  },
  mbtiType: {
    fontFamily: 'Inter-Bold',
    color: Theme.colors.primary,
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Theme.spacing.xl,
    marginTop: Theme.spacing.xxl,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: Theme.colors.text,
    marginBottom: Theme.spacing.md,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: Theme.spacing.xl,
    lineHeight: 24,
  },
  writeDiaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.md,
    borderRadius: Theme.borderRadius.round,
    ...Theme.shadows.md,
  },
  writeDiaryButtonText: {
    marginLeft: Theme.spacing.xs,
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: Theme.colors.white,
  },
});