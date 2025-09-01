import { useState, useRef, useCallback, useEffect } from 'react';

interface UseVoiceRecordingOptions {
  audioFormat?: 'webm' | 'mp4' | 'ogg';
  maxDuration?: number; // in seconds
}

interface UseVoiceRecordingReturn {
  isRecording: boolean;
  isPermissionGranted: boolean;
  recordingTime: number;
  audioBlob: Blob | null;
  error: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  resetRecording: () => void;
  requestPermission: () => Promise<boolean>;
}

export const useVoiceRecording = (
  options: UseVoiceRecordingOptions = {}
): UseVoiceRecordingReturn => {
  const { audioFormat = 'webm', maxDuration = 300 } = options;
  
  const [isRecording, setIsRecording] = useState(false);
  const [isPermissionGranted, setIsPermissionGranted] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Check for browser support
  useEffect(() => {
    if (typeof window !== 'undefined' && !navigator.mediaDevices?.getUserMedia) {
      setError('Browser does not support audio recording');
    }
  }, []);

  // Request microphone permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      // Immediately stop the stream after getting permission
      stream.getTracks().forEach(track => track.stop());
      
      setIsPermissionGranted(true);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get microphone permission';
      
      if (errorMessage.includes('Permission denied')) {
        setError('Microphone permission denied. Please allow microphone access in your browser settings.');
      } else if (errorMessage.includes('Permission dismissed')) {
        setError('Microphone permission request was dismissed. Please try again.');
      } else {
        setError(`Failed to access microphone: ${errorMessage}`);
      }
      
      setIsPermissionGranted(false);
      return false;
    }
  }, []);

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      setError(null);
      
      // Request permission if not already granted
      if (!isPermissionGranted) {
        const hasPermission = await requestPermission();
        if (!hasPermission) {
          return;
        }
      }

      // Get media stream
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      streamRef.current = stream;

      // Determine MIME type based on browser support
      let mimeType = 'audio/webm;codecs=opus';
      if (audioFormat === 'mp4' && MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      } else if (audioFormat === 'ogg' && MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
        mimeType = 'audio/ogg;codecs=opus';
      } else if (!MediaRecorder.isTypeSupported(mimeType)) {
        // Fallback to whatever is supported
        if (MediaRecorder.isTypeSupported('audio/webm')) {
          mimeType = 'audio/webm';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        }
      }

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      // Handle data available
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      // Handle recording stop
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        chunksRef.current = [];
      };

      // Handle errors
      mediaRecorder.onerror = (event: Event) => {
        const errorEvent = event as ErrorEvent;
        setError(`Recording error: ${errorEvent.error?.message || 'Unknown error'}`);
        stopRecording();
      };

      // Start recording
      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      let seconds = 0;
      timerRef.current = setInterval(() => {
        seconds += 1;
        setRecordingTime(seconds);
        
        // Auto-stop at max duration
        if (seconds >= maxDuration) {
          // Stop recording directly instead of calling stopRecording
          if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
          }
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
          }
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          setIsRecording(false);
        }
      }, 1000);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start recording';
      setError(errorMessage);
      setIsRecording(false);
    }
  }, [isPermissionGranted, requestPermission, audioFormat, maxDuration]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setIsRecording(false);
  }, []);

  // Reset recording
  const resetRecording = useCallback(() => {
    stopRecording();
    setAudioBlob(null);
    setRecordingTime(0);
    setError(null);
  }, [stopRecording]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isRecording) {
        stopRecording();
      }
    };
  }, [isRecording, stopRecording]);

  return {
    isRecording,
    isPermissionGranted,
    recordingTime,
    audioBlob,
    error,
    startRecording,
    stopRecording,
    resetRecording,
    requestPermission
  };
};