import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface StarFilledIconProps {
  size?: number;
  color?: string;
}

export const StarFilledIcon: React.FC<StarFilledIconProps> = ({
  size = 14,
  color = '#FFD700'
}) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
        fill={color}
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};
