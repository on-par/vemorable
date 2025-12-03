import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';

interface RecordButtonProps {
  isRecording: boolean;
  onPress: () => void;
  disabled?: boolean;
}

export function RecordButton({ isRecording, onPress, disabled }: RecordButtonProps) {
  const scale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0);

  React.useEffect(() => {
    if (isRecording) {
      // Pulse animation while recording
      scale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 500 }),
          withTiming(1, { duration: 500 })
        ),
        -1,
        true
      );
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.5, { duration: 500 }),
          withTiming(0, { duration: 500 })
        ),
        -1,
        true
      );
    } else {
      scale.value = withTiming(1, { duration: 200 });
      pulseOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [isRecording, scale, pulseOpacity]);

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedPulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  return (
    <View style={styles.container}>
      {/* Pulse ring */}
      <Animated.View style={[styles.pulseRing, animatedPulseStyle]} />

      {/* Main button */}
      <Animated.View style={animatedButtonStyle}>
        <TouchableOpacity
          style={[
            styles.button,
            isRecording && styles.buttonRecording,
            disabled && styles.buttonDisabled,
          ]}
          onPress={onPress}
          disabled={disabled}
          activeOpacity={0.8}
        >
          <View
            style={[
              styles.innerShape,
              isRecording && styles.innerShapeRecording,
            ]}
          />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 120,
    height: 120,
  },
  pulseRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#ef4444',
  },
  button: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#1a1a1a',
    borderWidth: 4,
    borderColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonRecording: {
    borderColor: '#ef4444',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  innerShape: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ef4444',
  },
  innerShapeRecording: {
    width: 24,
    height: 24,
    borderRadius: 4,
  },
});
