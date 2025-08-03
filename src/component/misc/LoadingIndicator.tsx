import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { View } from 'react-native';
import { useTheme } from 'react-native-paper';
import {
  default as Reanimated,
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const DEFAULT_SIZE = 20;
const DEFAULT_SCALE = 0.5;
const DEFAULT_SCALE_TO = 1.2;

export default function LoadingIndicator({ size = DEFAULT_SIZE }: { size?: number }) {
  const theme = useTheme();
  const animation = useSharedValue(0);
  useFocusEffect(
    useCallback(() => {
      animation.set(
        withRepeat(
          withSequence(withTiming(4, { duration: 900 }), withTiming(0, { duration: 900 })),
          0,
          false,
        ),
      );
      return () => {
        cancelAnimation(animation);
      };
    }, [animation]),
  );
  const style1 = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(
          animation.get(),
          [0, 1, 2],
          [DEFAULT_SCALE, DEFAULT_SCALE_TO, DEFAULT_SCALE],
          'clamp',
        ),
      },
    ],
  }));
  const style2 = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(
          animation.get(),
          [1, 2, 3],
          [DEFAULT_SCALE, DEFAULT_SCALE_TO, DEFAULT_SCALE],
          'clamp',
        ),
      },
    ],
  }));
  const style3 = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(
          animation.get(),
          [2, 3, 4],
          [DEFAULT_SCALE, DEFAULT_SCALE_TO, DEFAULT_SCALE],
          'clamp',
        ),
      },
    ],
  }));

  return (
    <View
      style={{
        flexDirection: 'row',
        gap: 2,
      }}>
      <Reanimated.View
        style={[
          {
            backgroundColor: theme.colors.onSecondaryContainer,
            borderRadius: 100,
            height: size,
            width: size,
          },
          style1,
        ]}
      />
      <Reanimated.View
        style={[
          {
            backgroundColor: theme.colors.onSecondaryContainer,
            borderRadius: 100,
            height: size,
            width: size,
          },
          style2,
        ]}
      />
      <Reanimated.View
        style={[
          {
            backgroundColor: theme.colors.onSecondaryContainer,
            borderRadius: 100,
            height: size,
            width: size,
          },
          style3,
        ]}
      />
    </View>
  );
}
