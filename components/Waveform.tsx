import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withDelay,
} from 'react-native-reanimated';

interface WaveformProps {
  isActive: boolean;
  barCount?: number;
}

function WaveformBar({ index, isActive }: { index: number; isActive: boolean }) {
  const height = useSharedValue(8);

  React.useEffect(() => {
    if (isActive) {
      // Random animation for each bar
      const minHeight = 8;
      const maxHeight = 32 + Math.random() * 16;
      const duration = 300 + Math.random() * 200;
      const delay = index * 50;

      height.value = withDelay(
        delay,
        withRepeat(
          withTiming(maxHeight, { duration }),
          -1,
          true
        )
      );
    } else {
      height.value = withTiming(8, { duration: 200 });
    }
  }, [isActive, height, index]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: height.value,
  }));

  return <Animated.View style={[styles.bar, animatedStyle]} />;
}

export function Waveform({ isActive, barCount = 5 }: WaveformProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: barCount }).map((_, index) => (
        <WaveformBar key={index} index={index} isActive={isActive} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 48,
  },
  bar: {
    width: 4,
    backgroundColor: '#6366f1',
    borderRadius: 2,
  },
});
