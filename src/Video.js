import React, { Component } from 'react';
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
import style from './assets/style';
import Icon from 'react-native-vector-icons/FontAwesome';
import SystemNavigationBar from 'react-native-system-navigation-bar';

class Video extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showSynopsys: false,
      fullscreen: false,
      part: 0,
      loading: false,
      data: this.props.route.params.data,
      shouldPrepareNextPart: false,
      preparePartAnimation: new Animated.Value(0),
    };
    this.downloadSource = [];
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
  }

  async setResolution(res) {
    if (this.state.loading) {
      return;
    }
    this.setState({
      loading: true,
    });
    const results = await fetch(
      'https://animeapi.aceracia.repl.co/fromUrl' +
        '?res=' +
        res +
        '&link=' +
        this.props.route.params.link,
    ).catch(err => {
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

  componentDidMount() {
    Orientation.lockToPortrait();
    this.back = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!this.state.fullscreen) {
        Orientation.unlockAllOrientations();
        StatusBar.setHidden(false);
        SystemNavigationBar.navigationShow();
        return false;
      } else {
        this.exitFullscreen();
        return true;
      }
    });
  }
  componentWillUnmount() {
    Orientation.unlockAllOrientations();
    this.back.remove();
    StatusBar.setHidden(false);
    SystemNavigationBar.navigationShow();
  }

  enterFullscreen() {
    Orientation.lockToLandscape();
    StatusBar.setHidden(true);
    SystemNavigationBar.navigationHide();
    this.setState({
      fullscreen: true,
    });
  }

  exitFullscreen() {
    StatusBar.setHidden(false);
    Orientation.lockToPortrait();
    SystemNavigationBar.navigationShow();
    this.setState({
      fullscreen: false,
    });
  }

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
        shouldPrepareNextPart: false,
      });
    }
  };
  onBack = () => {
    this.exitFullscreen();
  };

  downloadAllAnimePart = async (force = false) => {
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
    }
    this.hasDownloadAllPart = true;
  };

  handleProgress = data => {
    if (this.hasPart) {
      const remainingTime = data.seekableDuration - data.currentTime;
      if (remainingTime < 10 && this.state.shouldPrepareNextPart === false) {
        this.setState(
          {
            shouldPrepareNextPart: true,
          },
          () =>
            Animated.loop(this.preparePartAnimation, { iterations: 1 }).start(),
        );
      }
      if (remainingTime > 10 && this.state.shouldPrepareNextPart === true) {
        this.setState({
          shouldPrepareNextPart: false,
        });
      }
    }
  };

  render() {
    return (
      <View style={{ flex: 2 }}>
        {/* VIDEO ELEMENT */}
        <View
          style={[
            this.state.fullscreen ? styles.fullscreen : styles.notFullscreen,
          ]}>
          {this.state.shouldPrepareNextPart && (
            <>
              <Animated.View
                style={{
                  zIndex: 1,
                  alignItems: 'center',
                  opacity: this.state.preparePartAnimation,
                }}>
                <View
                  style={{
                    position: 'absolute',
                    top: 10,
                    backgroundColor: '#0000005e',
                    padding: 3,
                    borderRadius: 5,
                  }}>
                  <Text style={{ color: style.text.color, opacity: 1 }}>
                    Bersiap ke part selanjutnya
                  </Text>
                </View>
              </Animated.View>
            </>
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
                onEnterFullscreen={this.enterFullscreen.bind(this)}
                onExitFullscreen={this.exitFullscreen.bind(this)}
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
              <Text style={style.text}>Video tidak tersedia</Text>
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
                <Text style={[{ fontSize: 17 }, style.text]}>
                  {this.state.data.title}
                </Text>
              </View>

              <View
                style={{
                  backgroundColor: '#363636',
                  marginVertical: 10,
                  marginHorizontal: 2,
                  paddingVertical: 5,
                  borderRadius: 9,
                  paddingLeft: 4,
                }}>
                <Text style={[style.text, { fontSize: 15 }]}>
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
                              : 'blue',
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
                                : style.text.color,
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
                    <Text style={style.text}>Silahkan pilih part:</Text>
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
                                this.state.part === i ? 'orange' : 'blue',
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
                                    : style.text.color,
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
                  marginTop: 10,
                  marginBottom: 20,
                  marginHorizontal: 4,
                  borderRadius: 9,
                  paddingLeft: 4,
                }}>
                {this.state.showSynopsys ? (
                  <>
                    <Text style={[style.text, { fontSize: 13 }]}>
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
                      style.text,
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
                    onPress={() => this.downloadAllAnimePart()}>
                    <Text
                      style={[
                        {
                          fontWeight: 'bold',
                          fontSize: 18,
                          textAlign: 'center',
                        },
                        style.text,
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

const styles = StyleSheet.create({
  fullscreen: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  notFullscreen: {
    position: 'relative',
    flex: 0.4,
  },
  dlbtn: {
    flex: 1,
    flexDirection: 'row',
  },
});
export default Video;
