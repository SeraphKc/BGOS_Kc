import React, { useRef, useState } from 'react';
import waveImg from '../assets/images/audio wave.png';

interface VoicePlayerProps {
  src: string; // blob url
}

const VoicePlayer: React.FC<VoicePlayerProps> = ({ src }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  const handlePlayPause = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  return (
            <div className=" rounded-xl rounded-br-sm p-3.5 px-5 flex items-center gap-4 w-full min-w-0 shadow-custom" style={{ backgroundColor: '#2A2A2A' }}>
      {/* Кнопка Play/Pause */}
      <button
        onClick={handlePlayPause}
        className="bg-primary border-none rounded-full w-8 h-8 flex items-center justify-center cursor-pointer text-xl text-background flex-shrink-0 p-0 hover:bg-primary-dark transition-colors duration-200"
      >
        {playing ? (
          <svg width="18" height="18" viewBox="0 0 18 18">
            <rect x="3" y="3" width="4" height="12" rx="1.5" fill="#232323"/>
            <rect x="11" y="3" width="4" height="12" rx="1.5" fill="#232323"/>
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path
              d="M5 3.5C5 2.67157 5.89543 2.19526 6.55279 2.61803L15.1056 8.11803C15.7364 8.52376 15.7364 9.47624 15.1056 9.88197L6.55279 15.38197C5.89543 15.8047 5 15.3284 5 14.5V3.5Z"
              fill="#232323"
              stroke="#232323"
              strokeLinejoin="round"
              className="drop-shadow-sm"
            />
          </svg>
        )}
      </button>

      {/* Волна как картинка с анимацией */}
      <div className="flex-1 min-w-0 flex items-center justify-center">
        <img
          src={waveImg}
          alt="wave"
          className={`h-12 w-full max-w-60 object-contain block bg-none ${playing ? 'animate-wave-pulse' : ''}`}
        />
      </div>

      {/* Скрытый аудиоплеер */}
      <audio
        ref={audioRef}
        src={src}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        className="hidden"
      />
    </div>
  );
};

export default VoicePlayer; 