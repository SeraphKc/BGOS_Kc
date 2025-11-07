import React, { useRef, useState, useEffect, useMemo } from 'react';
import { COLORS } from '../utils/colors';

interface TelegramStyleVoiceMessageProps {
  src: string; // blob url
  duration?: number; // duration in seconds
  fileName?: string;
  isAssistantMessage?: boolean; // To distinguish assistant messages
}

const TelegramStyleVoiceMessage: React.FC<TelegramStyleVoiceMessageProps> = ({ 
  src, 
  duration = 0,
  fileName,
  isAssistantMessage = false
}) => {
  // Ensure duration is a valid number
  const fallbackDuration = (duration && isFinite(duration) && duration > 0) ? duration : 0;
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(fallbackDuration); // Initialize with fallback duration
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [animationTimestamp, setAnimationTimestamp] = useState(0);
  const [realTimeAmplitude, setRealTimeAmplitude] = useState(0);
  

  // Immediately use duration prop if available, don't wait for audio metadata
  useEffect(() => {
    if (duration && isFinite(duration) && duration > 0) {
      setAudioDuration(duration);
    } else if (fallbackDuration > 0) {
      setAudioDuration(fallbackDuration);
    }
  }, [duration, fallbackDuration]);

  // Force load audio metadata when src changes
  useEffect(() => {
    if (src && audioRef.current) {
      audioRef.current.load();
    }
  }, [src]);

  // Generate dynamic waveform data based on audio content
  useEffect(() => {
    // Generate static waveform immediately as fallback
    const generateStaticWaveform = () => {
      const bars = 50;
      const data: number[] = [];
      
      for (let i = 0; i < bars; i++) {
        // Create a more natural waveform pattern
        const baseHeight = Math.sin(i * 0.3) * 0.4 + 0.6;
        const randomVariation = Math.random() * 0.3;
        const height = Math.max(0.1, Math.min(1, baseHeight + randomVariation));
        data.push(height);
      }
      
      setWaveformData(data);
    };

    const generateDynamicWaveform = async () => {
      if (!src) {
        generateStaticWaveform();
        return;
      }
      
      try {
        // Fetch the audio data
        const response = await fetch(src);
        const arrayBuffer = await response.arrayBuffer();
        
        // Create AudioContext to analyze the audio
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        // Analyze audio data to create waveform
        const channelData = audioBuffer.getChannelData(0); // Use first channel
        const bars = 50; // Number of waveform bars
        const samplesPerBar = Math.floor(channelData.length / bars);
        const data: number[] = [];
        
        for (let i = 0; i < bars; i++) {
          const startSample = i * samplesPerBar;
          const endSample = Math.min(startSample + samplesPerBar, channelData.length);
          
          // Calculate RMS (Root Mean Square) for this segment
          let sum = 0;
          for (let j = startSample; j < endSample; j++) {
            sum += channelData[j] * channelData[j];
          }
          const rms = Math.sqrt(sum / (endSample - startSample));
          
          // Convert to height (0.1 to 1.0)
          const height = Math.max(0.1, Math.min(1, rms * 5)); // Scale factor of 5 for better visualization
          data.push(height);
        }
        
        setWaveformData(data);
        audioContext.close();
      } catch (error) {
        console.warn('Failed to generate dynamic waveform, using fallback:', error);
        // Fallback to static waveform if audio analysis fails
        generateStaticWaveform();
      }
    };

    // Generate static waveform immediately, then try dynamic
    generateStaticWaveform();
    generateDynamicWaveform();
  }, [src]);

  // Handle src changes for already sent messages
  useEffect(() => {
    if (src && audioRef.current) {
      // Reset audio state when src changes
      setCurrentTime(0);
      setIsPlaying(false);
      
      // Force reload the audio to ensure metadata is loaded
      audioRef.current.load();
    }
  }, [src]);

  // Animation loop for wave animation during playback
  useEffect(() => {
    if (isPlaying) {
      const animate = () => {
        setAnimationTimestamp(Date.now() * 0.005);
        requestAnimationFrame(animate);
      };
      animate();
    }
  }, [isPlaying]);

  // Handle audio events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      // Only update duration if we don't already have a valid duration from props
      if (!duration || !isFinite(duration) || duration <= 0) {
        if (audio.duration && isFinite(audio.duration) && audio.duration > 0) {
          setAudioDuration(audio.duration);
        }
      }
    };

    const handleLoadedData = () => {
           
      // Only update duration if we don't already have a valid duration from props
      if (!duration || !isFinite(duration) || duration <= 0) {
        if (audio.duration && isFinite(audio.duration) && audio.duration > 0) {
          setAudioDuration(audio.duration);
        }
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      
      // Calculate real-time amplitude for dynamic visualization
      const effectiveDuration = audioDuration > 0 ? audioDuration : (duration > 0 ? duration : 0);
      if (isPlaying && effectiveDuration > 0) {
        const currentBarIndex = Math.floor((audio.currentTime / effectiveDuration) * waveformData.length);
        if (currentBarIndex < waveformData.length && currentBarIndex >= 0) {
          setRealTimeAmplitude(waveformData[currentBarIndex] || 0);
        }
      }
    };

    const handlePlay = () => {
      setIsPlaying(true);
      // Only update duration if we don't already have a valid duration from props
      if (!duration || !isFinite(duration) || duration <= 0) {
        if (audio.duration && isFinite(audio.duration) && audio.duration > 0) {
          setAudioDuration(audio.duration);
        }
      }
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleError = (e: Event) => {
      console.warn('Audio failed to load:', e);
      // Only update duration if we don't already have a valid duration from props
      if (!duration || !isFinite(duration) || duration <= 0) {
        if (fallbackDuration > 0) {
          setAudioDuration(fallbackDuration);
        }
      }
    };

    const handleCanPlay = () => {
      // Only update duration if we don't already have a valid duration from props
      if (!duration || !isFinite(duration) || duration <= 0) {
        if (audio.duration && isFinite(audio.duration) && audio.duration > 0) {
          setAudioDuration(audio.duration);
        }
      }
    };

    // Load audio metadata immediately if already available
    if (audio.readyState >= 1) {
      handleLoadedMetadata();
    }

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('loadeddata', handleLoadedData);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('loadeddata', handleLoadedData);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [duration, fallbackDuration]);

  const handlePlayPause = async () => {
    if (!audioRef.current) return;
    
    try {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        // Reset to beginning if audio has ended
        const effectiveDuration = audioDuration > 0 ? audioDuration : (duration > 0 ? duration : 0);
        if (currentTime >= effectiveDuration) {
          audioRef.current.currentTime = 0;
          setCurrentTime(0);
        }
        await audioRef.current.play();
      }
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };

  // Format time as M:SS
  const formatTime = (time: number): string => {
    // Handle invalid time values
    if (!time || isNaN(time) || !isFinite(time)) {
      return '0:00';
    }
    
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Calculate progress percentage - ensure it works even when audioDuration is not set
  const effectiveDuration = audioDuration > 0 ? audioDuration : (duration > 0 ? duration : 0);
  const progressPercentage = (effectiveDuration > 0 && isFinite(effectiveDuration)) ? (currentTime / effectiveDuration) * 100 : 0;

  // Determine which bars should be yellow (played) vs gray (unplayed)
  const playedBars = Math.floor((waveformData.length * progressPercentage) / 100);

  // Ensure we have a valid duration for display
  const displayDuration = effectiveDuration;
  

  return (
    <div 
      className="flex items-center gap-4 p-4 rounded-xl max-w-xs"
      style={{ 
        backgroundColor: COLORS.DARK_2,
        border: `1px solid ${COLORS.DARK_3}`,
        position: 'relative',
        maxWidth: "fit-content"
      }}
    >

      {/* Play Button */}
      <button
        onClick={handlePlayPause}
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 ${
          isPlaying ? 'scale-110' : 'hover:scale-105'
        }`}
        style={{ 
          backgroundColor: isAssistantMessage ? COLORS.PRIMARY_1 : COLORS.PRIMARY_1,
          boxShadow: isPlaying ? `0 0 10px ${COLORS.PRIMARY_1}` : 'none'
        }}
      >
        {isPlaying ? (
          // Pause icon
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <rect x="3" y="2" width="2" height="8" rx="1" fill={COLORS.DARK_BG}/>
            <rect x="7" y="2" width="2" height="8" rx="1" fill={COLORS.DARK_BG}/>
          </svg>
        ) : (
          // Play icon
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M4 2L10 6L4 10V2Z"
              fill={COLORS.DARK_BG}
            />
          </svg>
        )}
      </button>

      {/* Waveform */}
      <div className="flex-1 flex items-center gap-1 min-w-0">
        {waveformData.map((height, index) => {
          const isPlayed = index < playedBars;
          const barHeight = Math.max(2, height * 20); // Scale height to 2-20px
          
          // Add dynamic wave animation during playback
          let animatedHeight = barHeight;
          let animatedOpacity = isPlayed ? 1 : 0.6;
          
          if (isPlaying && isPlayed) {
            // Add wave animation effect based on actual audio content
            const waveOffset = Math.sin(animationTimestamp + index * 0.3) * (height * 3);
            animatedHeight = Math.max(2, barHeight + waveOffset);
            animatedOpacity = 0.8 + 0.2 * Math.sin(animationTimestamp + index * 0.2);
            
            // Add pulsing effect for currently playing segment
            const currentBarIndex = Math.floor((currentTime / effectiveDuration) * waveformData.length);
            if (Math.abs(index - currentBarIndex) <= 2) {
              const pulseIntensity = Math.sin(animationTimestamp * 3) * 0.3;
              animatedHeight = Math.max(2, animatedHeight + pulseIntensity * 10);
              animatedOpacity = 1;
              
              // Enhance the current playing bar with real-time amplitude
              if (index === currentBarIndex) {
                const amplitudeBoost = realTimeAmplitude * 5;
                animatedHeight = Math.max(2, animatedHeight + amplitudeBoost);
              }
            }
          }
          
          return (
            <div
              key={index}
              className="flex-shrink-0 rounded-sm transition-all duration-100"
              style={{
                width: '2px',
                height: `${animatedHeight}px`,
                backgroundColor: isPlayed ? COLORS.PRIMARY_1 : '#9CA3AF', // Yellow for played, gray for unplayed
                opacity: animatedOpacity
              }}
            />
          );
        })}
      </div>

      {/* Timer - Current Time / Total Duration */}
      <div 
        className="flex-shrink-0 text-sm font-medium"
        style={{ color: COLORS.WHITE_1 }}
      >
        {formatTime(currentTime)} / {formatTime(displayDuration)}
      </div>

      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        crossOrigin="anonymous"
        className="hidden"
        onLoadedMetadata={(e) => {
          const target = e.target as HTMLAudioElement;
          // Only update duration if we don't already have a valid duration from props
          if (!duration || !isFinite(duration) || duration <= 0) {
            if (target.duration && isFinite(target.duration) && target.duration > 0) {
              setAudioDuration(target.duration);
            }
          }
        }}
        onCanPlay={(e) => {
          const target = e.target as HTMLAudioElement;
          // Only update duration if we don't already have a valid duration from props
          if (!duration || !isFinite(duration) || duration <= 0) {
            if (target.duration && isFinite(target.duration) && target.duration > 0) {
              setAudioDuration(target.duration);
            }
          }
        }}
      />
    </div>
  );
};

export default TelegramStyleVoiceMessage; 