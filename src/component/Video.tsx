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
  Alert,
  BackHandler,
  EmitterSubscription,
  NativeEventEmitter,
  NativeModules,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  ToastAndroid,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import DeviceInfo from 'react-native-device-info';
import { Dropdown } from '@pirles/react-native-element-dropdown';
import Orientation, { OrientationType } from 'react-native-orientation-locker';
import ReAnimated, {
  runOnJS,
  StretchInX,
  StretchOutX,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import SystemNavigationBar from 'react-native-system-navigation-bar';
import Icon from 'react-native-vector-icons/FontAwesome';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import url from 'url';
const deviceInfoEmitter = new NativeEventEmitter(NativeModules.RNDeviceInfo);

import useGlobalStyles, { darkText, lightText } from '../assets/style';
import useDownloadAnimeFunction from '../utils/downloadAnime';
import setHistory from '../utils/historyControl';
import throttleFunction from '../utils/throttleFunction';

import { StackActions } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import WebView from 'react-native-webview';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../misc/reduxStore';
import { AniDetail } from '../types/anime';
import { RootStackNavigator } from '../types/navigation';
import Anime_Whitelist from '../utils/Anime_Whitelist';
import AnimeAPI from '../utils/AnimeAPI';
import { getMovieDetail, getRawDataIfAvailable } from '../utils/animeMovie';
import deviceUserAgent from '../utils/deviceUserAgent';
import VideoPlayer from './VideoPlayer';

import { Buffer } from 'buffer/';
import cheerio from 'cheerio';
import { VideoView } from 'expo-video';
import Skeleton from './misc/Skeleton';

function useBackHandler(handler: () => boolean) {
  useEffect(() => {
    const event = BackHandler.addEventListener('hardwareBackPress', handler);

    return () => {
      event.remove();
    };
  }, [handler]);
}

type Props = StackScreenProps<RootStackNavigator, 'Video'>;

const defaultLoadingGif =
  'https://cdn.dribbble.com/users/2973561/screenshots/5757826/loading__.gif';

function Video(props: Props) {
  const colorScheme = useColorScheme();

  const globalStyles = useGlobalStyles();
  const styles = useStyles();

  const enableBatteryTimeInfo = useSelector(
    (state: RootState) => state.settings.enableBatteryTimeInfo,
  );
  const history = useSelector((state: RootState) => state.settings.history);

  const dispatchSettings = useDispatch<AppDispatch>();

  const historyData = useRef(props.route.params.historyData);

  const [batteryLevel, setBatteryLevel] = useState(0);
  // const [showBatteryLevel, setShowBatteryLevel] = useState(false);
  const [showSynopsis, setShowSynopsis] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(props.route.params.data);
  const [batteryTimeEnable, setBatteryTimeEnable] = useState(false);

  const downloadSource = useRef<string[]>([]);
  const currentLink = useRef(props.route.params.link);
  const firstTimeLoad = useRef(true);
  const videoRef = useRef<VideoView>(null);
  const webviewRef = useRef<WebView>(null);
  const embedInformationRef = useRef<View>(null);

  const synopsisTextRef = useRef<View>(null);

  const [animeDetail, setAnimeDetail] = useState<
    | (
        | (Awaited<ReturnType<typeof getMovieDetail>> & { status: 'Movie'; releaseYear: string })
        | Omit<AniDetail, 'episodeList'>
      )
    | undefined
  >(undefined);

  useEffect(() => {
    if (props.route.params.isMovie) {
      getMovieDetail(data.episodeData.animeDetail).then(detail => {
        setAnimeDetail({
          ...detail,
          rating: detail.rating,
          releaseYear: detail.updateDate,
          status: 'Movie',
        });
      });
      return;
    }
    AnimeAPI.fromUrl(data.episodeData.animeDetail, undefined, undefined, true).then(detail => {
      if (detail === 'Unsupported') return;
      if (detail.type === 'animeDetail') {
        if (
          detail.genres.includes('') &&
          !Anime_Whitelist.list.includes(data.episodeData.animeDetail)
        ) {
          props.navigation.dispatch(
            StackActions.replace('Blocked', {
              title: detail.title,
              url: data.episodeData.animeDetail,
              data: detail,
            }),
          );
          return;
        }
        setAnimeDetail(detail);
      }
    });
  }, [data.episodeData.animeDetail, props.navigation, props.route.params.isMovie]);

  const downloadAnimeFunction = useDownloadAnimeFunction();

  // eslint-disable-next-line react-compiler/react-compiler
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const updateHistoryThrottle = useCallback(
    throttleFunction(
      (
        currentTime: number,
        stateData: RootStackNavigator['Video']['data'],
        settContext: string,
        dispatchContext: typeof dispatchSettings,
        isMovie?: boolean,
      ) => {
        if (Math.floor(currentTime) === 0) {
          return;
        }
        const additionalData = {
          resolution: stateData.resolution,
          lastDuration: currentTime,
        };
        setHistory(
          stateData,
          currentLink.current,
          true,
          additionalData,
          settContext,
          dispatchContext,
          isMovie,
        );
        historyData.current = additionalData;
      },
      3000,
    ),
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
  const synopsisHeight = useRef(0);
  const infoContainerHeight = useSharedValue(0); // useSharedValue
  const infoContainerOpacity = useSharedValue(1); // useSharedValue
  const infoContainerStyle = useAnimatedStyle(() => {
    return {
      opacity: infoContainerOpacity.get(),
      height: infoContainerHeight.get() === 0 ? 'auto' : infoContainerHeight.get(),
    };
  });

  const enterFullscreen = useCallback((landscape?: OrientationType) => {
    // videoRef.current?.presentFullscreenPlayer();
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
    StatusBar.setHidden(true);
    SystemNavigationBar.navigationHide();
    setFullscreen(true);
  }, []);

  const exitFullscreen = useCallback(() => {
    SystemNavigationBar.fullScreen(false);
    StatusBar.setHidden(false);
    SystemNavigationBar.navigationShow();
    Orientation.lockToPortrait();
    setFullscreen(false);
  }, []);

  const orientationDidChange = useCallback(
    (orientation: OrientationType) => {
      if (orientation === 'PORTRAIT') {
        exitFullscreen();
      } else if (orientation !== 'UNKNOWN') {
        enterFullscreen(orientation);
      }
    },
    [enterFullscreen, exitFullscreen],
  );

  const willUnmountHandler = useCallback(() => {
    Orientation.removeDeviceOrientationListener(orientationDidChange);
    Orientation.lockToPortrait();
    StatusBar.setHidden(false);
    SystemNavigationBar.navigationShow();
  }, [orientationDidChange]);

  // didMount and willUnmount
  useEffect(() => {
    Orientation.addDeviceOrientationListener(orientationDidChange);

    return () => {
      willUnmountHandler();
      abortController.current?.abort();
    };
    // eslint-disable-next-line react-compiler/react-compiler
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // set header title
  useEffect(() => {
    props.navigation.setOptions({
      headerTitle: data.title,
      headerShown: !fullscreen,
    });
  }, [data, fullscreen, props.navigation]);

  // Battery level
  useEffect(() => {
    let _batteryEvent: EmitterSubscription | null;
    if (enableBatteryTimeInfo === 'true') {
      DeviceInfo.getBatteryLevel().then(async batteryLevels => {
        setBatteryLevel(batteryLevels);
        _batteryEvent = deviceInfoEmitter.addListener(
          'RNDeviceInfo_batteryLevelDidChange',
          async batteryLvel => {
            if (batteryLevel !== batteryLvel) {
              onBatteryStateChange({ batteryLevel: batteryLvel });
            }
          },
        );
        setBatteryTimeEnable(true);
      });
    }
    return () => {
      _batteryEvent && _batteryEvent.remove();
      _batteryEvent = null;
    };
  }, [batteryLevel, enableBatteryTimeInfo]);

  const onHardwareBackPress = useCallback(
    (isFullsc: boolean) => {
      if (!isFullsc) {
        willUnmountHandler();
        return false;
      } else {
        exitFullscreen();
        return true;
      }
    },
    [exitFullscreen, willUnmountHandler],
  );

  // BackHandler event
  useEffect(() => {
    const backHandlerEvent = BackHandler.addEventListener('hardwareBackPress', () =>
      onHardwareBackPress(fullscreen),
    );
    return () => {
      backHandlerEvent.remove();
    };
  }, [fullscreen, onHardwareBackPress]);

  const setResolution = useCallback(
    async (res: string, resolution: string) => {
      if (loading) {
        return;
      }
      setLoading(true);
      let resultData: string | undefined | { canceled: boolean } | { error: boolean };
      const signal = abortController.current?.signal;
      if ('type' in data) {
        resultData = await AnimeAPI.reqResolution(
          res,
          data.reqNonceAction,
          data.reqResolutionWithNonceAction,
          signal,
        ).catch(err => {
          if (err.message === 'canceled') {
            return { canceled: true };
          }
          const errMessage =
            err.message === 'Network Error'
              ? 'Permintaan gagal.\nPastikan kamu terhubung dengan internet'
              : 'Error tidak diketahui: ' + err.message;
          Alert.alert('Error', errMessage);
          setLoading(false);
          return { error: true };
        });
      } else {
        const rawData = await getRawDataIfAvailable({ title: resolution, url: res }, signal).catch(
          err => {
            if (err.message === 'canceled') {
              return { canceled: true };
            } else {
              throw err;
            }
          },
        );
        if (rawData === false) {
          resultData = cheerio
            .load(Buffer.from(res, 'base64').toString('utf8'))('iframe')
            .attr('src')!;
        } else {
          resultData = rawData;
        }
      }
      if (resultData === undefined) {
        setLoading(false);
        Alert.alert('Ganti resolusi gagal', 'Gagal mengganti resolusi karena data kosong!');
        return;
      }
      if (typeof resultData !== 'string' && ('canceled' in resultData || 'error' in resultData)) {
        return;
      }
      const isWebviewNeeded = await fetch(resultData, {
        headers: {
          'User-Agent': deviceUserAgent,
          ...(resultData.includes('mp4upload') ? { Referer: 'https://www.mp4upload.com/' } : {}),
        },
        method: 'HEAD',
        signal,
      })
        .catch(() => {})
        .then(response => {
          return !(
            response?.headers.get('content-type')?.includes('video') ||
            response?.headers.get('content-type')?.includes('octet-stream')
          );
        });
      if (signal?.aborted) return;
      setData(old => {
        return {
          ...old,
          streamingType: isWebviewNeeded ? 'embed' : 'raw',
          streamingLink: resultData,
          resolution,
        };
      });
      setLoading(false);
      firstTimeLoad.current = true;
    },
    [data, loading],
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
    return (
      <Icon
        name={iconName}
        style={{
          color: iconName === 'battery-0' ? 'red' : darkText,
        }}
      />
    );
  }, [batteryLevel]);

  const onBatteryStateChange = ({
    batteryLevel: currentBatteryLevel,
  }: {
    batteryLevel: number;
  }) => {
    setBatteryLevel(currentBatteryLevel);
  };

  const downloadAnime = useCallback(async () => {
    if (data.streamingType === 'embed') {
      return ToastAndroid.show(
        'Jenis format ini tidak mendukung fitur download',
        ToastAndroid.SHORT,
      );
    }
    const source = data.streamingLink;
    const resolution = data.resolution;
    await downloadAnimeFunction(
      source,
      downloadSource.current,
      data.title,
      resolution ?? '',
      undefined,
      () => {
        downloadSource.current = [...downloadSource.current, source];
        ToastAndroid.show('Sedang mendownload...', ToastAndroid.SHORT);
      },
    );
  }, [data, downloadAnimeFunction]);

  const handleProgress = useCallback(
    (currentTime: number) => {
      updateHistoryThrottle(
        currentTime,
        data,
        history,
        dispatchSettings,
        props.route.params.isMovie,
      );
    },
    [updateHistoryThrottle, data, history, dispatchSettings, props.route.params.isMovie],
  );

  const episodeDataControl = useCallback(
    async (dataLink: string) => {
      if (loading) {
        return;
      }
      setLoading(true);
      const result = await AnimeAPI.fromUrl(
        dataLink,
        undefined,
        undefined,
        undefined,
        abortController.current?.signal,
      ).catch(err => {
        if (err.message === 'Silahkan selesaikan captcha') {
          setLoading(false);
          return;
        }
        if (err.message === 'canceled') {
          return;
        }
        const errMessage =
          err.message === 'Network Error'
            ? 'Permintaan gagal.\nPastikan kamu terhubung dengan internet'
            : 'Error tidak diketahui: ' + err.message;
        Alert.alert('Error', errMessage);
        setLoading(false);
      });
      if (result === undefined) {
        return;
      }
      if (result === 'Unsupported') {
        Alert.alert('Tidak didukung!', 'Anime yang kamu tuju tidak memiliki data yang didukung!');
        setLoading(false);
        return;
      }

      if (result.type !== 'animeStreaming') {
        setLoading(false);
        Alert.alert(
          'Kesalahan!!',
          'Hasil perminataan tampaknya bukan data yang diharapkan, sepertinya ada kesalahan yang tidak diketahui.',
        );
        return;
      }

      setData(result);
      setLoading(false);
      firstTimeLoad.current = false;
      historyData.current = undefined;
      currentLink.current = dataLink;

      setHistory(result, dataLink, undefined, undefined, history, dispatchSettings);
    },
    [loading, history, dispatchSettings],
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
      videoRef.current.props.player.currentTime = historyData.current.lastDuration;
    }
    ToastAndroid.show('Otomatis kembali ke durasi terakhir', ToastAndroid.SHORT);

    // Alert.alert('Perhatian', `
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

  useLayoutEffect(() => {
    synopsisTextRef.current?.measure((_x, _y, _width, height, _pageX, _pageY) => {
      initialInfoContainerHeight.current = height;
      // infoContainerHeight.setValue(height);
    });
    // eslint-disable-next-line prettier/prettier
  }, [
    animeDetail?.synopsis,
    animeDetail?.rating,
    animeDetail?.genres,
  ]);

  const onSynopsisPress = useCallback(async () => {
    if (!isInfoPressed.current) {
      infoContainerHeight.set(initialInfoContainerHeight.current!);
      // infoContainerHeight.setValue(initialInfoContainerHeight.current!);

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
      // Animated.timing(infoContainerHeight, {
      //   toValue: initialInfoContainerHeight.current!,
      //   duration: 350,
      //   useNativeDriver: false,
      // }).start(({ finished }) => {
      //   if (finished) setShowSynopsis(false);
      // });
    } else {
      setShowSynopsis(true);
      queueMicrotask(() => {
        infoContainerHeight.set(withTiming(synopsisHeight.current, { duration: 350 }));
        // Animated.timing(infoContainerHeight, {
        //   toValue: synopsisHeight.current,
        //   duration: 350,
        //   useNativeDriver: false,
        // }).start();
      });
    }
  }, [infoContainerHeight, showSynopsis]);

  const onSynopsisPressIn = useCallback(() => {
    infoContainerOpacity.set(withTiming(0.4, { duration: 100 }));
    // Animated.timing(infoContainerOpacity, {
    //   toValue: 0.4,
    //   duration: 100,
    //   useNativeDriver: false,
    // }).start();
  }, [infoContainerOpacity]);

  const onSynopsisPressOut = useCallback(() => {
    infoContainerOpacity.set(withTiming(1, { duration: 100 }));
    // Animated.timing(infoContainerOpacity, {
    //   toValue: 1,
    //   duration: 100,
    //   useNativeDriver: false,
    // }).start();
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

  const resolutionDropdownValue = useMemo(() => {
    return data.resolution === undefined
      ? undefined
      : {
          label: data.resolution,
          value:
            data.resolutionRaw?.[
              data.resolutionRaw.findIndex(e => e.resolution === data.resolution)
            ],
        };
  }, [data.resolution, data.resolutionRaw]);

  const resolutionDropdownData = useMemo(() => {
    return Object.entries(data.resolutionRaw)
      .filter(z => z[1] !== undefined)
      .map(z => {
        return { label: z[1].resolution, value: z[1] };
      });
  }, [data.resolutionRaw]);

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
        {
          // mengecek apakah video tersedia
          data.streamingType === 'raw' ? (
            <VideoPlayer
              key={data.streamingLink}
              title={data.title}
              streamingURL={data.streamingLink}
              style={{ flex: 1, zIndex: 1 }}
              // @ts-expect-error
              videoRef={videoRef}
              fullscreen={fullscreen}
              onFullscreenUpdate={fullscreenUpdate}
              onDurationChange={handleProgress}
              onLoad={handleVideoLoad}
              headers={
                props.route.params.isMovie && data.streamingLink.includes('mp4upload')
                  ? { Referer: 'https://www.mp4upload.com/' }
                  : undefined
              }
              batteryAndClock={batteryAndClock}
            />
          ) : data.streamingType === 'embed' ? (
            <WebView
              style={{ flex: 1, zIndex: 1 }}
              key={data.streamingLink}
              setSupportMultipleWindows={false}
              onShouldStartLoadWithRequest={navigator => {
                const res =
                  navigator.url.includes(url.parse(data.streamingLink).host as string) ||
                  navigator.url.includes(defaultLoadingGif);
                if (!res) {
                  webviewRef.current?.stopLoading();
                }
                return res;
              }}
              source={{
                ...(data.resolution?.includes('lokal')
                  ? {
                      html: `<iframe src="${data.streamingLink}" style="width: 100vw; height: 100vh;" allowFullScreen>`,
                    }
                  : { uri: data.streamingLink }),
                baseUrl: `https://${url.parse(data.streamingLink).host}`,
              }}
              userAgent={data.resolution?.includes('lokal') ? undefined : deviceUserAgent}
              originWhitelist={['*']}
              allowsFullscreenVideo={true}
              injectedJavaScript={`
                window.alert = function() {}; // Disable alerts
                window.confirm = function() {}; // Disable confirms
                window.prompt = function() {}; // Disable prompts
                window.open = function() {}; // Disable opening new windows
              `}
            />
          ) : (
            <Text style={{ color: 'white' }}>Video tidak tersedia</Text>
          )
        }
        {data.streamingType === 'embed' && batteryAndClock}
      </View>
      {/* END OF VIDEO ELEMENT */}
      {
        // mengecek apakah sedang dalam keadaan fullscreen atau tidak
        // jika ya, maka hanya menampilkan video saja
        !fullscreen && (
          <ScrollView style={{ flex: 1 }}>
            {/* movie information */}
            {props.route.params.isMovie && (
              <View style={{ backgroundColor: '#fde24b', marginVertical: 5 }}>
                <Icon name="film" color={lightText} size={26} style={{ alignSelf: 'center' }} />
                <Text
                  style={{
                    color: lightText,
                    textAlign: 'center',
                    fontSize: 14,
                    fontWeight: 'bold',
                  }}>
                  Perhatian!
                </Text>
                <Text style={{ color: lightText }}>
                  Tipe data movie masih dalam tahap pengembangan dan eksperimental, jika kamu
                  mengalami masalah menonton, silahkan ganti resolusi/server
                </Text>
              </View>
            )}
            {/* acefile embed information */}
            {(data.resolution?.includes('acefile') || data.resolution?.includes('video')) &&
              data.streamingType === 'embed' && (
                <View style={{ backgroundColor: '#74fd4b', marginVertical: 5 }}>
                  <Icon name="server" color={lightText} size={26} style={{ alignSelf: 'center' }} />
                  <Text
                    style={{
                      color: lightText,
                      textAlign: 'center',
                      fontSize: 14,
                      fontWeight: 'bold',
                    }}>
                    AceFile
                  </Text>
                  <Text style={{ color: lightText }}>
                    Tampaknya server AceFile untuk resolusi ini mengalami masalah. Terkadang server
                    membutuhkan beberapa waktu untuk memproses data, silahkan coba lagi. Jika
                    masalah berlanjut silahkan ganti server atau resolusi lain.
                  </Text>
                </View>
              )}
            {/* embed player information */}
            {data.streamingType === 'embed' && (
              <View ref={embedInformationRef}>
                <View
                  style={{
                    backgroundColor: '#c9c900',
                    marginVertical: 5,
                  }}>
                  <TouchableOpacity
                    style={{ alignSelf: 'flex-end' }}
                    onPress={() => {
                      embedInformationRef.current?.setNativeProps({ display: 'none' });
                    }}>
                    <Icon name="close" color={lightText} size={26} />
                  </TouchableOpacity>
                  <Icon
                    name="lightbulb-o"
                    color={lightText}
                    size={26}
                    style={{ alignSelf: 'center' }}
                  />
                  <Text style={{ color: lightText }}>
                    Kamu saat ini menggunakan video player pihak ketiga dikarenakan data dengan
                    format yang biasa digunakan tidak tersedia. Fitur ini masih eksperimental.{'\n'}
                    Kamu mungkin akan melihat iklan di dalam video.{'\n'}
                    Fitur download, ganti resolusi, dan fullscreen tidak akan bekerja dengan normal.
                    {'\n'}
                    Jika menemui masalah seperti video berubah menjadi putih, silahkan reload video
                    player!
                  </Text>
                </View>
                <View
                  style={{
                    marginTop: 5,
                    backgroundColor: '#c99a00',
                  }}>
                  <MaterialCommunityIcons
                    name="screen-rotation"
                    color={lightText}
                    size={26}
                    style={{ alignSelf: 'center' }}
                  />
                  <Text style={{ color: lightText }}>
                    Untuk masuk ke mode fullscreen silahkan miringkan ponsel ke mode landscape
                  </Text>
                </View>
              </View>
            )}
            {/* embed reload button */}
            {data.streamingType === 'embed' && (
              <TouchableOpacity
                style={styles.reloadPlayer}
                onPress={async () => {
                  if (data.streamingLink === '') return;
                  const streamingLink = data.streamingLink;
                  setData(datas => {
                    return {
                      ...datas,
                      streamingLink: '',
                    };
                  });
                  await new Promise(res => setTimeout(res, 500));
                  setData(datas => {
                    return {
                      ...datas,
                      streamingLink,
                    };
                  });
                }}>
                <Icon name="refresh" color={darkText} size={15} style={{ alignSelf: 'center' }} />
                <Text style={{ color: darkText }}>Reload video player</Text>
              </TouchableOpacity>
            )}
            <Pressable
              style={[styles.container]}
              onPressIn={onSynopsisPressIn}
              onPressOut={onSynopsisPressOut}
              // onLayout={onSynopsisLayout}
              onPress={onSynopsisPress}
              disabled={synopsisTextLength <= 2}>
              <Text style={[globalStyles.text, styles.infoTitle]}>{data.title}</Text>

              <ReAnimated.Text
                ref={synopsisTextRef}
                style={[
                  globalStyles.text,
                  styles.infoSinopsis,
                  infoContainerStyle,
                  // {
                  //   opacity: infoContainerOpacity,
                  //   height:
                  //     // @ts-ignore
                  //     infoContainerHeight.__getValue() === 0 || synopsisTextLength <= 2
                  //       ? 'auto'
                  //       : infoContainerHeight,
                  // },
                ]}
                numberOfLines={!showSynopsis ? 2 : undefined}
                onTextLayout={e => {
                  setSynopsisTextLength(e.nativeEvent.lines.length);
                  synopsisHeight.current = e.nativeEvent.lines
                    // .slice(2)
                    .reduce((prev, curr) => prev + curr.height, 0);
                }}>
                {animeDetail === undefined ? (
                  <Skeleton width={150} height={20} />
                ) : (
                  animeDetail?.synopsis || 'Tidak ada sinopsis'
                )}
              </ReAnimated.Text>

              <View style={[styles.infoGenre]}>
                {animeDetail === undefined ? (
                  <View style={{ gap: 5, flexDirection: 'row' }}>
                    <Skeleton width={50} height={20} />
                    <Skeleton width={50} height={20} />
                    <Skeleton width={50} height={20} />
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
                      backgroundColor:
                        animeDetail?.status === 'Completed' || animeDetail?.status === 'Movie'
                          ? 'green'
                          : 'red',
                    },
                  ]}>
                  {animeDetail?.status}
                </Text>
                <Text style={[{ color: lightText }, styles.releaseYear]}>
                  <Icon name="calendar" color={lightText} /> {animeDetail?.releaseYear}
                </Text>
                <Text style={[globalStyles.text, styles.rating]}>
                  <Icon name="star" color="black" /> {animeDetail?.rating}
                </Text>
              </View>

              {synopsisTextLength > 2 && (
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

            <View style={[styles.container, { marginTop: 10, gap: 10 }]}>
              {data.episodeData && (
                <View style={[styles.episodeDataControl]}>
                  <TouchableOpacity
                    key="prev"
                    disabled={!data.episodeData.previous}
                    style={[
                      styles.episodeDataControlButton,
                      {
                        backgroundColor: data.episodeData.previous ? '#00ccff' : '#525252',
                        marginRight: 5,
                      },
                    ]}
                    onPress={() => {
                      episodeDataControl(data.episodeData?.previous as string); // ignoring the undefined type because we already have the button disabled
                    }}>
                    <Text style={[globalStyles.text, { fontWeight: 'bold', color: 'black' }]}>
                      <Icon name="arrow-left" size={18} color="black" /> Episode sebelumnya
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    key="next"
                    disabled={!data.episodeData.next}
                    style={[
                      styles.episodeDataControlButton,
                      {
                        backgroundColor: data.episodeData.next ? '#00ccff' : '#525252',
                      },
                    ]}
                    onPress={() => {
                      episodeDataControl(data.episodeData?.next as string); // ignoring the undefined type because we already have the button disabled
                    }}>
                    <Text style={[globalStyles.text, { fontWeight: 'bold', color: 'black' }]}>
                      Episode selanjutnya <Icon name="arrow-right" size={18} color="black" />
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
              <View style={{ maxWidth: '50%' }}>
                <Dropdown
                  value={resolutionDropdownValue}
                  placeholder="Pilih resolusi"
                  data={resolutionDropdownData}
                  valueField="value"
                  labelField="label"
                  onChange={val => {
                    setResolution(val.value.dataContent, val.label);
                  }}
                  style={styles.dropdownStyle}
                  containerStyle={styles.dropdownContainerStyle}
                  itemTextStyle={styles.dropdownItemTextStyle}
                  itemContainerStyle={styles.dropdownItemContainerStyle}
                  activeColor="#16687c"
                  selectedTextStyle={styles.dropdownSelectedTextStyle}
                  placeholderStyle={{ color: globalStyles.text.color }}
                  autoScroll
                  dropdownPosition="top"
                />
              </View>
            </View>

            {data.resolution?.includes('pogo') && (
              <Text style={[globalStyles.text, { color: '#ff6600', fontWeight: 'bold' }]}>
                Kamu menggunakan server pogo!, sangat tidak disarankan untuk skip/seek/menggeser
                menit dikarenakan akan menyebabkan loading yang sangat lama dan kemungkinan akan
                menghabiskan kuota data kamu. Disarankan untuk mengunduh/download video ini lewat
                tombol dibawah dan menontonnya saat proses download sudah selesai secara offline!
              </Text>
            )}

            {data.resolution?.includes('lokal') && (
              <Text style={[globalStyles.text, { color: '#ff6600', fontWeight: 'bold' }]}>
                Kamu menggunakan server "lokal". Perlu di ingat server ini tidak mendukung pemutaran
                melalui aplikasi dan akan menggunakan WebView untuk memutar video melalui server
                ini, jadi fitur download dan "lanjut dari histori" tidak akan bekerja ketika kamu
                menggunakan server "lokal".{'\n'}
                Harap gunakan server ini sebagai alternatif akhir jika server lain tidak berfungsi.
              </Text>
            )}

            <TouchableOpacity style={[styles.downloadButton]} onPress={downloadAnime}>
              <Icon name="download" size={23} color={darkText} />
              <Text style={{ color: darkText }}>Download</Text>
            </TouchableOpacity>
          </ScrollView>
        )
      }
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
  useBackHandler(() => {
    if (isLoading) {
      cancelLoading();
    }
    return isLoading;
  });

  useEffect(() => {
    if (isLoading) {
      setIsPaused(() => true);
    } else {
      setIsPaused(() => false);
    }
  }, [isLoading, setIsPaused]);

  const entering = useMemo(() => StretchInX.duration(300), []);
  const exiting = useMemo(() => StretchOutX.duration(300), []);

  return (
    isLoading && (
      <View style={styles.modalContainer}>
        <ReAnimated.View entering={entering} exiting={exiting} style={styles.modalContent}>
          <TouchableOpacity
            onPress={cancelLoading}
            style={{ position: 'absolute', top: 5, right: 5 }} //rngh
          >
            <Icon name="close" size={28} style={{ color: 'red' }} />
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
          backgroundColor: '#0000008a',
          justifyContent: 'center',
          alignItems: 'center',
        },
        modalContent: {
          flex: 0.15,
          minWidth: 300,
          minHeight: 80,
          backgroundColor: colorScheme === 'dark' ? '#2c2c2c' : '#f0f0f0',
          borderColor: 'gold',
          borderWidth: 1,
          alignContent: 'center',
          alignSelf: 'center',
          justifyContent: 'center',
          alignItems: 'center',
        },
        batteryInfo: {
          position: 'absolute',
          right: 10,
          top: 10,
          flexDirection: 'row',
          alignItems: 'center',
          padding: 3,
          borderRadius: 7,
          backgroundColor: '#00000085',
          zIndex: 1,
        },
        timeInfo: {
          position: 'absolute',
          left: 10,
          top: 10,
          flexDirection: 'row',
          alignItems: 'center',
          padding: 3,
          borderRadius: 7,
          backgroundColor: '#00000085',
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
          flex: 0.44,
        },
        dlbtn: {
          flex: 1,
          flexDirection: 'row',
        },
        container: {
          backgroundColor: colorScheme === 'dark' ? '#1d1d1d' : '#ebebeb',
          elevation: colorScheme === 'light' ? 3 : undefined,
          padding: 13,
          overflow: 'hidden',
        },
        infoTitle: {
          textAlign: 'center',
          fontWeight: 'bold',
          fontSize: 18,
          marginBottom: 5,
          fontFamily: '',
        },
        infoSinopsis: {
          fontSize: 13.5,
          color: colorScheme === 'dark' ? '#a5a5a5' : '#474747',
        },
        infoGenre: {
          marginVertical: 5,
          flexDirection: 'row',
          flexWrap: 'wrap',
          alignContent: 'stretch',
        },
        genre: {
          borderWidth: 1,
          borderColor: 'gray',
          padding: 2,
          margin: 2,
          fontSize: 11,
          textAlign: 'center',
        },
        infoData: {
          flexDirection: 'row',
          justifyContent: 'space-around',
        },
        status: {
          borderRadius: 5,
          padding: 3,
          fontWeight: 'bold',
          elevation: 4,
        },
        releaseYear: {
          backgroundColor: '#15d8b7',
          borderRadius: 5,
          padding: 3,
          paddingHorizontal: 5,
          textAlign: 'center',
          alignSelf: 'center',
          fontWeight: 'bold',
          elevation: 4,
        },
        rating: {
          backgroundColor: 'orange',
          borderRadius: 5,
          color: '#1f1f1f',
          padding: 3,
          fontWeight: 'bold',
          elevation: 4,
        },
        episodeDataControl: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'center',
        },
        episodeDataControlButton: {
          padding: 5,
        },
        downloadButton: {
          backgroundColor: '#0050ac',
          borderRadius: 5,
          marginTop: 40,
          padding: 9,
          width: '85%',
          alignItems: 'center',
          alignSelf: 'center',
        },
        dropdownStyle: {
          width: '100%',
          backgroundColor: colorScheme === 'dark' ? '#2c2c2c' : '#e9e9e9',
          padding: 5,
          borderRadius: 4,
          borderWidth: 1,
          borderColor: 'black',
        },
        dropdownContainerStyle: {
          maxWidth: '50%',
        },
        dropdownItemTextStyle: {
          color: globalStyles.text.color,
          fontSize: 15,
          textAlign: 'center',
        },
        dropdownItemContainerStyle: {
          borderColor: colorScheme !== 'dark' ? '#2c2c2c' : '#ccc9c9',
          borderWidth: StyleSheet.hairlineWidth,
          backgroundColor: colorScheme === 'dark' ? '#2c2c2c' : '#ccc9c9',
        },
        dropdownSelectedTextStyle: {
          color: globalStyles.text.color,
          textAlign: 'center',
        },
        reloadPlayer: {
          backgroundColor: '#0050ac',
          borderRadius: 5,
          marginTop: 6,
          padding: 9,
          width: '85%',
          alignItems: 'center',
          alignSelf: 'center',
        },
      }),
    [globalStyles, colorScheme],
  );
}

export default memo(Video);
