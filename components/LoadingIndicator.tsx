import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Reanimated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withRepeat, 
  withTiming, 
  withDelay,
  Easing,
  cancelAnimation
} from 'react-native-reanimated';
import { Theme } from '@/constants/theme';

type LoadingIndicatorProps = {
  text?: string;
};

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ 
  text = '日記を分析中...'
}) => {
  const dot1Opacity = useSharedValue(0.3);
  const dot2Opacity = useSharedValue(0.3);
  const dot3Opacity = useSharedValue(0.3);
  
  const dot1Style = useAnimatedStyle(() => ({
    opacity: dot1Opacity.value
  }));
  
  const dot2Style = useAnimatedStyle(() => ({
    opacity: dot2Opacity.value
  }));
  
  const dot3Style = useAnimatedStyle(() => ({
    opacity: dot3Opacity.value
  }));
  
  useEffect(() => {
    const animationConfig = {
      duration: 400,
      easing: Easing.inOut(Easing.ease)
    };
    
    dot1Opacity.value = withRepeat(
      withTiming(1, animationConfig, () => {
        dot1Opacity.value = withTiming(0.3, animationConfig);
      }),
      -1,
      true
    );
    
    dot2Opacity.value = withDelay(
      200,
      withRepeat(
        withTiming(1, animationConfig, () => {
          dot2Opacity.value = withTiming(0.3, animationConfig);
        }),
        -1,
        true
      )
    );
    
    dot3Opacity.value = withDelay(
      400,
      withRepeat(
        withTiming(1, animationConfig, () => {
          dot3Opacity.value = withTiming(0.3, animationConfig);
        }),
        -1,
        true
      )
    );
    
    return () => {
      cancelAnimation(dot1Opacity);
      cancelAnimation(dot2Opacity);
      cancelAnimation(dot3Opacity);
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{text}</Text>
      <View style={styles.dotsContainer}>
        <Reanimated.View style={[styles.dot, dot1Style]} />
        <Reanimated.View style={[styles.dot, dot2Style]} />
        <Reanimated.View style={[styles.dot, dot3Style]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Theme.spacing.md,
  },
  text: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: Theme.colors.primary,
    marginRight: Theme.spacing.sm,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Theme.colors.primary,
    margin: 2,
  },
});

export default LoadingIndicator;