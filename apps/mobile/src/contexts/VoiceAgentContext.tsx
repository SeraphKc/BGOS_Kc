import React, { createContext, useContext, ReactNode, useCallback, useRef } from 'react';

interface VoiceAgentContextType {
  onTranscriptReady?: (conversationId: string) => void;
  setTranscriptReadyHandler: (handler: (conversationId: string) => void) => void;
}

const VoiceAgentContext = createContext<VoiceAgentContextType | undefined>(undefined);

export const VoiceAgentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const transcriptReadyHandlerRef = useRef<((conversationId: string) => void) | undefined>(undefined);

  const setTranscriptReadyHandler = useCallback((handler: (conversationId: string) => void) => {
    console.log('VoiceAgentContext - Setting transcript handler');
    transcriptReadyHandlerRef.current = handler;
  }, []);

  const onTranscriptReady = useCallback((conversationId: string) => {
    if (transcriptReadyHandlerRef.current) {
      transcriptReadyHandlerRef.current(conversationId);
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
