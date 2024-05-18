import { AVPlaybackStatus, Audio, InterruptionModeAndroid, ResizeMode, Video } from "expo-av";
import { useKeepAwake } from 'expo-keep-awake';
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, GestureResponderEvent, Pressable, Text, View, ViewStyle } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import Reanimated, { SharedValue, runOnJS, useAnimatedStyle, useDerivedValue, useSharedValue, withTiming } from "react-native-reanimated";
import Icons from 'react-native-vector-icons/MaterialIcons';
import deviceUserAgent from "../../utils/deviceUserAgent";
import ReText from "../misc/ReText";
import SeekBar from "./SeekBar";

Audio.setAudioModeAsync({
  interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
});

type VideoPlayerProps = {
  title: string;
  streamingURL: string;
  style?: ViewStyle;
  videoRef: React.RefObject<Video>;
  onFullscreenUpdate?: (isFullscreen: boolean) => void;
  fullscreen?: boolean;
  onLoad?: () => void;
  isPaused?: boolean;
  onDurationChange?: (positionSecond: number) => void;
}
export default function VideoPlayer({ title, streamingURL, style, videoRef, onFullscreenUpdate, fullscreen, onLoad, isPaused, onDurationChange }: VideoPlayerProps) {
  useKeepAwake();
  const seekBarProgress = useSharedValue(0);
  const seekBarProgressDisabled = useSharedValue(false);

  const pressableShowControlsLocation = useRef<{ x: number, y: number }>({ x: 0, y: 0 });

  const [isBuffering, setIsBuffering] = useState(true);
  const [isError, setIsError] = useState(false);

  const [paused, setPaused] = useState(isPaused ?? false);
  useEffect(() => {
    setPaused(isPaused ?? false);
  }, [isPaused]);

  const [isFullscreen, setIsFullscreen] = useState(false);

  const [showControls, setShowControls] = useState(true);
  const showControlsOpacity = useSharedValue(1);

  const currentDurationSecond = useSharedValue(0);
  const totalDurationSecond = useSharedValue(0);

  useEffect(() => {
    setIsFullscreen(fullscreen ?? false);
  }, [fullscreen]);
  const playbackStatusUpdate = useCallback((status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      if (status.isBuffering && !status.isPlaying && status.shouldPlay) {
        setIsBuffering(true);
      } else {
        setIsBuffering(false);
      }
      totalDurationSecond.value = ((status.durationMillis ?? 0) / 1000);
      if (seekBarProgressDisabled.value === false) currentDurationSecond.value = (status.positionMillis / 1000);

      if (seekBarProgressDisabled.value === false) seekBarProgress.value = status.positionMillis / (status.durationMillis ?? 1);

      onDurationChange?.(status.positionMillis / 1000);

      setPaused(!status.shouldPlay);
    } else {
      setIsError(!!status.error);
    }
  }, [onDurationChange]);
  const setPositionAsync = (duration: number) => {
    videoRef?.current?.setPositionAsync(duration * 1000);
  };
  const onPressIn = useCallback((e: GestureResponderEvent) => {
    pressableShowControlsLocation.current = {
      x: e.nativeEvent.locationX,
      y: e.nativeEvent.locationY,
    }
  }, []);
  const onPressOut = useCallback((e: GestureResponderEvent) => {
    if (
      Math.abs(e.nativeEvent.locationX - pressableShowControlsLocation.current.x) < 10
      && Math.abs(e.nativeEvent.locationY - pressableShowControlsLocation.current.y) < 10
    ) {
      setShowControls(a => !a);
    }
  }, []);
  const onVideoLoad = useCallback((e: AVPlaybackStatus) => {
    if (e.isLoaded) {
      totalDurationSecond.value = ((e.durationMillis ?? 0) / 1000);
      currentDurationSecond.value = 0;
    }
    onLoad?.();
  }, [onLoad]);

  const onRewind = useCallback(() => {
    videoRef.current?.setPositionAsync((currentDurationSecond.value - 5) * 1000);
  }, []);
  const onForward = useCallback(() => {
    videoRef.current?.setPositionAsync((currentDurationSecond.value + 10) * 1000);
  }, []);
  const onPlayPausePressed = useCallback(() => {
    if (!paused) {
      videoRef?.current?.pauseAsync();
    } else {
      videoRef?.current?.playAsync();
    }
  }, [paused]);

  const onFullScreenButtonPressed = useCallback(() => {
    onFullscreenUpdate?.(isFullscreen)
    setIsFullscreen(a => !a)
  }, [onFullscreenUpdate, isFullscreen]);
  
  // fix: video is paused when changing streaming url
  useEffect(() => {
    videoRef.current?.playAsync();
  }, [streamingURL]);

  useEffect(() => {
    showControlsOpacity.value = withTiming(showControls ? 1 : 0, {
      duration: 150,
    });
  }, [showControls]);

  const showControlsStyle = useAnimatedStyle(() => {
    return {
      opacity: showControlsOpacity.value,
      display: showControlsOpacity.value === 0 ? 'none' : 'flex',
    }
  });
  return (
    <View style={[style]}>
      <Pressable onPressIn={onPressIn} onPressOut={onPressOut} style={{ flex: 1 }}>
        <Video
          key={streamingURL}
          onLoad={onVideoLoad}
          onPlaybackStatusUpdate={playbackStatusUpdate}
          source={{
            uri: streamingURL, headers: {
              'User-Agent': deviceUserAgent,
            }
          }}
          resizeMode={ResizeMode.CONTAIN}
          useNativeControls={false}
          style={{ position: 'absolute', top: 0, left: 0, bottom: 0, right: 0 }}
          ref={videoRef}
        />

        <Reanimated.View pointerEvents="box-none" style={[{flex: 1}, showControlsStyle]}>
          <Top title={title} />
          <CenterControl
            isBuffering={isBuffering}
            onRewind={onRewind}
            onForward={onForward}
            onPlayPausePressed={onPlayPausePressed} paused={paused} />
          <BottomControl
            currentDurationSecond={currentDurationSecond} totalDurationSecond={totalDurationSecond}
            isFullscreen={isFullscreen} onFullScreenButtonPressed={onFullScreenButtonPressed} onProgressChange={(e) => {
              'worklet';
              seekBarProgress.value = e;
              seekBarProgressDisabled.value = true;
              currentDurationSecond.value = (e * totalDurationSecond.value);
            }} onProgressChangeEnd={(e) => {
              'worklet';
              seekBarProgress.value = e;
              seekBarProgressDisabled.value = false;
              runOnJS(setPositionAsync)?.(e * totalDurationSecond.value);
            }} seekBarProgress={seekBarProgress} />
        </Reanimated.View>

        <Icons style={{
          position: 'absolute', top: '50%', alignSelf: 'center', display: isError ? 'flex' : 'none',
        }} name="error" size={50} color="red" />
      </Pressable>
    </View>
  )
}

function Top({ title }: { title: string }) {
  return (
    <View style={{ width: '100%', height: 50, backgroundColor: '#00000093', justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: 'white' }}>{title}</Text>
    </View>
  )
}

function CenterControl({ isBuffering, onPlayPausePressed, paused, onForward, onRewind }: { isBuffering: boolean; onPlayPausePressed: () => void, paused: boolean, onForward: () => void, onRewind: () => void }) {
  return (
    <Pressable style={{
      position: 'absolute', top: '50%', alignSelf: 'center',
      flexDirection: 'row', alignItems: 'center', gap: 10,
    }}>
      <TouchableOpacity onPress={onRewind} style={{ backgroundColor: '#00000069', padding: 5, borderRadius: 50 }}>
        <Icons name="replay-5" size={40} color={'white'} />
      </TouchableOpacity>
      {isBuffering ? (
        <ActivityIndicator size={'large'} />
      ) : (
        <TouchableOpacity onPress={onPlayPausePressed} style={{ backgroundColor: '#00000069', padding: 5, borderRadius: 50 }}>
          <Icons name={!paused ? "pause" : "play-arrow"} size={40} color={'white'} />
        </TouchableOpacity>
      )}
      <TouchableOpacity onPress={onForward} style={{ backgroundColor: '#00000069', padding: 5, borderRadius: 50 }}>
        <Icons name="forward-10" size={40} color={'white'} />
      </TouchableOpacity>
    </Pressable>
  )
}

function BottomControl({
  seekBarProgress,
  onProgressChange,
  onProgressChangeEnd,
  onFullScreenButtonPressed,
  isFullscreen,
  currentDurationSecond,
  totalDurationSecond,
}: {
  seekBarProgress: SharedValue<number>; onProgressChange: (value: number) => void, onProgressChangeEnd: (lastValue: number) => void; onFullScreenButtonPressed: () => void; isFullscreen: boolean;
  currentDurationSecond: SharedValue<number>; totalDurationSecond: SharedValue<number>;
}) {
  const currentSecond = useDerivedValue(() => {
    'worklet';
    const sec = Math.floor(currentDurationSecond.value % 60);
    const min = Math.floor(currentDurationSecond.value / 60);
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  })
  const totalSecond = useDerivedValue(() => {
    'worklet';
    const sec = Math.floor(totalDurationSecond.value % 60);
    const min = Math.floor(totalDurationSecond.value / 60);
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  })
  return (
    <Pressable style={{ flexDirection: 'row', backgroundColor: '#00000069', position: 'absolute', bottom: 0, alignSelf: 'center', width: '100%', padding: 5 }}>

      <View style={{ width: '95%', flexDirection: 'row', flex: 1 }}>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, flex: 1 }}>
          <ReText style={{ color: 'white', zIndex: 1 }} text={currentSecond} />
          <SeekBar progress={seekBarProgress} style={{ flex: 1, zIndex: 0, }} onProgressChange={onProgressChange} onProgressChangeEnd={onProgressChangeEnd} />
          <ReText style={{ color: 'white', zIndex: 1 }} text={totalSecond} />
        </View>
      </View>
      <TouchableOpacity containerStyle={{ justifyContent: 'center' }} onPress={onFullScreenButtonPressed}>
        <Icons name={isFullscreen ? "fullscreen-exit" : "fullscreen"} size={24} color={'white'} />
      </TouchableOpacity>
    </Pressable>

  )
}