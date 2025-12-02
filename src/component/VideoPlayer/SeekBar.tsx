import { useCallback, useMemo } from 'react';
import { LayoutChangeEvent, StyleSheet, View, ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Reanimated, {
  SharedValue,
  useAnimatedStyle,
  useDerivedValue,
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

const THUMB_SIZE = 14;
const TRACK_HEIGHT = 4;
const TOUCH_AREA_HEIGHT = 40;

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
  const isScrubbing = useSharedValue(false);

  const thumbScale = useDerivedValue(() => {
    return withTiming(isScrubbing.value ? 1.5 : 1, { duration: 100 });
  });

  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .onBegin(e => {
          'worklet';
          isScrubbing.value = true;
          const width = parentWidth.get();
          const newProgress = clampNumber(e.x / width, 0, 1);
          onProgressChange(newProgress);
        })
        .onUpdate(e => {
          'worklet';
          const width = parentWidth.get();
          const newProgress = clampNumber(e.x / width, 0, 1);
          onProgressChange(newProgress);
        })
        .onFinalize(e => {
          'worklet';
          isScrubbing.value = false;
          const width = parentWidth.get();
          const newProgress = clampNumber(e.x / width, 0, 1);
          onProgressChangeEnd(newProgress);
        }),
    [isScrubbing, onProgressChange, onProgressChangeEnd, parentWidth],
  );

  const coveredAreaStyles = useAnimatedStyle(() => ({
    width: `${progress.get() * 100}%`,
  }));

  const thumbStyle = useAnimatedStyle(() => {
    const centerX = progress.get() * parentWidth.get();
    return {
      transform: [
        { translateX: clampNumber(centerX - THUMB_SIZE / 2, 0, parentWidth.get() - THUMB_SIZE) },
        { scale: thumbScale.value },
      ],
    };
  });

  const onLayout = useCallback(
    (e: LayoutChangeEvent) => {
      parentWidth.set(e.nativeEvent.layout.width);
    },
    [parentWidth],
  );

  // const { width } = useWindowDimensions();

  // useLayoutEffect(() => {
  //   viewRef.current?.measure((_x, _y, measuredWidth) => {
  //     if (measuredWidth > 1) {
  //       parentWidth.set(width);
  //     }
  //   });
  // }, [parentWidth, width]);

  return (
    <View style={[style, styles.container]} onLayout={onLayout}>
      <GestureDetector gesture={gesture}>
        <View style={styles.touchableArea}>
          <View style={styles.trackBackground} />

          <Reanimated.View style={[styles.trackFill, coveredAreaStyles]} />

          <Reanimated.View style={[styles.thumb, thumbStyle]} />
        </View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'visible',
  },
  touchableArea: {
    width: '100%',
    height: TOUCH_AREA_HEIGHT,
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  trackBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: TRACK_HEIGHT,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: TRACK_HEIGHT / 2,
  },
  trackFill: {
    position: 'absolute',
    left: 0,
    height: TRACK_HEIGHT,
    backgroundColor: '#FF0000',
    borderRadius: TRACK_HEIGHT / 2,
    zIndex: 2,
  },
  thumb: {
    position: 'absolute',
    left: 0,
    height: THUMB_SIZE,
    width: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: '#FFFFFF',
    zIndex: 3,
    elevation: 4,
  },
});
