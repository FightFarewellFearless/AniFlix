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
          Animated.delay(100),
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
    outputRange: [-(width + height), width],
  });

  const shiningStyle = {
    transform: [{ translateX }, { rotate: '35deg' }, { translateY: -(height * (30 / 100)) }],
  };

  return (
    <View style={[styles.container, { height, width }]}>
      <AnimatedLinearGradient
        colors={['transparent', '#dfdfdf', 'transparent']}
        locations={[0, 0.5, 1]}
        start={{ x: 0, y: 1 }}
        end={{ x: 1, y: 1 }}
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
        backgroundColor: colorScheme === 'dark' ? '#5f5f5f' : '#afafaf',
        borderRadius: 8,
        overflow: 'hidden',
      },
      shining: {
        width: 20,
        height: '200%',
      },
    });
  }, [colorScheme]);
}
