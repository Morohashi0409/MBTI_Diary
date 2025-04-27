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
      
      progress.value = withTiming(dimension.score / 100, { 
        duration: 1000, 
        easing: Easing.out(Easing.cubic) 
      });
    }, delay);
  }, [dimension.score, delay]);
  
  const progressBarStyle = useAnimatedStyle(() => {
    return {
      width: `${progress.value * 100}%`
    };
  });
  
  const cardStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }]
    };
  });

  return (
    <Reanimated.View style={[styles.container, cardStyle]}>
      <Text style={styles.dimensionName}>{dimension.name}</Text>
      <View style={styles.labelsContainer}>
        <Text style={styles.label}>{dimension.label1}</Text>
        <Text style={styles.label}>{dimension.label2}</Text>
      </View>
      <View style={styles.progressBackground}>
        <Reanimated.View 
          style={[
            styles.progressFill, 
            progressBarStyle,
            { backgroundColor: getGradientColor(dimension.score / 100) }
          ]} 
        />
      </View>
      <View style={styles.scoreIndicator}>
        <Text style={styles.scoreText}>
          {Math.round(dimension.score)}%
        </Text>
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
  progressBackground: {
    height: 8,
    backgroundColor: Theme.colors.border,
    borderRadius: Theme.borderRadius.round,
    overflow: 'hidden',
    marginBottom: Theme.spacing.xs,
  },
  progressFill: {
    height: '100%',
    borderRadius: Theme.borderRadius.round,
  },
  scoreIndicator: {
    alignSelf: 'flex-end',
  },
  scoreText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: Theme.colors.textSecondary,
  },
});

export default MBTIScoreCard;