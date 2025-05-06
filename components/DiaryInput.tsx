import React, { useState } from 'react';
import { 
  View, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  Text,
  Keyboard,
} from 'react-native';
import { SendHorizontal } from 'lucide-react-native';
import { Theme } from '@/constants/theme';
import Reanimated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withTiming, 
  withSequence,
} from 'react-native-reanimated';

type DiaryInputProps = {
  onSubmit: (text: string) => void;
  isLoading: boolean;
  colorScheme?: 'EI' | 'SN' | 'TF' | 'JP';
};

const DiaryInput: React.FC<DiaryInputProps> = ({ 
  onSubmit, 
  isLoading, 
  colorScheme = 'JP' 
}) => {
  const [text, setText] = useState('');
  const scale = useSharedValue(1);
  
  const accentColor = Theme.colors.mbti[colorScheme];
  
  const animatedButtonStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }]
    };
  });

  const handleSubmit = async () => {
    if (text.trim().length === 0 || isLoading) return;
    
    scale.value = withSequence(
      withTiming(0.9, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );
    
    Keyboard.dismiss();
    onSubmit(text.trim());
  };

  const placeholderText = "今日はどんな一日でしたか？あなたの思いを共有してください...";

  return (
    <View style={styles.container}>
      <TextInput
        style={[
          styles.input,
          { borderColor: text.length > 0 ? accentColor : Theme.colors.border }
        ]}
        value={text}
        onChangeText={setText}
        placeholder={placeholderText}
        placeholderTextColor={Theme.colors.textTertiary}
        multiline
        numberOfLines={6}
        maxLength={1000}
        editable={!isLoading}
      />
      <Reanimated.View style={[styles.buttonContainer, animatedButtonStyle]}>
        <TouchableOpacity
          style={[
            styles.submitButton,
            { backgroundColor: Theme.colors.white },
            (text.trim().length === 0 || isLoading) && styles.disabledButton
          ]}
          onPress={handleSubmit}
          disabled={text.trim().length === 0 || isLoading}
        >
          <SendHorizontal 
            size={24} 
            color={text.trim().length === 0 || isLoading 
              ? Theme.colors.textTertiary 
              : Theme.colors.card
            } 
          />
        </TouchableOpacity>
      </Reanimated.View>
      <Text style={[
        styles.characterCount,
        text.length > 900 && { color: Theme.colors.warning },
        text.length > 950 && { color: Theme.colors.error }
      ]}>
        {text.length}/1000
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: Theme.spacing.md,
    position: 'relative',
  },
  input: {
    width: '100%',
    minHeight: 180,
    maxHeight: 300,
    borderWidth: 1,
    borderRadius: Theme.borderRadius.md,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.md,
    paddingBottom: Theme.spacing.lg,
    backgroundColor: Theme.colors.card,
    color: Theme.colors.text,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    textAlignVertical: 'top',
    ...Theme.shadows.sm,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: Theme.spacing.md,
    right: Theme.spacing.md,
  },
  submitButton: {
    width: 44,
    height: 44,
    borderRadius: Theme.borderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
    ...Theme.shadows.sm,
  },
  disabledButton: {
    opacity: 0.5,
  },
  characterCount: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    fontSize: 12,
    color: Theme.colors.textTertiary,
    fontFamily: 'Inter-Regular',
  },
});

export default DiaryInput;