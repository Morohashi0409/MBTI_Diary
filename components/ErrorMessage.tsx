import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CircleAlert as AlertCircle, RefreshCw } from 'lucide-react-native';
import { Theme } from '@/constants/theme';
import Reanimated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSequence, 
  withTiming,
  withDelay,
  Easing
} from 'react-native-reanimated';

type ErrorMessageProps = {
  message: string;
  onRetry?: () => void;
};

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onRetry }) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(-10);
  const scale = useSharedValue(0.95);
  
  useEffect(() => {
    opacity.value = withTiming(1, { 
      duration: 300, 
      easing: Easing.out(Easing.cubic) 
    });
    
    translateY.value = withTiming(0, { 
      duration: 300, 
      easing: Easing.out(Easing.cubic) 
    });
    
    scale.value = withSequence(
      withTiming(1.02, { duration: 150 }),
      withTiming(1, { duration: 150 })
    );
  }, [message]);
  
  const containerStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [
        { translateY: translateY.value },
        { scale: scale.value }
      ]
    };
  });

  return (
    <Reanimated.View style={[styles.container, containerStyle]}>
      <View style={styles.iconContainer}>
        <AlertCircle color={Theme.colors.error} size={24} />
      </View>
      <View style={styles.messageContainer}>
        <Text style={styles.messageText}>{message}</Text>
      </View>
      {onRetry && (
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <RefreshCw color={Theme.colors.white} size={16} />
          <Text style={styles.retryText}>再試行</Text>
        </TouchableOpacity>
      )}
    </Reanimated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.error + '15',
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    marginVertical: Theme.spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: Theme.colors.error,
  },
  iconContainer: {
    marginRight: Theme.spacing.sm,
  },
  messageContainer: {
    flex: 1,
  },
  messageText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: Theme.colors.text,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.error,
    padding: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.sm,
    marginLeft: Theme.spacing.sm,
  },
  retryText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: Theme.colors.white,
    marginLeft: 4,
  },
});

export default ErrorMessage;