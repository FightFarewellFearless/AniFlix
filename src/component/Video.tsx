import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
} from 'react';
import {
  StatusBar,
  View,
  Alert,
  ScrollView,
  Text,
  StyleSheet,
  TouchableOpacity,
  BackHandler,
  ActivityIndicator,
  ToastAndroid,
  Modal,
  NativeEventEmitter,
  NativeModules,
  EmitterSubscription,
  AppState,
  useColorScheme,
} from 'react-native';
import Orientation, { OrientationType } from 'react-native-orientation-locker';
import Icon from 'react-native-vector-icons/FontAwesome';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import DeviceInfo from 'react-native-device-info';
const deviceInfoEmitter = new NativeEventEmitter(NativeModules.RNDeviceInfo);
import { Dropdown } from 'react-native-element-dropdown';
import url from 'url';
import SystemNavigationBar from 'react-native-system-navigation-bar';
import ReAnimated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Video as ExpoVideo } from 'expo-av';

import useGlobalStyles, { darkText, lightText } from '../assets/style';
import useDownloadAnimeFunction from '../utils/downloadAnime';
import setHistory from '../utils/historyControl';
import throttleFunction from '../utils/throttleFunction';

import { useDispatch, useSelector } from 'react-redux';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackNavigator } from '../types/navigation';
import { AppDispatch, RootState } from '../misc/reduxStore';
import AnimeAPI from '../utils/AnimeAPI';
import WebView from 'react-native-webview';
import deviceUserAgent from '../utils/deviceUserAgent';
import { AniDetail } from '../types/anime';
import VideoPlayer from './VideoPlayer';

type Props = NativeStackScreenProps<RootStackNavigator, 'Video'>;

const TouchableOpacityAnimated =
  ReAnimated.createAnimatedComponent(TouchableOpacity);

const defaultLoadingGif = 'https://cdn.dribbble.com/users/2973561/screenshots/5757826/loading__.gif';

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
  const [showSynopsys, setShowSynopsys] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(props.route.params.data);
  const [batteryTimeEnable, setBatteryTimeEnable] = useState(false);

  const downloadSource = useRef<string[]>([]);
  const currentLink = useRef(props.route.params.link);
  const firstTimeLoad = useRef(true);
  const videoRef = useRef<ExpoVideo>(null);
  const webviewRef = useRef<WebView>(null);
  const [webViewKey, setWebViewKey] = useState(0);

  const [animeDetail, setAnimeDetail] = useState<Omit<AniDetail, 'episodeList'> | undefined>();

  useEffect(() => {
    AnimeAPI.fromUrl(data.episodeData.animeDetail).then(detail => {
      if (detail === 'Unsupported') return;
      if (detail.type === 'animeDetail') {
        setAnimeDetail(detail);
      }
    })
  }, []);

  const downloadAnimeFunction = useDownloadAnimeFunction();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const updateHistoryThrottle = useCallback(
    throttleFunction(
      (currentTime: number, stateData, settContext, dispatchContext) => {
        if (Math.floor(currentTime) === 0) {
          return;
        }
        const additionalData = {
          resolution: stateData.resolution,
          lastDuration: currentTime,
        }
        setHistory(
          stateData,
          currentLink.current,
          true,
          additionalData,
          settContext,
          dispatchContext,
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

  const infoContainerHeight = useSharedValue(0);
  const initialInfoContainerHeight = useRef<number>();
  const isInfoPressed = useRef(false);
  const [synopsysTextLength, setSynopsysTextLength] = useState(0);
  const synopsysHeight = useRef(0);
  const infoContainerStyle = useAnimatedStyle(() => ({
    height:
      infoContainerHeight.value === 0 ? 'auto' : infoContainerHeight.value,
  }));

  // didMount and willUnmount
  useEffect(() => {
    AppState.currentState === 'background' && setIsPaused(true);
    const appStateBlur = AppState.addEventListener('blur', () => {
      setIsPaused(true);
    });
    const appStateFocus = AppState.addEventListener('focus', () => {
      setIsPaused(false);
    });

    Orientation.addDeviceOrientationListener(orientationDidChange);

    return () => {
      willUnmountHandler();
      abortController.current?.abort();
      appStateBlur.remove();
      appStateFocus.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // BackHandler event
  useEffect(() => {
    const backHandlerEvent = BackHandler.addEventListener(
      'hardwareBackPress',
      () => onHardwareBackPress(fullscreen),
    );
    return () => {
      backHandlerEvent.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullscreen]);

  const onHardwareBackPress = (isFullsc: boolean) => {
    if (!isFullsc) {
      willUnmountHandler();
      return false;
    } else {
      exitFullscreen();
      return true;
    }
  };

  const setResolution = useCallback(
    async (res: string, resolution: string) => {
      if (loading) {
        return;
      }
      setLoading(true);
      const resultData = await AnimeAPI.reqResolution(
        res,
        data.reqNonceAction,
        data.reqResolutionWithNonceAction,
        abortController.current?.signal,
      ).catch(err => {
        if (err.message === 'canceled') {
          return;
        }
        const errMessage =
          err.message === 'Network Error'
            ? 'Permintaan gagal.\nPastikan kamu terhubung dengan internet'
            : 'Error tidak diketahui: ' + err.stack;
        Alert.alert('Error', errMessage);
        setLoading(false);
      });
      if (resultData === undefined) {
        return;
      }
      const isWebviewNeeded = await fetch(resultData, {
        method: 'HEAD',
      }).catch(() => {})
        .then(res => {
          return !res?.headers.get('content-type')?.includes('video');
        })
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
    [loading],
  );

  const willUnmountHandler = () => {
    Orientation.removeDeviceOrientationListener(orientationDidChange);
    Orientation.lockToPortrait();
    StatusBar.setHidden(false);
    SystemNavigationBar.navigationShow();
  };

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
    StatusBar.setHidden(true);
    StatusBar.setTranslucent(true);
    SystemNavigationBar.navigationHide();
    setFullscreen(true);
  }, []);

  const exitFullscreen = useCallback(() => {
    // videoRef.current?.dismissFullscreenPlayer();
    StatusBar.setHidden(false);
    StatusBar.setTranslucent(false);
    Orientation.lockToPortrait();
    SystemNavigationBar.navigationShow();
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
      );
    },
    [
      updateHistoryThrottle,
      data,
      history,
      dispatchSettings,
    ],
  );

  const episodeDataControl = useCallback(
    async (url: string) => {
      if (loading) {
        return;
      }
      setLoading(true);
      const result = await AnimeAPI.fromUrl(
        url,
        undefined,
        undefined,
        undefined,
        abortController.current?.signal,
      ).catch(err => {
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
        Alert.alert(
          'Tidak didukung!',
          'Anime yang kamu tuju tidak memiliki data yang didukung!',
        );
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
      currentLink.current = url;

      setHistory(result, url, undefined, undefined, history, dispatchSettings);
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
    videoRef.current?.setPositionAsync(historyData.current.lastDuration * 1000);
    ToastAndroid.show('Otomatis kembali ke durasi terakhir', ToastAndroid.SHORT);

    // Alert.alert('Perhatian', `
    // Fitur "lanjut menonton dari durasi terakhir" memiliki bug atau masalah.
    // Dan dinonaktifkan untuk sementara waktu, untuk melanjutkan menonton kamu bisa geser slider ke menit ${moment(historyData.current.lastDuration * 1000).format('mm:ss')}
    // `)

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isPaused) {
      videoRef.current?.pauseAsync();
    } else {
      videoRef.current?.playAsync();
    }
  }, [isPaused]);


  const fullscreenUpdate = useCallback((isFullscreen: boolean) => {
    if (isFullscreen) {
      exitFullscreen()
    } else {
      enterFullscreen()
    }
  }, []);

  return (
    <View style={{ flex: 2 }}>
      {/* Loading modal */}
      <LoadingModal loading={loading} cancelLoading={cancelLoading} />
      {/* VIDEO ELEMENT */}
      <View style={[fullscreen ? styles.fullscreen : styles.notFullscreen]}>

        {
          // mengecek apakah video tersedia
          data.streamingType === 'raw' ? (
            <VideoPlayer
              title={data.title}
              streamingURL={data.streamingLink}
              style={{ flex: 1 }}
              videoRef={videoRef}
              fullscreen={fullscreen}
              onFullscreenUpdate={fullscreenUpdate}
              onDurationChange={handleProgress}
              onLoad={handleVideoLoad} />
          ) : data.streamingType === 'embed' ? (
            <WebView
              key={data.streamingLink}
              setSupportMultipleWindows={false}
              onShouldStartLoadWithRequest={(navigator: Request) => {
                const res = navigator.url.includes(url.parse(data.streamingLink).host as string) || navigator.url.includes(defaultLoadingGif);
                if (!res) {
                  webviewRef.current?.stopLoading();
                }
                return res;
              }}
              source={{ uri: data.streamingLink, baseUrl: 'https://' + url.parse(data.streamingLink).host }}
              userAgent={deviceUserAgent}
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
            <Text style={globalStyles.text}>Video tidak tersedia</Text>
          )
        }

        {/* info baterai */}
        {fullscreen && batteryTimeEnable && (
          <View
            style={[
              styles.batteryInfo,
            ]}
            pointerEvents="none">
            {getBatteryIconComponent()}
            <Text style={{ color: darkText }}>
              {' '}
              {Math.round(batteryLevel * 100)}%
            </Text>
          </View>
        )}

        {/* info waktu/jam */}
        {fullscreen && batteryTimeEnable && (
          <View
            style={[
              styles.timeInfo,
            ]}
            pointerEvents="none">
            <TimeInfo />
          </View>
        )}
      </View>
      {/* END OF VIDEO ELEMENT */}
      {
        // mengecek apakah sedang dalam keadaan fullscreen atau tidak
        // jika ya, maka hanya menampilkan video saja
        !fullscreen && (
          <ScrollView style={{ flex: 1 }}>
            {/* embed player information */}
            {data.streamingType === 'embed' && (
              <View>
                <View style={{
                  backgroundColor: '#c9c900'
                }}>
                  <Icon name="lightbulb-o" color={lightText} size={26} style={{ alignSelf: 'center' }} />
                  <Text style={{ color: lightText }}>Kamu saat ini menggunakan video player pihak ketiga dikarenakan data
                    dengan format yang biasa digunakan tidak tersedia. Fitur ini masih eksperimental.{'\n'}
                    Kamu mungkin akan melihat iklan di dalam video.{'\n'}
                    Fitur download, ganti resolusi, dan fullscreen tidak akan bekerja dengan normal.{'\n'}
                    Jika menemui masalah seperti video berubah menjadi putih, silahkan reload video player!</Text>
                </View>
                <View style={{
                  marginTop: 5,
                  backgroundColor: '#c99a00'
                }}>
                  <MaterialCommunityIcons name="screen-rotation" color={lightText} size={26} style={{ alignSelf: 'center' }} />
                  <Text style={{ color: lightText }}>Untuk masuk ke mode fullscreen silahkan miringkan ponsel ke mode landscape</Text>
                </View>
                <TouchableOpacity style={styles.reloadPlayer} onPress={() => {
                  setWebViewKey(prev => prev + 1);
                }}>
                  <Icon name="refresh" color={darkText} size={15} style={{ alignSelf: 'center' }} />
                  <Text style={{ color: darkText }}>Reload video player</Text>
                </TouchableOpacity>
              </View>
            )}
            <TouchableOpacityAnimated
              style={[styles.container, infoContainerStyle]}
              onLayout={e => {
                if (isInfoPressed.current === false) {
                  // infoContainerHeight.value = e.nativeEvent.layout.height;
                  initialInfoContainerHeight.current =
                    e.nativeEvent.layout.height;
                }
              }}
              onPress={() => {
                if (!isInfoPressed.current) {
                  infoContainerHeight.value = initialInfoContainerHeight.current!;
                }
                isInfoPressed.current = true;
                if (showSynopsys) {
                  setTimeout(setShowSynopsys, 100, false);
                  infoContainerHeight.value = withTiming(
                    initialInfoContainerHeight.current as number,
                  );
                } else {
                  setTimeout(setShowSynopsys, 100, true);
                  infoContainerHeight.value = withTiming(
                    (initialInfoContainerHeight.current as number) +
                    synopsysHeight.current,
                  );
                }
              }}
              disabled={synopsysTextLength <= 2}>
              <Text style={[globalStyles.text, styles.infoTitle]}>
                {data.title}
              </Text>

              <Text
                style={[globalStyles.text, styles.infoSinopsis]}
                numberOfLines={!showSynopsys ? 2 : undefined}
                onTextLayout={e => {
                  setSynopsysTextLength(e.nativeEvent.lines.length);
                  synopsysHeight.current = e.nativeEvent.lines
                    .slice(2)
                    .reduce((prev, curr) => prev + curr.height, 0);
                }}>
                {animeDetail?.synopsys || 'Tidak ada sinopsis'}
              </Text>

              <View style={[styles.infoGenre]}>
                {(animeDetail?.genres ?? ['Loading']).map(genre => (
                  <Text key={genre} style={[globalStyles.text, styles.genre]}>
                    {genre}
                  </Text>
                ))}
              </View>

              <View style={styles.infoData}>
                <Text
                  style={[
                    globalStyles.text,
                    styles.status,
                    {
                      backgroundColor:
                        animeDetail?.status === 'Completed' ? 'green' : 'red',
                    },
                  ]}>
                  {animeDetail?.status}
                </Text>
                <Text style={[{ color: darkText }, styles.releaseYear]}>
                  <Icon name="calendar" color={darkText} /> {animeDetail?.releaseYear}
                </Text>
                <Text style={[globalStyles.text, styles.rating]}>
                  <Icon name="star" color="black" /> {animeDetail?.rating}
                </Text>
              </View>

              {synopsysTextLength > 2 && (
                <View style={{ alignItems: 'center', marginTop: 3 }}>
                  {showSynopsys ? (
                    <Icon name="chevron-up" size={20} color={colorScheme === 'dark' ? 'white' : 'black'} />
                  ) : (
                    <Icon name="chevron-down" size={20} color={colorScheme === 'dark' ? 'white' : 'black'} />
                  )}
                </View>
              )}
            </TouchableOpacityAnimated>

            <View style={[styles.container, { marginTop: 10 }]}>
              {data.episodeData && (
                <View style={[styles.episodeDataControl]}>
                  <TouchableOpacity
                    key="prev"
                    disabled={!data.episodeData.previous}
                    style={[
                      styles.episodeDataControlButton,
                      {
                        backgroundColor: data.episodeData.previous
                          ? '#00ccff'
                          : '#525252',
                        marginRight: 5,
                      },
                    ]}
                    onPress={() => {
                      episodeDataControl(data.episodeData?.previous as string); // ignoring the undefined type because we already have the button disabled
                    }}>
                    <Icon name="arrow-left" size={18} color="black" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    key="next"
                    disabled={!data.episodeData.next}
                    style={[
                      styles.episodeDataControlButton,
                      {
                        backgroundColor: data.episodeData.next
                          ? '#00ccff'
                          : '#525252',
                      },
                    ]}
                    onPress={() => {
                      episodeDataControl(data.episodeData?.next as string); // ignoring the undefined type because we already have the button disabled
                    }}>
                    <Icon name="arrow-right" size={18} color="black" />
                  </TouchableOpacity>
                </View>
              )}
              <View style={{ maxWidth: '50%' }}>
                <Dropdown
                  value={data.resolution === undefined ? undefined : {label: data.resolution, value: data.resolutionRaw?.[data.resolutionRaw.findIndex(e => e.resolution === data.resolution)]}}
                  placeholder='Pilih resolusi'
                  data={Object.entries(data.resolutionRaw).filter(z => z[1] !== undefined).map(z => {
                    return { label: z[1].resolution, value: z[1] };
                  })}
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
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.downloadButton}
              onPress={downloadAnime}>
              <Icon name="download" size={23} color={darkText} />
              <Text style={{ color: darkText }}>
                Download
              </Text>
            </TouchableOpacity>
          </ScrollView>
        )
      }
    </View>
  );
}

function LoadingModal({
  loading,
  cancelLoading,
}: {
  loading: boolean;
  cancelLoading: () => void;
}) {
  const globalStyles = useGlobalStyles();
  const styles = useStyles();
  return (
    <Modal statusBarTranslucent={true} visible={loading} transparent onRequestClose={cancelLoading}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <TouchableOpacity
            onPress={cancelLoading}
            style={{ position: 'absolute', top: 5, right: 5 }}>
            <Icon name="close" size={28} style={{ color: 'red' }} />
          </TouchableOpacity>
          <ActivityIndicator size={'large'} />
          <Text style={globalStyles.text}>Loading...</Text>
        </View>
      </View>
    </Modal>
  );
}

function TimeInfo() {
  const [time, setTime] = useState<string>();

  const changeTime = useCallback(() => {
    const currentDate = new Date();
    const hours = currentDate.getHours();
    const minutes = currentDate.getMinutes();
    const newDate = `${hours < 10 ? '0' + hours : hours}:${minutes < 10 ? '0' + minutes : minutes
      }`;
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
  return StyleSheet.create({
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#0000008a',
    },
    modalContent: {
      flex: 0.15,
      minWidth: 300,
      minHeight: 80,
      backgroundColor: colorScheme === 'dark' ? '#2c2c2c' : '#9b9b9b',
      borderColor: 'gold',
      borderWidth: 1,
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
      backgroundColor: colorScheme === 'dark' ? '#1d1d1d' : '#d8d8d8',
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
    },
    releaseYear: {
      backgroundColor: '#4b4b4b',
      borderRadius: 5,
      padding: 3,
      paddingHorizontal: 5,
      textAlign: 'center',
      alignSelf: 'center',
    },
    rating: {
      backgroundColor: 'orange',
      borderRadius: 5,
      color: '#1f1f1f',
      padding: 3,
    },
    episodeDataControl: {
      flexDirection: 'row',
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
      backgroundColor: colorScheme === 'dark' ? '#2c2c2c' : '#ccc9c9',
    },
    dropdownSelectedTextStyle: {
      color: globalStyles.text.color,
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
  });
}


export default Video;