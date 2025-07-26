import { useMemo } from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { Gesture, GestureDetector, Pressable } from 'react-native-gesture-handler';
import { default as Reanimated, useSharedValue, withTiming } from 'react-native-reanimated';
import { runOnJS } from 'react-native-worklets';

type Props = {
  children: React.ReactNode;
  style: StyleProp<ViewStyle>;
  onPress: () => void;
  disabled: boolean;
};

export function TouchableOpacity(props: Partial<Props>): ReturnType<typeof Pressable> {
  const opacity = useSharedValue(1);
  const onPress = props.onPress;
  const sigleTaps = useMemo(
    () =>
      Gesture.Tap()
        .maxDuration(1500)
        .enabled(!props.disabled)
        .onBegin(() => {
          opacity.set(withTiming(0.5, { duration: 100 }));
        })
        .onFinalize(() => {
          opacity.set(withTiming(1, { duration: 100 }));
        })
        .onEnd(() => {
          if (onPress) {
            runOnJS(onPress)();
          }
        }),
    [opacity, props.disabled, onPress],
  );
  return (
    <GestureDetector gesture={sigleTaps}>
      <Reanimated.View style={[StyleSheet.flatten(props.style), { opacity }]}>
        {props.children}
      </Reanimated.View>
    </GestureDetector>
  );
}
