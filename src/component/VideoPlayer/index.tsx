/* eslint-disable react-compiler/react-compiler */
import {
  AudioMixingMode,
  VideoPlayer as ExpoVideoPlayer,
  VideoView,
  useVideoPlayer,
} from 'expo-video';

import Icons from '@react-native-vector-icons/material-icons';
import { useEventListener } from 'expo';
import { useKeepAwake } from 'expo-keep-awake';
import React, {
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
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
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { runOnJS } from 'react-native-worklets';
import { DatabaseManager, useModifiedKeyValueIfFocused } from '../../utils/DatabaseManager';
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
  subtitleURL?: string;
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

const ICON_SIZE = 45;

export default memo(VideoPlayer);

function VideoPlayer({
  title,
  thumbnailURL,
  streamingURL,
  subtitleURL,
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

  const enableNowPlayingNotification = useModifiedKeyValueIfFocused(
    'enableNowPlayingNotification',
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
      initialPlayer.audioMixingMode = DatabaseManager.getSync('audioMixingMode') as AudioMixingMode;
      initialPlayer.timeUpdateEventInterval = subtitleURL ? 45 / 1000 : 1;
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

  const [subtitles, setSubtitles] = useState<ReturnType<typeof parseSubtitles>>([]);
  const [currentSubtitle, setCurrentSubtitle] = useState<string>('');

  useEffect(() => {
    async function fetchSubtitles(url: string) {
      const subtitleText = await fetch(url).then(res => res.text());
      const subtitle = parseSubtitles(subtitleText);
      setSubtitles(subtitle);
    }
    subtitleURL && fetchSubtitles(subtitleURL);
  }, [subtitleURL]);

  useLayoutEffect(() => {
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

    const currentSub = subtitles.find(subtitle => {
      const start = Number(subtitle.startTime);
      const end = Number(subtitle.endTime);
      return e.currentTime >= start && e.currentTime <= end;
    });
    setCurrentSubtitle(currentSub?.text || '');
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

        <View
          style={{
            position: 'absolute',
            bottom: 15,
            zIndex: 10,
            left: 0,
            right: 0,
            flexDirection: 'row',
            alignSelf: 'flex-start',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Text
            style={{
              marginHorizontal: 20,
              backgroundColor: currentSubtitle === '' ? undefined : '#0000006b',
              fontSize: isFullscreen ? 24 : 14,
              textAlign: 'center',
              color: 'white',
              textShadowColor: 'black',
              textShadowOffset: { width: -1, height: 1 },
              textShadowRadius: 1,
            }}>
            {currentSubtitle}
          </Text>
        </View>
        <Reanimated.View
          pointerEvents="box-none"
          style={[{ flex: 1, zIndex: 999, backgroundColor: '#00000094' }, showControlsStyle]}>
          <Top title={title} videoRef={videoRef} />
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

function Top({ title, videoRef }: { title: string; videoRef?: React.RefObject<VideoView | null> }) {
  const requestPiP = useCallback(() => {
    videoRef?.current?.startPictureInPicture();
  }, [videoRef]);
  const isPiPEnabled = useModifiedKeyValueIfFocused(
    'enableNowPlayingNotification',
    res => res === 'true',
  );
  return (
    <View
      style={{
        width: '100%',
        height: 50,
        flexDirection: 'row',
        alignItems: 'center',
      }}>
      <TouchableOpacity
        style={{
          display: isPiPEnabled ? 'flex' : 'none',
          justifyContent: 'center',
          marginLeft: 6,
          backgroundColor: '#00000062',
          padding: 5,
          borderRadius: 5,
        }}
        /* //rngh - containerStyle */ onPress={requestPiP}
        hitSlop={2}>
        <Icons name={'picture-in-picture'} size={20} color={'white'} />
      </TouchableOpacity>
      <Text
        style={{ color: '#dadada', fontWeight: 'bold', textAlign: 'center', flex: 1 }}
        numberOfLines={2}>
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
        gap: 30,
      }}>
      {/* Im wrapping the TouchableOpacity in "View" with onStartShouldSetResponder because RNGH's Touchables still execute the parent "Pressable" pressIn/Out */}
      <TouchableOpacity onPress={onRewind} style={{ borderRadius: 50 }}>
        <Icons name="replay-5" size={ICON_SIZE} color={'white'} />
      </TouchableOpacity>
      {isBuffering ? (
        <ActivityIndicator color="white" size={ICON_SIZE} />
      ) : !isError ? (
        <TouchableOpacity onPress={onPlayPausePressed} style={{ borderRadius: 50 }}>
          <Icons name={!paused ? 'pause' : 'play-arrow'} size={ICON_SIZE} color={'white'} />
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
          style={{ borderRadius: 50 }}>
          <Icons name="refresh" size={ICON_SIZE} color={'white'} />
        </TouchableOpacity>
      )}
      <TouchableOpacity onPress={onForward} style={{ borderRadius: 50 }}>
        <Icons name="forward-10" size={ICON_SIZE} color={'white'} />
      </TouchableOpacity>
    </View>
  );
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
  seekBarProgress: SharedValue<number>;
  onProgressChange: (value: number) => void;
  onProgressChangeEnd: (lastValue: number) => void;
  onFullScreenButtonPressed: () => void;
  isFullscreen: boolean;
  currentDurationSecond: SharedValue<number>;
  totalDurationSecond: SharedValue<number>;
}) {
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
        position: 'absolute',
        bottom: 0,
        alignSelf: 'center',
        width: '100%',
        paddingHorizontal: 15,
        marginBottom: 2,
      }}>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <ReText style={{ color: 'white', zIndex: 1, fontSize: 12 }} text={currentSecond} />
            <Text style={{ color: '#dadada', zIndex: 1, fontSize: 12 }}>/</Text>
            <ReText style={{ color: '#dadada', zIndex: 1, fontSize: 12 }} text={totalSecond} />
          </View>
          <TouchableOpacity
            style={{ justifyContent: 'center' }}
            /* //rngh - containerStyle */ onPress={onFullScreenButtonPressed}
            hitSlop={2}>
            <Icons
              name={isFullscreen ? 'fullscreen-exit' : 'fullscreen'}
              size={28}
              color={'white'}
            />
          </TouchableOpacity>
        </View>
        <View style={{ width: '100%' }}>
          <SeekBar
            progress={seekBarProgress}
            style={{ flex: 1, zIndex: 0 }}
            onProgressChange={onProgressChange}
            onProgressChangeEnd={onProgressChangeEnd}
          />
        </View>
      </View>
    </Pressable>
  );
}

const parseTimeToSeconds = (time: string) => {
  const [hours, minutes, rest] = time.split(':');
  const [seconds, milliseconds] = rest.split(',');
  return (
    parseInt(hours, 10) * 3600 +
    parseInt(minutes, 10) * 60 +
    parseInt(seconds, 10) +
    parseInt(milliseconds, 10) / 1000
  );
};
const parseSubtitles = (rawText: string) => {
  const subtitleRegex =
    /(?:\d+\s+)?(\d{1,2}:\d{2}:\d{2}[.,]\d{3})\s+-->\s+(\d{1,2}:\d{2}:\d{2}[.,]\d{3})(?:[^\n]*)?\s+([\s\S]*?)(?=\s*(?:\d+\s+)?\d{1,2}:\d{2}:\d{2}[.,]\d{3}|$)/g;
  const htmlRegex = /<\/?[^>]+(>|$)/g;

  const results = [];
  let match;

  while ((match = subtitleRegex.exec(rawText)) !== null) {
    let cleanText = match[3].replace(htmlRegex, '').replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();

    results.push({
      startTime: parseTimeToSeconds(match[1].replace('.', ',')),
      endTime: parseTimeToSeconds(match[2].replace('.', ',')),
      text: cleanText,
    });
  }

  return results;
};
