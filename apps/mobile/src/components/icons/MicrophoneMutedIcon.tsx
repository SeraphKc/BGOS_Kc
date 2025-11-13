import React from 'react';
import Svg, { Path, Rect, Line } from 'react-native-svg';

interface MicrophoneMutedIconProps {
  size?: number;
  color?: string;
}

export const MicrophoneMutedIcon: React.FC<MicrophoneMutedIconProps> = ({
  size = 20,
  color = 'rgba(255, 255, 255, 0.5)'
}) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect
        x="9"
        y="2"
        width="6"
        height="11"
        rx="3"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M5 10V12C5 15.866 8.13401 19 12 19C15.866 19 19 15.866 19 12V10"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 19V22"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M8 22H16"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Diagonal slash for muted state */}
      <Line
        x1="4"
        y1="4"
        x2="20"
        y2="20"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
};
