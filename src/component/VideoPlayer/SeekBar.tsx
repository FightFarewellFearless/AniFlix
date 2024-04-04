import { useCallback, useMemo } from "react";
import { ViewStyle, View, StyleSheet, LayoutChangeEvent } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Reanimated, { useSharedValue, useAnimatedStyle, withTiming, SharedValue } from "react-native-reanimated";

type SeekBarProps = {
  progress: SharedValue<number>;
  onProgressChange: (value: number) => void,
  onProgressChangeEnd: (lastValue: number) => void;
  style?: Omit<ViewStyle, 'margin' | 'marginHorizontal' | 'marginVertical' | 'marginBottom' | 'marginEnd' | 'marginLeft' | 'marginRight' | 'marginStart' | 'marginTop'>
}
export default function SeekBar({ progress, onProgressChange, onProgressChangeEnd, style }: SeekBarProps) {
  const parentWidth = useSharedValue(0);
  const circleScale = useSharedValue(1);
  const clampNumber = (num: number, a: number, b: number) => {
    'worklet';
    return Math.max(Math.min(num, Math.max(a, b)), Math.min(a, b));
  }
  const gesture = useMemo(() =>
    Gesture.Pan()
      .onBegin((e) => {
        if (e.x > parentWidth.value) {
          onProgressChange(clampNumber(parentWidth.value / parentWidth.value, 0, 1));
        }
        else {
          onProgressChange(clampNumber(e.x / parentWidth.value, 0, 1));
        }
        circleScale.value = withTiming(1.3);
      })
      .onUpdate((e) => {
        if (e.x > parentWidth.value) {
          onProgressChange(clampNumber(parentWidth.value / parentWidth.value, 0, 1));
        }
        else {
          onProgressChange(clampNumber(e.x / parentWidth.value, 0, 1));
        }
      })
      .onFinalize((e) => {
        onProgressChangeEnd(clampNumber(e.x / parentWidth.value, 0, 1));
        circleScale.value = withTiming(1);
      }), []);
  const coveredAreaStyles = useAnimatedStyle(() => ({
    width: (progress.value * parentWidth.value)
  }));
  const lastCoveredStyles = useAnimatedStyle(() => ({
    transform: [{
      translateX: clampNumber((progress.value * parentWidth.value) - 5, 0, parentWidth.value - 12),
    }, {
      scale: circleScale.value,
    }]
  }));
  const onLayout = useCallback((e: LayoutChangeEvent) => {
    parentWidth.value = e.nativeEvent.layout.width;
  }, [])
  return (
    <View style={[style]}
      onLayout={onLayout}>

      <GestureDetector gesture={gesture}>
        <View style={[styles.gestureContainer]}>
          <Reanimated.View style={[coveredAreaStyles, styles.coveredArea]} />
          <Reanimated.View
            style={[styles.lastCovered, lastCoveredStyles]}
          />
          <View
            style={[styles.availableArea]}
          />
        </View>
      </GestureDetector>
    </View>

  )
}

const styles = StyleSheet.create({
  gestureContainer: {
    width: '100%',
    height: 12,
    borderRadius: 5,
    justifyContent: 'center',
  },
  coveredArea: {
    position: 'absolute',
    height: 5,
    backgroundColor: '#b10202',
    borderRadius: 5,
    zIndex: 2,
  },
  lastCovered: {
    position: 'absolute',
    height: 12,
    width: 12,
    backgroundColor: '#ff0000',
    borderRadius: 5,
    overflow: 'visible',
    zIndex: 3,
  },
  availableArea: {
    position: 'absolute',
    backgroundColor: '#dbd8d8',
    height: 5,
    width: '100%',
    borderRadius: 5,
    zIndex: 1,
  },
})