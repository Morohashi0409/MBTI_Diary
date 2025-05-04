import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { router } from 'expo-router';
import { apiClient, DiaryAnalysisResponse } from '@/services/apiClient';
import { getUserProfile } from '@/services/userStorage';
import { Theme } from '@/constants/theme';
import { ArrowRight, RefreshCcw, BookOpen } from 'lucide-react-native';
import ErrorMessage from '@/components/ErrorMessage';
import Animated, { FadeIn } from 'react-native-reanimated';

interface DiaryItemProps {
  diary: DiaryAnalysisResponse;
  onPress: (id: string) => void;
}

// 日記リストの各アイテムを表示するコンポーネント
const DiaryItem: React.FC<DiaryItemProps> = ({ diary, onPress }) => {
  // MBTIタイプを計算
  const getMBTIType = (dimensions: DiaryAnalysisResponse['dimensions']) => {
    if (!dimensions) return '不明';
    
    const type = [
      dimensions.EI < 50 ? 'E' : 'I',
      dimensions.SN < 50 ? 'S' : 'N',
      dimensions.TF < 50 ? 'T' : 'F',
      dimensions.JP < 50 ? 'J' : 'P',
    ].join('');
    
    return type;
  };
  
  // 日付をフォーマット
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // 本文を省略して表示（最初の50文字）
  const truncateContent = (content: string, maxLength: number = 50) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };
  
  const mbtiType = getMBTIType(diary.dimensions);
  
  return (
    <TouchableOpacity 
      style={styles.diaryItem}
      onPress={() => onPress(diary.id)}
      activeOpacity={0.7}
    >
      <View style={styles.diaryHeader}>
        <Text style={styles.diaryDate}>{formatDate(diary.created_at)}</Text>
        <View style={styles.mbtiTypeContainer}>
          <Text style={styles.mbtiType}>{mbtiType}</Text>
        </View>
      </View>
      
      <Text style={styles.diaryContent}>
        {truncateContent(diary.content)}
      </Text>
      
      <View style={styles.diaryFooter}>
        <View style={styles.dimensionsContainer}>
          <View style={styles.dimensionItem}>
            <Text style={styles.dimensionLabel}>E-I</Text>
            <Text style={styles.dimensionValue}>{diary.dimensions.EI.toFixed(1)}</Text>
          </View>
          <View style={styles.dimensionItem}>
            <Text style={styles.dimensionLabel}>S-N</Text>
            <Text style={styles.dimensionValue}>{diary.dimensions.SN.toFixed(1)}</Text>
          </View>
          <View style={styles.dimensionItem}>
            <Text style={styles.dimensionLabel}>T-F</Text>
            <Text style={styles.dimensionValue}>{diary.dimensions.TF.toFixed(1)}</Text>
          </View>
          <View style={styles.dimensionItem}>
            <Text style={styles.dimensionLabel}>J-P</Text>
            <Text style={styles.dimensionValue}>{diary.dimensions.JP.toFixed(1)}</Text>
          </View>
        </View>
        
        <ArrowRight size={16} color={Theme.colors.textSecondary} />
      </View>
    </TouchableOpacity>
  );
};

export default function AnalysisScreen() {
  const [diaries, setDiaries] = useState<DiaryAnalysisResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // 分析履歴を取得する関数
  const fetchDiaryAnalyses = async () => {
    try {
      setError(null);
      
      const userProfile = await getUserProfile();
      if (!userProfile || !userProfile.userId) {
        throw new Error('ユーザープロフィールが見つかりません。再ログインしてください。');
      }
      
      const response = await apiClient.getUserDiaries(userProfile.userId);
      setDiaries(response);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '不明なエラーが発生しました';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };
  
  // 初回読み込み時にデータを取得
  useEffect(() => {
    fetchDiaryAnalyses();
  }, []);
  
  // プルダウンで更新
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDiaryAnalyses();
  };
  
  // 詳細画面への遷移
  const handleDiaryPress = (id: string) => {
    router.push(`/analysis/${id}`);
  };
  
  // 新規日記作成画面へ遷移
  const handleWriteDiary = () => {
    router.push('/');
  };
  
  // リスト空の場合の表示
  const renderEmptyList = () => {
    if (isLoading) return null;
    
    return (
      <View style={styles.emptyContainer}>
        <BookOpen size={48} color={Theme.colors.textSecondary} />
        <Text style={styles.emptyTitle}>分析履歴がありません</Text>
        <Text style={styles.emptyText}>
          日記を書いてMBTIパーソナリティ分析を始めましょう
        </Text>
        <TouchableOpacity 
          style={styles.writeDiaryButton}
          onPress={handleWriteDiary}
        >
          <Text style={styles.writeDiaryButtonText}>
            日記を書く
          </Text>
        </TouchableOpacity>
      </View>
    );
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>分析履歴</Text>
      </View>
      
      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
          <Text style={styles.loadingText}>分析履歴を読み込み中...</Text>
        </View>
      ) : (
        <FlatList
          data={diaries}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Animated.View entering={FadeIn.duration(300)}>
              <DiaryItem diary={item} onPress={handleDiaryPress} />
            </Animated.View>
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Theme.colors.primary]}
              tintColor={Theme.colors.primary}
            />
          }
        />
      )}
      
      {error && <ErrorMessage message={error} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  headerContainer: {
    padding: Theme.spacing.md,
    paddingTop: Theme.spacing.lg,
    paddingBottom: Theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  title: {
    fontSize: 22,
    fontFamily: 'Inter-Bold',
    color: Theme.colors.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Theme.spacing.md,
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: Theme.colors.textSecondary,
  },
  listContent: {
    padding: Theme.spacing.md,
    paddingBottom: Theme.spacing.xxl,
  },
  diaryItem: {
    backgroundColor: Theme.colors.cardBackground,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
    ...Theme.shadows.sm,
  },
  diaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.xs,
  },
  diaryDate: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: Theme.colors.textSecondary,
  },
  mbtiTypeContainer: {
    backgroundColor: Theme.colors.primary + '20',
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs / 2,
    borderRadius: Theme.borderRadius.round,
  },
  mbtiType: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: Theme.colors.primary,
  },
  diaryContent: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    color: Theme.colors.text,
    marginBottom: Theme.spacing.md,
    lineHeight: 22,
  },
  diaryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dimensionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dimensionItem: {
    marginRight: Theme.spacing.md,
    alignItems: 'center',
  },
  dimensionLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: Theme.colors.textSecondary,
    marginBottom: 2,
  },
  dimensionValue: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: Theme.colors.text,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Theme.spacing.xl,
    marginTop: Theme.spacing.xxl,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: Theme.colors.text,
    marginTop: Theme.spacing.md,
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
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.md,
    borderRadius: Theme.borderRadius.round,
    ...Theme.shadows.md,
  },
  writeDiaryButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: Theme.colors.white,
  },
});