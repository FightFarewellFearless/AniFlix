import Icon from '@react-native-vector-icons/fontawesome';
import { useFocusEffect } from '@react-navigation/core';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View, useColorScheme } from 'react-native';
import { SystemBars } from 'react-native-edge-to-edge';
import { DeviceInfoModule } from 'react-native-nitro-device-info';
import Orientation, { OrientationType } from 'react-native-orientation-locker';
import { ActivityIndicator, useTheme } from 'react-native-paper';
import ReAnimated, {
  AnimatedRef,
  FadeInUp,
  FadeOutDown,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import SystemNavigationBar from 'react-native-system-navigation-bar';

import useGlobalStyles, { darkText } from '@assets/style';
import { TouchableOpacity } from '@component/misc/TouchableOpacityRNGH';
import { useBackHandler } from '@hooks/useBackHandler';

export function LoadingModal({
  isLoading,
  cancelLoading,
  setIsPaused,
}: {
  isLoading: boolean;
  cancelLoading: () => void;
  setIsPaused: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const globalStyles = useGlobalStyles();
  const styles = useVideoStyles();
  useBackHandler(
    useCallback(() => {
      if (isLoading) {
        cancelLoading();
      }
      return isLoading;
    }, [isLoading, cancelLoading]),
  );

  useEffect(() => {
    if (isLoading) {
      setIsPaused(() => true);
    } else {
      setIsPaused(() => false);
    }
  }, [isLoading, setIsPaused]);

  const entering = useMemo(() => FadeInUp.duration(300), []);
  const exiting = useMemo(() => FadeOutDown.duration(300), []);

  return (
    isLoading && (
      <View style={styles.modalContainer}>
        <ReAnimated.View entering={entering} exiting={exiting} style={styles.modalContent}>
          <TouchableOpacity
            onPress={cancelLoading}
            style={{ position: 'absolute', top: 5, right: 5 }} //rngh
          >
            <Icon name="close" size={28} color="red" />
          </TouchableOpacity>
          <ActivityIndicator size={28} />
          <Text style={globalStyles.text}>Tunggu sebentar, sedang mengambil data...</Text>
        </ReAnimated.View>
      </View>
    )
  );
}

export function TimeInfo() {
  const [time, setTime] = useState<string>();

  const changeTime = useCallback(() => {
    const currentDate = new Date();
    const hours = currentDate.getHours();
    const minutes = currentDate.getMinutes();
    const newDate = `${hours < 10 ? '0' + hours : hours}:${minutes < 10 ? '0' + minutes : minutes}`;
    if (time !== newDate) {
      setTime(newDate);
    }
  }, [time]);

  useFocusEffect(
    useCallback(() => {
      changeTime();
      const interval = setInterval(changeTime, 1_000);
      return () => {
        clearInterval(interval);
      };
    }, [changeTime]),
  );
  return <Text style={{ color: '#dadada' }}>{time}</Text>;
}

export function useVideoStyles() {
  const theme = useTheme();
  const globalStyles = useGlobalStyles();
  const colorScheme = useColorScheme();

  return useMemo(
    () =>
      StyleSheet.create({
        modalContainer: {
          position: 'absolute',
          width: '100%',
          height: '100%',
          zIndex: 100,
          backgroundColor: 'rgba(0,0,0,0.7)',
          justifyContent: 'center',
          alignItems: 'center',
        },
        modalContent: {
          flex: 0.15,
          minWidth: 300,
          minHeight: 80,
          backgroundColor: colorScheme === 'dark' ? '#2A2A2A' : '#FFFFFF',
          borderRadius: 12,
          borderWidth: 1,
          borderColor: colorScheme === 'dark' ? '#404040' : '#E0E0E0',
          alignItems: 'center',
          alignSelf: 'center',
          justifyContent: 'center',
          elevation: 5,
        },
        batteryInfo: {
          position: 'absolute',
          right: 15,
          top: 15,
          flexDirection: 'row',
          alignItems: 'center',
          padding: 6,
          borderRadius: 20,
          backgroundColor: 'rgba(0,0,0,0.6)',
          zIndex: 1,
        },
        timeInfo: {
          position: 'absolute',
          left: 15,
          top: 15,
          padding: 6,
          borderRadius: 20,
          backgroundColor: 'rgba(0,0,0,0.6)',
          zIndex: 1,
        },
        fullscreen: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 },
        notFullscreen: { position: 'relative', aspectRatio: 16 / 9, backgroundColor: '#000' },
        container: {
          backgroundColor: colorScheme === 'dark' ? '#1F1F1F' : '#FFFFFF',
          padding: 15,
          borderRadius: 12,
          marginHorizontal: 10,
          marginVertical: 5,
          elevation: 2,
        },
        infoTitle: {
          fontSize: 20,
          fontWeight: '600',
          color: colorScheme === 'dark' ? '#FFFFFF' : '#1A1A1A',
          marginBottom: 10,
        },
        infoSinopsis: {
          fontSize: 14,
          lineHeight: 20,
          color: colorScheme === 'dark' ? '#A0A0A0' : '#666666',
        },
        infoGenre: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          marginVertical: 10,
          gap: 8,
          alignContent: 'center',
          alignItems: 'center',
        },
        genre: {
          backgroundColor: colorScheme === 'dark' ? '#333333' : '#F0F0F0',
          paddingVertical: 4,
          paddingHorizontal: 10,
          borderRadius: 15,
          fontSize: 12,
          color: colorScheme === 'dark' ? '#D0D0D0' : '#555555',
        },
        infoData: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'space-around',
          alignContent: 'center',
          alignItems: 'center',
          marginTop: 10,
        },
        status: {
          paddingVertical: 4,
          paddingHorizontal: 10,
          borderRadius: 15,
          fontSize: 12,
          fontWeight: '600',
          color: '#FFFFFF',
          backgroundColor: '#4CAF50',
        },
        releaseYear: {
          backgroundColor: colorScheme === 'dark' ? '#333333' : '#F0F0F0',
          paddingVertical: 4,
          paddingHorizontal: 10,
          borderRadius: 15,
          fontSize: 12,
          color: colorScheme === 'dark' ? '#D0D0D0' : '#555555',
        },
        rating: {
          backgroundColor: '#FFD700',
          paddingVertical: 4,
          paddingHorizontal: 10,
          borderRadius: 15,
          fontSize: 12,
          color: '#1A1A1A',
          fontWeight: '600',
        },
        episodeDataControl: {
          flexDirection: 'row',
          gap: 10,
          justifyContent: 'center',
          marginBottom: 15,
        },
        episodeDataControlButton: { flex: 1, alignItems: 'center' },
        dropdownStyle: {
          backgroundColor: colorScheme === 'dark' ? '#333333' : '#F5F5F5',
          padding: 10,
          borderRadius: 8,
          borderWidth: 0,
        },
        dropdownContainerStyle: {
          width: 200,
          borderRadius: 8,
          backgroundColor: colorScheme === 'dark' ? '#333333' : '#F5F5F5',
          borderWidth: 0,
          elevation: 5,
        },
        dropdownItemTextStyle: { color: globalStyles.text.color, fontSize: 14 },
        dropdownItemContainerStyle: {
          borderRadius: 6,
          backgroundColor: colorScheme === 'dark' ? '#333333' : '#F5F5F5',
        },
        dropdownSelectedTextStyle: { color: globalStyles.text.color, fontSize: 14 },
        reloadPlayer: {
          backgroundColor: theme.colors.secondaryContainer,
          borderRadius: 8,
          padding: 12,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          marginHorizontal: 10,
          marginVertical: 10,
        },
        warningContainer: {
          backgroundColor: colorScheme === 'dark' ? '#333333' : '#FFF3E0',
          borderRadius: 8,
          padding: 15,
          marginHorizontal: 10,
          marginVertical: 5,
          borderLeftWidth: 4,
          borderLeftColor: '#FF9800',
        },
        warningText: {
          color: colorScheme === 'dark' ? '#FFB300' : '#E65100',
          fontSize: 13,
          lineHeight: 18,
        },
      }),
    [colorScheme, globalStyles.text.color, theme],
  );
}

export function useFullscreenControl(onEnterFullscreenFunc?: () => void) {
  const onEnterFullscreen = useRef(onEnterFullscreenFunc);
  onEnterFullscreen.current = onEnterFullscreenFunc;

  const [fullscreen, setFullscreen] = useState(false);

  const enterFullscreen = useCallback(
    (landscape?: OrientationType) => {
      onEnterFullscreen.current?.();
      if (landscape === undefined) {
        Orientation.lockToLandscape();
      } else {
        switch (landscape) {
          case 'LANDSCAPE-LEFT':
            Orientation.lockToLandscapeLeft();
            break;
          case 'LANDSCAPE-RIGHT':
            Orientation.lockToLandscapeRight();
            break;
          default:
            Orientation.lockToLandscape();
        }
      }
      SystemNavigationBar.fullScreen(true);
      SystemBars.setHidden(true);
      SystemNavigationBar.navigationHide();
      setFullscreen(true);
    },
    [onEnterFullscreen],
  );

  const exitFullscreen = useCallback(() => {
    SystemNavigationBar.fullScreen(false);
    SystemBars.setHidden(false);
    SystemNavigationBar.navigationShow();
    Orientation.lockToPortrait();
    setFullscreen(false);
  }, []);

  const orientationDidChange = useCallback(
    (orientation: OrientationType) => {
      Orientation.getAutoRotateState(state => {
        if (state) {
          if (orientation === 'PORTRAIT') {
            exitFullscreen();
          } else if (orientation !== 'UNKNOWN') {
            enterFullscreen(orientation);
          }
        }
      });
    },
    [enterFullscreen, exitFullscreen],
  );

  const willUnmountHandler = useCallback(() => {
    Orientation.lockToPortrait();
    SystemBars.setHidden(false);
    SystemNavigationBar.navigationShow();
  }, []);

  return {
    fullscreen,
    setFullscreen,
    enterFullscreen,
    exitFullscreen,
    orientationDidChange,
    willUnmountHandler,
  };
}

export function useBatteryAndClock(enableBatteryTimeInfo: string) {
  const [batteryLevel, setBatteryLevel] = useState(0);
  const [batteryTimeEnable, setBatteryTimeEnable] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let _batteryEvent: NodeJS.Timeout | null;
      if (enableBatteryTimeInfo === 'true') {
        const updateLevel = () => {
          const currentLevel = DeviceInfoModule.getBatteryLevel();
          setBatteryLevel(prev => (prev === currentLevel ? prev : currentLevel));
        };
        updateLevel();
        _batteryEvent = setInterval(updateLevel, 5000);
        setBatteryTimeEnable(true);
      }
      return () => {
        _batteryEvent && clearInterval(_batteryEvent);
        _batteryEvent = null;
      };
    }, [enableBatteryTimeInfo]),
  );

  const BatteryIcon = useCallback(() => {
    let iconName = 'battery-';
    const batteryLevelPercentage = Math.round(batteryLevel * 100);
    if (batteryLevelPercentage > 75) {
      iconName += '4';
    } else if (batteryLevelPercentage > 50) {
      iconName += '3';
    } else if (batteryLevelPercentage > 30) {
      iconName += '2';
    } else if (batteryLevelPercentage > 15) {
      iconName += '1';
    } else {
      iconName += '0';
    }
    type BattNumber = '0' | '1' | '2' | '3' | '4';
    return (
      <Icon
        name={iconName as `battery-${BattNumber}`}
        color={iconName === 'battery-0' ? 'red' : darkText}
      />
    );
  }, [batteryLevel]);

  return { batteryLevel, batteryTimeEnable, BatteryIcon };
}

export function useSynopsisControl(
  synopsisTextRef: AnimatedRef<Text>,
  showSynopsis: boolean,
  setShowSynopsis: React.Dispatch<React.SetStateAction<boolean>>,
) {
  const initialInfoContainerHeight = useRef<number>(null);
  const isInfoPressed = useRef(false);
  const [synopsisTextLength, setSynopsisTextLength] = useState(0);
  const [hadSynopsisMeasured, setHadSynopsisMeasured] = useState(false);
  const hadSynopsisMeasuredSharedValue = useSharedValue(false);
  const synopsisHeight = useRef(0);
  const infoContainerHeight = useSharedValue(0);
  const infoContainerOpacity = useSharedValue(1);

  const infoContainerStyle = useAnimatedStyle(() => {
    return {
      opacity: hadSynopsisMeasuredSharedValue.get() ? infoContainerOpacity.get() : 0,
      position: hadSynopsisMeasuredSharedValue.get() ? 'relative' : 'absolute',
      height: infoContainerHeight.get() === 0 ? 'auto' : infoContainerHeight.get(),
    };
  });

  const measureAndUpdateSynopsisLayout = useCallback(
    (fromFullscreen = false) => {
      if (fromFullscreen) {
        if (hadSynopsisMeasured && initialInfoContainerHeight.current === null) {
          synopsisTextRef.current?.measure((_x, _y, _width, height, _pageX, _pageY) => {
            initialInfoContainerHeight.current = height;
          });
        } else if (!hadSynopsisMeasured) {
          return setTimeout(() => {
            synopsisTextRef.current?.measure((_x, _y, _width, height, _pageX, _pageY) => {
              if (height === 0) return;
              setSynopsisTextLength(height / 20); // 20: lineheight
              synopsisHeight.current = height;
              setHadSynopsisMeasured(true);
              hadSynopsisMeasuredSharedValue.set(true);
            });
          }, 1000);
        }
      } else {
        if (hadSynopsisMeasured && initialInfoContainerHeight.current === null) {
          synopsisTextRef.current?.measure((_x, _y, _width, height, _pageX, _pageY) => {
            initialInfoContainerHeight.current = height;
          });
        } else if (!hadSynopsisMeasured) {
          synopsisTextRef.current?.measure((_x, _y, _width, height, _pageX, _pageY) => {
            if (height === 0) return;
            setSynopsisTextLength(height / 20); // 20: lineheight
            synopsisHeight.current = height;
            setHadSynopsisMeasured(true);
            hadSynopsisMeasuredSharedValue.set(true);
          });
        }
      }
    },
    [hadSynopsisMeasured, hadSynopsisMeasuredSharedValue, synopsisTextRef],
  );

  const onSynopsisPress = useCallback(async () => {
    if (!isInfoPressed.current) {
      infoContainerHeight.set(initialInfoContainerHeight.current!);
      await new Promise(res => setTimeout(res, 0));
    }
    isInfoPressed.current = true;
    if (showSynopsis) {
      infoContainerHeight.set(
        withTiming(initialInfoContainerHeight.current as number, { duration: 350 }, () => {
          runOnJS(setShowSynopsis)(false);
        }),
      );
    } else {
      setShowSynopsis(true);
      queueMicrotask(() => {
        infoContainerHeight.set(withTiming(synopsisHeight.current, { duration: 350 }));
      });
    }
  }, [infoContainerHeight, showSynopsis, setShowSynopsis]);

  const onSynopsisPressIn = useCallback(() => {
    infoContainerOpacity.set(withTiming(0.4, { duration: 100 }));
  }, [infoContainerOpacity]);

  const onSynopsisPressOut = useCallback(() => {
    infoContainerOpacity.set(withTiming(1, { duration: 100 }));
  }, [infoContainerOpacity]);

  return {
    synopsisTextLength,
    hadSynopsisMeasured,
    infoContainerStyle,
    measureAndUpdateSynopsisLayout,
    onSynopsisPress,
    onSynopsisPressIn,
    onSynopsisPressOut,
  };
}
