import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface ChevronDownIconProps {
  size?: number;
  color?: string;
}

export const ChevronDownIcon: React.FC<ChevronDownIconProps> = ({
  size = 12,
  color = 'rgba(255, 255, 255, 0.6)'
}) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 12 12" fill="none">
      <Path
        d="M3 4.5L6 7.5L9 4.5"
        stroke={color}
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};
