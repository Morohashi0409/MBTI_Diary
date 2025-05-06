import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar } from 'react-native';
import { Theme } from '@/constants/theme';
import { Sparkles, Target, CircleArrowUp as ArrowUpCircle } from 'lucide-react-native';
import { apiClient, GrowthAdvice } from '@/services/apiClient';
import { getUserId } from '@/services/userStorage';
import LoadingIndicator from '@/components/LoadingIndicator';
import ErrorMessage from '@/components/ErrorMessage';

// アイコンのマッピング
const iconMap = {
  1: Sparkles,
  2: Target,
  3: ArrowUpCircle,
};

export default function GrowthScreen() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adviceData, setAdviceData] = useState<GrowthAdvice[]>([]);
  
  // のびしろ情報の取得
  useEffect(() => {
    const fetchGrowthAdvice = async () => {
      try {
        console.log('のびしろ情報の取得を開始します');
        setLoading(true);
        setError(null);
        
        // ユーザーIDの取得 (非同期関数になったため、awaitを使用)
        const userId = await getUserId();
        console.log('取得したユーザーID:', userId);
        
        if (!userId) {
          console.log('ユーザーIDが取得できませんでした');
          setError('ユーザー情報が見つかりません。プロフィールから登録してください。');
          setLoading(false);
          return;
        }
        
        // のびしろ情報の取得
        console.log('APIリクエスト開始:', `/diary/user/growth/${userId}`);
        const response = await apiClient.getGrowthAdvice(userId);
        console.log('APIレスポンス:', response);
        setAdviceData(response.advice);
        
      } catch (err) {
        console.error('のびしろ情報取得エラー:', err);
        setError('のびしろ情報の取得に失敗しました。もう一度お試しください。');
      } finally {
        setLoading(false);
        console.log('のびしろ情報取得処理完了');
      }
    };
    
    console.log('GrowthScreen コンポーネントがマウントされました');
    fetchGrowthAdvice();
    
    return () => {
      console.log('GrowthScreen コンポーネントがアンマウントされました');
    };
  }, []);

  // エラー表示
  if (error) {
    return (
      <View style={styles.container}>
        <ErrorMessage message={error} />
      </View>
    );
  }

  // ローディング表示
  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <LoadingIndicator message="のびしろ情報を取得中..." whiteText={true} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={Theme.colors.card} barStyle="light-content" />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>あなたの個性を活かす</Text>
          <Text style={styles.subtitle}>
            日記の分析から導き出された成長のためのアドバイス
          </Text>
        </View>

        <View style={styles.adviceSection}>
          {adviceData.map((item) => {
            // アイコンのマッピング（デフォルトはSparkles）
            const IconComponent = iconMap[item.id as keyof typeof iconMap] || Sparkles;
            
            // アイコンの色を設定（MBTIの色を使用）
            let iconColor;
            switch (item.id % 4) {
              case 0:
                iconColor = Theme.colors.mbti.JP; // 紫色
                break;
              case 1:
                iconColor = Theme.colors.mbti.EI; // 青色
                break;
              case 2:
                iconColor = Theme.colors.mbti.SN; // 黄色
                break;
              case 3:
                iconColor = Theme.colors.mbti.TF; // 緑色
                break;
              default:
                iconColor = Theme.colors.mbti.JP; // デフォルトは紫色
            }
            
            return (
              <View key={item.id} style={styles.adviceCard}>
                <View style={styles.adviceHeader}>
                  <View style={styles.iconContainer}>
                    <IconComponent size={24} color={iconColor} />
                  </View>
                  <Text style={styles.adviceTitle}>{item.title}</Text>
                </View>
                <Text style={styles.adviceText}>{item.description}</Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: Theme.spacing.md,
  },
  header: {
    padding: Theme.spacing.lg,
    backgroundColor: Theme.colors.card,
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
  adviceSection: {
    padding: Theme.spacing.md,
  },
  adviceCard: {
    backgroundColor: Theme.colors.card,
    padding: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.md,
    marginBottom: Theme.spacing.md,
    ...Theme.shadows.sm,
  },
  adviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.sm,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Theme.colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Theme.spacing.sm,
  },
  adviceTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: Theme.colors.text,
  },
  adviceText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Theme.colors.text,
    lineHeight: 20,
  },
});