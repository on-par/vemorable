import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

/**
 * Audio recording utilities using expo-av
 */

export interface RecordingOptions {
  sampleRate?: number;
  numberOfChannels?: number;
  bitRate?: number;
}

const DEFAULT_RECORDING_OPTIONS: Audio.RecordingOptions = {
  isMeteringEnabled: true,
  android: {
    extension: '.m4a',
    outputFormat: Audio.AndroidOutputFormat.MPEG_4,
    audioEncoder: Audio.AndroidAudioEncoder.AAC,
    sampleRate: 44100,
    numberOfChannels: 1,
    bitRate: 128000,
  },
  ios: {
    extension: '.m4a',
    outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
    audioQuality: Audio.IOSAudioQuality.HIGH,
    sampleRate: 44100,
    numberOfChannels: 1,
    bitRate: 128000,
  },
  web: {
    mimeType: 'audio/webm',
    bitsPerSecond: 128000,
  },
};

/**
 * Request audio recording permissions
 */
export async function requestAudioPermissions(): Promise<boolean> {
  const { status } = await Audio.requestPermissionsAsync();
  return status === 'granted';
}

/**
 * Check if audio permissions are granted
 */
export async function hasAudioPermissions(): Promise<boolean> {
  const { status } = await Audio.getPermissionsAsync();
  return status === 'granted';
}

/**
 * Configure audio mode for recording
 */
export async function configureAudioMode(): Promise<void> {
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: true,
    playsInSilentModeIOS: true,
    staysActiveInBackground: false,
    shouldDuckAndroid: true,
    playThroughEarpieceAndroid: false,
  });
}

/**
 * Create a new recording instance
 */
export async function createRecording(): Promise<Audio.Recording> {
  await configureAudioMode();

  const recording = new Audio.Recording();
  await recording.prepareToRecordAsync(DEFAULT_RECORDING_OPTIONS);

  return recording;
}

/**
 * Start recording audio
 */
export async function startRecording(recording: Audio.Recording): Promise<void> {
  await recording.startAsync();
}

/**
 * Stop recording and get the URI
 */
export async function stopRecording(recording: Audio.Recording): Promise<string> {
  await recording.stopAndUnloadAsync();

  // Reset audio mode for playback
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
  });

  const uri = recording.getURI();
  if (!uri) {
    throw new Error('Recording URI is null');
  }

  return uri;
}

/**
 * Get recording status
 */
export async function getRecordingStatus(
  recording: Audio.Recording
): Promise<Audio.RecordingStatus> {
  return await recording.getStatusAsync();
}

/**
 * Convert audio file to base64
 */
export async function audioToBase64(uri: string): Promise<string> {
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return base64;
}

/**
 * Get audio duration from file
 */
export async function getAudioDuration(uri: string): Promise<number> {
  const { sound } = await Audio.Sound.createAsync({ uri });
  const status = await sound.getStatusAsync();
  await sound.unloadAsync();

  if (status.isLoaded) {
    return Math.round(status.durationMillis! / 1000);
  }

  return 0;
}

/**
 * Delete audio file
 */
export async function deleteAudioFile(uri: string): Promise<void> {
  try {
    await FileSystem.deleteAsync(uri);
  } catch {
    // File may not exist, ignore error
  }
}

/**
 * Format duration in seconds to mm:ss
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
