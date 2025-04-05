import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useState } from 'react';
import { Animated, StyleSheet, useColorScheme, View } from 'react-native';

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

export default function Skeleton({ height, width }: { height: number; width: number }) {
  const styles = useStyles();
  const [shiningPosition] = useState(() => new Animated.Value(0));

  useFocusEffect(
    useCallback(() => {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(shiningPosition, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(shiningPosition, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      );
      animation.start();

      return () => {
        animation.stop();
      };
    }, [shiningPosition]),
  );

  const translateX = shiningPosition.interpolate({
    inputRange: [0, 1],
    outputRange: [-width - 100, width],
  });

  const shiningStyle = {
    transform: [{ translateX }],
  };

  return (
    <View style={[styles.container, { height, width }]}>
      <AnimatedLinearGradient
        colors={['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0.4)', 'rgba(255, 255, 255, 0)']}
        locations={[0.3, 0.5, 0.7]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[styles.shining, shiningStyle]}
      />
    </View>
  );
}

function useStyles() {
  const colorScheme = useColorScheme();
  return React.useMemo(() => {
    return StyleSheet.create({
      container: {
        backgroundColor: colorScheme === 'dark' ? '#2c2c2c' : '#f0f0f0',
        borderRadius: 12,
        overflow: 'hidden',
      },
      shining: {
        width: '200%',
        height: '100%',
        position: 'absolute',
      },
    });
  }, [colorScheme]);
}
