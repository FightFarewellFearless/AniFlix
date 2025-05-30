import { useMemo } from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { Gesture, GestureDetector, Pressable } from 'react-native-gesture-handler';
import {
  default as Reanimated,
  runOnJS,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

type Props = {
  children: React.ReactNode;
  style: StyleProp<ViewStyle>;
  onPress: () => void;
  disabled: boolean;
};

export function TouchableOpacity(props: Partial<Props>): ReturnType<typeof Pressable> {
  const opacity = useSharedValue(1);
  const sigleTaps = useMemo(
    () =>
      Gesture.Tap()
        .enabled(!props.disabled)
        .onBegin(() => {
          opacity.set(withTiming(0.5, { duration: 100 }));
        })
        .onFinalize(() => {
          opacity.set(withTiming(1, { duration: 100 }));
        })
        .onEnd(() => {
          if (props.onPress) {
            runOnJS(props.onPress)();
          }
        }),
    [opacity, props.disabled, props.onPress],
  );
  return (
    <GestureDetector gesture={sigleTaps}>
      <Reanimated.View style={[StyleSheet.flatten(props.style), { opacity }]}>
        {/* 
          TODO: The current implementation somehow gives an error
          [Reanimated] Tried to modify key `current` of an object which has been already passed to a worklet 
          Possibly related to react-native-dropdown-element's ref
        */}
        {props.children}
      </Reanimated.View>
    </GestureDetector>
  );
}
