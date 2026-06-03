import { useCallback, useEffect, useState } from 'react';
import {
  LayoutChangeEvent,
  Platform,
  StyleSheet,
  TVFocusGuideView,
  View,
  ViewStyle,
  useTVEventHandler,
} from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
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
  const [isTvFocused, setIsTvFocused] = useState(false);
  const isTvFocusedShared = useSharedValue(false);

  useEffect(() => {
    isTvFocusedShared.value = isTvFocused;
  }, [isTvFocused, isTvFocusedShared]);

  const thumbScale = useDerivedValue(() => {
    return withTiming(isScrubbing.value || isTvFocusedShared.value ? 1.6 : 1, { duration: 100 });
  });

  useTVEventHandler(
    useCallback(
      evt => {
        if (!Platform.isTV || !isTvFocused) return;

        if (evt && evt.eventKeyAction === 1) {
          const currentProg = progress.get();
          if (evt.eventType === 'left') {
            const nextProg = Math.max(0, currentProg - 0.02);
            onProgressChange(nextProg);
            onProgressChangeEnd(nextProg);
          } else if (evt.eventType === 'right') {
            const nextProg = Math.min(1, currentProg + 0.02);
            onProgressChange(nextProg);
            onProgressChangeEnd(nextProg);
          }
        }
      },
      [isTvFocused, onProgressChange, onProgressChangeEnd, progress],
    ),
  );

  const gesture = usePanGesture({
    onBegin: e => {
      'worklet';
      isScrubbing.value = true;
      const width = parentWidth.get();
      const newProgress = clampNumber(e.x / width, 0, 1);
      onProgressChange(newProgress);
    },
    onUpdate: e => {
      'worklet';
      const width = parentWidth.get();
      const newProgress = clampNumber(e.x / width, 0, 1);
      onProgressChange(newProgress);
    },
    onFinalize: e => {
      'worklet';
      isScrubbing.value = false;
      const width = parentWidth.get();
      const newProgress = clampNumber(e.x / width, 0, 1);
      onProgressChangeEnd(newProgress);
    },
  });

  const coveredAreaStyles = useAnimatedStyle(() => ({
    width: `${progress.get() * 100}%`,
  }));

  const thumbStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: thumbScale.value }],
    };
  });
  const thumbPositionStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: `${progress.get() * 100}%`,
        },
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
        <TVFocusGuideView
          trapFocusLeft
          trapFocusRight
          focusable
          onFocus={() => setIsTvFocused(true)}
          onBlur={() => setIsTvFocused(false)}>
          <View style={styles.touchableArea} focusable accessible>
            <View style={styles.trackBackground} />

            <Reanimated.View
              style={[
                styles.trackFill,
                coveredAreaStyles,
                isTvFocused && { backgroundColor: '#FF3333' },
              ]}
            />
            <Reanimated.View
              style={[
                {
                  position: 'absolute',
                  width: '100%',
                  height: THUMB_SIZE,
                  left: -THUMB_SIZE / 2,
                  zIndex: 3,
                },
                thumbPositionStyle,
              ]}>
              <Reanimated.View
                style={[styles.thumb, thumbStyle, isTvFocused && { backgroundColor: '#FF0000' }]}
              />
            </Reanimated.View>
          </View>
        </TVFocusGuideView>
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
