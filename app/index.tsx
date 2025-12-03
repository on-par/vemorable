import React, { useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { Audio } from 'expo-av';
import { useRouter } from 'expo-router';
import {
  RecordButton,
  Waveform,
  PromptDisplay,
  InsightModeSelector,
  ProcessingOverlay,
} from '@/components';
import { useDumpStore } from '@/stores/dumpStore';
import * as audioLib from '@/lib/audio';

export default function RecordScreen() {
  const router = useRouter();
  const recordingRef = useRef<Audio.Recording | null>(null);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const {
    currentPrompt,
    selectedInsightMode,
    recording,
    processing,
    setRecordingState,
    setSelectedInsightMode,
    rotatePrompt,
    processDump,
  } = useDumpStore();

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  // Request permissions on mount
  React.useEffect(() => {
    (async () => {
      const granted = await audioLib.requestAudioPermissions();
      setHasPermission(granted);
    })();

    return () => {
      // Cleanup on unmount
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const newRecording = await audioLib.createRecording();
      recordingRef.current = newRecording;
      await audioLib.startRecording(newRecording);

      setRecordingState({
        isRecording: true,
        isPaused: false,
        duration: 0,
        audioUri: null,
        error: null,
      });

      // Start duration timer
      durationIntervalRef.current = setInterval(() => {
        setRecordingState({
          duration: useDumpStore.getState().recording.duration + 1,
        });
      }, 1000);
    } catch (error) {
      setRecordingState({
        error: error instanceof Error ? error.message : 'Failed to start recording',
      });
    }
  }, [setRecordingState]);

  const stopRecording = useCallback(async () => {
    if (!recordingRef.current) return;

    try {
      // Stop duration timer
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }

      const uri = await audioLib.stopRecording(recordingRef.current);
      recordingRef.current = null;

      setRecordingState({
        isRecording: false,
        audioUri: uri,
      });

      // Convert to base64 and process
      const audioBase64 = await audioLib.audioToBase64(uri);
      const result = await processDump(audioBase64);

      if (result) {
        router.push('/result');
      }

      // Cleanup audio file
      await audioLib.deleteAudioFile(uri);
    } catch (error) {
      setRecordingState({
        isRecording: false,
        error: error instanceof Error ? error.message : 'Failed to stop recording',
      });
    }
  }, [setRecordingState, processDump, router]);

  const handleRecordPress = useCallback(() => {
    if (recording.isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [recording.isRecording, startRecording, stopRecording]);

  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>
            Microphone access is required to record voice memos.
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={async () => {
              const granted = await audioLib.requestAudioPermissions();
              setHasPermission(granted);
            }}
          >
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ProcessingOverlay state={processing} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/archive')}>
          <Text style={styles.headerButton}>Archive</Text>
        </TouchableOpacity>
        <Text style={styles.logo}>V</Text>
        <TouchableOpacity onPress={() => router.push('/search')}>
          <Text style={styles.headerButton}>Search</Text>
        </TouchableOpacity>
      </View>

      {/* Main content */}
      <View style={styles.content}>
        {/* Prompt */}
        <View style={styles.promptContainer}>
          <PromptDisplay
            prompt={currentPrompt}
            onRotate={rotatePrompt}
            showRotateButton={!recording.isRecording}
          />
        </View>

        {/* Recording UI */}
        <View style={styles.recordingContainer}>
          {recording.isRecording && (
            <>
              <Waveform isActive={recording.isRecording} />
              <Text style={styles.duration}>
                {audioLib.formatDuration(recording.duration)}
              </Text>
            </>
          )}
        </View>

        {/* Record button */}
        <View style={styles.buttonContainer}>
          <RecordButton
            isRecording={recording.isRecording}
            onPress={handleRecordPress}
            disabled={hasPermission !== true || processing.isProcessing}
          />
        </View>

        {/* Insight mode selector */}
        {!recording.isRecording && (
          <View style={styles.modeContainer}>
            <InsightModeSelector
              selectedMode={selectedInsightMode}
              onModeSelect={setSelectedInsightMode}
            />
          </View>
        )}

        {/* Instructions */}
        {!recording.isRecording && (
          <Text style={styles.instructions}>
            Tap to start recording your thoughts
          </Text>
        )}
      </View>

      {/* Error display */}
      {recording.error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{recording.error}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerButton: {
    color: '#6366f1',
    fontSize: 16,
    fontWeight: '500',
  },
  logo: {
    color: '#fafafa',
    fontSize: 24,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  promptContainer: {
    marginBottom: 48,
  },
  recordingContainer: {
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  duration: {
    color: '#fafafa',
    fontSize: 18,
    fontWeight: '500',
    marginTop: 12,
  },
  buttonContainer: {
    marginBottom: 32,
  },
  modeContainer: {
    width: '100%',
    marginBottom: 24,
  },
  instructions: {
    color: '#71717a',
    fontSize: 14,
  },
  errorContainer: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: '#ef4444',
    padding: 12,
    borderRadius: 8,
  },
  errorText: {
    color: '#fafafa',
    textAlign: 'center',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  permissionText: {
    color: '#fafafa',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: '#fafafa',
    fontSize: 16,
    fontWeight: '600',
  },
});
