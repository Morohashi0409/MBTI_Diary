import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Reanimated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withTiming,
  Easing
} from 'react-native-reanimated';
import { Theme } from '@/constants/theme';

type FeedbackDisplayProps = {
  feedback: string;
  summary: string;
  delay?: number;
};

const FeedbackDisplay: React.FC<FeedbackDisplayProps> = ({ 
  feedback, 
  summary, 
  delay = 0 
}) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);
  
  useEffect(() => {
    setTimeout(() => {
      opacity.value = withTiming(1, { 
        duration: 500, 
        easing: Easing.out(Easing.cubic) 
      });
      
      translateY.value = withTiming(0, { 
        duration: 500, 
        easing: Easing.out(Easing.cubic) 
      });
    }, delay);
  }, [delay]);
  
  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }]
    };
  });

  return (
    <Reanimated.View style={[styles.container, animatedStyle]}>
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryTitle}>Summary</Text>
        <Text style={styles.summaryText}>{summary}</Text>
      </View>
      
      <View style={styles.feedbackContainer}>
        <Text style={styles.feedbackTitle}>Detailed Feedback</Text>
        <Text style={styles.feedbackText}>{feedback}</Text>
      </View>
    </Reanimated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
    ...Theme.shadows.sm,
  },
  summaryContainer: {
    marginBottom: Theme.spacing.md,
    padding: Theme.spacing.md,
    backgroundColor: Theme.colors.primaryLight + '20', // Adding transparency
    borderRadius: Theme.borderRadius.sm,
  },
  summaryTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: Theme.colors.white,
    marginBottom: Theme.spacing.xs,
  },
  summaryText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: Theme.colors.text,
    lineHeight: 24,
  },
  feedbackContainer: {
    padding: Theme.spacing.md,
    backgroundColor: Theme.colors.secondaryLight + '20', // Adding transparency
    borderRadius: Theme.borderRadius.sm,
  },
  feedbackTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: Theme.colors.white,
    marginBottom: Theme.spacing.xs,
  },
  feedbackText: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    color: Theme.colors.text,
    lineHeight: 22,
  },
});

export default FeedbackDisplay;