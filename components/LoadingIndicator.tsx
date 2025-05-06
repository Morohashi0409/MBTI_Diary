import React, { useEffect, useState } from 'react';
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
  colorScheme?: 'EI' | 'SN' | 'TF' | 'JP';
  isProfile?: boolean; // マイページ用のフラグを追加
  whiteText?: boolean; // テキストを白にするためのフラグを追加
};

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ 
  text = '日記を分析中...',
  colorScheme = 'JP', // デフォルトはJP（紫色: #88619a）
  isProfile = false, // デフォルトは false
  whiteText = false, // デフォルトは false
}) => {
  const dot1Opacity = useSharedValue(0.3);
  const dot2Opacity = useSharedValue(0.3);
  const dot3Opacity = useSharedValue(0.3);
  
  // 選択された色スキームに基づいてアクセントカラーを取得
  const accentColor = Theme.colors.mbti[colorScheme];
  
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
    <View style={[
      styles.container, 
      isProfile && styles.profileContainer
    ]}>
      <Text style={[
        styles.text, 
        isProfile || whiteText ? styles.profileText : { color: accentColor }
      ]}>{text}</Text>
      <View style={styles.dotsContainer}>
        <Reanimated.View style={[
          styles.dot, 
          dot1Style, 
          { backgroundColor: isProfile || whiteText ? Theme.colors.white : accentColor }
        ]} />
        <Reanimated.View style={[
          styles.dot, 
          dot2Style, 
          { backgroundColor: isProfile || whiteText ? Theme.colors.white : accentColor }
        ]} />
        <Reanimated.View style={[
          styles.dot, 
          dot3Style, 
          { backgroundColor: isProfile || whiteText ? Theme.colors.white : accentColor }
        ]} />
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
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.borderRadius.md,
    ...Theme.shadows.sm,
  },
  profileContainer: {
    backgroundColor: Theme.colors.background, // マイページの背景を他画面と統一されたグレーに変更
  },
  text: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: Theme.colors.text,
    marginRight: Theme.spacing.sm,
  },
  profileText: {
    color: Theme.colors.white,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    margin: 2,
  },
});

export default LoadingIndicator;