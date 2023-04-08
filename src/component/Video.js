import React, { Component, useEffect, useState } from 'react';
import {
  StatusBar,
  View,
  Alert,
  ScrollView,
  Text,
  StyleSheet,
  TouchableOpacity,
  ToastAndroid,
  BackHandler,
  ActivityIndicator,
  Animated,
} from 'react-native';
import Videos from 'react-native-media-console';
import Orientation from 'react-native-orientation-locker';
import RNFetchBlob from 'rn-fetch-blob';
import globalStyles from '../assets/style';
import Icon from 'react-native-vector-icons/FontAwesome';
import SystemNavigationBar from 'react-native-system-navigation-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Battery from 'react-native-device-battery';

class Video extends Component {
  constructor(props) {
    super(props);
    this.state = {
      batteryLevel: 0,
      showBatteryLevel: false,
      showSynopsys: false,
      fullscreen: false,
      part: 0,
      loading: false,
      data: this.props.route.params.data,
      shouldShowNextPartNotification: false,
      preparePartAnimation: new Animated.Value(0),
      episodeDataLoadingStatus: false,
    };
    this.downloadSource = [];
    this.currentLink = this.props.route.params.link;
    this.hasDownloadAllPart = false;
    this.hasPart = this.state.data.streamingLink.length > 1;
    this.preparePartAnimation = Animated.sequence([
      Animated.timing(this.state.preparePartAnimation, {
        toValue: 1,
        useNativeDriver: true,
        duration: 500,
      }),
      Animated.timing(this.state.preparePartAnimation, {
        toValue: 0,
        useNativeDriver: true,
        duration: 500,
        delay: 3000,
      }),
    ]);

    this.abortController = new AbortController();

    AsyncStorage.getItem('enableNextPartNotification').then(value => {
      this.nextPartEnable = value === 'true' || value === null;
    });
  }

  async setResolution(res) {
    if (this.state.loading) {
      return;
    }
    this.setState({
      loading: true,
    });
    const results = await fetch(
      'https://animeapi.aceracia.repl.co/v2/fromUrl' +
        '?res=' +
        res +
        '&link=' +
        this.currentLink,
      {
        signal: this.abortController.signal,
      },
    ).catch(err => {
      if (err.message === 'Aborted') {
        return;
      }
      Alert.alert('Error', err.message);
      this.setState({
        loading: false,
      });
    });
    if (results === undefined) {
      return;
    }
    const data = await results.json();
    this.hasPart = data.streamingLink.length > 1;
    this.setState({
      data,
      loading: false,
      part: 0,
    });
  }

  willUnmountHandler() {
    Orientation.removeDeviceOrientationListener(this.orientationDidChange);
    Orientation.unlockAllOrientations();
    StatusBar.setHidden(false);
    SystemNavigationBar.navigationShow();
  }

  getBatteryIconComponent = () => {
    let iconName = 'battery-';
    const batteryLevel = Math.round(this.state.batteryLevel * 100);
    if (batteryLevel > 75) {
      iconName += '4';
    } else if (batteryLevel > 50) {
      iconName += '3';
    } else if (batteryLevel > 25) {
      iconName += '2';
    } else if (batteryLevel > 15) {
      iconName += '1';
    } else {
      iconName += '0';
    }
    console.log(batteryLevel);
    return <Icon name={iconName} />;
  };

  onBatteryStateChange = ({ level }) => {
    this.setState({
      batteryLevel: level,
    });
  };

  orientationDidChange = orientation => {
    if (orientation === 'PORTRAIT') {
      this.exitFullscreen();
    } else if (orientation !== 'PORTRAIT' && orientation !== 'UNKNOWN') {
      this.enterFullscreen();
    }
  };

  componentDidMount() {
    Orientation.addDeviceOrientationListener(this.orientationDidChange);
    this.back = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!this.state.fullscreen) {
        this.willUnmountHandler();
        return false;
      } else {
        this.exitFullscreen();
        return true;
      }
    });

    AsyncStorage.getItem('enableBatteryTimeInfo').then(async data => {
      if (data === 'true') {
        const batteryLevel = await Battery.getBatteryLevel();
        this.setState({
          batteryLevel,
        });
        Battery.addListener(this.onBatteryStateChange);
        this.batteryTimeEnable = true;
      }
    });
  }
  componentWillUnmount() {
    Battery.removeListener(this.onBatteryStateChange);
    this.willUnmountHandler();
    this.back.remove();
    this.abortController.abort();
  }

  enterFullscreen = () => {
    Orientation.lockToLandscape();
    StatusBar.setHidden(true);
    SystemNavigationBar.navigationHide();
    this.setState({
      fullscreen: true,
    });
  };

  exitFullscreen = () => {
    StatusBar.setHidden(false);
    Orientation.lockToPortrait();
    SystemNavigationBar.navigationShow();
    this.setState({
      fullscreen: false,
    });
  };

  downloadAnime = async (force = false) => {
    const source =
      this.state.data.streamingLink[this.state.part].sources[0].src;

    if (this.downloadSource.includes(source) && force === false) {
      Alert.alert(
        'Lanjutkan?',
        'kamu sudah mengunduh bagian ini. Masih ingin melanjutkan?',
        [
          {
            text: 'Batalkan',
            style: 'cancel',
            onPress: () => null,
          },
          {
            text: 'Lanjutkan',
            onPress: () => {
              this.downloadAnime(true);
            },
          },
        ],
      );
      return;
    }

    let Title =
      this.state.data.streamingLink.length > 1
        ? this.state.data.title + ' Part ' + (this.state.part + 1)
        : this.state.data.title;

    if (force === true) {
      Title +=
        ' (' + this.downloadSource.filter(z => z === source).length + ')';
    }

    this.downloadSource = [...this.downloadSource, source];

    RNFetchBlob.config({
      addAndroidDownloads: {
        useDownloadManager: true,
        path:
          '/storage/emulated/0/Download' +
          '/' +
          Title +
          ' ' +
          this.state.data.resolution +
          '.mp4',
        notification: true,
        mime: 'video/mp4',
        title: Title + ' ' + this.state.data.resolution + '.mp4',
      },
    })
      .fetch('GET', source)
      .then(resp => {
        // the path of downloaded file
        resp.path();
      })
      .catch(() => {});
    ToastAndroid.show('Sedang mendownload...', ToastAndroid.SHORT);
  };

  onEnd = () => {
    if (this.state.part < this.state.data.streamingLink.length - 1) {
      this.setState({
        part: this.state.part + 1,
        shouldShowNextPartNotification: false,
      });
    }
  };
  onBack = () => {
    this.exitFullscreen();
  };

  downloadAllAnimePart = async (force = false, askForDownload = false) => {
    if (this.hasDownloadAllPart && force === false) {
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
              this.downloadAllAnimePart(true, true);
            },
          },
        ],
      );
      return;
    }

    if (askForDownload) {
      Alert.alert(
        'Download semua part?',
        `Ini akan mendownload semua (${this.state.data.streamingLink.length}) part`,
        [
          {
            text: 'Tidak',
            style: 'cancel',
            onPress: () => null,
          },
          {
            text: 'Ya',
            onPress: () => {
              this.downloadAllAnimePart(true);
            },
          },
        ],
      );
      return;
    }

    for (let i = 0; i < this.state.data.streamingLink.length; i++) {
      const source = this.state.data.streamingLink[i].sources[0].src;

      let Title = this.state.data.title + ' Part ' + (i + 1);

      if (this.hasDownloadAllPart) {
        Title +=
          ' (' + this.downloadSource.filter(z => z === source).length + ')';
      }

      this.downloadSource = [...this.downloadSource, source];

      RNFetchBlob.config({
        addAndroidDownloads: {
          useDownloadManager: true,
          path:
            '/storage/emulated/0/Download' +
            '/' +
            Title +
            ' ' +
            this.state.data.resolution +
            '.mp4',
          notification: true,
          mime: 'video/mp4',
          title: Title + ' ' + this.state.data.resolution + '.mp4',
        },
      })
        .fetch('GET', source)
        .then(resp => {
          // the path of downloaded file
          resp.path();
        })
        .catch(() => {});
      ToastAndroid.show('Sedang mendownload...', ToastAndroid.SHORT);
    }
    this.hasDownloadAllPart = true;
  };

  handleProgress = data => {
    if (this.hasPart) {
      const remainingTime = data.seekableDuration - data.currentTime;
      if (
        remainingTime < 10 &&
        this.state.shouldShowNextPartNotification === false &&
        this.state.part < this.state.data.streamingLink.length - 1 &&
        this.nextPartEnable
      ) {
        this.setState(
          {
            shouldShowNextPartNotification: true,
          },
          () =>
            Animated.loop(this.preparePartAnimation, { iterations: 1 }).start(),
        );
      }
      if (
        remainingTime > 10 &&
        this.state.shouldShowNextPartNotification === true
      ) {
        this.setState({
          shouldShowNextPartNotification: false,
        });
      }
    }
  };

  episodeDataControl = async url => {
    if (this.state.episodeDataLoadingStatus) {
      return;
    }
    this.setState({
      episodeDataLoadingStatus: true,
    });
    const results = await fetch(
      'https://animeapi.aceracia.repl.co/v2/fromUrl' + '?link=' + url,
      {
        signal: this.abortController.signal,
      },
    ).catch(err => {
      if (err.message === 'Aborted') {
        return;
      }
      Alert.alert('Error', err.message);
      this.setState({
        episodeDataLoadingStatus: false,
      });
    });
    if (results === undefined) {
      return;
    }
    const result = await results.json();
    this.hasPart = result.streamingLink.length > 1;
    this.setState(
      {
        data: result,
        episodeDataLoadingStatus: false,
        part: 0,
      },
      () => (this.currentLink = url),
    );
    (async () => {
      let data = await AsyncStorage.getItem('history');
      if (data === null) {
        data = '[]';
      }
      data = JSON.parse(data);
      const episodeI = result.title.toLowerCase().indexOf('episode');
      const title =
        episodeI >= 0 ? result.title.slice(0, episodeI) : result.title;
      const episode = episodeI < 0 ? null : result.title.slice(episodeI);
      const dataINDEX = data.findIndex(val => val.title === title);
      if (dataINDEX >= 0) {
        data.splice(dataINDEX, 1);
      }
      data.splice(0, 0, {
        title,
        episode,
        link: url,
        thumbnailUrl: result.thumbnailUrl,
        date: Date.now(),
      });
      AsyncStorage.setItem('history', JSON.stringify(data));
    })();
  };

  render() {
    return (
      <View style={{ flex: 2 }}>
        {/* VIDEO ELEMENT */}
        <View
          style={[
            this.state.fullscreen ? styles.fullscreen : styles.notFullscreen,
          ]}>
          {/* notifikasi part selanjutnya */}
          {this.state.shouldShowNextPartNotification && (
            <>
              <Animated.View
                style={{
                  zIndex: 1,
                  alignItems: 'center',
                  opacity: this.state.preparePartAnimation,
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
          {this.state.fullscreen && this.batteryTimeEnable && (
            <View style={styles.batteryInfo} pointerEvents="none">
              {this.getBatteryIconComponent()}
              <Text style={globalStyles.text}>
                {' '}
                {Math.round(this.state.batteryLevel * 100)}%
              </Text>
            </View>
          )}

          {/* info waktu/jam */}
          {this.state.fullscreen && this.batteryTimeEnable && (
            <View style={styles.timeInfo} pointerEvents="none">
              <TimeInfo />
            </View>
          )}

          {
            // mengecek apakah video tersedia
            this.state.data.streamingLink?.[this.state.part]?.sources[0].src ? (
              <Videos
                key={
                  this.state.data.streamingLink[this.state.part].sources[0].src
                }
                showOnEnd={true}
                title={this.state.data.title}
                disableBack={!this.state.fullscreen}
                onBack={this.onBack}
                toggleResizeModeOnFullscreen={false}
                isFullscreen={this.state.fullscreen}
                onEnterFullscreen={this.enterFullscreen}
                onExitFullscreen={this.exitFullscreen}
                source={{
                  uri: this.state.data.streamingLink[this.state.part].sources[0]
                    .src,
                }}
                onEnd={this.onEnd}
                rewindTime={10}
                showDuration={true}
                onProgress={this.handleProgress}
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
          !this.state.fullscreen && (
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
                  {this.state.data.title}
                </Text>
              </View>
              {
                /* mengecek apakah episodeData tersedia */
                this.state.data.episodeData && (
                  <View
                    style={{
                      justifyContent: 'center',
                      alignItems: 'center',
                      flexDirection: 'row',
                    }}>
                    <TouchableOpacity
                      key="prev"
                      disabled={
                        !this.state.data.episodeData.previous ||
                        this.state.episodeDataLoadingStatus
                      }
                      style={{
                        backgroundColor: this.state.data.episodeData.previous
                          ? '#00ccff'
                          : '#525252',
                        padding: 5,
                      }}
                      onPress={() =>
                        this.episodeDataControl(
                          this.state.data.episodeData.previous,
                        )
                      }>
                      <Icon name="arrow-left" size={18} />
                    </TouchableOpacity>

                    <View
                      style={{
                        height: 20,
                        width: 20,
                      }}>
                      {this.state.episodeDataLoadingStatus && (
                        <ActivityIndicator size={20} />
                      )}
                    </View>

                    <TouchableOpacity
                      key="next"
                      disabled={
                        !this.state.data.episodeData.next ||
                        this.state.episodeDataLoadingStatus
                      }
                      style={{
                        backgroundColor: this.state.data.episodeData.next
                          ? '#00ccff'
                          : '#525252',
                        padding: 5,
                      }}
                      onPress={() =>
                        this.episodeDataControl(
                          this.state.data.episodeData.next,
                        )
                      }>
                      <Icon name="arrow-right" size={18} />
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
                  {this.state.data.validResolution.map(res => {
                    return (
                      <TouchableOpacity
                        key={res}
                        style={{
                          alignSelf: 'flex-start',
                          paddingVertical: 1,
                          paddingHorizontal: 9,
                          marginRight: 5,
                          backgroundColor:
                            this.state.data.resolution === res
                              ? 'orange'
                              : '#005ca7',
                        }}
                        onPress={() => {
                          if (this.state.data.resolution !== res) {
                            this.setResolution(res);
                          }
                        }}>
                        <Text
                          style={{
                            color:
                              this.state.data.resolution === res
                                ? '#181818'
                                : globalStyles.text.color,
                          }}>
                          {res}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                  {this.state.loading && <ActivityIndicator />}
                </View>
              </View>

              {
                // mengecek apakah anime terdiri dari beberapa part
                this.state.data.streamingLink?.length > 1 && (
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
                      {this.state.data.streamingLink.map((_, i) => {
                        return (
                          <TouchableOpacity
                            key={i}
                            style={{
                              alignSelf: 'flex-start',
                              paddingVertical: 1,
                              paddingHorizontal: 9,
                              marginRight: 5,
                              marginBottom: 5,
                              backgroundColor:
                                this.state.part === i ? 'orange' : '#005ca7',
                            }}
                            onPress={() => {
                              this.setState({
                                part: i,
                              });
                            }}>
                            <Text
                              style={{
                                color:
                                  this.state.part === i
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
                      <Icon name="info-circle" size={17} />
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
                    {this.state.data.status}
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
                    {this.state.data.releaseYear}
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
                    {this.state.data.rating}
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
                      {this.state.data.genre.map(data => {
                        return (
                          <View
                            key={data}
                            style={{
                              flexWrap: 'wrap',
                              backgroundColor: '#005272',
                              borderRadius: 2,
                              marginBottom: 5,
                            }}>
                            <Text style={[globalStyles.text]}>{data}</Text>
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
                {this.state.showSynopsys ? (
                  <>
                    <Text style={[globalStyles.text, { fontSize: 13 }]}>
                      {this.state.data.synopsys}
                    </Text>
                    <TouchableOpacity
                      style={{ alignSelf: 'flex-start' }}
                      onPress={() =>
                        this.setState({
                          showSynopsys: false,
                        })
                      }>
                      <Text style={{ color: '#7a86f1' }}>
                        Sembunyikan sinopsis
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity
                    style={{ alignSelf: 'flex-start' }}
                    onPress={() =>
                      this.setState({
                        showSynopsys: true,
                      })
                    }>
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
                  onPress={() => this.downloadAnime()}>
                  <Text
                    style={[
                      { fontWeight: 'bold', fontSize: 18, textAlign: 'center' },
                      globalStyles.text,
                    ]}>
                    Download
                    {this.state.data.streamingLink.length > 1 && ' part ini'}
                  </Text>
                </TouchableOpacity>

                {this.state.data.streamingLink?.length > 1 && (
                  <TouchableOpacity
                    style={{
                      backgroundColor: '#e27800',
                      flex: 1,
                    }}
                    onPress={() => this.downloadAllAnimePart(undefined, true)}>
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
}

function TimeInfo() {
  const date = new Date();
  const [time, setTime] = useState(`${date.getHours()}:${date.getMinutes()}`);

  const interval = setInterval(() => {
    const currentDate = new Date();
    const newDate = `${currentDate.getHours()}:${currentDate.getMinutes()}`;
    if (time !== newDate) {
      setTime(newDate);
    }
  }, 1_000);

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
