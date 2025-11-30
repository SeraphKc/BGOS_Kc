import React, { useState, useEffect, useRef } from 'react';

interface NotificationData {
  chatId: string;
  chatTitle: string;
  assistantName: string;
  avatarUrl?: string;
  unreadCount: number;
}

// Avatar color palette (same as app's avatarUtils)
const avatarColors = [
  '#7C6F5D', '#6B8E7F', '#8B7E8F', '#7B8FA3', '#A37B6F',
  '#6F8BA3', '#9F8170', '#7A8C7E', '#8F7A7A', '#7A8F8F',
  '#8F8A7A', '#7A7F8F',
];

function getInitials(name: string): string {
  if (!name) return '?';
  const words = name.trim().split(/\s+/);
  if (words.length === 1) {
    const word = words[0];
    return word.length >= 2 ? word.substring(0, 2).toUpperCase() : word.toUpperCase();
  }
  return (words[0][0] + words[1][0]).toUpperCase();
}

function getAvatarColor(name: string): string {
  if (!name) return avatarColors[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % avatarColors.length;
  return avatarColors[index];
}

const NotificationPopup: React.FC = () => {
  const [data, setData] = useState<NotificationData | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [progress, setProgress] = useState(100);
  const [isVisible, setIsVisible] = useState(false);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const DURATION = 5000; // 5 seconds
  const UPDATE_INTERVAL = 50; // Update progress every 50ms

  useEffect(() => {
    // @ts-ignore - notificationAPI is exposed via preload
    window.notificationAPI?.onNotificationData((notificationData: NotificationData) => {
      setData(notificationData);
      setProgress(100);
      // Trigger animation after a small delay
      setTimeout(() => setIsVisible(true), 10);
    });
  }, []);

  // Handle progress bar countdown
  useEffect(() => {
    if (!data || isHovered) {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      return;
    }

    const decrementPerTick = (100 / DURATION) * UPDATE_INTERVAL;

    progressIntervalRef.current = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev - decrementPerTick;
        if (newProgress <= 0) {
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
          }
          return 0;
        }
        return newProgress;
      });
    }, UPDATE_INTERVAL);

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [data, isHovered]);

  const handleClick = () => {
    if (data) {
      // @ts-ignore
      window.notificationAPI?.notificationClicked(data.chatId);
    }
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    // @ts-ignore
    window.notificationAPI?.notificationClosed();
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    // @ts-ignore
    window.notificationAPI?.notificationHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    // @ts-ignore
    window.notificationAPI?.notificationHovered(false);
  };

  if (!data) return null;

  return (
    <div
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        width: '380px',
        backgroundColor: '#212121',
        borderRadius: '12px',
        border: '1px solid #3A3A3A',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
        cursor: 'pointer',
        overflow: 'hidden',
        position: 'relative',
        transform: isVisible ? 'translateX(0)' : 'translateX(100%)',
        opacity: isVisible ? 1 : 0,
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease',
      }}
    >
      {/* Content */}
      <div style={{ padding: '16px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
        {/* Avatar */}
        {data.avatarUrl ? (
          <img
            src={data.avatarUrl}
            alt={data.assistantName}
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              objectFit: 'cover',
              flexShrink: 0,
            }}
          />
        ) : (
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              backgroundColor: getAvatarColor(data.assistantName),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              fontWeight: 600,
              fontSize: '16px',
              flexShrink: 0,
            }}
          >
            {getInitials(data.assistantName)}
          </div>
        )}

        {/* Text Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: '14px',
              fontWeight: 600,
              color: '#FFFFFF',
              marginBottom: '4px',
            }}
          >
            New message from {data.assistantName}
          </div>
          <div
            style={{
              fontSize: '13px',
              color: '#9CA3AF',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {data.unreadCount} unread message{data.unreadCount > 1 ? 's' : ''} in "{data.chatTitle}"
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={handleClose}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '4px',
            color: '#6B7280',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'color 0.2s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#FFFFFF'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#6B7280'; }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* Progress Bar */}
      <div
        style={{
          height: '3px',
          backgroundColor: '#3A3A3A',
          position: 'relative',
        }}
      >
        <div
          style={{
            height: '100%',
            backgroundColor: '#FFD700',
            width: `${progress}%`,
            transition: isHovered ? 'none' : `width ${UPDATE_INTERVAL}ms linear`,
          }}
        />
      </div>
    </div>
  );
};

export default NotificationPopup;
