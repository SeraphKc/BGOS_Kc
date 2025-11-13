/**
 * AudioRecordingService
 *
 * Service for handling audio recording using react-native-audio-recorder-player
 * Provides recording, pause/resume, and audio level monitoring
 */

import AudioRecorderPlayer, {
  AVEncoderAudioQualityIOSType,
  AVEncodingOption,
  AudioEncoderAndroidType,
  AudioSourceAndroidType,
  PlayBackType,
  RecordBackType,
} from 'react-native-audio-recorder-player';
import { Platform } from 'react-native';
import RNFS from 'react-native-fs';

class AudioRecordingService {
  private audioRecorderPlayer: AudioRecorderPlayer;
  private recordingPath: string | null = null;
  private isRecording: boolean = false;
  private isPaused: boolean = false;
  private audioLevelCallback: ((level: number) => void) | null = null;

  constructor() {
    this.audioRecorderPlayer = new AudioRecorderPlayer();
  }

  /**
   * Start recording audio
   * @returns Path to the recording file
   */
  async startRecording(): Promise<string> {
    try {
      // Generate unique file path
      const path = this.generateRecordingPath();
      this.recordingPath = path;

      // Configure audio settings
      const audioSet = {
        AudioEncoderAndroid: AudioEncoderAndroidType.AAC,
        AudioSourceAndroid: AudioSourceAndroidType.MIC,
        AVEncoderAudioQualityKeyIOS: AVEncoderAudioQualityIOSType.high,
        AVNumberOfChannelsKeyIOS: 1,
        AVFormatIDKeyIOS: AVEncodingOption.aac,
      };

      console.log('Starting recording to path:', path);
      const uri = await this.audioRecorderPlayer.startRecorder(path, audioSet);

      // Setup audio level listener
      this.audioRecorderPlayer.addRecordBackListener((e: RecordBackType) => {
        // Normalize metering value to 0-1 range
        // iOS: currentMetering ranges from -160 to 0
        // Android: currentDecibels ranges from 0 to 120
        let normalizedLevel = 0;

        if (Platform.OS === 'ios' && e.currentMetering !== undefined) {
          normalizedLevel = Math.max(0, (e.currentMetering + 160) / 160);
        } else if (Platform.OS === 'android' && e.currentDecibels !== undefined) {
          normalizedLevel = Math.min(1, e.currentDecibels / 120);
        }

        if (this.audioLevelCallback) {
          this.audioLevelCallback(normalizedLevel);
        }
      });

      this.isRecording = true;
      this.isPaused = false;
      console.log('Recording started successfully');

      return uri;
    } catch (error) {
      console.error('Failed to start recording:', error);
      throw error;
    }
  }

  /**
   * Stop recording and return the file path
   * @returns Path to the recorded audio file
   */
  async stopRecording(): Promise<string> {
    try {
      if (!this.isRecording) {
        throw new Error('No active recording to stop');
      }

      console.log('Stopping recording...');
      const result = await this.audioRecorderPlayer.stopRecorder();
      this.audioRecorderPlayer.removeRecordBackListener();

      this.isRecording = false;
      this.isPaused = false;

      console.log('Recording stopped, file saved to:', result);
      return result;
    } catch (error) {
      console.error('Failed to stop recording:', error);
      throw error;
    }
  }

  /**
   * Pause the current recording
   */
  async pauseRecording(): Promise<void> {
    try {
      if (!this.isRecording || this.isPaused) {
        return;
      }

      await this.audioRecorderPlayer.pauseRecorder();
      this.isPaused = true;
      console.log('Recording paused');
    } catch (error) {
      console.error('Failed to pause recording:', error);
      throw error;
    }
  }

  /**
   * Resume a paused recording
   */
  async resumeRecording(): Promise<void> {
    try {
      if (!this.isRecording || !this.isPaused) {
        return;
      }

      await this.audioRecorderPlayer.resumeRecorder();
      this.isPaused = false;
      console.log('Recording resumed');
    } catch (error) {
      console.error('Failed to resume recording:', error);
      throw error;
    }
  }

  /**
   * Get the current recording status
   */
  getStatus(): { isRecording: boolean; isPaused: boolean } {
    return {
      isRecording: this.isRecording,
      isPaused: this.isPaused,
    };
  }

  /**
   * Set callback for audio level updates
   * @param callback Function to call with normalized audio level (0-1)
   */
  setAudioLevelCallback(callback: (level: number) => void): void {
    this.audioLevelCallback = callback;
  }

  /**
   * Remove audio level callback
   */
  removeAudioLevelCallback(): void {
    this.audioLevelCallback = null;
  }

  /**
   * Convert audio file to base64
   * @param filePath Path to the audio file
   * @returns Base64 encoded audio data
   */
  async convertToBase64(filePath: string): Promise<string> {
    try {
      console.log('Converting audio file to base64:', filePath);
      const base64 = await RNFS.readFile(filePath, 'base64');
      console.log('Audio file converted to base64, length:', base64.length);
      return base64;
    } catch (error) {
      console.error('Failed to convert audio to base64:', error);
      throw error;
    }
  }

  /**
   * Delete the recorded audio file
   * @param filePath Path to the audio file to delete
   */
  async deleteRecording(filePath: string): Promise<void> {
    try {
      const exists = await RNFS.exists(filePath);
      if (exists) {
        await RNFS.unlink(filePath);
        console.log('Recording file deleted:', filePath);
      }
    } catch (error) {
      console.error('Failed to delete recording:', error);
      // Don't throw - deletion failure shouldn't break the flow
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    try {
      if (this.isRecording) {
        await this.stopRecording();
      }

      if (this.recordingPath) {
        await this.deleteRecording(this.recordingPath);
        this.recordingPath = null;
      }

      this.audioLevelCallback = null;
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }

  /**
   * Generate a unique path for recording
   */
  private generateRecordingPath(): string {
    const timestamp = Date.now();
    const filename = `voice_recording_${timestamp}`;

    if (Platform.OS === 'ios') {
      return `${filename}.m4a`;
    } else {
      // Android
      return `${RNFS.CachesDirectoryPath}/${filename}.mp3`;
    }
  }
}

export default new AudioRecordingService();
