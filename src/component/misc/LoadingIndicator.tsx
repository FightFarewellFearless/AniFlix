import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useTheme } from 'react-native-paper';

const DEFAULT_SIZE = 20;

type DotProps = {
  index: number;
  animation: Animated.Value;
  size: number;
  color: string;
};

function AnimatedDot({ index, animation, size, color }: DotProps) {
  const scale = animation.interpolate({
    inputRange: [index, index + 1, index + 2],
    outputRange: [0.5, 1.2, 0.5],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View
      style={{
        backgroundColor: color,
        borderRadius: size,
        height: size,
        width: size,
        transform: [{ scale }],
      }}
    />
  );
}

export default function LoadingIndicator({ size = DEFAULT_SIZE }: { size?: number }) {
  const theme = useTheme();
  const animation = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      const activeAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(animation, {
            toValue: 4,
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(animation, {
            toValue: 0,
            duration: 900,
            useNativeDriver: true,
          }),
        ]),
      );

      activeAnimation.start();

      return () => {
        activeAnimation.stop();
      };
    }, [animation]),
  );

  const color = theme.colors.onSecondaryContainer;

  return (
    <View style={styles.container}>
      <AnimatedDot index={0} animation={animation} size={size} color={color} />
      <AnimatedDot index={1} animation={animation} size={size} color={color} />
      <AnimatedDot index={2} animation={animation} size={size} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 2,
  },
});
