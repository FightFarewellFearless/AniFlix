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
} from 'react-native';
import Videos from 'react-native-media-console';
import Orientation from 'react-native-orientation-locker';
import globalStyles from '../assets/style';
import Icon from 'react-native-vector-icons/FontAwesome';
import SystemNavigationBar from 'react-native-system-navigation-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Battery from 'expo-battery';
import downloadAnimeFunction from '../utils/downloadAnime';
import Dropdown from 'react-native-dropdown-picker';

function Video(props) {
  const [batteryLevel, setBatteryLevel] = useState(0);
  // const [showBatteryLevel, setShowBatteryLevel] = useState(false);
  const [showSynopsys, setShowSynopsys] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [part, setPart] = useState(0);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(props.route.params.data);
  const [shouldShowNextPartNotification, setShouldShowNextPartNotification] =
    useState(false);
  const preparePartAnimation = useRef(new Animated.Value(0)).current;
  const [batteryTimeEnable, setBatteryTimeEnable] = useState(false);

  const [openResolution, setOpenResolution] = useState(false);
  const [openPart, setOpenPart] = useState(false);

  const downloadSource = useRef([]);
  const currentLink = useRef(props.route.params.link);
  const hasDownloadAllPart = useRef(false);
  const hasPart = useRef(data.streamingLink.length > 1);

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

  const abortController = useRef(null);
  if (abortController.current === null) {
    abortController.current = new AbortController();
  }

  const nextPartEnable = useRef();

  // didMount and willUnmount
  useEffect(() => {
    AsyncStorage.getItem('enableNextPartNotification').then(value => {
      nextPartEnable.current = value === 'true' || value === null;
    });

    Orientation.addDeviceOrientationListener(orientationDidChange);
    let _batteryEvent;
    AsyncStorage.getItem('enableBatteryTimeInfo').then(async dbData => {
      if (dbData === 'true') {
        const batteryLevels = await Battery.getBatteryLevelAsync();
        setBatteryLevel(batteryLevels);
        _batteryEvent = setInterval(async () => {
          const batteryLevelsInterval = await Battery.getBatteryLevelAsync();
          if (batteryLevel !== batteryLevelsInterval) {
            onBatteryStateChange({ batteryLevel: batteryLevelsInterval });
          }
        }, 60_000);
        setBatteryTimeEnable(true);
      }
    });
    return () => {
      _batteryEvent && clearInterval(_batteryEvent);
      _batteryEvent = null;
      willUnmountHandler();
      abortController.current.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // BackHandler event
  useEffect(() => {
    const backHandlerEvent = BackHandler.addEventListener(
      'hardwareBackPress',
      onHardwareBackPress,
    );
    return () => {
      backHandlerEvent.remove();
    };
  }, [fullscreen, onHardwareBackPress]);

  const onHardwareBackPress = useCallback(() => {
    if (!fullscreen) {
      willUnmountHandler();
      return false;
    } else {
      exitFullscreen();
      return true;
    }
  }, [fullscreen, willUnmountHandler, exitFullscreen]);

  const setResolution = useCallback(
    async res => {
      if (loading) {
        return;
      }
      setLoading(true);
      const resultData = await fetch(
        // eslint-disable-next-line prettier/prettier
        'https://animeapi.aceracia.repl.co/v2/fromUrl' + '?res=' + res + '&link=' + currentLink.current,
        {
          signal: abortController.current.signal,
        },
      )
        .then(results => results.json())
        .catch(err => {
          if (err.message === 'Aborted') {
            return;
          }
          Alert.alert('Error', err.message);
          setLoading(false);
        });
      if (resultData === undefined) {
        return;
      }
      hasPart.current = resultData.streamingLink.length > 1;
      setData(resultData);
      setLoading(false);
      setPart(0);
    },
    [loading],
  );

  const willUnmountHandler = useCallback(() => {
    Orientation.removeDeviceOrientationListener(orientationDidChange);
    Orientation.unlockAllOrientations();
    StatusBar.setHidden(false);
    SystemNavigationBar.navigationShow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    return <Icon name={iconName} style={globalStyles.text} />;
  }, [batteryLevel]);

  const onBatteryStateChange = useCallback(
    ({ batteryLevel: currentBatteryLevel }) => {
      setBatteryLevel(currentBatteryLevel);
    },
    [],
  );

  const orientationDidChange = useCallback(
    orientation => {
      if (orientation === 'PORTRAIT') {
        exitFullscreen();
      } else if (orientation !== 'PORTRAIT' && orientation !== 'UNKNOWN') {
        enterFullscreen(orientation);
      }
    },
    [enterFullscreen, exitFullscreen],
  );

  const enterFullscreen = useCallback(landscape => {
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
    SystemNavigationBar.navigationHide();
    setFullscreen(true);
  }, []);

  const exitFullscreen = useCallback(() => {
    StatusBar.setHidden(false);
    Orientation.lockToPortrait();
    SystemNavigationBar.navigationShow();
    setFullscreen(false);
  }, []);

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
  }, [data, part]);

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
      hasDownloadAllPart.current = true;
      ToastAndroid.show('Sedang mendownload...', ToastAndroid.SHORT);
    },
    [data],
  );

  const handleProgress = useCallback(
    progressData => {
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

  const episodeDataControl = useCallback(
    async url => {
      if (loading) {
        return;
      }
      setLoading(true);
      const result = await fetch(
        'https://animeapi.aceracia.repl.co/v2/fromUrl' + '?link=' + url,
        {
          signal: abortController.current.signal,
        },
      )
        .then(resultData => resultData.json())
        .catch(err => {
          if (err.message === 'Aborted') {
            return;
          }
          Alert.alert('Error', err.message);
          setLoading(false);
        });
      if (result === undefined) {
        return;
      }
      hasPart.current = result.streamingLink.length > 1;

      setData(result);
      setLoading(false);
      setPart(0);
      currentLink.current = url;

      (async () => {
        let historyData = await AsyncStorage.getItem('history');
        if (historyData === null) {
          historyData = '[]';
        }
        historyData = JSON.parse(historyData);
        const episodeI = result.title.toLowerCase().indexOf('episode');
        const title =
          episodeI >= 0 ? result.title.slice(0, episodeI) : result.title;
        const episode = episodeI < 0 ? null : result.title.slice(episodeI);
        const dataINDEX = historyData.findIndex(val => val.title === title);
        if (dataINDEX >= 0) {
          historyData.splice(dataINDEX, 1);
        }
        historyData.splice(0, 0, {
          title,
          episode,
          link: url,
          thumbnailUrl: result.thumbnailUrl,
          date: Date.now(),
        });
        AsyncStorage.setItem('history', JSON.stringify(historyData));
      })();
    },
    [loading],
  );
  return (
    <View style={{ flex: 2 }}>
      {/* Loading modal */}
      <Modal
        visible={loading}
        transparent
        onRequestClose={() => {
          abortController.current.abort();
          setLoading(false);
          abortController.current = new AbortController();
        }}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <ActivityIndicator size={'large'} />
            <Text style={globalStyles.text}>Loading...</Text>
          </View>
        </View>
      </Modal>
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
              <View
                style={{
                  position: 'absolute',
                  top: 10,
                  backgroundColor: '#0000005e',
                  padding: 3,
                  borderRadius: 5,
                }}>
                <Text style={{ color: globalStyles.text.color, opacity: 1 }}>
                  Bersiap ke part selanjutnya
                </Text>
              </View>
            </Animated.View>
          </>
        )}

        {/* info baterai */}
        {fullscreen && batteryTimeEnable && (
          <View style={styles.batteryInfo} pointerEvents="none">
            {getBatteryIconComponent()}
            <Text style={globalStyles.text}>
              {' '}
              {Math.round(batteryLevel * 100)}%
            </Text>
          </View>
        )}

        {/* info waktu/jam */}
        {fullscreen && batteryTimeEnable && (
          <View style={styles.timeInfo} pointerEvents="none">
            <TimeInfo />
          </View>
        )}

        {
          // mengecek apakah video tersedia
          data.streamingLink?.[part]?.sources[0].src ? (
            <Videos
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
            />
          ) : (
            <Text style={globalStyles.text}>Video tidak tersedia</Text>
          )
        }
      </View>
      {/* END OF VIDEO ELEMENT */}
      {
        // mengecek apakah sedang dalam keadaan fullscreen atau tidak
        // jika ya, maka hanya menampilkan video saja
        !fullscreen && (
          <ScrollView style={{ flex: 1 }}>
            <TouchableOpacity
              style={[styles.container]}
              onPress={() => setShowSynopsys(!showSynopsys)}>
              <Text style={[globalStyles.text, styles.infoTitle]}>
                {data.title}
              </Text>

              <Text
                style={[globalStyles.text, styles.infoSinopsis]}
                numberOfLines={!showSynopsys ? 2 : undefined}>
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
                <Text style={[globalStyles.text, styles.status]}>
                  {data.status}
                </Text>
                <Text style={[globalStyles.text, styles.releaseYear]}>
                  {data.releaseYear}
                </Text>
                <Text style={[globalStyles.text, styles.rating]}>
                  <Icon name="star" color="gold" /> {data.rating}
                </Text>
              </View>
            </TouchableOpacity>

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
                    onPress={() =>
                      episodeDataControl(data.episodeData.previous)
                    }>
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
                    onPress={() => episodeDataControl(data.episodeData.next)}>
                    <Icon name="arrow-right" size={18} color="black" />
                  </TouchableOpacity>
                </View>
              )}
              <View style={{ width: 120 }}>
                <Dropdown
                  open={openResolution}
                  value={data.resolution}
                  items={data.validResolution.map(z => {
                    return { label: z, value: z };
                  })}
                  setOpen={setOpenResolution}
                  setValue={val => {
                    setResolution(val());
                  }}
                  listMode="MODAL"
                  modalTitle="Pilih resolusi"
                  theme="DARK"
                  style={{
                    width: 120,
                  }}
                />
              </View>
              {data.streamingLink?.length > 1 && (
                <View style={styles.dropdownPart}>
                  <Dropdown
                    open={openPart}
                    value={part}
                    items={data.streamingLink.map((_, i) => {
                      return { label: 'Part ' + (i + 1), value: i };
                    })}
                    setOpen={setOpenPart}
                    setValue={val => {
                      setPart(val());
                    }}
                    listMode="MODAL"
                    modalTitle="Pilih part"
                    theme="DARK"
                    containerStyle={{
                      width: 120,
                    }}
                  />
                  {/* <Icon name="info-circle" /> */}
                </View>
              )}
            </View>

            <TouchableOpacity
              style={styles.downloadButton}
              onPress={downloadAnime}>
              <Icon name="download" size={23} color={globalStyles.text.color} />
              <Text style={globalStyles.text}>
                Download {data.streamingLink?.length > 1 && 'Part ini'}
              </Text>
            </TouchableOpacity>

            {data.streamingLink?.length > 1 && (
              <TouchableOpacity
                style={[
                  styles.downloadButton,
                  { backgroundColor: '#996300', marginTop: 5 },
                ]}
                onPress={downloadAllAnimePart}>
                <Icon
                  name="download"
                  size={23}
                  color={globalStyles.text.color}
                />
                <Text style={globalStyles.text}>Download semua part</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        )
      }
    </View>
  );
}

function TimeInfo() {
  const [time, setTime] = useState();

  const changeTime = () => {
    const currentDate = new Date();
    const hours = currentDate.getHours();
    const minutes = currentDate.getMinutes();
    const newDate = `${hours < 10 ? '0' + hours : hours}:${
      minutes < 10 ? '0' + minutes : minutes
    }`;
    if (time !== newDate) {
      setTime(newDate);
    }
  };
  changeTime();

  const interval = setInterval(changeTime, 1_000);

  useEffect(() => {
    return () => {
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <Text style={globalStyles.text}>{time}</Text>;
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
    minHeight: 100,
    backgroundColor: '#2c2c2c',
    borderColor: 'gold',
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  batteryInfo: {
    position: 'absolute',
    right: 10,
    top: 10,
    zIndex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeInfo: {
    position: 'absolute',
    left: 10,
    top: 10,
    zIndex: 1,
    flexDirection: 'row',
    alignItems: 'center',
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
    backgroundColor: '#1d1d1d',
    padding: 13,
  },
  infoTitle: {
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 5,
  },
  infoSinopsis: {
    fontSize: 13.5,
  },
  infoGenre: {
    marginVertical: 5,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  genre: {
    borderWidth: 1,
    borderColor: 'gray',
    padding: 1,
    margin: 2,
    fontSize: 11,
    textAlign: 'center',
  },
  infoData: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  status: {},
  releaseYear: {
    borderWidth: 1,
    borderColor: 'green',
    paddingHorizontal: 5,
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
    marginTop: 40,
    padding: 9,
    width: '85%',
    alignItems: 'center',
    alignSelf: 'center',
  },
});
export default Video;
