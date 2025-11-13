import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface AddIconProps {
  size?: number;
  color?: string;
}

export const AddIcon: React.FC<AddIconProps> = ({ size = 24, color = 'white' }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path
        d="M3 8H13"
        stroke={color}
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M8 13V3"
        stroke={color}
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};
