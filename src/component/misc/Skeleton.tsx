import { useNavigation } from '@react-navigation/native';
import React, { useEffect } from 'react';
import { StyleSheet, useColorScheme, ViewStyle } from 'react-native';
import Reanimated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

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
  const opacity = useSharedValue(1);
  const navigation = useNavigation();

  useEffect(() => {
    const startAnimation = () => {
      opacity.value = withRepeat(withTiming(0.4, { duration: 800 }), -1, true);
    };

    startAnimation();

    let navigationFocus: ReturnType<typeof navigation.addListener>;
    let navigationBlur: ReturnType<typeof navigation.addListener>;

    if (stopOnBlur) {
      navigationBlur = navigation.addListener('blur', () => {
        cancelAnimation(opacity);
      });
      navigationFocus = navigation.addListener('focus', () => {
        opacity.value = 1;
        startAnimation();
      });
    }

    return () => {
      cancelAnimation(opacity);
      navigationFocus && navigationFocus();
      navigationBlur && navigationBlur();
    };
  }, [navigation, stopOnBlur, opacity]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  return <Reanimated.View style={[styles.container, { height, width }, animatedStyle, style]} />;
}

function useStyles() {
  const colorScheme = useColorScheme();
  return React.useMemo(() => {
    return StyleSheet.create({
      container: {
        backgroundColor: colorScheme === 'dark' ? '#2c2c2c' : '#e1e9ee',
        borderRadius: 12,
      },
    });
  }, [colorScheme]);
}
