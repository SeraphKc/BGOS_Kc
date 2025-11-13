import { useState, useEffect, useRef, useCallback } from 'react';
import AudioRecorderPlayer, { AVEncoderAudioQualityIOSType, AVEncodingOption, AudioEncoderAndroidType, AudioSet, AudioSourceAndroidType } from 'react-native-audio-recorder-player';
import { Platform, PermissionsAndroid } from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';

export interface VoiceRecordingData {
  audioData: string;
  audioFileName: string;
  audioMimeType: string;
  duration: number;
}

export interface UseVoiceRecordingReturn {
  isRecording: boolean;
  recordingDuration: number;
  audioLevel: number;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<VoiceRecordingData | null>;
  cancelRecording: () => Promise<void>;
}

export const useVoiceRecording = (): UseVoiceRecordingReturn => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const audioPathRef = useRef<string | null>(null);
  const recordingStartTimeRef = useRef<number>(0);

  // Request microphone permission for Android
  const requestMicrophonePermission = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message: 'This app needs access to your microphone to record voice messages.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.error('Error requesting microphone permission:', err);
        return false;
      }
    }
    return true; // iOS handles permissions automatically
  };

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      // Request permission first
      const hasPermission = await requestMicrophonePermission();
      if (!hasPermission) {
        console.error('Microphone permission denied');
        return;
      }

      // Generate file path
      const path = Platform.select({
        ios: `voice-message-${Date.now()}.m4a`,
        android: `${ReactNativeBlobUtil.fs.dirs.CacheDir}/voice-message-${Date.now()}.m4a`,
      });

      if (!path) {
        console.error('Failed to generate audio file path');
        return;
      }

      audioPathRef.current = path;
      recordingStartTimeRef.current = Date.now();

      // Start recording (no audioSets or meteringEnabled parameters needed for basic recording)
      const result = await AudioRecorderPlayer.startRecorder(path, undefined, undefined);
      console.log('Recording started:', result);

      setIsRecording(true);
      setRecordingDuration(0);

      // Listen to recording progress for audio level and duration
      AudioRecorderPlayer.addRecordBackListener((e) => {
        // Update duration (in seconds)
        setRecordingDuration(Math.floor(e.currentPosition / 1000));

        // Simulate audio level (react-native-audio-recorder-player doesn't provide real-time audio levels)
        // We'll use a random value between 0.3 and 0.9 to simulate waveform
        // In a production app, you'd need a different library for real-time audio analysis
        setAudioLevel(0.3 + Math.random() * 0.6);
      });
    } catch (error) {
      console.error('Failed to start recording:', error);
      setIsRecording(false);
    }
  }, []);

  // Stop recording and return the audio data
  const stopRecording = useCallback(async (): Promise<VoiceRecordingData | null> => {
    try {
      const result = await AudioRecorderPlayer.stopRecorder();
      AudioRecorderPlayer.removeRecordBackListener();

      setIsRecording(false);
      setAudioLevel(0);

      console.log('Recording stopped:', result);

      if (!audioPathRef.current) {
        console.error('No audio path available');
        return null;
      }

      // Calculate actual duration
      const duration = Math.floor((Date.now() - recordingStartTimeRef.current) / 1000);

      // Read the audio file as base64
      const base64Audio = await ReactNativeBlobUtil.fs.readFile(audioPathRef.current, 'base64');

      const fileName = audioPathRef.current.split('/').pop() || 'voice-message.m4a';

      const voiceData: VoiceRecordingData = {
        audioData: base64Audio,
        audioFileName: fileName,
        audioMimeType: 'audio/m4a',
        duration,
      };

      return voiceData;
    } catch (error) {
      console.error('Failed to stop recording:', error);
      setIsRecording(false);
      setAudioLevel(0);
      return null;
    }
  }, []);

  // Cancel recording and clean up
  const cancelRecording = useCallback(async () => {
    try {
      await AudioRecorderPlayer.stopRecorder();
      AudioRecorderPlayer.removeRecordBackListener();

      setIsRecording(false);
      setRecordingDuration(0);
      setAudioLevel(0);

      // Clean up the audio file
      if (audioPathRef.current) {
        try {
          await ReactNativeBlobUtil.fs.unlink(audioPathRef.current);
          console.log('Audio file deleted:', audioPathRef.current);
        } catch (err) {
          console.error('Failed to delete audio file:', err);
        }
        audioPathRef.current = null;
      }
    } catch (error) {
      console.error('Failed to cancel recording:', error);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isRecording) {
        AudioRecorderPlayer.stopRecorder();
        AudioRecorderPlayer.removeRecordBackListener();
      }
    };
  }, [isRecording]);

  return {
    isRecording,
    recordingDuration,
    audioLevel,
    startRecording,
    stopRecording,
    cancelRecording,
  };
};
