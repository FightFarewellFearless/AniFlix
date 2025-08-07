import { Ref, useMemo } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Gesture, GestureDetector, Pressable } from 'react-native-gesture-handler';
import {
  default as Reanimated,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { runOnJS } from 'react-native-worklets';

type Props = {
  hitSlop: number;
  ref: Ref<View>;
  children: React.ReactNode;
  style: StyleProp<ViewStyle>;
  onPress: () => void;
  disabled: boolean;
};

export function TouchableOpacity(props: Partial<Props>): ReturnType<typeof Pressable> {
  const opacity = useSharedValue(1);
  const style = useAnimatedStyle(() => {
    return {
      opacity: opacity.get(),
    };
  });
  const onPress = props.onPress;
  const sigleTaps = useMemo(
    () =>
      Gesture.Tap()
        .hitSlop(props.hitSlop)
        .maxDuration(Infinity)
        .enabled(!props.disabled)
        .onBegin(() => {
          opacity.set(withTiming(0.3, { duration: 100 }));
        })
        .onFinalize(() => {
          opacity.set(withTiming(1, { duration: 200 }));
        })
        .onEnd(() => {
          if (onPress) {
            runOnJS(onPress)();
          }
        }),
    [props.hitSlop, props.disabled, opacity, onPress],
  );
  return (
    <GestureDetector gesture={sigleTaps}>
      <Reanimated.View ref={props.ref} style={[StyleSheet.flatten(props.style), style]}>
        {props.children}
      </Reanimated.View>
    </GestureDetector>
  );
}
