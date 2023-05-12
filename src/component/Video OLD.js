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
} from 'react-native';
import Videos from 'react-native-media-console';
import Orientation from 'react-native-orientation-locker';
import globalStyles from '../assets/style';
import Icon from 'react-native-vector-icons/FontAwesome';
import SystemNavigationBar from 'react-native-system-navigation-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Battery from 'expo-battery';
import downloadAnimeFunction from '../utils/downloadAnime';

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
  const [preparePartAnimation] = useState(new Animated.Value(0));
  const [episodeDataLoadingStatus, setEpisodeDataLoadingStatus] =
    useState(false);
  const [batteryTimeEnable, setBatteryTimeEnable] = useState(false);

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

  const onBatteryStateChange = ({ batteryLevel: currentBatteryLevel }) => {
    setBatteryLevel(currentBatteryLevel);
  };

  const orientationDidChange = orientation => {
    if (orientation === 'PORTRAIT') {
      exitFullscreen();
    } else if (orientation !== 'PORTRAIT' && orientation !== 'UNKNOWN') {
      enterFullscreen(orientation);
    }
  };

  const enterFullscreen = landscape => {
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
  };

  const exitFullscreen = useCallback(() => {
    StatusBar.setHidden(false);
    Orientation.lockToPortrait();
    SystemNavigationBar.navigationShow();
    setFullscreen(false);
  }, []);

  const downloadAnime = async () => {
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
  };

  const onEnd = () => {
    if (part < data.streamingLink.length - 1) {
      setPart(part + 1);
      setShouldShowNextPartNotification(false);
    }
  };
  const onBack = () => {
    exitFullscreen();
  };

  const downloadAllAnimePart = async (force = false, askForDownload = true) => {
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
          ' (' + downloadSource.current.filter(z => z === source).length + ')';
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
  };

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
    [
      data.streamingLink.length,
      part,
      preparePartAnimationSequence,
      shouldShowNextPartNotification,
    ],
  );

  const episodeDataControl = useCallback(
    async url => {
      if (episodeDataLoadingStatus) {
        return;
      }
      setEpisodeDataLoadingStatus(true);
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
          setEpisodeDataLoadingStatus(false);
        });
      if (result === undefined) {
        return;
      }
      hasPart.current = result.streamingLink.length > 1;

      setData(result);
      setEpisodeDataLoadingStatus(false);
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
    [episodeDataLoadingStatus],
  );
  return (
    <View style={{ flex: 2 }}>
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
            <View
              style={{
                backgroundColor: '#363636',
                marginVertical: 10,
                marginHorizontal: 4,
                borderRadius: 9,
                paddingLeft: 4,
              }}>
              <Text style={[{ fontSize: 17 }, globalStyles.text]}>
                {data.title}
              </Text>
            </View>
            {
              /* mengecek apakah episodeData tersedia */
              data.episodeData && (
                <View
                  style={{
                    justifyContent: 'center',
                    alignItems: 'center',
                    flexDirection: 'row',
                  }}>
                  <TouchableOpacity
                    key="prev"
                    disabled={
                      !data.episodeData.previous ||
                      episodeDataLoadingStatus ||
                      loading
                    }
                    style={{
                      backgroundColor: data.episodeData.previous
                        ? '#00ccff'
                        : '#525252',
                      padding: 5,
                    }}
                    onPress={() =>
                      episodeDataControl(data.episodeData.previous)
                    }>
                    <Icon
                      name="arrow-left"
                      style={{ color: '#000000' }}
                      size={18}
                    />
                  </TouchableOpacity>

                  <View
                    style={{
                      height: 20,
                      width: 20,
                    }}>
                    {episodeDataLoadingStatus && (
                      <ActivityIndicator size={20} />
                    )}
                  </View>

                  <TouchableOpacity
                    key="next"
                    disabled={
                      !data.episodeData.next ||
                      episodeDataLoadingStatus ||
                      loading
                    }
                    style={{
                      backgroundColor: data.episodeData.next
                        ? '#00ccff'
                        : '#525252',
                      padding: 5,
                    }}
                    onPress={() => episodeDataControl(data.episodeData.next)}>
                    <Icon
                      name="arrow-right"
                      style={{ color: '#000000' }}
                      size={18}
                    />
                  </TouchableOpacity>
                </View>
              )
            }

            <View
              style={{
                backgroundColor: '#363636',
                marginVertical: 10,
                marginHorizontal: 2,
                paddingVertical: 5,
                borderRadius: 9,
                paddingLeft: 4,
              }}>
              <Text style={[globalStyles.text, { fontSize: 15 }]}>
                Silahkan pilih resolusi:
              </Text>
              <View style={{ flexDirection: 'row' }}>
                {data.validResolution.map(res => {
                  return (
                    <TouchableOpacity
                      key={res}
                      disabled={loading || episodeDataLoadingStatus}
                      style={{
                        alignSelf: 'flex-start',
                        paddingVertical: 1,
                        paddingHorizontal: 9,
                        marginRight: 5,
                        backgroundColor:
                          data.resolution === res ? 'orange' : '#005ca7',
                      }}
                      onPress={() => {
                        if (data.resolution !== res) {
                          setResolution(res);
                        }
                      }}>
                      <Text
                        style={{
                          color:
                            data.resolution === res
                              ? '#181818'
                              : globalStyles.text.color,
                        }}>
                        {res}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
                {loading && <ActivityIndicator />}
              </View>
            </View>

            {
              // mengecek apakah anime terdiri dari beberapa part
              data.streamingLink?.length > 1 && (
                <View
                  style={{
                    backgroundColor: '#363636',
                    marginVertical: 10,
                    marginHorizontal: 4,
                    borderRadius: 9,
                    paddingLeft: 4,
                    paddingVertical: 5,
                  }}>
                  <Text style={globalStyles.text}>Silahkan pilih part:</Text>
                  <View
                    style={{
                      flex: 1,
                      flexWrap: 'wrap',
                      flexDirection: 'row',
                    }}>
                    {data.streamingLink.map((_, i) => {
                      return (
                        <TouchableOpacity
                          key={i}
                          style={{
                            alignSelf: 'flex-start',
                            paddingVertical: 1,
                            paddingHorizontal: 9,
                            marginRight: 5,
                            marginBottom: 5,
                            backgroundColor: part === i ? 'orange' : '#005ca7',
                          }}
                          onPress={() => {
                            setPart(i);
                          }}>
                          <Text
                            style={{
                              color:
                                part === i
                                  ? '#181818'
                                  : globalStyles.text.color,
                            }}>
                            {'Part ' + (i + 1)}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  {/* info tentang part */}
                  <TouchableOpacity
                    hitSlop={8}
                    onPress={() => {
                      Alert.alert(
                        'Mengapa episode di bagi menjadi beberapa part?',
                        'Kami menjadikan episode anime dengan durasi yang panjang atau resolusi yang besar menjadi beberapa part agar proses streaming menjadi lebih lancar dan bebas error.',
                      );
                    }}
                    style={{ position: 'absolute', right: 5, top: 2 }}>
                    <Icon
                      name="info-circle"
                      style={globalStyles.text}
                      size={17}
                    />
                  </TouchableOpacity>
                </View>
              )
            }

            <View
              style={{
                backgroundColor: '#363636',
                marginVertical: 10,
                marginHorizontal: 4,
                borderRadius: 9,
                paddingLeft: 4,
              }}>
              <View style={{ flexDirection: 'row', marginBottom: 5 }}>
                <Text style={globalStyles.text}>Status:</Text>
                <Text
                  style={[
                    globalStyles.text,
                    {
                      position: 'absolute',
                      left: '40%',
                    },
                  ]}>
                  {data.status}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', marginBottom: 5 }}>
                <Text style={globalStyles.text}>Tahun rilis:</Text>
                <Text
                  style={[
                    globalStyles.text,
                    {
                      position: 'absolute',
                      left: '40%',
                    },
                  ]}>
                  {data.releaseYear}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', marginBottom: 5 }}>
                <Text style={globalStyles.text}>Rating:</Text>
                <Text
                  style={[
                    globalStyles.text,
                    {
                      position: 'absolute',
                      left: '40%',
                    },
                  ]}>
                  {data.rating}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', marginBottom: 5 }}>
                <Text style={[globalStyles.text]}>Genre:</Text>
                <View style={{ marginLeft: '5%', width: '60%' }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      flexWrap: 'wrap',
                      justifyContent: 'space-around',
                    }}>
                    {data.genre.map(mappedData => {
                      return (
                        <View
                          key={mappedData}
                          style={{
                            flexWrap: 'wrap',
                            backgroundColor: '#005272',
                            borderRadius: 2,
                            marginBottom: 5,
                          }}>
                          <Text style={[globalStyles.text]}>{mappedData}</Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              </View>
            </View>

            <View
              style={{
                backgroundColor: '#363636',
                marginTop: 10,
                marginBottom: 20,
                marginHorizontal: 4,
                borderRadius: 9,
                paddingLeft: 4,
              }}>
              {showSynopsys ? (
                <>
                  <Text style={[globalStyles.text, { fontSize: 13 }]}>
                    {data.synopsys}
                  </Text>
                  <TouchableOpacity
                    style={{ alignSelf: 'flex-start' }}
                    onPress={() => setShowSynopsys(false)}>
                    <Text style={{ color: '#7a86f1' }}>
                      Sembunyikan sinopsis
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={{ alignSelf: 'flex-start' }}
                  onPress={() => setShowSynopsys(true)}>
                  <Text style={{ color: '#7a86f1' }}>Tampilkan sinopsis</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.dlbtn}>
              <TouchableOpacity
                style={{
                  backgroundColor: '#00749b',
                  flex: 1,
                  marginRight: 5,
                }}
                onPress={() => downloadAnime()}>
                <Text
                  style={[
                    { fontWeight: 'bold', fontSize: 18, textAlign: 'center' },
                    globalStyles.text,
                  ]}>
                  Download
                  {data.streamingLink.length > 1 && ' part ini'}
                </Text>
              </TouchableOpacity>

              {data.streamingLink?.length > 1 && (
                <TouchableOpacity
                  style={{
                    backgroundColor: '#e27800',
                    flex: 1,
                  }}
                  onPress={() => downloadAllAnimePart()}>
                  <Text
                    style={[
                      {
                        fontWeight: 'bold',
                        fontSize: 18,
                        textAlign: 'center',
                      },
                      globalStyles.text,
                    ]}>
                    Download semua part
                  </Text>
                </TouchableOpacity>
              )}
            </View>
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
});
export default Video;
