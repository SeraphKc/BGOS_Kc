import React, { useState, useRef } from 'react';
import TelegramStyleVoiceMessage from './TelegramStyleVoiceMessage';
import { VoiceRecordingInterface } from './VoiceRecordingInterface';

const VoiceMessageTest: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [sampleAudioUrl, setSampleAudioUrl] = useState<string>('');

  // Create a sample audio blob for testing
  const createSampleAudioBlob = (): string => {
    // This is a minimal valid audio file (silent 1-second WAV)
    const wavHeader = new Uint8Array([
      0x52, 0x49, 0x46, 0x46, // RIFF
      0x24, 0x00, 0x00, 0x00, // Size
      0x57, 0x41, 0x56, 0x45, // WAVE
      0x66, 0x6D, 0x74, 0x20, // fmt 
      0x10, 0x00, 0x00, 0x00, // fmt chunk size
      0x01, 0x00, // Audio format (PCM)
      0x01, 0x00, // Channels
      0x44, 0xAC, 0x00, 0x00, // Sample rate (44100)
      0x88, 0x58, 0x01, 0x00, // Byte rate
      0x02, 0x00, // Block align
      0x10, 0x00, // Bits per sample
      0x64, 0x61, 0x74, 0x61, // data
      0x00, 0x00, 0x00, 0x00  // data size (empty)
    ]);
    
    const blob = new Blob([wavHeader], { type: 'audio/wav' });
    return URL.createObjectURL(blob);
  };

  // Simulate recording
  const startRecording = () => {
    setIsRecording(true);
    setRecordingDuration(0);
    setAudioLevel(0.5);
    
    // Simulate audio level changes
    const interval = setInterval(() => {
      setAudioLevel(Math.random() * 0.8 + 0.2);
    }, 100);

    // Simulate recording duration
    const durationInterval = setInterval(() => {
      setRecordingDuration(prev => prev + 1);
    }, 1000);

    // Store intervals for cleanup
    (window as any).testIntervals = { audio: interval, duration: durationInterval };
  };

  const stopRecording = () => {
    setIsRecording(false);
    setAudioLevel(0);
    
    // Clear intervals
    if ((window as any).testIntervals) {
      clearInterval((window as any).testIntervals.audio);
      clearInterval((window as any).testIntervals.duration);
    }
    
    // Set sample audio URL
    setSampleAudioUrl(createSampleAudioBlob());
  };

  const handleConfirm = () => {
    stopRecording();
  };

  const handleCancel = () => {
    stopRecording();
  };

  return (
            <div className="p-8 space-y-6" style={{ backgroundColor: '#212121', minHeight: '100vh' }}>
      <h1 className="text-2xl font-bold text-white mb-6">Voice Message Features Test</h1>
      
      {/* Recording Interface Test */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-white mb-2">Voice Recording Interface</h2>
        
        {isRecording ? (
                      <div className="p-4 rounded-lg" style={{ backgroundColor: '#2A2A2A', border: '1px solid #3A3A3A' }}>
            <VoiceRecordingInterface
              audioLevel={audioLevel}
              assistantName="Test Assistant"
              onAssistantChange={() => {}}
              assistants={[{ id: '1', name: 'Test Assistant' }]}
              currentAssistantId="1"
              onConfirm={handleConfirm}
              onCancel={handleCancel}
              recordingDuration={recordingDuration}
            />
          </div>
        ) : (
          <button
            onClick={startRecording}
            className="px-4 py-2 rounded-lg text-white font-medium"
            style={{ backgroundColor: '#FFD900', color: '#212121' }}
          >
            Start Recording Test
          </button>
        )}
      </div>

      {/* Voice Message Playback Test */}
      {sampleAudioUrl && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white mb-2">Voice Message Playback</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-md font-medium text-white mb-2">User Voice Message (3 seconds)</h3>
              <TelegramStyleVoiceMessage 
                src={sampleAudioUrl} 
                duration={3}
                fileName="user-voice-message.wav"
                isAssistantMessage={false}
              />
            </div>

            <div>
              <h3 className="text-md font-medium text-white mb-2">Assistant Voice Message (14 seconds) - With Wave Animation</h3>
              <TelegramStyleVoiceMessage 
                src={sampleAudioUrl} 
                duration={14}
                fileName="assistant-voice-message.wav"
                isAssistantMessage={true}
              />
            </div>

            <div>
              <h3 className="text-md font-medium text-white mb-2">Long Voice Message (1 minute 23 seconds)</h3>
              <TelegramStyleVoiceMessage 
                src={sampleAudioUrl} 
                duration={83}
                fileName="long-voice-message.wav"
                isAssistantMessage={false}
              />
            </div>
          </div>
        </div>
      )}

      {/* Features List */}
              <div className="mt-8 p-4 rounded-lg" style={{ backgroundColor: '#2A2A2A', border: '1px solid #3A3A3A' }}>
        <h3 className="text-lg font-semibold text-white mb-2">✅ Implemented Features:</h3>
        <ul className="text-white space-y-1 text-sm">
          <li>✅ Voice message recording with real-time timer</li>
          <li>✅ Animated waveform during recording (like Telegram)</li>
          <li>✅ Recording status indicator with pulsing dot</li>
          <li>✅ Half-width layout for voice messages</li>
          <li>✅ Project color scheme integration</li>
          <li>✅ Play/pause functionality with visual feedback</li>
          <li>✅ Progress indication (yellow bars for played portion)</li>
          <li>✅ Assistant message indicator (pulsing dot)</li>
          <li>✅ Wave animation during assistant response playback</li>
          <li>✅ Enhanced play button with glow effect during playback</li>
          <li>✅ Proper duration formatting and error handling</li>
          <li>✅ Responsive design with smooth transitions</li>
        </ul>
      </div>

      {/* Instructions */}
              <div className="mt-4 p-4 rounded-lg" style={{ backgroundColor: '#2A2A2A', border: '1px solid #3A3A3A' }}>
        <h3 className="text-lg font-semibold text-white mb-2">🎯 How to Test:</h3>
        <ul className="text-white space-y-1 text-sm">
          <li>1. Click "Start Recording Test" to see the recording interface</li>
          <li>2. Watch the animated waveform and timer during recording</li>
          <li>3. Click "Confirm" or "Cancel" to stop recording</li>
          <li>4. Test the voice message playback by clicking the play buttons</li>
          <li>5. Notice the wave animation on assistant messages during playback</li>
          <li>6. Observe the enhanced visual feedback and animations</li>
        </ul>
      </div>
    </div>
  );
};

export default VoiceMessageTest; 