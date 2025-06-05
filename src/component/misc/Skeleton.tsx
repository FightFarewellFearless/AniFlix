import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import { StyleSheet, useColorScheme, View, ViewStyle } from 'react-native';
import Reanimated, {
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const ReanimatedLinearGradient = Reanimated.createAnimatedComponent(LinearGradient);

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
  const shiningPosition = useSharedValue(0);
  const navigation = useNavigation();

  useEffect(() => {
    const startAnimation = () => {
      shiningPosition.value = withRepeat(
        withSequence(withTiming(1, { duration: 1500 }), withTiming(0, { duration: 0 })),
        -1,
      );
    };

    startAnimation();

    let navigationFocus: ReturnType<typeof navigation.addListener>;
    let navigationBlur: ReturnType<typeof navigation.addListener>;

    if (stopOnBlur) {
      navigationBlur = navigation.addListener('blur', () => {
        cancelAnimation(shiningPosition);
      });
      navigationFocus = navigation.addListener('focus', () => {
        shiningPosition.value = 0;
        startAnimation();
      });
    }

    return () => {
      cancelAnimation(shiningPosition);
      navigationFocus && navigationFocus();
      navigationBlur && navigationBlur();
    };
  }, [navigation, stopOnBlur, shiningPosition]);

  const animatedShiningStyle = useAnimatedStyle(() => {
    const translateX = interpolate(shiningPosition.value, [0, 1], [-width - 100, width]);
    return {
      transform: [{ translateX }],
    };
  });

  return (
    <View style={[styles.container, { height, width }, style]}>
      <ReanimatedLinearGradient
        colors={['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0.4)', 'rgba(255, 255, 255, 0)']}
        locations={[0.3, 0.5, 0.7]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[styles.shining, animatedShiningStyle]}
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
