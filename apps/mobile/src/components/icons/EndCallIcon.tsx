import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface EndCallIconProps {
  size?: number;
  color?: string;
}

export const EndCallIcon: React.FC<EndCallIconProps> = ({
  size = 20,
  color = '#d66171'
}) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 6L6 18"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M6 6L18 18"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};
