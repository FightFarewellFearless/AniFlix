import React, { Component } from 'react';
import {
    StatusBar,
    View,
    Alert,
    ScrollView,
    Text,
    StyleSheet,
    TouchableOpacity,
    Button,
    ToastAndroid,
    BackHandler,
    ActivityIndicator,
} from 'react-native';
import Videos from 'react-native-media-console';
import Orientation from 'react-native-orientation-locker';
import RNFetchBlob from 'rn-fetch-blob';
import style from './assets/style';
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
        };
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

    downloadAnime = async () => {
        const Title =
            this.state.data.streamingLink.length > 1
                ? this.state.data.title + ' Part ' + (this.state.part + 1)
                : this.state.data.title;
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
            .fetch(
                'GET',
                this.state.data.streamingLink[this.state.part].sources[0].src,
            )
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
            });
        }
    };
    onBack = () => {
        this.exitFullscreen();
    };

    render() {
        return (
            <View style={{ flex: 2 }}>
                {/* VIDEO ELEMENT */}
                <View
                    style={[
                        this.state.fullscreen
                            ? styles.fullscreen
                            : styles.notFullscreen,
                    ]}>
                    {
                        // mengecek apakah video tersedia
                        this.state.data.streamingLink?.[this.state.part]
                            ?.sources[0].src ? (
                            <Videos
                                key={
                                    this.state.data.streamingLink[
                                        this.state.part
                                    ].sources[0].src
                                }
                                title={this.state.data.title}
                                disableBack={!this.state.fullscreen}
                                onBack={this.onBack}
                                toggleResizeModeOnFullscreen={false}
                                isFullscreen={this.state.fullscreen}
                                onEnterFullscreen={this.enterFullscreen.bind(
                                    this,
                                )}
                                onExitFullscreen={this.exitFullscreen.bind(
                                    this,
                                )}
                                source={{
                                    uri: this.state.data.streamingLink[
                                        this.state.part
                                    ].sources[0].src,
                                }}
                                onEnd={this.onEnd}
                                rewindTime={10}
                                showDuration={true}
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
                                    {this.state.data.validResolution.map(
                                        res => {
                                            return (
                                                <TouchableOpacity
                                                    key={res}
                                                    style={{
                                                        width: 50,
                                                        marginRight: 5,
                                                        backgroundColor:
                                                            this.state.data
                                                                .resolution ===
                                                            res
                                                                ? 'orange'
                                                                : 'blue',
                                                    }}
                                                    onPress={() => {
                                                        if (
                                                            this.state.data
                                                                .resolution !==
                                                            res
                                                        ) {
                                                            this.setResolution(
                                                                res,
                                                            );
                                                        }
                                                    }}>
                                                    <Text style={style.text}>
                                                        {res}
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        },
                                    )}
                                    {this.state.loading && (
                                        <ActivityIndicator />
                                    )}
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
                                        <Text style={style.text}>
                                            Silahkan pilih part:
                                        </Text>
                                        <View
                                            style={{
                                                flex: 1,
                                                flexWrap: 'wrap',
                                                flexDirection: 'row',
                                            }}>
                                            {this.state.data.streamingLink.map(
                                                (_, i) => {
                                                    return (
                                                        <TouchableOpacity
                                                            key={i}
                                                            style={{
                                                                width: 50,
                                                                marginRight: 5,
                                                                marginBottom: 5,
                                                                backgroundColor:
                                                                    this.state
                                                                        .part ===
                                                                    i
                                                                        ? 'orange'
                                                                        : 'blue',
                                                            }}
                                                            onPress={() => {
                                                                this.setState({
                                                                    part: i,
                                                                });
                                                            }}>
                                                            <Text
                                                                style={
                                                                    style.text
                                                                }>
                                                                {'Part ' +
                                                                    (i + 1)}
                                                            </Text>
                                                        </TouchableOpacity>
                                                    );
                                                },
                                            )}
                                        </View>
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
                                        <Text
                                            style={[
                                                style.text,
                                                { fontSize: 13 },
                                            ]}>
                                            {this.state.data.synopsys}
                                        </Text>
                                        <TouchableOpacity
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
                                        onPress={() =>
                                            this.setState({
                                                showSynopsys: true,
                                            })
                                        }>
                                        <Text style={{ color: '#7a86f1' }}>
                                            Tampilkan sinopsis
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                            <Button
                                style={styles.dlbtn}
                                title={
                                    'Download' +
                                    (this.state.data.streamingLink.length > 1
                                        ? ' part ini'
                                        : '')
                                }
                                onPress={this.downloadAnime}
                            />
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
        marginTop: 20,
    },
});
export default Video;
