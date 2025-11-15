import React, { useEffect, useRef } from 'react';
import { View, Image, Animated, StyleSheet } from 'react-native';
import Logo from '../assets/logo.svg';

interface RotatingLogoProps {
  size?: number;
}

const RotatingLogo: React.FC<RotatingLogoProps> = ({ size = 80 }) => {
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Create continuous rotation animation
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1000, // 1 second per rotation
        useNativeDriver: true,
      })
    ).start();
  }, [spinValue]);

  // Interpolate rotation value to degrees
  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={{
          transform: [{ rotate: spin }],
        }}
      >
        <Logo
          width={size}
          height={size * 0.25}
          fill="#FFD700"
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    resizeMode: 'contain',
  },
});

export default RotatingLogo;
