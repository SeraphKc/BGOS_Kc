import React from 'react';
import Svg, { Circle } from 'react-native-svg';

interface ThreeDotsIconProps {
  size?: number;
  color?: string;
}

export const ThreeDotsIcon: React.FC<ThreeDotsIconProps> = ({
  size = 16,
  color = 'rgb(166, 165, 157)'
}) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Circle cx="2.5" cy="8" r="1.5" fill={color} />
      <Circle cx="8" cy="8" r="1.5" fill={color} />
      <Circle cx="13.5" cy="8" r="1.5" fill={color} />
    </Svg>
  );
};
