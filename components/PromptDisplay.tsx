import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';

interface PromptDisplayProps {
  prompt: string;
  onRotate?: () => void;
  showRotateButton?: boolean;
}

export function PromptDisplay({
  prompt,
  onRotate,
  showRotateButton = true,
}: PromptDisplayProps) {
  const [key, setKey] = React.useState(0);

  const handleRotate = () => {
    setKey((k) => k + 1);
    onRotate?.();
  };

  return (
    <View style={styles.container}>
      <Animated.Text
        key={key}
        entering={FadeIn.duration(300)}
        exiting={FadeOut.duration(300)}
        style={styles.prompt}
      >
        {prompt}
      </Animated.Text>

      {showRotateButton && onRotate && (
        <TouchableOpacity
          onPress={handleRotate}
          style={styles.rotateButton}
          activeOpacity={0.7}
        >
          <Text style={styles.rotateIcon}>↻</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  prompt: {
    fontSize: 24,
    fontWeight: '300',
    color: '#fafafa',
    textAlign: 'center',
    lineHeight: 32,
  },
  rotateButton: {
    marginLeft: 12,
    padding: 8,
  },
  rotateIcon: {
    fontSize: 20,
    color: '#71717a',
  },
});
