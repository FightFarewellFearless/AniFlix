import { StatusChangeEventPayload, useVideoPlayer, VideoPlayer as ExpoVideoPlayer, VideoView } from "expo-video"

import { useKeepAwake } from 'expo-keep-awake';
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, AppState, GestureResponderEvent, Pressable, Text, View, ViewStyle } from "react-native";
import { TouchableOpacity } from "react-native"; //rngh
import Reanimated, { SharedValue, runOnJS, useAnimatedStyle, useDerivedValue, useSharedValue, withTiming } from "react-native-reanimated";
import Icons from 'react-native-vector-icons/MaterialIcons';
import deviceUserAgent from "../../utils/deviceUserAgent";
import ReText from "../misc/ReText";
import SeekBar from "./SeekBar";
import { useEventListener } from "expo";

type VideoPlayerProps = {
  title: string;
  streamingURL: string;
  style?: ViewStyle;
  videoRef: React.RefObject<VideoView>;
  onFullscreenUpdate?: (isFullscreen: boolean) => void;
  fullscreen?: boolean;
  onLoad?: () => void;
  isPaused?: boolean;
  onDurationChange?: (positionSecond: number) => void;
  headers?: Record<string, string>;
  batteryAndClock?: React.JSX.Element;
}
export default function VideoPlayer({ title, streamingURL, style, videoRef, onFullscreenUpdate, fullscreen, onLoad, isPaused, onDurationChange, headers, batteryAndClock }: VideoPlayerProps) {
  useKeepAwake();

  const currentDurationSecond = useSharedValue(0);
  const totalDurationSecond = useSharedValue(0);

  const player = useVideoPlayer({
    uri: streamingURL,
    headers: {
      'User-Agent': deviceUserAgent,
      ...headers,
    }
  }, player => {
    player.audioMixingMode = 'doNotMix';
    player.timeUpdateEventInterval = 1;
  })

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

  useEffect(() => {
    setIsFullscreen(fullscreen ?? false);
  }, [fullscreen]);

  const playbackStatusUpdate = useCallback(({ status, error }: StatusChangeEventPayload) => {
    if (status === 'readyToPlay') {
      setIsError(false);
      setIsBuffering(false);
      totalDurationSecond.set(((player.duration ?? 0)));
      if (seekBarProgressDisabled.get() === false) currentDurationSecond.set((player.currentTime));

      if (seekBarProgressDisabled.get() === false) seekBarProgress.set(player.currentTime / (player.duration ?? 1));

      currentDurationSecond.get() < 1 && onLoad?.();
      onDurationChange?.(player.currentTime);

      // Fix: video is playing when app is in background
      if(AppState.currentState === 'background') {
        setPaused(true);
        player.pause();
      }
    }
    else if (status === 'loading') {
      setIsBuffering(true);
    }
    else if (status === 'error') {
      setIsError(true);
      setIsBuffering(false);
    }
  }, [onDurationChange, player, onLoad]);

  useEventListener(player, 'statusChange', playbackStatusUpdate);
  useEventListener(player, 'playingChange', (e) => {
    setPaused(!e.isPlaying);
    if(!e.isPlaying) {
      setShowControls(true);
    }
  })
  useEventListener(player, 'timeUpdate', (e) => {
    if (seekBarProgressDisabled.get() === false) currentDurationSecond.set((e.currentTime));
    if (seekBarProgressDisabled.get() === false) seekBarProgress.set(e.currentTime / (player.duration ?? 1));
    onDurationChange?.(e.currentTime);
  })
  useEventListener(player, 'playToEnd', () => {
    setShowControls(true);
  })

  const setPositionAsync = (duration: number) => {
    player.currentTime = (duration);
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

  const onRewind = useCallback(() => {
    const rewind = Math.max(0, currentDurationSecond.get() - 5);
    player.currentTime = (rewind);
    currentDurationSecond.set(rewind);
    seekBarProgress.set(rewind / totalDurationSecond.get());
  }, []);
  const onForward = useCallback(() => {
    const forward = Math.min(totalDurationSecond.get(), currentDurationSecond.get() + 10);
    player.currentTime = (forward);
    currentDurationSecond.set(forward);
    seekBarProgress.set(forward / totalDurationSecond.get());
  }, []);
  const onPlayPausePressed = useCallback(() => {
    if (!paused) {
      player.pause();
      setPaused(true);
    } else {
      player.play();
      setPaused(false);
    }
  }, [paused]);

  const onFullScreenButtonPressed = useCallback(() => {
    onFullscreenUpdate?.(isFullscreen)
    setIsFullscreen(a => !a)
  }, [onFullscreenUpdate, isFullscreen]);

  // fix: video is paused when changing streaming url
  // useEffect(() => {
  //   player.play();
  // }, [streamingURL]);

  useEffect(() => {
    showControlsOpacity.set(withTiming(showControls ? 1 : 0, {
      duration: 150,
    }));
  }, [showControls]);

  const showControlsStyle = useAnimatedStyle(() => {
    return {
      opacity: showControlsOpacity.get(),
      display: showControlsOpacity.get() === 0 ? 'none' : 'flex',
    }
  });
  return (
    <View style={[style]}>
      <VideoView
        pointerEvents="none"
        player={player}
        key={streamingURL}
        contentFit="contain"
        nativeControls={false}
        style={{ position: 'absolute', top: 0, left: 0, bottom: 0, right: 0, zIndex: 0, }}
        ref={videoRef}
      />
      <Pressable onPressIn={onPressIn} onPressOut={onPressOut} style={{ flex: 1 }}>
        {batteryAndClock}

        <Reanimated.View pointerEvents="box-none" style={[{ flex: 1, zIndex: 999 }, showControlsStyle]}>
          <Top title={title} />
          <CenterControl
            isBuffering={isBuffering}
            isError={isError}
            onRewind={onRewind}
            onForward={onForward}
            onPlayPausePressed={onPlayPausePressed} paused={paused} player={player}
            streamingURL={streamingURL}
            headers={headers}
            lastTimeError={currentDurationSecond}
            onLoad={onLoad} />
          <BottomControl
            currentDurationSecond={currentDurationSecond} totalDurationSecond={totalDurationSecond}
            isFullscreen={isFullscreen} onFullScreenButtonPressed={onFullScreenButtonPressed} onProgressChange={(e) => {
              'worklet';
              seekBarProgress.set(e);
              seekBarProgressDisabled.set(true);
              currentDurationSecond.set((e * totalDurationSecond.get()));
            }} onProgressChangeEnd={(e) => {
              'worklet';
              seekBarProgress.set(e);
              seekBarProgressDisabled.set(false);
              runOnJS(setPositionAsync)?.(e * totalDurationSecond.get());
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

function CenterControl({ 
  isBuffering, isError, onPlayPausePressed, paused,
  onForward, onRewind, player, headers, streamingURL, lastTimeError, onLoad
}: 
  {
    isBuffering: boolean; isError: boolean; onPlayPausePressed: () => void, paused: boolean,
    onForward: () => void, onRewind: () => void; player: ExpoVideoPlayer; lastTimeError: SharedValue<number>;
  } & Pick<VideoPlayerProps, 'streamingURL' | 'headers' | 'onLoad'>
) {
  return (
    <View pointerEvents='box-none' onStartShouldSetResponder={() => true} style={{
      position: 'absolute', top: '50%', alignSelf: 'center',
      flexDirection: 'row', alignItems: 'center', gap: 10,
    }}>
      {/* Im wrapping the TouchableOpacity in "View" with onStartShouldSetResponder because RNGH's Touchables still execute the parent "Pressable" pressIn/Out */}
      <TouchableOpacity onPress={onRewind} style={{ backgroundColor: '#00000069', padding: 5, borderRadius: 50 }}>
        <Icons name="replay-5" size={40} color={'white'} />
      </TouchableOpacity>
      {isBuffering ? (
        <ActivityIndicator size={'large'} />
      ) : !isError ? (
        <TouchableOpacity onPress={onPlayPausePressed} style={{ backgroundColor: '#00000069', padding: 5, borderRadius: 50 }}>
          <Icons name={!paused ? "pause" : "play-arrow"} size={40} color={'white'} />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity onPress={() => {
          player.replace('');
          player.replace({
            uri: streamingURL,
            headers: {
              'User-Agent': deviceUserAgent,
              ...headers,
            }
          });
          const lastTime = lastTimeError.get();
          if(lastTime > 0) player.currentTime = lastTime;
          else onLoad?.();
        }} style={{ backgroundColor: '#00000069', padding: 5, borderRadius: 50 }}>
          <Icons name="refresh" size={40} color={'white'} />
        </TouchableOpacity>
      )}
      <TouchableOpacity onPress={onForward} style={{ backgroundColor: '#00000069', padding: 5, borderRadius: 50 }}>
        <Icons name="forward-10" size={40} color={'white'} />
      </TouchableOpacity>
    </View>
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
  const totalSecond = useDerivedValue(() => {
    'worklet';
    const sec = Math.floor(totalDurationSecond.get() % 60);
    const min = Math.floor(totalDurationSecond.get() / 60);
    const hour = Math.floor(min / 60);
    const minStr = (min % 60).toString().padStart(2, '0');
    const secStr = sec.toString().padStart(2, '0');
    return `${hour > 0 ? `${hour.toString().padStart(2, '0')}:` : ''}${minStr}:${secStr}`;
  })
  const currentSecond = useDerivedValue(() => {
    'worklet';
    const totalSecStr = totalSecond.get();
    const hasHour = totalSecStr.split(':').length === 3;
    const sec = Math.floor(currentDurationSecond.get() % 60);
    const min = Math.floor(currentDurationSecond.get() / 60);
    const hour = Math.floor(min / 60);
    const minStr = (min % 60).toString().padStart(2, '0');
    const secStr = sec.toString().padStart(2, '0');
    return hasHour ? `${hour.toString().padStart(2, '0')}:${minStr}:${secStr}` : `${minStr}:${secStr}`;
  })
  return (
    <Pressable style={{ flexDirection: 'row', backgroundColor: '#00000069', position: 'absolute', bottom: 0, alignSelf: 'center', width: '100%', paddingHorizontal: 5 }}>

      <View style={{ width: '95%', flexDirection: 'row', flex: 1 }}>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, flex: 1 }}>
          <ReText style={{ color: 'white', zIndex: 1 }} text={currentSecond} />
          <SeekBar progress={seekBarProgress} style={{ flex: 1, zIndex: 0, }} onProgressChange={onProgressChange} onProgressChangeEnd={onProgressChangeEnd} />
          <ReText style={{ color: 'white', zIndex: 1 }} text={totalSecond} />
        </View>
      </View>
      <TouchableOpacity style={{ justifyContent: 'center' }} /* //rngh - containerStyle */ onPress={onFullScreenButtonPressed} hitSlop={5}>
        <Icons name={isFullscreen ? "fullscreen-exit" : "fullscreen"} size={28} color={'white'} />
      </TouchableOpacity>
    </Pressable>

  )
}