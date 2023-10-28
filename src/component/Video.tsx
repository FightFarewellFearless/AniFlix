import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
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
  Animated,
  ToastAndroid,
  Modal,
  Linking,
  NativeEventEmitter,
  NativeModules,
  EmitterSubscription,
  AppState,
} from 'react-native';
import Videos from 'react-native-media-console';
import Orientation, { OrientationType } from 'react-native-orientation-locker';
import Icon from 'react-native-vector-icons/FontAwesome';
import DeviceInfo from 'react-native-device-info';
const deviceInfoEmitter = new NativeEventEmitter(NativeModules.RNDeviceInfo);
import { Dropdown } from 'react-native-element-dropdown';
import SystemNavigationBar from 'react-native-system-navigation-bar';
import { useAnimations } from '@react-native-media-console/reanimated';
import ReAnimated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import globalStyles, { darkText } from '../assets/style';
import useDownloadAnimeFunction from '../utils/downloadAnime';
import setHistory from '../utils/historyControl';
import throttleFunction from '../utils/throttleFunction';

import { useDispatch, useSelector } from 'react-redux';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackNavigator } from '../types/navigation';
import { AppDispatch, RootState } from '../misc/reduxStore';
import VideoType, { OnProgressData } from 'react-native-video';
import colorScheme from '../utils/colorScheme';
import AnimeAPI from '../utils/AnimeAPI';

type Props = NativeStackScreenProps<RootStackNavigator, 'Video'>;

const TouchableOpacityAnimated =
  ReAnimated.createAnimatedComponent(TouchableOpacity);

function Video(props: Props) {
  const enableNextPartNotification = useSelector(
    (state: RootState) => state.settings.enableNextPartNotification,
  );
  const enableBatteryTimeInfo = useSelector(
    (state: RootState) => state.settings.enableBatteryTimeInfo,
  );
  const downloadFrom = useSelector(
    (state: RootState) => state.settings.downloadFrom,
  );
  const history = useSelector((state: RootState) => state.settings.history);
  const lockScreenOrientation = useSelector(
    (state: RootState) => state.settings.lockScreenOrientation,
  );

  const dispatchSettings = useDispatch<AppDispatch>();

  const historyData = useRef(props.route.params.historyData).current;

  const [batteryLevel, setBatteryLevel] = useState(0);
  // const [showBatteryLevel, setShowBatteryLevel] = useState(false);
  const [showSynopsys, setShowSynopsys] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [part, setPart] = useState(historyData?.part ?? 0);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(props.route.params.data);
  const [shouldShowNextPartNotification, setShouldShowNextPartNotification] =
    useState(false);
  const preparePartAnimation = useRef(new Animated.Value(0)).current;
  const [batteryTimeEnable, setBatteryTimeEnable] = useState(false);
  const [isControlsHidden, setIsControlsHidden] = useState(true);

  const downloadSource = useRef<string[]>([]);
  const currentLink = useRef(props.route.params.link);
  const hasDownloadAllPart = useRef(false);
  const hasPart = useRef(data.streamingLink.length > 1);
  const firstTimeLoad = useRef(true);
  const videoRef = useRef<VideoType>(null);

  const downloadAnimeFunction = useDownloadAnimeFunction();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const updateHistoryThrottle = useCallback(
    throttleFunction(
      (progressData, stateData, statePart, settContext, dispatchContext) => {
        if (Math.floor(progressData.currentTime) === 0) {
          return;
        }
        setHistory(
          stateData,
          currentLink.current,
          true,
          {
            part: hasPart.current ? statePart : undefined,
            resolution: stateData.resolution,
            lastDuration: progressData.currentTime,
          },
          settContext,
          dispatchContext,
        );
      },
      3000,
    ),
    [],
  );

  const preparePartAnimationSequence = useMemo(
    () =>
      Animated.sequence([
        Animated.timing(preparePartAnimation, {
          toValue: 1,
          useNativeDriver: true,
          duration: 500,
        }),
        Animated.timing(preparePartAnimation, {
          toValue: 0,
          useNativeDriver: true,
          duration: 500,
          delay: 3000,
        }),
      ]),
    [preparePartAnimation],
  );

  const abortController = useRef<AbortController | null>(null);
  if (abortController.current === null) {
    abortController.current = new AbortController();
  }

  const nextPartEnable = useRef<string>();

  const [isBackground, setIsBackground] = useState(false);

  const infoContainerHeight = useSharedValue(0);
  const initialInfoContainerHeight = useRef<number>();
  const [synopsysTextLength, setSynopsysTextLength] = useState(0);
  const synopsysHeight = useRef(0);
  const infoContainerStyle = useAnimatedStyle(() => ({
    height:
      infoContainerHeight.value === 0 ? 'auto' : infoContainerHeight.value,
  }));

  // didMount and willUnmount
  useEffect(() => {
    AppState.currentState === 'background' && setIsBackground(true);
    const appStateBlur = AppState.addEventListener('blur', () => {
      setIsBackground(true);
    });
    const appStateFocus = AppState.addEventListener('focus', () => {
      setIsBackground(false);
    });

    nextPartEnable.current = enableNextPartNotification;

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
    async (res: string) => {
      if (loading) {
        return;
      }
      setLoading(true);
      const resultData = await AnimeAPI.fromUrl(
        currentLink.current,
        res,
        true,
        abortController.current?.signal,
      ).catch(err => {
        if (err.message === 'Aborted') {
          return;
        }
        const errMessage =
          err.message === 'Network request failed'
            ? 'Permintaan gagal.\nPastikan kamu terhubung dengan internet'
            : 'Error tidak diketahui: ' + err.message;
        Alert.alert('Error', errMessage);
        setLoading(false);
      });
      if (resultData === undefined) {
        return;
      }
      if (resultData === 'Unsupported') {
        Alert.alert(
          'Tidak didukung!',
          'Anime yang kamu tuju tidak memiliki data yang didukung!',
        );
        setLoading(false);
        return;
      }
      if (resultData.maintenance) {
        setLoading(false);
        ToastAndroid.show('Server sedang maintenance!', ToastAndroid.SHORT);
        return;
      }
      if (resultData.blocked) {
        setLoading(false);
        Alert.alert('Gagal mengganti resolusi', 'Karena data di blokir');
        return;
      }
      if (resultData.type !== 'singleEps') {
        setLoading(false);
        Alert.alert(
          'Kesalahan!!',
          'Hasil perminataan tampaknya bukan data yang diharapkan, sepertinya ada kesalahan yang tidak diketahui.',
        );
        return;
      }
      hasPart.current = resultData.streamingLink.length > 1;
      setData(resultData);
      setLoading(false);
      setPart(0);
      firstTimeLoad.current = false;
    },
    [loading],
  );

  const willUnmountHandler = () => {
    Orientation.removeDeviceOrientationListener(orientationDidChange);
    if (lockScreenOrientation === 'true') {
      Orientation.lockToPortrait();
    } else {
      Orientation.unlockAllOrientations();
    }
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
    const source = data.streamingLink[part].sources[0].src;
    const resolution = data.resolution;
    await downloadAnimeFunction(
      source,
      downloadSource.current,
      data.streamingLink.length > 1
        ? data.title + ' Part ' + (part + 1)
        : data.title,
      resolution,
      undefined,
      () => {
        downloadSource.current = [...downloadSource.current, source];
        ToastAndroid.show('Sedang mendownload...', ToastAndroid.SHORT);
      },
    );
  }, [data, downloadAnimeFunction, part]);

  const onEnd = useCallback(() => {
    if (part < data.streamingLink.length - 1) {
      setPart(part + 1);
      setShouldShowNextPartNotification(false);
    }
  }, [data, part]);
  const onBack = useCallback(() => {
    exitFullscreen();
  }, [exitFullscreen]);

  const downloadAllAnimePart = useCallback(
    async (force = false, askForDownload = true) => {
      if (hasDownloadAllPart.current && force === false) {
        Alert.alert(
          'Lanjutkan?',
          'kamu sudah mengunduh semua part. Masih ingin melanjutkan?',
          [
            {
              text: 'Batalkan',
              style: 'cancel',
              onPress: () => null,
            },
            {
              text: 'Lanjutkan',
              onPress: () => {
                downloadAllAnimePart(true);
              },
            },
          ],
        );
        return;
      }

      if (askForDownload) {
        Alert.alert(
          'Download semua part?',
          `Ini akan mendownload semua (${data.streamingLink.length}) part`,
          [
            {
              text: 'Tidak',
              style: 'cancel',
              onPress: () => null,
            },
            {
              text: 'Ya',
              onPress: () => {
                downloadAllAnimePart(force, false);
              },
            },
          ],
        );
        return;
      }

      for (let i = 0; i < data.streamingLink.length; i++) {
        const source = data.streamingLink[i].sources[0].src;

        let Title = data.title + ' Part ' + (i + 1);

        if (hasDownloadAllPart.current) {
          Title +=
            ' (' +
            downloadSource.current.filter(z => z === source).length +
            ')';
        }

        if (downloadFrom === 'native' || downloadFrom === null) {
          await downloadAnimeFunction(
            source,
            downloadSource.current,
            Title,
            data.resolution,
            true,
            () => {
              downloadSource.current = [...downloadSource.current, source];
            },
          );
        }
      }
      if (downloadFrom === 'browser') {
        if (await Linking.canOpenURL(data.downloadLink)) {
          Linking.openURL(data.downloadLink);
        } else {
          ToastAndroid.show('https tidak didukung', ToastAndroid.SHORT);
        }
      }
      hasDownloadAllPart.current = true;
      ToastAndroid.show('Sedang mendownload...', ToastAndroid.SHORT);
    },
    [data, downloadFrom, downloadAnimeFunction],
  );

  const nextPartNotificationControl = useCallback(
    (progressData: OnProgressData) => {
      if (hasPart.current) {
        const remainingTime =
          progressData.seekableDuration - progressData.currentTime;
        if (
          remainingTime < 10 &&
          shouldShowNextPartNotification === false &&
          part < data.streamingLink.length - 1 &&
          nextPartEnable.current
        ) {
          setShouldShowNextPartNotification(true);
          Animated.loop(preparePartAnimationSequence, {
            iterations: 1,
          }).start();
        }
        if (remainingTime > 10 && shouldShowNextPartNotification === true) {
          setShouldShowNextPartNotification(false);
        }
      }
    },
    [data, part, preparePartAnimationSequence, shouldShowNextPartNotification],
  );

  const handleProgress = useCallback(
    (progressData: OnProgressData) => {
      nextPartNotificationControl(progressData);
      updateHistoryThrottle(
        progressData,
        data,
        part,
        history,
        dispatchSettings,
      );
    },
    [
      nextPartNotificationControl,
      updateHistoryThrottle,
      data,
      part,
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
        abortController.current?.signal,
      ).catch(err => {
        if (err.message === 'Aborted') {
          return;
        }
        const errMessage =
          err.message === 'Network request failed'
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
      if (result.maintenance) {
        setLoading(false);
        ToastAndroid.show('Server sedang maintenance!', ToastAndroid.SHORT);
        return;
      }
      if (result.blocked) {
        setLoading(false);
        Alert.alert('Gagal mengganti episode', 'Karena data di blokir');
        return;
      }
      if (result.type !== 'singleEps') {
        setLoading(false);
        Alert.alert(
          'Kesalahan!!',
          'Hasil perminataan tampaknya bukan data yang diharapkan, sepertinya ada kesalahan yang tidak diketahui.',
        );
        return;
      }

      hasPart.current = result.streamingLink.length > 1;

      setData(result);
      setLoading(false);
      setPart(0);
      firstTimeLoad.current = false;
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
    if (historyData === undefined || historyData.lastDuration === undefined) {
      return;
    }
    videoRef.current?.seek(historyData.lastDuration);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hideControls = useCallback(() => {
    setIsControlsHidden(true);
  }, []);
  const showControls = useCallback(() => {
    setIsControlsHidden(false);
  }, []);

  return (
    <View style={{ flex: 2 }}>
      {/* Loading modal */}
      <LoadingModal loading={loading} cancelLoading={cancelLoading} />
      {/* VIDEO ELEMENT */}
      <View style={[fullscreen ? styles.fullscreen : styles.notFullscreen]}>
        {/* notifikasi part selanjutnya */}
        {shouldShowNextPartNotification && (
          <>
            <Animated.View
              style={{
                zIndex: 1,
                alignItems: 'center',
                opacity: preparePartAnimation,
              }}
              pointerEvents="none">
              <View style={styles.partNotificationContainer}>
                <Text style={{ color: darkText }}>
                  Bersiap ke part selanjutnya
                </Text>
              </View>
            </Animated.View>
          </>
        )}

        {
          // mengecek apakah video tersedia
          data.streamingLink?.[part]?.sources[0].src ? (
            <Videos
              useAnimations={useAnimations}
              key={data.streamingLink[part].sources[0].src}
              showOnEnd={true}
              title={data.title}
              disableBack={!fullscreen}
              onBack={onBack}
              toggleResizeModeOnFullscreen={false}
              isFullscreen={fullscreen}
              onEnterFullscreen={enterFullscreen}
              onExitFullscreen={exitFullscreen}
              source={{
                uri: data.streamingLink[part].sources[0].src,
              }}
              onEnd={onEnd}
              rewindTime={10}
              showDuration={true}
              onProgress={handleProgress}
              onLoad={handleVideoLoad}
              videoRef={videoRef}
              onHideControls={hideControls}
              onShowControls={showControls}
              playInBackground={false}
              paused={isBackground}
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
              { display: isControlsHidden ? 'flex' : 'none' },
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
              { display: isControlsHidden ? 'flex' : 'none' },
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
            <TouchableOpacityAnimated
              style={[styles.container, infoContainerStyle]}
              onLayout={e => {
                if (initialInfoContainerHeight.current === undefined) {
                  infoContainerHeight.value = e.nativeEvent.layout.height;
                  initialInfoContainerHeight.current =
                    e.nativeEvent.layout.height;
                }
              }}
              onPress={() => {
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
                {data.synopsys}
              </Text>

              <View style={[styles.infoGenre]}>
                {data.genre.map(genre => (
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
                        data.status === 'Ended' ? 'green' : 'red',
                    },
                  ]}>
                  {data.status}
                </Text>
                <Text style={[{ color: darkText }, styles.releaseYear]}>
                  <Icon name="calendar" color={darkText} /> {data.releaseYear}
                </Text>
                <Text style={[globalStyles.text, styles.rating]}>
                  <Icon name="star" color="black" /> {data.rating}
                </Text>
              </View>

              {synopsysTextLength > 2 && (
                <View style={{ alignItems: 'center', marginTop: 3 }}>
                  {showSynopsys ? (
                    <Icon name="chevron-up" size={20} />
                  ) : (
                    <Icon name="chevron-down" size={20} />
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
              <View style={{ width: 120 }}>
                <Dropdown
                  value={data.resolution}
                  data={data.validResolution.map(z => {
                    return { label: z, value: z };
                  })}
                  valueField="value"
                  labelField="label"
                  onChange={val => {
                    setResolution(val.value);
                  }}
                  style={styles.dropdownStyle}
                  containerStyle={styles.dropdownContainerStyle}
                  itemTextStyle={styles.dropdownItemTextStyle}
                  itemContainerStyle={styles.dropdownItemContainerStyle}
                  activeColor="#16687c"
                  selectedTextStyle={styles.dropdownSelectedTextStyle}
                />
              </View>
              {data.streamingLink?.length > 1 && (
                <View style={styles.dropdownPart}>
                  <Dropdown
                    // @ts-ignore
                    value={part}
                    data={data.streamingLink.map((_, i) => {
                      return { label: 'Part ' + (i + 1), value: i };
                    })}
                    valueField="value"
                    labelField="label"
                    onChange={val => {
                      setPart(val.value);
                      firstTimeLoad.current = false;
                    }}
                    style={styles.dropdownStyle}
                    containerStyle={styles.dropdownContainerStyle}
                    itemTextStyle={styles.dropdownItemTextStyle}
                    itemContainerStyle={styles.dropdownItemContainerStyle}
                    activeColor="#16687c"
                    selectedTextStyle={styles.dropdownSelectedTextStyle}
                  />
                  {/* <Icon name="info-circle" /> */}
                </View>
              )}
            </View>

            <TouchableOpacity
              style={styles.downloadButton}
              onPress={downloadAnime}>
              <Icon name="download" size={23} color={darkText} />
              <Text style={{ color: darkText }}>
                Download {data.streamingLink?.length > 1 && 'Part ini'}
              </Text>
            </TouchableOpacity>

            {data.streamingLink?.length > 1 && (
              <TouchableOpacity
                style={[
                  styles.downloadButton,
                  { backgroundColor: '#996300', marginTop: 5 },
                ]}
                onPress={downloadAllAnimePart as () => void}>
                <Icon name="download" size={23} color={darkText} />
                <Text style={{ color: darkText }}>Download semua part</Text>
              </TouchableOpacity>
            )}
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
  return (
    <Modal visible={loading} transparent onRequestClose={cancelLoading}>
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
    const newDate = `${hours < 10 ? '0' + hours : hours}:${
      minutes < 10 ? '0' + minutes : minutes
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

const styles = StyleSheet.create({
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
  dropdownPart: {
    width: 120,
    position: 'absolute',
    bottom: 13,
    right: 13,
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
  partNotificationContainer: {
    position: 'absolute',
    top: 10,
    backgroundColor: '#0000008f',
    padding: 3,
    borderRadius: 5,
  },
  dropdownStyle: {
    width: 120,
    backgroundColor: colorScheme === 'dark' ? '#2c2c2c' : '#9b9b9b',
    padding: 5,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'black',
  },
  dropdownContainerStyle: {
    width: 120,
  },
  dropdownItemTextStyle: {
    color: globalStyles.text.color,
    fontSize: 15,
    textAlign: 'center',
  },
  dropdownItemContainerStyle: {
    backgroundColor: colorScheme === 'dark' ? '#2c2c2c' : '#9b9b9b',
  },
  dropdownSelectedTextStyle: {
    color: globalStyles.text.color,
  },
});
export default Video;
