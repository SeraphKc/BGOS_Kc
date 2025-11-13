/**
 * Voice Slice
 *
 * Redux slice for managing voice-to-voice functionality state
 * Handles recording status, playback, audio levels, and conversation tracking
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type VoiceStatus = 'idle' | 'connecting' | 'recording' | 'processing' | 'playing';

export interface VoiceState {
  status: VoiceStatus;
  isPaused: boolean;
  conversationId: string | null;
  audioLevel: number; // 0-1 normalized audio level for visualization
  playbackProgress: number; // 0-1 playback progress
  error: string | null;
  recordingStartTime: number | null;
  transcriptMessages: Array<{
    role: 'user' | 'assistant';
    message: string;
    timestamp: string;
  }>;
}

const initialState: VoiceState = {
  status: 'idle',
  isPaused: false,
  conversationId: null,
  audioLevel: 0,
  playbackProgress: 0,
  error: null,
  recordingStartTime: null,
  transcriptMessages: [],
};

const voiceSlice = createSlice({
  name: 'voice',
  initialState,
  reducers: {
    startVoiceSession: (state, action: PayloadAction<{ conversationId?: string }>) => {
      state.status = 'connecting';
      state.conversationId = action.payload.conversationId || null;
      state.error = null;
      state.audioLevel = 0;
      state.playbackProgress = 0;
      state.recordingStartTime = null;
      state.transcriptMessages = [];
    },

    startRecording: (state) => {
      state.status = 'recording';
      state.isPaused = false;
      state.recordingStartTime = Date.now();
    },

    pauseRecording: (state) => {
      state.isPaused = true;
    },

    resumeRecording: (state) => {
      state.isPaused = false;
    },

    setRecordingProcessing: (state) => {
      state.status = 'processing';
      state.audioLevel = 0;
    },

    startPlayback: (state) => {
      state.status = 'playing';
      state.playbackProgress = 0;
    },

    pausePlayback: (state) => {
      state.isPaused = true;
    },

    resumePlayback: (state) => {
      state.isPaused = false;
    },

    setAudioLevel: (state, action: PayloadAction<number>) => {
      state.audioLevel = action.payload;
    },

    setPlaybackProgress: (state, action: PayloadAction<number>) => {
      state.playbackProgress = action.payload;
    },

    setTranscript: (
      state,
      action: PayloadAction<Array<{ role: 'user' | 'assistant'; message: string; timestamp: string }>>
    ) => {
      state.transcriptMessages = action.payload;
    },

    addTranscriptMessage: (
      state,
      action: PayloadAction<{ role: 'user' | 'assistant'; message: string; timestamp: string }>
    ) => {
      state.transcriptMessages.push(action.payload);
    },

    stopVoiceSession: (state) => {
      state.status = 'idle';
      state.isPaused = false;
      state.conversationId = null;
      state.audioLevel = 0;
      state.playbackProgress = 0;
      state.recordingStartTime = null;
      state.error = null;
    },

    setVoiceError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.status = 'idle';
      state.isPaused = false;
      state.audioLevel = 0;
      state.playbackProgress = 0;
    },

    clearVoiceError: (state) => {
      state.error = null;
    },
  },
});

export const {
  startVoiceSession,
  startRecording,
  pauseRecording,
  resumeRecording,
  setRecordingProcessing,
  startPlayback,
  pausePlayback,
  resumePlayback,
  setAudioLevel,
  setPlaybackProgress,
  setTranscript,
  addTranscriptMessage,
  stopVoiceSession,
  setVoiceError,
  clearVoiceError,
} = voiceSlice.actions;

export default voiceSlice.reducer;
