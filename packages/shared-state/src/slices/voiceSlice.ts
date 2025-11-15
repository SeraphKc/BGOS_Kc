/**
 * Voice Slice
 *
 * Redux slice for managing voice-to-voice functionality state
 * Handles recording status, playback, audio levels, and conversation tracking
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type VoiceStatus =
  | 'idle'
  | 'connecting'
  | 'recording'
  | 'processing'
  | 'playing'
  | 'error';

export interface ToolCall {
  tool_call_id: string;
  tool_name: string;
  tool_input: any;
  tool_output?: any;
  status: 'pending' | 'completed' | 'error';
  error?: string;
  timestamp: string;
}

export interface VoiceState {
  status: VoiceStatus;
  isPaused: boolean;
  conversationId: string | null;
  isAgentSpeaking: boolean;
  isTranscriptLoading: boolean;
  audioLevel: number; // 0-1 normalized audio level for visualization
  playbackProgress: number; // 0-1 playback progress
  error: string | null;
  recordingStartTime: number | null;
  transcriptMessages: Array<{
    role: 'user' | 'assistant';
    message: string;
    timestamp: string;
  }>;
  toolCalls: ToolCall[]; // Active tool calls during conversation
  liveTranscription: {
    user: string;
    agent: string;
  };
}

const initialState: VoiceState = {
  status: 'idle',
  isPaused: false,
  conversationId: null,
  isAgentSpeaking: false,
  isTranscriptLoading: false,
  audioLevel: 0,
  playbackProgress: 0,
  error: null,
  recordingStartTime: null,
  transcriptMessages: [],
  toolCalls: [],
  liveTranscription: {
    user: '',
    agent: '',
  },
};

const voiceSlice = createSlice({
  name: 'voice',
  initialState,
  reducers: {
    startVoiceSession: (state, action: PayloadAction<{ conversationId?: string }>) => {
      state.status = 'connecting';
      state.conversationId = action.payload.conversationId || null;
      state.error = null;
      state.isPaused = false;
      state.isAgentSpeaking = false;
      state.isTranscriptLoading = false;
      state.audioLevel = 0;
      state.playbackProgress = 0;
      state.recordingStartTime = null;
      state.transcriptMessages = [];
    },

    startRecording: (state) => {
      state.status = 'recording';
      state.isPaused = false;
      state.recordingStartTime = Date.now();
      state.isTranscriptLoading = false;
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
      state.isTranscriptLoading = true;
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
      state.isAgentSpeaking = false;
      state.isTranscriptLoading = false;
      state.audioLevel = 0;
      state.playbackProgress = 0;
      state.recordingStartTime = null;
      state.error = null;
    },

    setVoiceError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.status = 'error';
      state.isPaused = false;
      state.audioLevel = 0;
      state.playbackProgress = 0;
      state.isAgentSpeaking = false;
      state.isTranscriptLoading = false;
    },

    clearVoiceError: (state) => {
      state.error = null;
    },

    setAgentSpeaking: (state, action: PayloadAction<boolean>) => {
      state.isAgentSpeaking = action.payload;
    },

    setTranscriptLoading: (state, action: PayloadAction<boolean>) => {
      state.isTranscriptLoading = action.payload;
    },

    setConversationMetadata: (
      state,
      action: PayloadAction<{ conversationId: string | null }>
    ) => {
      state.conversationId = action.payload.conversationId;
    },

    // Tool call actions
    addToolCall: (state, action: PayloadAction<ToolCall>) => {
      state.toolCalls.push(action.payload);
    },

    updateToolCall: (
      state,
      action: PayloadAction<{ tool_call_id: string; updates: Partial<ToolCall> }>
    ) => {
      const toolCall = state.toolCalls.find((tc) => tc.tool_call_id === action.payload.tool_call_id);
      if (toolCall) {
        Object.assign(toolCall, action.payload.updates);
      }
    },

    clearToolCalls: (state) => {
      state.toolCalls = [];
    },

    // Live transcription actions
    setLiveUserTranscription: (state, action: PayloadAction<string>) => {
      state.liveTranscription.user = action.payload;
    },

    setLiveAgentTranscription: (state, action: PayloadAction<string>) => {
      state.liveTranscription.agent = action.payload;
    },

    clearLiveTranscription: (state) => {
      state.liveTranscription = { user: '', agent: '' };
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
  setAgentSpeaking,
  setTranscriptLoading,
  setConversationMetadata,
  addToolCall,
  updateToolCall,
  clearToolCalls,
  setLiveUserTranscription,
  setLiveAgentTranscription,
  clearLiveTranscription,
} = voiceSlice.actions;

export default voiceSlice.reducer;
