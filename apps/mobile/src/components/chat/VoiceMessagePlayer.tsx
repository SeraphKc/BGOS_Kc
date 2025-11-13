import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { COLORS } from '@bgos/shared-logic';

interface VoiceMessagePlayerProps {
  audioData: string;
  audioMimeType: string;
  duration: number;
  fileName?: string;
}

export const VoiceMessagePlayer: React.FC<VoiceMessagePlayerProps> = ({
  audioData,
  audioMimeType,
  duration,
  fileName,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [audioDuration, setAudioDuration] = useState(duration);
  const audioPathRef = useRef<string | null>(null);

  // Format time as M:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Save base64 audio to temp file
  const saveAudioFile = async (): Promise<string | null> => {
    try {
      if (audioPathRef.current) {
        return audioPathRef.current;
      }

      const fileExtension = audioMimeType.includes('m4a') ? 'm4a' : 'mp3';
      const tempPath = `${ReactNativeBlobUtil.fs.dirs.CacheDir}/voice-playback-${Date.now()}.${fileExtension}`;

      await ReactNativeBlobUtil.fs.writeFile(tempPath, audioData, 'base64');
      audioPathRef.current = tempPath;
      return tempPath;
    } catch (error) {
      console.error('Failed to save audio file:', error);
      return null;
    }
  };

  // Start playback
  const startPlayback = async () => {
    try {
      const audioPath = await saveAudioFile();
      if (!audioPath) {
        console.error('Failed to get audio path');
        return;
      }

      const result = await AudioRecorderPlayer.startPlayer(audioPath, undefined);
      console.log('Playback started:', result);

      setIsPlaying(true);

      AudioRecorderPlayer.addPlayBackListener((e) => {
        setCurrentPosition(Math.floor(e.currentPosition / 1000));
        setAudioDuration(Math.floor(e.duration / 1000));

        // Stop when playback finishes
        if (e.currentPosition >= e.duration) {
          stopPlayback();
        }
      });
    } catch (error) {
      console.error('Failed to start playback:', error);
      setIsPlaying(false);
    }
  };

  // Stop playback
  const stopPlayback = async () => {
    try {
      await AudioRecorderPlayer.stopPlayer();
      AudioRecorderPlayer.removePlayBackListener();
      setIsPlaying(false);
      setCurrentPosition(0);
    } catch (error) {
      console.error('Failed to stop playback:', error);
    }
  };

  // Toggle play/pause
  const togglePlayback = async () => {
    if (isPlaying) {
      await stopPlayback();
    } else {
      await startPlayback();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isPlaying) {
        AudioRecorderPlayer.stopPlayer();
        AudioRecorderPlayer.removePlayBackListener();
      }
      // Clean up temp file
      if (audioPathRef.current) {
        ReactNativeBlobUtil.fs.unlink(audioPathRef.current).catch((err) => {
          console.error('Failed to delete temp audio file:', err);
        });
      }
    };
  }, [isPlaying]);

  // Generate static waveform bars
  const generateStaticWaveform = (): number[] => {
    const bars: number[] = [];
    for (let i = 0; i < 30; i++) {
      // Create varying heights for visual interest
      const height = 0.3 + Math.random() * 0.7;
      bars.push(height);
    }
    return bars;
  };

  const waveformBars = generateStaticWaveform();
  const progress = audioDuration > 0 ? currentPosition / audioDuration : 0;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.playButton}
        onPress={togglePlayback}
        activeOpacity={0.7}
      >
        <Text style={styles.playIcon}>{isPlaying ? '❚❚' : '▶'}</Text>
      </TouchableOpacity>

      <View style={styles.waveformContainer}>
        {/* Waveform bars */}
        <View style={styles.waveformBars}>
          {waveformBars.map((height, index) => (
            <View
              key={index}
              style={[
                styles.waveformBar,
                {
                  height: Math.max(4, height * 28),
                  backgroundColor:
                    index / waveformBars.length <= progress
                      ? '#FFD700'
                      : 'rgba(255, 255, 255, 0.3)',
                },
              ]}
            />
          ))}
        </View>

        {/* Time display */}
        <Text style={styles.timeText}>
          {formatTime(isPlaying ? currentPosition : audioDuration)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.INPUT_BG,
    borderRadius: 16,
    padding: 12,
    minWidth: 220,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  playIcon: {
    color: COLORS.MAIN_BG,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  waveformContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  waveformBars: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 28,
    flex: 1,
    marginRight: 12,
  },
  waveformBar: {
    width: 2.5,
    marginHorizontal: 1,
    borderRadius: 1.25,
  },
  timeText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontFamily: 'Styrene-B',
    minWidth: 40,
  },
});
