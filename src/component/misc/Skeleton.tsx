import { useNavigation } from '@react-navigation/native';
import React, { useEffect } from 'react';
import { Animated, StyleSheet, useColorScheme, ViewStyle } from 'react-native';

const globalOpacity = new Animated.Value(1);
let activeSkeletonCount = 0;
let animationLoop: Animated.CompositeAnimation | null = null;

function retainSkeleton() {
  activeSkeletonCount++;
  if (activeSkeletonCount === 1) {
    animationLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(globalOpacity, {
          toValue: 0.4,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(globalOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    animationLoop.start();
  }
}

function releaseSkeleton() {
  activeSkeletonCount = Math.max(0, activeSkeletonCount - 1);
  if (activeSkeletonCount === 0) {
    if (animationLoop) {
      animationLoop.stop();
      animationLoop = null;
    }
    globalOpacity.setValue(1);
  }
}

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
  const navigation = useNavigation();

  useEffect(() => {
    retainSkeleton();

    let navigationFocus: ReturnType<typeof navigation.addListener>;
    let navigationBlur: ReturnType<typeof navigation.addListener>;

    if (stopOnBlur && navigation) {
      navigationBlur = navigation.addListener('blur', () => {
        releaseSkeleton();
      });
      navigationFocus = navigation.addListener('focus', () => {
        retainSkeleton();
      });
    }

    return () => {
      releaseSkeleton();
      navigationFocus && navigationFocus();
      navigationBlur && navigationBlur();
    };
  }, [navigation, stopOnBlur]);

  return (
    <Animated.View style={[styles.container, { height, width, opacity: globalOpacity }, style]} />
  );
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
