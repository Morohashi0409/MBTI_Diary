import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Reanimated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withTiming,
  Easing 
} from 'react-native-reanimated';
import { Theme } from '@/constants/theme';
import { MBTIDimension } from '@/types';

type MBTIScoreCardProps = {
  dimension: MBTIDimension;
  delay?: number;
};

const MBTIScoreCard: React.FC<MBTIScoreCardProps> = ({ 
  dimension, 
  delay = 0 
}) => {
  const progress = useSharedValue(0);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);
  
  // 左側が高いか右側が高いかを判断
  const isRightSideHigher = dimension.score < 50;
  
  // 表示するスコア値を取得
  const leftScore = dimension.score.toFixed(1);
  const rightScore = (100 - dimension.score).toFixed(1);
  
  // プログレスバーの値と方向を決定
  const progressValue = isRightSideHigher 
    ? (100 - dimension.score) / 100  // 右側が高い場合は反転値
    : dimension.score / 100;         // 左側が高い場合はそのまま
  
  useEffect(() => {
    // Animation for progress bar
    setTimeout(() => {
      opacity.value = withTiming(1, { 
        duration: 300, 
        easing: Easing.out(Easing.cubic) 
      });
      
      translateY.value = withTiming(0, { 
        duration: 300, 
        easing: Easing.out(Easing.cubic) 
      });
      
      progress.value = withTiming(progressValue, { 
        duration: 1000, 
        easing: Easing.out(Easing.cubic) 
      });
    }, delay);
  }, [dimension.score, delay, progressValue]);
  
  const progressBarStyle = useAnimatedStyle(() => {
    return {
      width: `${progress.value * 100}%`,
      ...(isRightSideHigher 
          ? { right: 0 }    // 右側から表示
          : { left: 0 })    // 左側から表示
    };
  });
  
  const cardStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }]
    };
  });

  const barColor = getGradientColor(
    isRightSideHigher 
      ? (100 - dimension.score) / 100 
      : dimension.score / 100
  );

  return (
    <Reanimated.View style={[styles.container, cardStyle]}>
      <Text style={styles.dimensionName}>{dimension.name}</Text>
      <View style={styles.labelsContainer}>
        <Text style={styles.label}>{dimension.label1}</Text>
        <Text style={styles.label}>{dimension.label2}</Text>
      </View>
      <View style={styles.progressContainer}>
        <View style={styles.scoreIndicator}>
          <Text style={styles.scoreText}>
            {leftScore}%
          </Text>
        </View>
        <View style={styles.progressBackground}>
          <Reanimated.View 
            style={[
              styles.progressFill, 
              progressBarStyle,
              { backgroundColor: barColor }
            ]} 
          />
        </View>
        <View style={styles.scoreIndicator}>
          <Text style={styles.scoreText}>
            {rightScore}%
          </Text>
        </View>
      </View>
    </Reanimated.View>
  );
};

// Helper function to get color based on score
const getGradientColor = (score: number) => {
  // Left side (0) is first label, right side (1) is second label
  if (score < 0.3) return Theme.colors.primary;
  if (score < 0.7) return Theme.colors.secondary;
  return Theme.colors.accent;
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
    ...Theme.shadows.sm,
  },
  dimensionName: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: Theme.colors.text,
    marginBottom: Theme.spacing.xs,
  },
  labelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Theme.spacing.xs,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Theme.colors.textSecondary,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.xs,
  },
  progressBackground: {
    flex: 1,
    height: 8,
    backgroundColor: Theme.colors.border,
    borderRadius: Theme.borderRadius.round,
    overflow: 'hidden',
    marginHorizontal: Theme.spacing.xs,
  },
  progressFill: {
    height: '100%',
    borderRadius: Theme.borderRadius.round,
    position: 'absolute',
  },
  scoreIndicator: {
    alignSelf: 'flex-start',
  },
  scoreText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: Theme.colors.textSecondary,
  },
});

export default MBTIScoreCard;