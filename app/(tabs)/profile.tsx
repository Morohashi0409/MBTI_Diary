import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Theme } from '@/constants/theme';
import { LineChart } from '@/components/LineChart';
import MBTIScoreCard from '@/components/MBTIScoreCard';
import { getUserProfile, UserProfile } from '@/services/userStorage';
import { apiClient, DiaryAnalysisResponse } from '@/services/apiClient';
import ErrorMessage from '@/components/ErrorMessage';

// MBTI次元のデータ型
type MBTIDimension = {
  name: string;
  score: number;
  label1: string;
  label2: string;
};

// 時系列データの型
type TimelineData = {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    color: string;
  }[];
};

export default function ProfileScreen() {
  // ユーザープロフィール情報の状態
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // MBTI分析データの状態
  const [diaries, setDiaries] = useState<DiaryAnalysisResponse[]>([]);
  const [currentDimensions, setCurrentDimensions] = useState<MBTIDimension[]>([]);
  const [timelineData, setTimelineData] = useState<TimelineData | null>(null);
  
  // 平均スコアを計算するヘルパー関数
  const calculateAverageDimensions = (diaries: DiaryAnalysisResponse[]): MBTIDimension[] => {
    if (diaries.length === 0) return [];
    
    // 各次元のスコアを集計
    const totals = {
      EI: 0,
      SN: 0,
      TF: 0,
      JP: 0
    };
    
    diaries.forEach(diary => {
      totals.EI += diary.dimensions.EI;
      totals.SN += diary.dimensions.SN;
      totals.TF += diary.dimensions.TF;
      totals.JP += diary.dimensions.JP;
    });
    
    // 平均値を計算
    const count = diaries.length;
    return [
      {
        name: '興味関心の方向',
        score: Math.round(totals.EI / count),
        label1: '外向型 (E)',
        label2: '内向型 (I)',
      },
      {
        name: 'ものの見方',
        score: Math.round(totals.SN / count),
        label1: '感覚型 (S)',
        label2: '直感型 (N)',
      },
      {
        name: '判断の仕方',
        score: Math.round(totals.TF / count),
        label1: '思考型 (T)',
        label2: '感情型 (F)',
      },
      {
        name: '外界への接し方',
        score: Math.round(totals.JP / count),
        label1: '判断型 (J)',
        label2: '知覚型 (P)',
      },
    ];
  };
  
  // 時系列データを生成するヘルパー関数
  const generateTimelineData = (diaries: DiaryAnalysisResponse[]): TimelineData => {
    const sortedDiaries = [...diaries].sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    
    // 日付ラベルを生成
    const labels = sortedDiaries.map(diary => {
      const date = new Date(diary.created_at);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    });
    
    // 各次元のデータセットを生成
    const datasets = [
      {
        label: 'E-I',
        data: sortedDiaries.map(diary => diary.dimensions.EI),
        color: Theme.colors.mbti.EI,
      },
      {
        label: 'S-N',
        data: sortedDiaries.map(diary => diary.dimensions.SN),
        color: Theme.colors.mbti.SN,
      },
      {
        label: 'T-F',
        data: sortedDiaries.map(diary => diary.dimensions.TF),
        color: Theme.colors.mbti.TF,
      },
      {
        label: 'J-P',
        data: sortedDiaries.map(diary => diary.dimensions.JP),
        color: Theme.colors.mbti.JP,
      },
    ];
    
    return { labels, datasets };
  };
  
  // MBTIタイプを計算する関数
  const getMBTIType = (dimensions: MBTIDimension[]): string => {
    if (!dimensions || dimensions.length < 4) return '未測定';
    
    return [
      dimensions[0].score > 50 ? 'E' : 'I',
      dimensions[1].score > 50 ? 'S' : 'N',
      dimensions[2].score > 50 ? 'T' : 'F',
      dimensions[3].score > 50 ? 'J' : 'P',
    ].join('');
  };
  
  // 主要な傾向の変化を分析するヘルパー関数
  const analyzeTrends = (diaries: DiaryAnalysisResponse[]): string => {
    if (diaries.length < 2) return '傾向を分析するには、さらに日記データが必要です。';
    
    // 最新の5件と、それより前の最大5件を比較
    const recentDiaries = diaries.slice(0, Math.min(5, diaries.length));
    const olderDiaries = diaries.slice(Math.min(5, diaries.length), Math.min(10, diaries.length));
    
    if (olderDiaries.length === 0) return '傾向を分析するには、さらに日記データが必要です。';
    
    const recentAvg = {
      EI: recentDiaries.reduce((sum, d) => sum + d.dimensions.EI, 0) / recentDiaries.length,
      SN: recentDiaries.reduce((sum, d) => sum + d.dimensions.SN, 0) / recentDiaries.length,
      TF: recentDiaries.reduce((sum, d) => sum + d.dimensions.TF, 0) / recentDiaries.length,
      JP: recentDiaries.reduce((sum, d) => sum + d.dimensions.JP, 0) / recentDiaries.length,
    };
    
    const olderAvg = {
      EI: olderDiaries.reduce((sum, d) => sum + d.dimensions.EI, 0) / olderDiaries.length,
      SN: olderDiaries.reduce((sum, d) => sum + d.dimensions.SN, 0) / olderDiaries.length,
      TF: olderDiaries.reduce((sum, d) => sum + d.dimensions.TF, 0) / olderDiaries.length,
      JP: olderDiaries.reduce((sum, d) => sum + d.dimensions.JP, 0) / olderDiaries.length,
    };
    
    // 変化量を計算
    const changes = {
      EI: recentAvg.EI - olderAvg.EI,
      SN: recentAvg.SN - olderAvg.SN,
      TF: recentAvg.TF - olderAvg.TF,
      JP: recentAvg.JP - olderAvg.JP,
    };
    
    // 最も変化が大きい次元を特定
    const dimensions = [
      { key: 'EI', change: changes.EI, labels: ['外向的', '内向的'] },
      { key: 'SN', change: changes.SN, labels: ['感覚的', '直感的'] },
      { key: 'TF', change: changes.TF, labels: ['思考的', '感情的'] },
      { key: 'JP', change: changes.JP, labels: ['判断的', '知覚的'] },
    ];
    
    dimensions.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
    
    const significantChanges = dimensions.filter(d => Math.abs(d.change) >= 5);
    
    if (significantChanges.length === 0) {
      return '過去10日間で大きな変化は見られませんでした。';
    }
    
    // 変化のレポートを生成
    let report = '過去10日間の傾向: ';
    
    significantChanges.forEach((dim, index) => {
      const direction = dim.change > 0 ? dim.labels[0] : dim.labels[1];
      report += `${dim.key}次元で${direction}な傾向が${Math.abs(dim.change).toFixed(1)}ポイント`;
      
      if (dim.change > 0) {
        report += '強まっています';
      } else {
        report += '弱まっています';
      }
      
      if (index < significantChanges.length - 1) {
        report += '。また、';
      }
    });
    
    return report;
  };

  // コンポーネントがマウントされたときにユーザープロフィールと日記データを取得
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // ユーザープロフィールを取得
        const profile = await getUserProfile();
        setUserProfile(profile);
        
        if (profile && profile.userId) {
          // 過去10日間の日記データを取得
          const diaryData = await apiClient.getUserDiaries(profile.userId, 10);
          setDiaries(diaryData);
          
          // 平均MBTIスコアを計算
          const avgDimensions = calculateAverageDimensions(diaryData);
          setCurrentDimensions(avgDimensions);
          
          // 時系列データを生成
          if (diaryData.length > 0) {
            const timeline = generateTimelineData(diaryData);
            setTimelineData(timeline);
          }
        }
      } catch (error) {
        console.error('データ取得エラー:', error);
        setError('データの取得中にエラーが発生しました。もう一度お試しください。');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
        <Text style={styles.loadingText}>データを読み込み中...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {error && <ErrorMessage message={error} />}
      
      {/* ユーザープロフィール情報表示 */}
      {userProfile && (
        <View style={styles.profileCard}>
          <Text style={styles.welcomeText}>
            ようこそ <Text style={styles.username}>{userProfile.username}</Text> さん
          </Text>
          <Text style={styles.mbtiText}>
            あなたの自己申告MBTIタイプ：
            <Text style={styles.mbtiType}>{userProfile.mbti}</Text>
          </Text>
          {currentDimensions.length > 0 && (
            <Text style={styles.mbtiText}>
              過去10日間の平均MBTIタイプ：
              <Text style={styles.mbtiType}>{getMBTIType(currentDimensions)}</Text>
            </Text>
          )}
          <Text style={styles.userIdText}>
            ユーザーID：{userProfile.userId}
          </Text>
        </View>
      )}

      <View style={styles.header}>
        <Text style={styles.title}>あなたの過去10日間のMBTI傾向</Text>
        <Text style={styles.subtitle}>
          最近の日記から分析された、あなたの平均的なパーソナリティの特徴です
        </Text>
      </View>

      {currentDimensions.length > 0 ? (
        <View style={styles.currentScores}>
          {currentDimensions.map((dimension, index) => (
            <MBTIScoreCard
              key={dimension.name}
              dimension={dimension}
              delay={index * 200}
            />
          ))}
        </View>
      ) : (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>
            まだ分析データがありません。日記を書いて自分のMBTI傾向を分析しましょう。
          </Text>
        </View>
      )}

      {timelineData && (
        <View style={styles.timelineSection}>
          <Text style={styles.sectionTitle}>スコア推移</Text>
          <Text style={styles.sectionSubtitle}>
            過去10日間のMBTI次元の変化
          </Text>
          <View style={styles.chartContainer}>
            <LineChart data={timelineData} />
          </View>
        </View>
      )}

      {diaries.length > 0 && (
        <View style={styles.insightSection}>
          <Text style={styles.sectionTitle}>最近の変化</Text>
          <View style={styles.insightCard}>
            <Text style={styles.insightText}>
              {analyzeTrends(diaries)}
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
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
  profileCard: {
    backgroundColor: Theme.colors.primary + '10',
    padding: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.primary + '30',
  },
  welcomeText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: Theme.colors.text,
    marginBottom: Theme.spacing.xs,
  },
  username: {
    fontFamily: 'Inter-Bold',
    color: Theme.colors.primary,
  },
  mbtiText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Theme.colors.textSecondary,
    marginBottom: Theme.spacing.xs,
  },
  mbtiType: {
    fontFamily: 'Inter-Bold',
    color: Theme.colors.primary,
  },
  userIdText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: Theme.colors.textTertiary,
  },
  header: {
    padding: Theme.spacing.lg,
    backgroundColor: Theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: Theme.colors.text,
    marginBottom: Theme.spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Theme.colors.textSecondary,
  },
  currentScores: {
    padding: Theme.spacing.md,
  },
  timelineSection: {
    padding: Theme.spacing.md,
    backgroundColor: Theme.colors.white,
    marginVertical: Theme.spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: Theme.colors.text,
    marginBottom: Theme.spacing.xs,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Theme.colors.textSecondary,
    marginBottom: Theme.spacing.md,
  },
  chartContainer: {
    height: 300,
    marginVertical: Theme.spacing.md,
  },
  insightSection: {
    padding: Theme.spacing.md,
  },
  insightCard: {
    backgroundColor: Theme.colors.white,
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    ...Theme.shadows.sm,
  },
  insightText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Theme.colors.text,
    lineHeight: 20,
  },
  noDataContainer: {
    padding: Theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noDataText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Theme.colors.textSecondary,
    textAlign: 'center',
  },
});