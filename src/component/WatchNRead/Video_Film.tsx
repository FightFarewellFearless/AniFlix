import Icon from '@react-native-vector-icons/fontawesome';
import { VideoView } from 'expo-video';
import React, {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  ToastAndroid,
  useColorScheme,
  View,
} from 'react-native';
import { SystemBars } from 'react-native-edge-to-edge';
import { DeviceInfoModule } from 'react-native-nitro-device-info';
import Orientation, { OrientationType } from 'react-native-orientation-locker';
import ReAnimated, {
  FadeInUp,
  FadeOutDown,
  useAnimatedRef,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SystemNavigationBar from 'react-native-system-navigation-bar';
import { runOnJS } from 'react-native-worklets';
import { TouchableOpacity } from '../misc/TouchableOpacityRNGH';

import useGlobalStyles, { darkText, lightText } from '../../assets/style';
import setHistory from '../../utils/historyControl';

import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button, useTheme } from 'react-native-paper';
import { useBackHandler } from '../../hooks/useBackHandler';
import { RootStackNavigator } from '../../types/navigation';
import { useKeyValueIfFocused } from '../../utils/DatabaseManager';
import DialogManager from '../../utils/dialogManager';
import { getFilmDetails } from '../../utils/scrapers/film';
import { throttle } from '../../utils/throttle';
import Skeleton from '../misc/Skeleton';
import VideoPlayer, { PlayerRef } from '../VideoPlayer';

type Props = NativeStackScreenProps<RootStackNavigator, 'Video_Film'>;

function Video_Film(props: Props) {
  const colorScheme = useColorScheme();
  const globalStyles = useGlobalStyles();
  const styles = useStyles();

  const enableBatteryTimeInfo = useKeyValueIfFocused('enableBatteryTimeInfo');

  const historyData = useRef(props.route.params.historyData);

  const [batteryLevel, setBatteryLevel] = useState(0);
  // const [showBatteryLevel, setShowBatteryLevel] = useState(false);
  const [showSynopsis, setShowSynopsis] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(props.route.params.data);
  const [batteryTimeEnable, setBatteryTimeEnable] = useState(false);

  const currentLink = useRef(props.route.params.link);
  const firstTimeLoad = useRef(true);
  const videoRef = useRef<VideoView>(null);
  const playerRef = useRef<PlayerRef>(null);

  const synopsisTextRef = useAnimatedRef<View>();

  const animeDetail = props.route.params.data;

  const updateHistory = useMemo(
    () =>
      throttle((currentTime: number, stateData: RootStackNavigator['Video_Film']['data']) => {
        if (Math.floor(currentTime) === 0) {
          return;
        }
        const additionalData = {
          resolution: undefined,
          lastDuration: currentTime,
        };
        setHistory(stateData, currentLink.current, true, additionalData, true);
        historyData.current = additionalData;
      }, 2000),
    [],
  );

  const abortController = useRef<AbortController | null>(null);
  if (abortController.current === null) {
    abortController.current = new AbortController();
  }

  const [isPaused, setIsPaused] = useState(false);

  const initialInfoContainerHeight = useRef<number>(null);
  const isInfoPressed = useRef(false);
  const [synopsisTextLength, setSynopsisTextLength] = useState(0);
  const [hadSynopsisMeasured, setHadSynopsisMeasured] = useState(false);
  const synopsisHeight = useRef(0);
  const infoContainerHeight = useSharedValue(0);
  const infoContainerOpacity = useSharedValue(1);
  const infoContainerStyle = useAnimatedStyle(() => {
    return {
      opacity: infoContainerOpacity.get(),
      height: infoContainerHeight.get() === 0 ? 'auto' : infoContainerHeight.get(),
    };
  });

  const enterFullscreen = useCallback((landscape?: OrientationType) => {
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
  }, []);

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

  // didMount and willUnmount
  useEffect(() => {
    Orientation.addDeviceOrientationListener(orientationDidChange);

    return () => {
      Orientation.removeDeviceOrientationListener(orientationDidChange);
      willUnmountHandler();
      abortController.current?.abort();
    };
  }, [orientationDidChange, willUnmountHandler]);

  // set header title
  useLayoutEffect(() => {
    props.navigation.setOptions({
      headerTitle: data.title,
      headerShown: !fullscreen,
    });
  }, [data, fullscreen, props.navigation]);

  // Battery level
  useEffect(() => {
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
  }, [enableBatteryTimeInfo]);

  // BackHandler event
  useBackHandler(
    useCallback(() => {
      if (!fullscreen) {
        willUnmountHandler();
        return false;
      } else {
        exitFullscreen();
        return true;
      }
    }, [exitFullscreen, fullscreen, willUnmountHandler]),
  );

  const getBatteryIconComponent = useCallback(() => {
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

  const handleProgress = useCallback(
    (currentTime: number) => {
      updateHistory(currentTime, data);
    },
    [updateHistory, data],
  );

  const episodeDataControl = useCallback(
    async (dataLink: string) => {
      if (loading) {
        return;
      }
      setLoading(true);
      const result = await getFilmDetails(dataLink, abortController.current?.signal).catch(err => {
        if (err.message === 'Aborted') {
          return;
        }
        const errMessage =
          err.message === 'Network Error'
            ? 'Permintaan gagal.\nPastikan kamu terhubung dengan internet'
            : 'Error tidak diketahui: ' + err.message;
        DialogManager.alert('Error', errMessage);
        setLoading(false);
      });
      if (result === undefined) return;
      if (result.type === 'detail')
        return DialogManager.alert('Error', 'Data episode dalam bentuk tidak terduga');
      if ('isError' in result) {
        DialogManager.alert(
          'Error',
          'Inisialisasi data movie gagal! Silahkan buka ulang aplikasi/reload/ketuk teks merah pada beranda untuk mencoba mengambil data yang diperlukan',
        );
      } else {
        setData(result);
        setHistory(result, dataLink, undefined, undefined, true);
      }
      setLoading(false);
      firstTimeLoad.current = false;
      historyData.current = undefined;
      currentLink.current = dataLink;
    },
    [loading],
  );

  const cancelLoading = useCallback(() => {
    abortController.current?.abort();
    setLoading(false);
    abortController.current = new AbortController();
  }, []);

  const handleVideoLoad = useCallback(() => {
    if (firstTimeLoad.current === false) {
      return;
    }
    firstTimeLoad.current = false;
    if (historyData.current === undefined || historyData.current.lastDuration === undefined) {
      return;
    }
    if (videoRef.current && videoRef.current.props.player) {
      playerRef.current?.skipTo(historyData.current.lastDuration);
    }
    ToastAndroid.show('Otomatis kembali ke durasi terakhir', ToastAndroid.SHORT);

    // DialogManager.alert('Perhatian', `
    // Fitur "lanjut menonton dari durasi terakhir" memiliki bug atau masalah.
    // Dan dinonaktifkan untuk sementara waktu, untuk melanjutkan menonton kamu bisa geser slider ke menit ${moment(historyData.current.lastDuration * 1000).format('mm:ss')}
    // `)
  }, []);

  useEffect(() => {
    if (isPaused) {
      videoRef.current?.props.player.pause();
    } else {
      videoRef.current?.props.player.play();
    }
  }, [isPaused]);

  const fullscreenUpdate = useCallback(
    (isFullscreen: boolean) => {
      if (isFullscreen) {
        exitFullscreen();
      } else {
        enterFullscreen();
      }
    },
    [enterFullscreen, exitFullscreen],
  );

  const measureAndUpdateSynopsisLayout = useCallback(
    (fromFullscreen = false) => {
      if (fromFullscreen) {
        if (hadSynopsisMeasured && initialInfoContainerHeight.current === null) {
          synopsisTextRef.current?.measure((_x, _y, _width, height, _pageX, _pageY) => {
            initialInfoContainerHeight.current = height;
          });
        } else if (!hadSynopsisMeasured) {
          // delay the measurement because if the layout is from fullscreen the width would be wrong
          return setTimeout(() => {
            synopsisTextRef.current?.measure((_x, _y, _width, height, _pageX, _pageY) => {
              setSynopsisTextLength(height / 20); // 20: lineheight
              synopsisHeight.current = height;
              setHadSynopsisMeasured(true);
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
            setSynopsisTextLength(height / 20); // 20: lineheight
            synopsisHeight.current = height;
            setHadSynopsisMeasured(true);
          });
        }
      }
    },
    [hadSynopsisMeasured, synopsisTextRef],
  );
  const initialRender = useRef(true);
  useEffect(() => {
    if (initialRender.current) {
      initialRender.current = false;
      return;
    }
    const mightBeTimeoutID = measureAndUpdateSynopsisLayout(true);
    return () => {
      clearTimeout(mightBeTimeoutID);
    };
  }, [fullscreen, measureAndUpdateSynopsisLayout]);
  useLayoutEffect(() => {
    measureAndUpdateSynopsisLayout();
  }, [
    animeDetail?.synopsis,
    animeDetail?.rating,
    animeDetail?.genres,
    measureAndUpdateSynopsisLayout,
  ]);

  const onSynopsisPress = useCallback(async () => {
    if (!isInfoPressed.current) {
      infoContainerHeight.set(initialInfoContainerHeight.current!);

      /* 
      wait for the next event loop,
      make sure the infoContainerHeight is set to initialInfoContainerHeight before starting animation.
      This is to prevent jumping animation in react-native-reanimated
      */
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
  }, [infoContainerHeight, showSynopsis]);

  const onSynopsisPressIn = useCallback(() => {
    infoContainerOpacity.set(withTiming(0.4, { duration: 100 }));
  }, [infoContainerOpacity]);

  const onSynopsisPressOut = useCallback(() => {
    infoContainerOpacity.set(withTiming(1, { duration: 100 }));
  }, [infoContainerOpacity]);

  const batteryAndClock = (
    <>
      {/* info baterai */}
      {fullscreen && batteryTimeEnable && (
        <View style={[styles.batteryInfo]} pointerEvents="none">
          {getBatteryIconComponent()}
          <Text style={{ color: darkText }}> {Math.round(batteryLevel * 100)}%</Text>
        </View>
      )}

      {/* info waktu/jam */}
      {fullscreen && batteryTimeEnable && (
        <View style={[styles.timeInfo]} pointerEvents="none">
          <TimeInfo />
        </View>
      )}
    </>
  );

  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1 }}>
      {/* Loading modal */}
      <LoadingModal setIsPaused={setIsPaused} isLoading={loading} cancelLoading={cancelLoading} />
      {/* VIDEO ELEMENT */}
      <View style={[fullscreen ? styles.fullscreen : styles.notFullscreen]}>
        <View
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: 'black',
            zIndex: 0,
            position: 'absolute',
          }}
        />
        <VideoPlayer
          // key={data.streamingLink}
          title={data.title}
          thumbnailURL={data.thumbnailUrl}
          streamingURL={data.streamingLink}
          subtitleURL={data.subtitleLink}
          style={{ flex: 1, zIndex: 1 }}
          videoRef={videoRef}
          ref={playerRef}
          fullscreen={fullscreen}
          onFullscreenUpdate={fullscreenUpdate}
          onDurationChange={handleProgress}
          onLoad={handleVideoLoad}
          batteryAndClock={batteryAndClock}
        />
      </View>
      {/* END OF VIDEO ELEMENT */}
      {/* 
        mengecek apakah sedang dalam keadaan fullscreen atau tidak
        jika ya, maka hanya menampilkan video saja 
       */}
      <ScrollView
        style={{ flex: 1, display: fullscreen ? 'none' : 'flex' }}
        contentContainerStyle={{ paddingBottom: insets.bottom }}>
        <Pressable
          style={[styles.container]}
          onPressIn={onSynopsisPressIn}
          onPressOut={onSynopsisPressOut}
          // onLayout={onSynopsisLayout}
          onPress={onSynopsisPress}
          disabled={synopsisTextLength < 3}>
          <Text style={[globalStyles.text, styles.infoTitle]}>{data.title}</Text>

          {animeDetail !== undefined ? (
            <ReAnimated.Text
              ref={synopsisTextRef}
              style={[
                globalStyles.text,
                styles.infoSinopsis,
                infoContainerStyle,
                {
                  position: hadSynopsisMeasured ? 'relative' : 'absolute',
                  opacity: hadSynopsisMeasured ? undefined : 0,
                },
              ]}
              numberOfLines={!showSynopsis && hadSynopsisMeasured ? 2 : undefined}>
              {animeDetail?.synopsis || 'Tidak ada sinopsis'}
            </ReAnimated.Text>
          ) : (
            <Skeleton stopOnBlur={false} width={150} height={20} />
          )}
          {!hadSynopsisMeasured && animeDetail !== undefined && (
            <Skeleton stopOnBlur={false} width={150} height={20} />
          )}

          <View style={[styles.infoGenre]}>
            {animeDetail === undefined ? (
              <View style={{ gap: 5, flexDirection: 'row' }}>
                <Skeleton stopOnBlur={false} width={50} height={20} />
                <Skeleton stopOnBlur={false} width={50} height={20} />
                <Skeleton stopOnBlur={false} width={50} height={20} />
              </View>
            ) : (
              animeDetail.genres.map(genre => (
                <Text key={genre} style={[globalStyles.text, styles.genre]}>
                  {genre}
                </Text>
              ))
            )}
          </View>

          <View style={styles.infoData}>
            <Text
              style={[
                globalStyles.text,
                styles.status,
                {
                  backgroundColor: animeDetail?.next || animeDetail?.prev ? 'green' : 'red',
                },
              ]}>
              {animeDetail?.next || animeDetail?.prev ? 'TV Series' : 'Film'}
            </Text>
            <Text style={[{ color: lightText }, styles.releaseYear]}>
              <Icon name="calendar" color={styles.releaseYear.color} /> {animeDetail?.releaseDate}
            </Text>
            <Text style={[globalStyles.text, styles.rating]}>
              <Icon name="star" color="black" /> {animeDetail?.rating}
            </Text>
          </View>

          {synopsisTextLength >= 3 && (
            <View style={{ alignItems: 'center', marginTop: 3 }}>
              {showSynopsis ? (
                <Icon
                  name="chevron-up"
                  size={20}
                  color={colorScheme === 'dark' ? 'white' : 'black'}
                />
              ) : (
                <Icon
                  name="chevron-down"
                  size={20}
                  color={colorScheme === 'dark' ? 'white' : 'black'}
                />
              )}
            </View>
          )}
        </Pressable>

        {(data.next || data.prev) && (
          <View style={[styles.container, { marginTop: 10, gap: 10 }]}>
            <View style={[styles.episodeDataControl]}>
              <Button
                mode="contained-tonal"
                icon="arrow-left"
                key="prev"
                disabled={!data.prev}
                style={[styles.episodeDataControlButton]}
                onPress={async () => {
                  await episodeDataControl(data.prev as string); // ignoring the undefined type because we already have the button disabled
                }}>
                Sebelumnya
              </Button>

              <Button
                mode="contained-tonal"
                icon="arrow-right"
                key="next"
                disabled={!data.next}
                style={[styles.episodeDataControlButton]}
                contentStyle={{ flexDirection: 'row-reverse' }}
                onPress={async () => {
                  await episodeDataControl(data.next as string); // ignoring the undefined type because we already have the button disabled
                }}>
                Selanjutnya
              </Button>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function LoadingModal({
  isLoading,
  cancelLoading,
  setIsPaused,
}: {
  isLoading: boolean;
  cancelLoading: () => void;
  setIsPaused: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const globalStyles = useGlobalStyles();
  const styles = useStyles();
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
          <ActivityIndicator size={'large'} />
          <Text style={globalStyles.text}>Tunggu sebentar, sedang mengambil data...</Text>
        </ReAnimated.View>
      </View>
    )
  );
}

function TimeInfo() {
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

  useEffect(() => {
    changeTime();
    const interval = setInterval(changeTime, 1_000);
    return () => {
      clearInterval(interval);
    };
  }, [changeTime, time]);
  return <Text style={{ color: '#dadada' }}>{time}</Text>;
}

function useStyles() {
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
        fullscreen: {
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
        },
        notFullscreen: {
          position: 'relative',
          aspectRatio: 16 / 9,
          backgroundColor: '#000',
        },
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
        episodeDataControlButton: {
          flex: 1,
          alignItems: 'center',
        },
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
        dropdownItemTextStyle: {
          color: globalStyles.text.color,
          fontSize: 14,
        },
        dropdownItemContainerStyle: {
          borderRadius: 6,
          backgroundColor: colorScheme === 'dark' ? '#333333' : '#F5F5F5',
        },
        dropdownSelectedTextStyle: {
          color: globalStyles.text.color,
          fontSize: 14,
        },
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
export default memo(Video_Film);
