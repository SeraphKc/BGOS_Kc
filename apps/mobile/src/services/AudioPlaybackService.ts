/**
 * AudioPlaybackService
 *
 * Service for handling audio playback using react-native-audio-recorder-player
 * Provides playback control, pause/resume, and progress monitoring
 */

import AudioRecorderPlayer, { PlayBackType } from 'react-native-audio-recorder-player';
import RNFS from 'react-native-fs';
import { Platform } from 'react-native';

class AudioPlaybackService {
  private audioRecorderPlayer: AudioRecorderPlayer;
  private isPlaying: boolean = false;
  private isPaused: boolean = false;
  private currentAudioPath: string | null = null;
  private playbackCallback: ((progress: number) => void) | null = null;
  private completeCallback: (() => void) | null = null;

  constructor() {
    this.audioRecorderPlayer = new AudioRecorderPlayer();
  }

  /**
   * Play audio from base64 data
   * @param base64Audio Base64 encoded audio data
   * @returns Promise that resolves when playback starts
   */
  async playFromBase64(base64Audio: string): Promise<void> {
    try {
      // Stop any current playback
      if (this.isPlaying) {
        await this.stopPlayback();
      }

      // Convert base64 to file
      const audioPath = await this.saveBase64ToFile(base64Audio);
      this.currentAudioPath = audioPath;

      console.log('Starting playback from:', audioPath);
      await this.audioRecorderPlayer.startPlayer(audioPath);

      // Setup playback progress listener
      this.audioRecorderPlayer.addPlayBackListener((e: PlayBackType) => {
        if (e.currentPosition > 0 && e.duration > 0) {
          const progress = e.currentPosition / e.duration;

          if (this.playbackCallback) {
            this.playbackCallback(progress);
          }

          // Check if playback completed
          if (e.currentPosition >= e.duration - 100) {
            this.handlePlaybackComplete();
          }
        }
      });

      this.isPlaying = true;
      this.isPaused = false;
      console.log('Playback started successfully');
    } catch (error) {
      console.error('Failed to play audio:', error);
      throw error;
    }
  }

  /**
   * Play audio from file path
   * @param filePath Path to the audio file
   */
  async playFromFile(filePath: string): Promise<void> {
    try {
      // Stop any current playback
      if (this.isPlaying) {
        await this.stopPlayback();
      }

      this.currentAudioPath = filePath;

      console.log('Starting playback from file:', filePath);
      await this.audioRecorderPlayer.startPlayer(filePath);

      // Setup playback progress listener
      this.audioRecorderPlayer.addPlayBackListener((e: PlayBackType) => {
        if (e.currentPosition > 0 && e.duration > 0) {
          const progress = e.currentPosition / e.duration;

          if (this.playbackCallback) {
            this.playbackCallback(progress);
          }

          // Check if playback completed
          if (e.currentPosition >= e.duration - 100) {
            this.handlePlaybackComplete();
          }
        }
      });

      this.isPlaying = true;
      this.isPaused = false;
      console.log('Playback started successfully');
    } catch (error) {
      console.error('Failed to play audio from file:', error);
      throw error;
    }
  }

  /**
   * Stop playback and cleanup
   */
  async stopPlayback(): Promise<void> {
    try {
      if (!this.isPlaying) {
        return;
      }

      console.log('Stopping playback...');
      await this.audioRecorderPlayer.stopPlayer();
      this.audioRecorderPlayer.removePlayBackListener();

      this.isPlaying = false;
      this.isPaused = false;

      // Cleanup temporary file
      if (this.currentAudioPath) {
        await this.deleteAudioFile(this.currentAudioPath);
        this.currentAudioPath = null;
      }

      console.log('Playback stopped');
    } catch (error) {
      console.error('Failed to stop playback:', error);
      throw error;
    }
  }

  /**
   * Pause playback
   */
  async pausePlayback(): Promise<void> {
    try {
      if (!this.isPlaying || this.isPaused) {
        return;
      }

      await this.audioRecorderPlayer.pausePlayer();
      this.isPaused = true;
      console.log('Playback paused');
    } catch (error) {
      console.error('Failed to pause playback:', error);
      throw error;
    }
  }

  /**
   * Resume playback
   */
  async resumePlayback(): Promise<void> {
    try {
      if (!this.isPlaying || !this.isPaused) {
        return;
      }

      await this.audioRecorderPlayer.resumePlayer();
      this.isPaused = false;
      console.log('Playback resumed');
    } catch (error) {
      console.error('Failed to resume playback:', error);
      throw error;
    }
  }

  /**
   * Get current playback status
   */
  getStatus(): { isPlaying: boolean; isPaused: boolean } {
    return {
      isPlaying: this.isPlaying,
      isPaused: this.isPaused,
    };
  }

  /**
   * Set callback for playback progress updates
   * @param callback Function to call with progress (0-1)
   */
  setPlaybackCallback(callback: (progress: number) => void): void {
    this.playbackCallback = callback;
  }

  /**
   * Set callback for playback completion
   * @param callback Function to call when playback completes
   */
  setCompleteCallback(callback: () => void): void {
    this.completeCallback = callback;
  }

  /**
   * Remove callbacks
   */
  removeCallbacks(): void {
    this.playbackCallback = null;
    this.completeCallback = null;
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    try {
      if (this.isPlaying) {
        await this.stopPlayback();
      }

      if (this.currentAudioPath) {
        await this.deleteAudioFile(this.currentAudioPath);
        this.currentAudioPath = null;
      }

      this.removeCallbacks();
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }

  /**
   * Save base64 audio data to a temporary file
   * @param base64Audio Base64 encoded audio data
   * @returns Path to the saved file
   */
  private async saveBase64ToFile(base64Audio: string): Promise<string> {
    const timestamp = Date.now();
    const filename = `voice_playback_${timestamp}`;

    const path = Platform.OS === 'ios'
      ? `${RNFS.DocumentDirectoryPath}/${filename}.m4a`
      : `${RNFS.CachesDirectoryPath}/${filename}.mp3`;

    await RNFS.writeFile(path, base64Audio, 'base64');
    console.log('Audio file saved to:', path);

    return path;
  }

  /**
   * Delete audio file
   * @param filePath Path to the file to delete
   */
  private async deleteAudioFile(filePath: string): Promise<void> {
    try {
      const exists = await RNFS.exists(filePath);
      if (exists) {
        await RNFS.unlink(filePath);
        console.log('Audio file deleted:', filePath);
      }
    } catch (error) {
      console.error('Failed to delete audio file:', error);
      // Don't throw - deletion failure shouldn't break the flow
    }
  }

  /**
   * Handle playback completion
   */
  private handlePlaybackComplete(): void {
    console.log('Playback completed');
    this.isPlaying = false;
    this.isPaused = false;

    if (this.completeCallback) {
      this.completeCallback();
    }

    // Cleanup
    this.audioRecorderPlayer.removePlayBackListener();
  }
}

export default new AudioPlaybackService();
