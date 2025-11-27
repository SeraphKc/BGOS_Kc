import React, { createContext, useContext, ReactNode, useCallback, useRef, useState, useEffect } from 'react';
import type { TranscriptMessage } from '../services/elevenLabsService';

export interface TranscriptReadyPayload {
  conversationId: string;
  transcript?: TranscriptMessage[];
}

interface VoiceAgentContextType {
  onTranscriptReady?: (payload: TranscriptReadyPayload) => void;
  setTranscriptReadyHandler: (handler: (payload: TranscriptReadyPayload) => void) => void;
  // Modal control
  isModalVisible: boolean;
  modalAgentId: string | undefined;
  modalAgentName: string | undefined;
  showVoiceModal: (agentId: string, agentName: string) => void;
  hideVoiceModal: () => void;
}

const VoiceAgentContext = createContext<VoiceAgentContextType | undefined>(undefined);

export const VoiceAgentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const transcriptReadyHandlerRef = useRef<((payload: TranscriptReadyPayload) => void) | undefined>(
    undefined
  );

  // Modal state - rendered at App level to bypass react-native-screens
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalAgentId, setModalAgentId] = useState<string | undefined>(undefined);
  const [modalAgentName, setModalAgentName] = useState<string | undefined>(undefined);

  // Ref to track and cleanup hide timeout
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const setTranscriptReadyHandler = useCallback((handler: (payload: TranscriptReadyPayload) => void) => {
    console.log('VoiceAgentContext - Setting transcript handler');
    transcriptReadyHandlerRef.current = handler;
  }, []);

  const onTranscriptReady = useCallback((payload: TranscriptReadyPayload) => {
    if (transcriptReadyHandlerRef.current) {
      transcriptReadyHandlerRef.current(payload);
    }
  }, []);

  const showVoiceModal = useCallback((agentId: string, agentName: string) => {
    console.log('🎤 VoiceAgentContext - Showing voice modal for:', agentName);
    setModalAgentId(agentId);
    setModalAgentName(agentName);
    setIsModalVisible(true);
  }, []);

  const hideVoiceModal = useCallback(() => {
    console.log('🎤 VoiceAgentContext - Hiding voice modal');
    setIsModalVisible(false);

    // Clear any existing timeout to prevent memory leaks
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }

    // Clear agent info after a delay to allow modal close animation
    hideTimeoutRef.current = setTimeout(() => {
      setModalAgentId(undefined);
      setModalAgentName(undefined);
      hideTimeoutRef.current = null;
    }, 300);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  return (
    <VoiceAgentContext.Provider
      value={{
        onTranscriptReady,
        setTranscriptReadyHandler,
        isModalVisible,
        modalAgentId,
        modalAgentName,
        showVoiceModal,
        hideVoiceModal,
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
