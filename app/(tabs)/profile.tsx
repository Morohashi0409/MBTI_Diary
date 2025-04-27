import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Theme } from '@/constants/theme';
import LineChart from '@/components/LineChart';
import { MBTIScoreCard } from '@/components/MBTIScoreCard';

// Mock data for MBTI scores over time
const mockTimelineData = {
  labels: ['1月', '2月', '3月', '4月', '5月'],
  datasets: [
    {
      label: 'E-I',
      data: [30, 45, 55, 60, 65],
      color: Theme.colors.primary,
    },
    {
      label: 'S-N',
      data: [50, 48, 52, 55, 58],
      color: Theme.colors.secondary,
    },
    {
      label: 'T-F',
      data: [70, 65, 60, 62, 65],
      color: Theme.colors.accent,
    },
    {
      label: 'J-P',
      data: [40, 45, 50, 48, 45],
      color: Theme.colors.success,
    },
  ],
};

// Current MBTI dimensions
const currentDimensions = [
  {
    name: '外向-内向',
    score: 65,
    label1: '外向的 (E)',
    label2: '内向的 (I)',
  },
  {
    name: '感覚-直感',
    score: 58,
    label1: '感覚的 (S)',
    label2: '直感的 (N)',
  },
  {
    name: '思考-感情',
    score: 65,
    label1: '論理的 (T)',
    label2: '感情的 (F)',
  },
  {
    name: '判断-知覚',
    score: 45,
    label1: '計画的 (J)',
    label2: '柔軟的 (P)',
  },
];

export default function ProfileScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>あなたの現在のMBTI傾向</Text>
        <Text style={styles.subtitle}>
          過去の日記から分析された、あなたのパーソナリティの特徴です
        </Text>
      </View>

      <View style={styles.currentScores}>
        {currentDimensions.map((dimension, index) => (
          <MBTIScoreCard
            key={dimension.name}
            dimension={dimension}
            delay={index * 200}
          />
        ))}
      </View>

      <View style={styles.timelineSection}>
        <Text style={styles.sectionTitle}>スコア推移</Text>
        <Text style={styles.sectionSubtitle}>
          時間とともに変化するあなたのMBTI傾向
        </Text>
        <View style={styles.chartContainer}>
          <LineChart data={mockTimelineData} />
        </View>
      </View>

      <View style={styles.insightSection}>
        <Text style={styles.sectionTitle}>最近の変化</Text>
        <View style={styles.insightCard}>
          <Text style={styles.insightText}>
            最近の日記からは、内向的な傾向が強まっていることが観察されます。
            また、直感的な思考パターンも徐々に発達してきています。
          </Text>
        </View>
      </View>
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
});