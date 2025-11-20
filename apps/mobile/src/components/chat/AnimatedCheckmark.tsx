import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface AnimatedCheckmarkProps {
  size?: number;
}

const AnimatedPath = Animated.createAnimatedComponent(Path);

export const AnimatedCheckmark: React.FC<AnimatedCheckmarkProps> = ({ size = 16 }) => {
  const strokeDashoffset = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    // Reset and start animation
    strokeDashoffset.setValue(24);
    Animated.timing(strokeDashoffset, {
      toValue: 0,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Svg width={size} height={size} viewBox="0 0 18 14" fill="none">
      <AnimatedPath
        d="M1 7L6.32706 13L17 1"
        stroke="#F4D03F"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="24"
        strokeDashoffset={strokeDashoffset}
      />
    </Svg>
  );
};
