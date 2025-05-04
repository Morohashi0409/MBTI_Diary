import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Theme } from '@/constants/theme';
import { Sparkles, Target, CircleArrowUp as ArrowUpCircle } from 'lucide-react-native';

// Mock advice data
const mockAdvice = [
  {
    id: 1,
    title: '内向的な特性を活かす',
    description: '深い思考と自己理解を大切にしながら、時には小さな社交の機会も取り入れてみましょう。',
    icon: Sparkles,
  },
  {
    id: 2,
    title: '直感力の向上',
    description: 'パターンや関連性を見出す習慣をつけることで、より創造的な問題解決が可能になります。',
    icon: Target,
  },
  {
    id: 3,
    title: 'バランスの取れた判断',
    description: '論理的思考と感情的な理解のバランスを意識することで、より良い決断ができるようになります。',
    icon: ArrowUpCircle,
  },
];

// Mock target type advice
const targetTypeAdvice = {
  targetType: 'ENFJ',
  advice: [
    'リーダーシップの機会を積極的に求めてみましょう',
    '他者の感情に寄り添いながら、建設的なフィードバックを提供する練習をしてみましょう',
  ],
};

export default function GrowthScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>あなたの個性をさらに活かすためのヒント</Text>
        <Text style={styles.subtitle}>
          日記の分析から導き出された、あなたの成長のためのアドバイス
        </Text>
      </View>

      <View style={styles.adviceSection}>
        {mockAdvice.map((item) => (
          <View key={item.id} style={styles.adviceCard}>
            <View style={styles.adviceHeader}>
              <item.icon size={24} color={Theme.colors.primary} />
              <Text style={styles.adviceTitle}>{item.title}</Text>
            </View>
            <Text style={styles.adviceText}>{item.description}</Text>
          </View>
        ))}
      </View>

      {/* {targetTypeAdvice && (
        <View style={styles.targetSection}>
          <Text style={styles.sectionTitle}>
            なりたいタイプ（{targetTypeAdvice.targetType}）に向けて
          </Text>
          <View style={styles.targetAdviceList}>
            {targetTypeAdvice.advice.map((advice, index) => (
              <View key={index} style={styles.targetAdviceItem}>
                <Text style={styles.targetAdviceText}>• {advice}</Text>
              </View>
            ))}
          </View>
        </View>
      )} */}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
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
  adviceSection: {
    padding: Theme.spacing.md,
  },
  adviceCard: {
    backgroundColor: Theme.colors.white,
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
  adviceTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: Theme.colors.text,
    marginLeft: Theme.spacing.sm,
  },
  adviceText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Theme.colors.text,
    lineHeight: 20,
  },
  targetSection: {
    padding: Theme.spacing.md,
    backgroundColor: Theme.colors.white,
    margin: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    ...Theme.shadows.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: Theme.colors.text,
    marginBottom: Theme.spacing.md,
  },
  targetAdviceList: {
    marginTop: Theme.spacing.sm,
  },
  targetAdviceItem: {
    marginBottom: Theme.spacing.sm,
  },
  targetAdviceText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Theme.colors.text,
    lineHeight: 20,
  },
});