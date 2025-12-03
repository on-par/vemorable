import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import type { ProcessingState } from '@/types';

interface ProcessingOverlayProps {
  state: ProcessingState;
}

const stepMessages: Record<ProcessingState['step'], string> = {
  idle: '',
  uploading: 'Uploading audio...',
  transcribing: 'Transcribing your thoughts...',
  analyzing: 'Finding the one thing...',
  saving: 'Saving your dump...',
};

export function ProcessingOverlay({ state }: ProcessingOverlayProps) {
  if (!state.isProcessing) {
    return null;
  }

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(300)}
      style={styles.overlay}
    >
      <View style={styles.content}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.message}>{stepMessages[state.step]}</Text>

        <View style={styles.steps}>
          <StepIndicator
            label="Upload"
            isActive={state.step === 'uploading'}
            isComplete={['transcribing', 'analyzing', 'saving'].includes(state.step)}
          />
          <StepIndicator
            label="Transcribe"
            isActive={state.step === 'transcribing'}
            isComplete={['analyzing', 'saving'].includes(state.step)}
          />
          <StepIndicator
            label="Analyze"
            isActive={state.step === 'analyzing'}
            isComplete={state.step === 'saving'}
          />
          <StepIndicator
            label="Save"
            isActive={state.step === 'saving'}
            isComplete={false}
          />
        </View>
      </View>
    </Animated.View>
  );
}

interface StepIndicatorProps {
  label: string;
  isActive: boolean;
  isComplete: boolean;
}

function StepIndicator({ label, isActive, isComplete }: StepIndicatorProps) {
  return (
    <View style={styles.step}>
      <View
        style={[
          styles.stepDot,
          isActive && styles.stepDotActive,
          isComplete && styles.stepDotComplete,
        ]}
      />
      <Text
        style={[
          styles.stepLabel,
          (isActive || isComplete) && styles.stepLabelActive,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  content: {
    alignItems: 'center',
    padding: 32,
  },
  message: {
    color: '#fafafa',
    fontSize: 18,
    fontWeight: '500',
    marginTop: 24,
    textAlign: 'center',
  },
  steps: {
    flexDirection: 'row',
    marginTop: 32,
    gap: 16,
  },
  step: {
    alignItems: 'center',
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#2a2a2a',
    marginBottom: 8,
  },
  stepDotActive: {
    backgroundColor: '#6366f1',
  },
  stepDotComplete: {
    backgroundColor: '#22c55e',
  },
  stepLabel: {
    color: '#71717a',
    fontSize: 11,
  },
  stepLabelActive: {
    color: '#fafafa',
  },
});
