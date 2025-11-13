/**
 * MicrophoneIcon Component
 *
 * SVG microphone icon for voice button
 */

import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface MicrophoneIconProps {
  color?: string;
  size?: number;
}

export const MicrophoneIcon: React.FC<MicrophoneIconProps> = ({
  color = '#FFD700',
  size = 24,
}) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 1C10.3431 1 9 2.34315 9 4V12C9 13.6569 10.3431 15 12 15C13.6569 15 15 13.6569 15 12V4C15 2.34315 13.6569 1 12 1Z"
        fill={color}
      />
      <Path
        d="M6 10C6.55228 10 7 10.4477 7 11V12C7 14.7614 9.23858 17 12 17C14.7614 17 17 14.7614 17 12V11C17 10.4477 17.4477 10 18 10C18.5523 10 19 10.4477 19 11V12C19 15.5265 16.3923 18.4439 13 18.9291V21H15C15.5523 21 16 21.4477 16 22C16 22.5523 15.5523 23 15 23H9C8.44772 23 8 22.5523 8 22C8 21.4477 8.44772 21 9 21H11V18.9291C7.60771 18.4439 5 15.5265 5 12V11C5 10.4477 5.44772 10 6 10Z"
        fill={color}
      />
    </Svg>
  );
};
