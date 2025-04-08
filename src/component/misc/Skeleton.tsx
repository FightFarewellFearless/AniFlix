import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { Animated, StyleSheet, useColorScheme, View, ViewStyle } from 'react-native';

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

export default function Skeleton({
  height,
  width,
  style = {},
  stopOnBlur = true,
}: {
  height: number;
  width: number;
  style?: ViewStyle;
  stopOnBlur?: boolean;
}) {
  const styles = useStyles();
  const [shiningPosition] = useState(() => new Animated.Value(0));
  const navigation = useNavigation();

  useEffect(() => {
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
    let navigationFocus: ReturnType<typeof navigation.addListener>;
    let navigationBlur: ReturnType<typeof navigation.addListener>;
    if (stopOnBlur) {
      navigationBlur = navigation.addListener('blur', () => {
        animation.stop();
      });
      navigationFocus = navigation.addListener('focus', () => {
        animation.start();
      });
    }
    animation.start();

    return () => {
      animation.stop();
      navigationFocus && navigationFocus();
      navigationBlur && navigationBlur();
    };
  }, [navigation, shiningPosition, stopOnBlur]);

  const translateX = shiningPosition.interpolate({
    inputRange: [0, 1],
    outputRange: [-width - 100, width],
  });

  const shiningStyle = {
    transform: [{ translateX }],
  };

  return (
    <View style={[styles.container, { height, width }, style]}>
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
