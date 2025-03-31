import { useCallback, useLayoutEffect, useMemo, useRef } from 'react';
import { LayoutChangeEvent, StyleSheet, useWindowDimensions, View, ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Reanimated, {
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

type SeekBarProps = {
  progress: SharedValue<number>;
  onProgressChange: (value: number) => void;
  onProgressChangeEnd: (lastValue: number) => void;
  style?: Omit<
    ViewStyle,
    | 'margin'
    | 'marginHorizontal'
    | 'marginVertical'
    | 'marginBottom'
    | 'marginEnd'
    | 'marginLeft'
    | 'marginRight'
    | 'marginStart'
    | 'marginTop'
  >;
};
function clampNumber(num: number, a: number, b: number) {
  'worklet';
  return Math.max(Math.min(num, Math.max(a, b)), Math.min(a, b));
}
export default function SeekBar({
  progress,
  onProgressChange,
  onProgressChangeEnd,
  style,
}: SeekBarProps) {
  const parentWidth = useSharedValue(0);
  const circleScale = useSharedValue(1);

  const viewRef = useRef<View>(null);

  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .onBegin(e => {
          'worklet';
          if (e.x > parentWidth.get()) {
            onProgressChange(clampNumber(parentWidth.get() / parentWidth.get(), 0, 1));
          } else {
            onProgressChange(clampNumber(e.x / parentWidth.get(), 0, 1));
          }
          circleScale.set(withTiming(1.3));
        })
        .onUpdate(e => {
          'worklet';
          if (e.x > parentWidth.get()) {
            onProgressChange(clampNumber(parentWidth.get() / parentWidth.get(), 0, 1));
          } else {
            onProgressChange(clampNumber(e.x / parentWidth.get(), 0, 1));
          }
        })
        .onFinalize(e => {
          'worklet';
          onProgressChangeEnd(clampNumber(e.x / parentWidth.get(), 0, 1));
          circleScale.set(withTiming(1));
        }),
    [circleScale, onProgressChange, onProgressChangeEnd, parentWidth],
  );
  const coveredAreaStyles = useAnimatedStyle(() => ({
    width: progress.get() * parentWidth.get(),
  }));
  const circleStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: clampNumber(progress.get() * parentWidth.get() - 5, 0, parentWidth.get() - 12),
      },
      {
        scale: circleScale.get(),
      },
    ],
  }));
  const onLayout = useCallback(
    (e: LayoutChangeEvent) => {
      parentWidth.set(e.nativeEvent.layout.width);
    },
    [parentWidth],
  );

  const { width } = useWindowDimensions();

  useLayoutEffect(() => {
    viewRef.current?.measure((_x, _y, measuredWidth) => {
      if (measuredWidth > 1) {
        parentWidth.set(width);
      }
    });
  }, [parentWidth, width]);

  return (
    <View style={[style]} onLayout={onLayout} ref={viewRef}>
      <GestureDetector gesture={gesture}>
        <View style={[styles.gestureContainer]}>
          <Reanimated.View style={[coveredAreaStyles, styles.coveredArea]} />
          <Reanimated.View style={[styles.circle, circleStyle]} />
          <View style={[styles.availableArea]} />
        </View>
      </GestureDetector>
    </View>
  );
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
  circle: {
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
});
