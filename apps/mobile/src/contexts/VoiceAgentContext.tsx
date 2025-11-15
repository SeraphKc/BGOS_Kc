import React, { createContext, useContext, ReactNode, useCallback, useRef } from 'react';
import type { TranscriptMessage } from '../services/elevenLabsService';

export interface TranscriptReadyPayload {
  conversationId: string;
  transcript?: TranscriptMessage[];
}

interface VoiceAgentContextType {
  onTranscriptReady?: (payload: TranscriptReadyPayload) => void;
  setTranscriptReadyHandler: (handler: (payload: TranscriptReadyPayload) => void) => void;
}

const VoiceAgentContext = createContext<VoiceAgentContextType | undefined>(undefined);

export const VoiceAgentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const transcriptReadyHandlerRef = useRef<((payload: TranscriptReadyPayload) => void) | undefined>(
    undefined
  );

  const setTranscriptReadyHandler = useCallback((handler: (payload: TranscriptReadyPayload) => void) => {
    console.log('VoiceAgentContext - Setting transcript handler');
    transcriptReadyHandlerRef.current = handler;
  }, []);

  const onTranscriptReady = useCallback((payload: TranscriptReadyPayload) => {
    if (transcriptReadyHandlerRef.current) {
      transcriptReadyHandlerRef.current(payload);
    }
  }, []);

  return (
    <VoiceAgentContext.Provider
      value={{
        onTranscriptReady,
        setTranscriptReadyHandler,
      }}
    >
      {children}
    </VoiceAgentContext.Provider>
  );
};

export const useVoiceAgentModal = () => {
  const context = useContext(VoiceAgentContext);
  if (context === undefined) {
    throw new Error('useVoiceAgentModal must be used within a VoiceAgentProvider');
  }
  return context;
};
