/* eslint-disable react-compiler/react-compiler */
import { VideoPlayer as ExpoVideoPlayer, VideoView, useVideoPlayer } from 'expo-video';

import { useEventListener } from 'expo';
import { useKeepAwake } from 'expo-keep-awake';
import React, { memo, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  GestureResponderEvent,
  Pressable,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import Reanimated, {
  SharedValue,
  runOnJS,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Icons from 'react-native-vector-icons/MaterialIcons';
import useSelectorIfFocused from '../../hooks/useSelectorIfFocused';
import deviceUserAgent from '../../utils/deviceUserAgent';
import ReText from '../misc/ReText';
import SeekBar from './SeekBar';

export type PlayerRef = {
  skipTo: (duration: number) => void;
};
type VideoPlayerProps = {
  title: string;
  thumbnailURL?: string;
  streamingURL: string;
  style?: ViewStyle;
  videoRef?: React.RefObject<VideoView | null>;
  ref?: React.Ref<PlayerRef>;
  onFullscreenUpdate?: (isFullscreen: boolean) => void;
  fullscreen?: boolean;
  onLoad?: () => void;
  isPaused?: boolean;
  onDurationChange?: (positionSecond: number) => void;
  headers?: Record<string, string>;
  batteryAndClock?: React.JSX.Element;
};

export default memo(VideoPlayer);

function VideoPlayer({
  title,
  thumbnailURL,
  streamingURL,
  style,
  videoRef,
  ref,
  onFullscreenUpdate,
  fullscreen,
  onLoad,
  isPaused,
  onDurationChange,
  headers,
  batteryAndClock,
}: VideoPlayerProps) {
  useKeepAwake();

  const currentDurationSecond = useSharedValue(0);
  const totalDurationSecond = useSharedValue(0);

  const enableNowPlayingNotification = useSelectorIfFocused(
    state => state.settings.enableNowPlayingNotification,
    true,
    res => res === 'true',
  );

  const player = useVideoPlayer(
    {
      uri: streamingURL,
      metadata: {
        title,
        artist: 'AniFlix',
        artwork: thumbnailURL,
      },
      headers: {
        'User-Agent': deviceUserAgent,
        ...headers,
      },
    },
    initialPlayer => {
      initialPlayer.audioMixingMode = 'doNotMix';
      initialPlayer.timeUpdateEventInterval = 1;
      initialPlayer.showNowPlayingNotification = enableNowPlayingNotification;
    },
  );

  const seekBarProgress = useSharedValue(0);
  const seekBarProgressDisabled = useSharedValue(false);

  const pressableShowControlsLocation = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const [isBuffering, setIsBuffering] = useState(true);
  useEffect(() => {
    setIsBuffering(true);
    seekBarProgress.set(0);
    currentDurationSecond.set(0);
    totalDurationSecond.set(0);
  }, [currentDurationSecond, seekBarProgress, streamingURL, totalDurationSecond]);

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

  useEventListener(player, 'statusChange', ({ status }) => {
    if (status === 'readyToPlay') {
      setIsError(false);
      setIsBuffering(false);
      totalDurationSecond.set(player.duration ?? 0);
      if (seekBarProgressDisabled.get() === false) currentDurationSecond.set(player.currentTime);

      if (seekBarProgressDisabled.get() === false)
        seekBarProgress.set(player.currentTime / (player.duration ?? 1));

      currentDurationSecond.get() < 1 && onLoad?.();
      onDurationChange?.(player.currentTime);

      // Fix: video is playing when app is in background
      if (AppState.currentState === 'background') {
        setPaused(true);
        player.pause();
      }
    } else if (status === 'loading') {
      setIsBuffering(true);
    } else if (status === 'error') {
      setIsError(true);
      setIsBuffering(false);
    }
  });
  useEventListener(player, 'playingChange', e => {
    setPaused(!e.isPlaying);
    if (!e.isPlaying) {
      setShowControls(true);
    }
  });
  useEventListener(player, 'timeUpdate', e => {
    if (!player.playing) return; // Do not update time if video is paused (fix for video history not synced)
    if (seekBarProgressDisabled.get() === false) currentDurationSecond.set(e.currentTime);
    if (seekBarProgressDisabled.get() === false)
      seekBarProgress.set(e.currentTime / (player.duration ?? 1));
    onDurationChange?.(e.currentTime);
  });
  useImperativeHandle(
    ref,
    () => ({
      skipTo: (duration: number) => {
        player.currentTime = duration;
        currentDurationSecond.set(duration);
        seekBarProgress.set(duration / (player.duration ?? 1));
      },
    }),
    [player, currentDurationSecond, seekBarProgress],
  );
  useEventListener(player, 'playToEnd', () => {
    setShowControls(true);
  });

  const setPositionAsync = (duration: number) => {
    player.currentTime = duration;
  };
  const onPressIn = useCallback((e: GestureResponderEvent) => {
    pressableShowControlsLocation.current = {
      x: e.nativeEvent.locationX,
      y: e.nativeEvent.locationY,
    };
  }, []);
  const onPressOut = useCallback((e: GestureResponderEvent) => {
    if (
      Math.abs(e.nativeEvent.locationX - pressableShowControlsLocation.current.x) < 10 &&
      Math.abs(e.nativeEvent.locationY - pressableShowControlsLocation.current.y) < 10
    ) {
      setShowControls(a => !a);
    }
  }, []);

  const onRewind = useCallback(() => {
    const rewind = Math.max(0, currentDurationSecond.get() - 5);
    player.currentTime = rewind;
    currentDurationSecond.set(rewind);
    seekBarProgress.set(rewind / totalDurationSecond.get());
  }, [currentDurationSecond, player, seekBarProgress, totalDurationSecond]);
  const onForward = useCallback(() => {
    const forward = Math.min(totalDurationSecond.get(), currentDurationSecond.get() + 10);
    player.currentTime = forward;
    currentDurationSecond.set(forward);
    seekBarProgress.set(forward / totalDurationSecond.get());
  }, [currentDurationSecond, player, seekBarProgress, totalDurationSecond]);
  const onPlayPausePressed = useCallback(() => {
    if (!paused) {
      player.pause();
      setPaused(true);
    } else {
      player.play();
      setPaused(false);
    }
  }, [paused, player]);

  const onFullScreenButtonPressed = useCallback(() => {
    onFullscreenUpdate?.(isFullscreen);
    setIsFullscreen(a => !a);
  }, [onFullscreenUpdate, isFullscreen]);

  // fix: video is paused when changing streaming url
  // useEffect(() => {
  //   player.play();
  // }, [streamingURL]);

  useEffect(() => {
    showControlsOpacity.set(
      withTiming(showControls ? 1 : 0, {
        duration: 150,
      }),
    );
  }, [showControls, showControlsOpacity]);

  const showControlsStyle = useAnimatedStyle(() => {
    return {
      opacity: showControlsOpacity.get(),
      display: showControlsOpacity.get() === 0 ? 'none' : 'flex',
    };
  });

  const pipTimeout = useRef<NodeJS.Timeout>(null);
  const onPiPStop = useCallback(() => {
    pipTimeout.current = setTimeout(() => {
      if (AppState.currentState === 'active' && !paused) {
        try {
          player.play();
        } catch {}
        setPaused(false);
      }
    }, 100);
    player.pause();
    setPaused(true);
  }, [paused, player]);

  useEffect(() => {
    return () => {
      pipTimeout.current && clearTimeout(pipTimeout.current);
    };
  }, []);

  // run gc on streamingURL change
  useEffect(() => {
    return () => {
      globalThis.gc?.();
    };
  }, [streamingURL]);

  return (
    <View style={[style]}>
      <VideoView
        onPictureInPictureStop={onPiPStop}
        allowsPictureInPicture={true}
        pointerEvents="none"
        player={player}
        key={streamingURL}
        contentFit="contain"
        nativeControls={false}
        style={{ position: 'absolute', top: 0, left: 0, bottom: 0, right: 0, zIndex: 0 }}
        ref={videoRef}
      />
      <Pressable onPressIn={onPressIn} onPressOut={onPressOut} style={{ flex: 1 }}>
        {batteryAndClock}

        <Reanimated.View
          pointerEvents="box-none"
          style={[{ flex: 1, zIndex: 999, backgroundColor: '#00000094' }, showControlsStyle]}>
          <Top title={title} />
          <CenterControl
            isBuffering={isBuffering}
            isError={isError}
            onRewind={onRewind}
            onForward={onForward}
            onPlayPausePressed={onPlayPausePressed}
            paused={paused}
            player={player}
            streamingURL={streamingURL}
            headers={headers}
            lastTimeError={currentDurationSecond}
            onLoad={onLoad}
          />
          <BottomControl
            videoRef={videoRef}
            currentDurationSecond={currentDurationSecond}
            totalDurationSecond={totalDurationSecond}
            isFullscreen={isFullscreen}
            onFullScreenButtonPressed={onFullScreenButtonPressed}
            onProgressChange={e => {
              'worklet';
              seekBarProgress.set(e);
              seekBarProgressDisabled.set(true);
              currentDurationSecond.set(e * totalDurationSecond.get());
            }}
            onProgressChangeEnd={e => {
              'worklet';
              seekBarProgress.set(e);
              seekBarProgressDisabled.set(false);
              runOnJS(setPositionAsync)?.(e * totalDurationSecond.get());
            }}
            seekBarProgress={seekBarProgress}
          />
        </Reanimated.View>

        <View
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            alignSelf: 'center',
            justifyContent: 'center',
            display: isError ? 'flex' : 'none',
          }}>
          <Icons name="error" size={50} color="red" />
        </View>
      </Pressable>
    </View>
  );
}

function Top({ title }: { title: string }) {
  return (
    <View
      style={{
        width: '100%',
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
      }}>
      <Text style={{ color: 'white', fontWeight: 'bold' }} numberOfLines={2}>
        {title}
      </Text>
    </View>
  );
}

function CenterControl({
  isBuffering,
  isError,
  onPlayPausePressed,
  paused,
  onForward,
  onRewind,
  player,
  headers,
  streamingURL,
  lastTimeError,
  onLoad,
}: {
  isBuffering: boolean;
  isError: boolean;
  onPlayPausePressed: () => void;
  paused: boolean;
  onForward: () => void;
  onRewind: () => void;
  player: ExpoVideoPlayer;
  lastTimeError: SharedValue<number>;
} & Pick<VideoPlayerProps, 'streamingURL' | 'headers' | 'onLoad'>) {
  return (
    <View
      pointerEvents="box-none"
      onStartShouldSetResponder={() => true}
      style={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
      }}>
      {/* Im wrapping the TouchableOpacity in "View" with onStartShouldSetResponder because RNGH's Touchables still execute the parent "Pressable" pressIn/Out */}
      <TouchableOpacity
        onPress={onRewind}
        style={{ backgroundColor: '#00000069', padding: 5, borderRadius: 50 }}>
        <Icons name="replay-5" size={40} color={'white'} />
      </TouchableOpacity>
      {isBuffering ? (
        <ActivityIndicator size={'large'} />
      ) : !isError ? (
        <TouchableOpacity
          onPress={onPlayPausePressed}
          style={{ backgroundColor: '#00000069', padding: 5, borderRadius: 50 }}>
          <Icons name={!paused ? 'pause' : 'play-arrow'} size={40} color={'white'} />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          onPress={() => {
            player.replace('');
            player.replace({
              uri: streamingURL,
              headers: {
                'User-Agent': deviceUserAgent,
                ...headers,
              },
            });
            const lastTime = lastTimeError.get();
            if (lastTime > 0) player.currentTime = lastTime;
            else onLoad?.();
          }}
          style={{ backgroundColor: '#00000069', padding: 5, borderRadius: 50 }}>
          <Icons name="refresh" size={40} color={'white'} />
        </TouchableOpacity>
      )}
      <TouchableOpacity
        onPress={onForward}
        style={{ backgroundColor: '#00000069', padding: 5, borderRadius: 50 }}>
        <Icons name="forward-10" size={40} color={'white'} />
      </TouchableOpacity>
    </View>
  );
}

function BottomControl({
  seekBarProgress,
  videoRef,
  onProgressChange,
  onProgressChangeEnd,
  onFullScreenButtonPressed,
  isFullscreen,
  currentDurationSecond,
  totalDurationSecond,
}: {
  seekBarProgress: SharedValue<number>;
  videoRef?: React.RefObject<VideoView | null>;
  onProgressChange: (value: number) => void;
  onProgressChangeEnd: (lastValue: number) => void;
  onFullScreenButtonPressed: () => void;
  isFullscreen: boolean;
  currentDurationSecond: SharedValue<number>;
  totalDurationSecond: SharedValue<number>;
}) {
  const requestPiP = useCallback(() => {
    videoRef?.current?.startPictureInPicture();
  }, [videoRef]);
  const totalSecond = useDerivedValue(() => {
    'worklet';
    const sec = Math.floor(totalDurationSecond.get() % 60);
    const min = Math.floor(totalDurationSecond.get() / 60);
    const hour = Math.floor(min / 60);
    const minStr = (min % 60).toString().padStart(2, '0');
    const secStr = sec.toString().padStart(2, '0');
    return `${hour > 0 ? `${hour.toString().padStart(2, '0')}:` : ''}${minStr}:${secStr}`;
  });
  const currentSecond = useDerivedValue(() => {
    'worklet';
    const totalSecStr = totalSecond.get();
    const hasHour = totalSecStr.split(':').length === 3;
    const sec = Math.floor(currentDurationSecond.get() % 60);
    const min = Math.floor(currentDurationSecond.get() / 60);
    const hour = Math.floor(min / 60);
    const minStr = (min % 60).toString().padStart(2, '0');
    const secStr = sec.toString().padStart(2, '0');
    return hasHour
      ? `${hour.toString().padStart(2, '0')}:${minStr}:${secStr}`
      : `${minStr}:${secStr}`;
  });
  return (
    <Pressable
      style={{
        flexDirection: 'row',

        position: 'absolute',
        bottom: 0,
        alignSelf: 'center',
        width: '100%',
        paddingHorizontal: 5,
      }}>
      <View style={{ width: '95%', flexDirection: 'row', flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 1, flex: 1 }}>
          <ReText
            style={{ color: 'white', zIndex: 1, fontWeight: 'bold', fontSize: 13 }}
            text={currentSecond}
          />
          <Text style={{ color: 'white', zIndex: 1, fontWeight: 'bold' }}>/</Text>
          <ReText
            style={{ color: 'white', zIndex: 1, fontWeight: 'bold', fontSize: 13 }}
            text={totalSecond}
          />
          <SeekBar
            progress={seekBarProgress}
            style={{ flex: 1, zIndex: 0 }}
            onProgressChange={onProgressChange}
            onProgressChangeEnd={onProgressChangeEnd}
          />
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 2 }}>
        <TouchableOpacity
          style={{ justifyContent: 'center', marginLeft: 6 }}
          /* //rngh - containerStyle */ onPress={requestPiP}
          hitSlop={2}>
          <Icons name={'picture-in-picture'} size={22} color={'white'} />
        </TouchableOpacity>
        <TouchableOpacity
          style={{ justifyContent: 'center' }}
          /* //rngh - containerStyle */ onPress={onFullScreenButtonPressed}
          hitSlop={2}>
          <Icons name={isFullscreen ? 'fullscreen-exit' : 'fullscreen'} size={28} color={'white'} />
        </TouchableOpacity>
      </View>
    </Pressable>
  );
}
