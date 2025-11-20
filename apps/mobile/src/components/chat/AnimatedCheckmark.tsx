import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface AnimatedCheckmarkProps {
  size?: number;
}

export const AnimatedCheckmark: React.FC<AnimatedCheckmarkProps> = ({ size = 16 }) => {
  // Simplified version without animation to fix white screen issue
  return (
    <Svg width={size} height={size} viewBox="0 0 18 14" fill="none">
      <Path
        d="M1 7L6.32706 13L17 1"
        stroke="#F4D03F"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};
