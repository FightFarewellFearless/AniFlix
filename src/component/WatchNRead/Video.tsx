import { Dropdown, IDropdownRef } from '@pirles/react-native-element-dropdown';
import Icon from '@react-native-vector-icons/fontawesome';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import { useFocusEffect } from '@react-navigation/core';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import cheerio from 'cheerio';
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
import { Pressable, ScrollView, Text, ToastAndroid, useColorScheme, View } from 'react-native';
import Orientation from 'react-native-orientation-locker';
import { Button, useTheme } from 'react-native-paper';
import ReAnimated, { useAnimatedRef } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import WebView from 'react-native-webview';
import url from 'url';

import { TouchableOpacity } from '@component/misc/TouchableOpacityRNGH';

import useGlobalStyles, { darkText, lightText } from '@assets/style';
import useDownloadAnimeFunction from '@utils/downloadAnime';
import setHistory from '@utils/historyControl';

import { AniDetail } from '@/types/anime';
import { RootStackNavigator } from '@/types/navigation';
import Skeleton from '@component/misc/Skeleton';
import VideoPlayer, { PlayerRef } from '@component/VideoPlayer';
import { useBackHandler } from '@hooks/useBackHandler';
import AnimeAPI from '@utils/AnimeAPI';
import { useKeyValueIfFocused } from '@utils/DatabaseManager';
import deviceUserAgent from '@utils/deviceUserAgent';
import DialogManager from '@utils/dialogManager';
import {
  getMovieDetail,
  getRawDataIfAvailable,
  getStreamingDetail,
  MovieDetail,
} from '@utils/scrapers/animeMovie';
import {
  LoadingModal,
  TimeInfo,
  useBatteryAndClock,
  useFullscreenControl,
  useSynopsisControl,
  useVideoStyles,
} from './SharedVideo';

type Props = NativeStackScreenProps<RootStackNavigator, 'Video'>;

const defaultLoadingGif =
  'https://cdn.dribbble.com/users/2973561/screenshots/5757826/loading__.gif';

function Video(props: Props) {
  const colorScheme = useColorScheme();

  const theme = useTheme();
  const globalStyles = useGlobalStyles();
  const styles = useVideoStyles();

  const enableBatteryTimeInfo = useKeyValueIfFocused('enableBatteryTimeInfo');

  const historyData = useRef(props.route.params.historyData);

  // const [showBatteryLevel, setShowBatteryLevel] = useState(false);
  const [showSynopsis, setShowSynopsis] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(props.route.params.data);

  const currentData = useRef(data);
  currentData.current = data;

  const downloadSource = useRef<string[]>([]);
  const currentLink = useRef(props.route.params.link);
  const firstTimeLoad = useRef(true);
  const videoRef = useRef<VideoView>(null);
  const playerRef = useRef<PlayerRef>(null);
  const webviewRef = useRef<WebView>(null);
  const dropdownResolutionRef = useRef<IDropdownRef>(null);
  const embedInformationRef = useRef<View>(null);

  const synopsisTextRef = useAnimatedRef<Text>();

  const [animeDetail, setAnimeDetail] = useState<
    | ((MovieDetail & { status: 'Movie'; releaseYear: string }) | Omit<AniDetail, 'episodeList'>)
    | undefined
  >(undefined);

  useEffect(() => {
    if (props.route.params.isMovie) {
      getMovieDetail(data.episodeData.animeDetail).then(detail => {
        if ('isError' in detail) {
          DialogManager.alert(
            'Error',
            'Inisialisasi data movie gagal! Silahkan buka ulang aplikasi/reload/ketuk teks merah pada beranda untuk mencoba mengambil data yang diperlukan',
          );
          return;
        }
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
        if (detail.genres.includes('')) {
          DialogManager.alert(
            'Perhatian!',
            'Anime ini mengandung genre ecchi. Mohon bijak dalam menonton.',
          );
        }
        setAnimeDetail(detail);
      }
    });
  }, [data.episodeData.animeDetail, props.navigation, props.route.params.isMovie]);

  const downloadAnimeFunction = useDownloadAnimeFunction();

  const lastSavedTimeRef = useRef<number>(0);
  const currentTimeRef = useRef<number>(0);
  const saveProgressToHistory = useCallback(() => {
    if (!(currentTimeRef.current > 5)) return;
    historyData.current = {
      resolution: historyData.current?.resolution,
      lastDuration: currentTimeRef.current,
    };
    setHistory(
      currentData.current,
      currentLink.current,
      true,
      {
        lastDuration: currentTimeRef.current,
      },
      props.route.params.isMovie,
    );
  }, [props.route.params.isMovie]);
  const updateHistory = useCallback(
    (currentTime: number) => {
      currentTimeRef.current = currentTime;

      if (Math.abs(currentTime - lastSavedTimeRef.current) > 30) {
        lastSavedTimeRef.current = currentTime;

        saveProgressToHistory();
      }
    },
    [saveProgressToHistory],
  );

  const abortController = useRef<AbortController | null>(null);

  const [isPaused, setIsPaused] = useState(false);

  const { fullscreen, enterFullscreen, exitFullscreen, orientationDidChange, willUnmountHandler } =
    useFullscreenControl(() => dropdownResolutionRef.current?.close());

  const { batteryLevel, batteryTimeEnable, BatteryIcon } = useBatteryAndClock(
    enableBatteryTimeInfo as string,
  );

  const {
    synopsisTextLength,
    hadSynopsisMeasured,
    infoContainerStyle,
    measureAndUpdateSynopsisLayout,
    onSynopsisPress,
    onSynopsisPressIn,
    onSynopsisPressOut,
  } = useSynopsisControl(synopsisTextRef, showSynopsis, setShowSynopsis);

  // didMount and willUnmount
  useFocusEffect(
    useCallback(() => {
      abortController.current = new AbortController();
      Orientation.addDeviceOrientationListener(orientationDidChange);

      return () => {
        Orientation.removeDeviceOrientationListener(orientationDidChange);
        willUnmountHandler();
        abortController.current?.abort();
      };
    }, [orientationDidChange, willUnmountHandler]),
  );
  useFocusEffect(
    useCallback(() => {
      return () => {
        saveProgressToHistory();
      };
    }, [saveProgressToHistory]),
  );

  // set header title
  useLayoutEffect(() => {
    props.navigation.setOptions({
      headerTitle: data.title,
      headerShown: !fullscreen,
    });
  }, [data, fullscreen, props.navigation]);

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
          DialogManager.alert('Error', errMessage);
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
        DialogManager.alert('Ganti resolusi gagal', 'Gagal mengganti resolusi karena data kosong!');
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
            response?.headers.get('content-type')?.includes('octet-stream') ||
            resultData.includes('filedon')
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
      updateHistory(currentTime);
    },
    [updateHistory],
  );

  const episodeDataControl = useCallback(
    async (dataLink: string) => {
      if (loading) {
        return;
      }
      setLoading(true);
      if (props.route.params.isMovie) {
        const result = await getStreamingDetail(dataLink, abortController.current?.signal).catch(
          err => {
            if (err.message === 'canceled') {
              return;
            }
            const errMessage =
              err.message === 'Network Error'
                ? 'Permintaan gagal.\nPastikan kamu terhubung dengan internet'
                : 'Error tidak diketahui: ' + err.message;
            DialogManager.alert('Error', errMessage);
            setLoading(false);
          },
        );
        if (result === undefined) return;
        if ('isError' in result) {
          DialogManager.alert(
            'Error',
            'Inisialisasi data movie gagal! Silahkan buka ulang aplikasi/reload/ketuk teks merah pada beranda untuk mencoba mengambil data yang diperlukan',
          );
        } else {
          setData(result);
          setHistory(result, dataLink, undefined, undefined, props.route.params.isMovie);
        }
      } else {
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
          DialogManager.alert('Error', errMessage);
          setLoading(false);
        });
        if (result === undefined) {
          return;
        }
        if (result === 'Unsupported') {
          DialogManager.alert(
            'Tidak didukung!',
            'Anime yang kamu tuju tidak memiliki data yang didukung!',
          );
          setLoading(false);
          return;
        }

        if (result.type !== 'animeStreaming') {
          setLoading(false);
          DialogManager.alert(
            'Kesalahan!!',
            'Hasil perminataan tampaknya bukan data yang diharapkan, sepertinya ada kesalahan yang tidak diketahui.',
          );
          return;
        }

        setData(result);
        setHistory(result, dataLink, undefined, undefined);
      }
      setLoading(false);
      firstTimeLoad.current = false;
      historyData.current = undefined;
      currentLink.current = dataLink;
    },
    [loading, props.route.params.isMovie],
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
      videoRef.current?.props?.player?.pause();
      saveProgressToHistory();
    } else {
      videoRef.current?.props?.player?.play();
    }
  }, [isPaused, saveProgressToHistory]);

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

  const initialRender = useRef(true);
  useFocusEffect(
    useCallback(() => {
      fullscreen; // fix for react hooks deps. This is need because we need to call the code below when changing fullscreen state
      if (initialRender.current) {
        initialRender.current = false;
        return;
      }
      const mightBeTimeoutID = measureAndUpdateSynopsisLayout(true);
      return () => {
        clearTimeout(mightBeTimeoutID);
      };
    }, [fullscreen, measureAndUpdateSynopsisLayout]),
  );
  useLayoutEffect(() => {
    measureAndUpdateSynopsisLayout();
  }, [
    animeDetail?.synopsis,
    animeDetail?.rating,
    animeDetail?.genres,
    measureAndUpdateSynopsisLayout,
  ]);

  const batteryAndClock = (
    <>
      {/* info baterai */}
      {fullscreen && batteryTimeEnable && (
        <View style={[styles.batteryInfo]} pointerEvents="none">
          <BatteryIcon />
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

  const resolutionDropdownData = useMemo(() => {
    return Object.entries(data.resolutionRaw)
      .filter(z => z[1] !== undefined)
      .map(z => {
        return { label: z[1].resolution, value: z[1] };
      });
  }, [data.resolutionRaw]);

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
        {
          // mengecek apakah video tersedia
          data.streamingType === 'raw' ? (
            <VideoPlayer
              // key={data.streamingLink}
              title={data.title}
              thumbnailURL={data.thumbnailUrl}
              streamingURL={data.streamingLink}
              style={{ flex: 1, zIndex: 1 }}
              videoRef={videoRef}
              ref={playerRef}
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
            // <>
            //   {/* TEMP|TODO|WORKAROUND: Temporary fix for webview layout not working properly when using native-stack */}
            //   <VideoPlayer title="" streamingURL="" style={{ display: 'none' }} />
            <WebView
              style={{ flex: 1, zIndex: 1 }}
              ref={webviewRef}
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
                      html: `
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Document</title>
</head>
<body>
  <iframe
    src="${data.streamingLink}"
    style="width: 100vw; height: 100vh;"
    allowFullScreen
  ></iframe>
</body>`,
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
            // </>
            <Text style={{ color: 'white' }}>Video tidak tersedia</Text>
          )
        }
        {data.streamingType === 'embed' && batteryAndClock}
      </View>
      {/* END OF VIDEO ELEMENT */}
      {/* 
        mengecek apakah sedang dalam keadaan fullscreen atau tidak
        jika ya, maka hanya menampilkan video saja 
       */}
      <ScrollView
        style={{ flex: 1, display: fullscreen ? 'none' : 'flex' }}
        contentContainerStyle={{ paddingBottom: insets.bottom }}>
        {/* movie information */}
        {props.route.params.isMovie && (
          <View style={{ backgroundColor: theme.colors.secondaryContainer, marginVertical: 5 }}>
            <Icon
              name="film"
              color={theme.colors.onSecondaryContainer}
              size={26}
              style={{ alignSelf: 'center' }}
            />
            <Text
              style={{
                color: theme.colors.onSecondaryContainer,
                textAlign: 'center',
                fontSize: 14,
                fontWeight: 'bold',
              }}>
              Perhatian!
            </Text>
            <Text style={{ color: theme.colors.onSecondaryContainer }}>
              Jika kamu mengalami masalah menonton, silahkan ganti resolusi/server
            </Text>
          </View>
        )}
        {/* acefile embed information */}
        {(data.resolution?.includes('acefile') || data.resolution?.includes('video')) &&
          data.streamingType === 'embed' && (
            <View style={{ backgroundColor: theme.colors.tertiaryContainer, marginVertical: 5 }}>
              <Icon
                name="server"
                color={theme.colors.onTertiaryContainer}
                size={26}
                style={{ alignSelf: 'center' }}
              />
              <Text
                style={{
                  color: theme.colors.onTertiaryContainer,
                  textAlign: 'center',
                  fontSize: 14,
                  fontWeight: 'bold',
                }}>
                AceFile
              </Text>
              <Text style={{ color: theme.colors.onTertiaryContainer }}>
                Tampaknya server AceFile untuk resolusi ini mengalami masalah. Terkadang server
                membutuhkan beberapa waktu untuk memproses data, silahkan coba lagi. Jika masalah
                berlanjut silahkan ganti server atau resolusi lain.
              </Text>
            </View>
          )}
        {/* embed player information */}
        {data.streamingType === 'embed' && (
          <View ref={embedInformationRef}>
            <View
              style={{
                backgroundColor: theme.colors.tertiaryContainer,
                marginVertical: 5,
              }}>
              <TouchableOpacity
                style={{ alignSelf: 'flex-end' }}
                onPress={() => {
                  embedInformationRef.current?.setNativeProps({ display: 'none' });
                }}>
                <Icon name="close" color={theme.colors.onTertiaryContainer} size={26} />
              </TouchableOpacity>
              <Icon
                name="lightbulb-o"
                color={theme.colors.onTertiaryContainer}
                size={26}
                style={{ alignSelf: 'center' }}
              />
              <Text style={{ color: theme.colors.onTertiaryContainer }}>
                Kamu saat ini menggunakan video player pihak ketiga dikarenakan data dengan format
                yang biasa digunakan tidak tersedia. Fitur ini masih eksperimental.{'\n'}
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
                backgroundColor: theme.colors.tertiaryContainer,
              }}>
              <MaterialCommunityIcons
                name="screen-rotation"
                color={theme.colors.onTertiaryContainer}
                size={26}
                style={{ alignSelf: 'center' }}
              />
              <Text style={{ color: theme.colors.onTertiaryContainer }}>
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
            <Icon
              name="refresh"
              color={theme.colors.onSecondaryContainer}
              size={15}
              style={{ alignSelf: 'center' }}
            />
            <Text style={{ color: theme.colors.onSecondaryContainer }}>Reload video player</Text>
          </TouchableOpacity>
        )}
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
              style={[globalStyles.text, styles.infoSinopsis, infoContainerStyle]}
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
                  backgroundColor:
                    animeDetail?.status === 'Completed' || animeDetail?.status === 'Movie'
                      ? 'green'
                      : 'red',
                },
              ]}>
              {animeDetail?.status}
            </Text>
            <Text style={[{ color: lightText }, styles.releaseYear]}>
              <Icon name="calendar" color={styles.releaseYear.color} /> {animeDetail?.releaseYear}
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

        <View style={[styles.container, { marginTop: 10, gap: 10 }]}>
          {data.episodeData && (
            <View style={[styles.episodeDataControl]}>
              <Button
                mode="contained-tonal"
                icon="arrow-left"
                key="prev"
                disabled={!data.episodeData.previous}
                style={[styles.episodeDataControlButton]}
                onPress={async () => {
                  await episodeDataControl(data.episodeData?.previous as string); // ignoring the undefined type because we already have the button disabled
                }}>
                Sebelumnya
              </Button>

              <Button
                mode="contained-tonal"
                icon="arrow-right"
                key="next"
                disabled={!data.episodeData.next}
                style={[styles.episodeDataControlButton]}
                contentStyle={{ flexDirection: 'row-reverse' }}
                onPress={async () => {
                  await episodeDataControl(data.episodeData?.next as string); // ignoring the undefined type because we already have the button disabled
                }}>
                Selanjutnya
              </Button>
            </View>
          )}
          <TouchableOpacity
            style={{ maxWidth: '50%' }}
            onPress={() => {
              dropdownResolutionRef.current?.open();
            }}>
            <View pointerEvents="box-only">
              <Dropdown
                ref={dropdownResolutionRef}
                value={{
                  label: data.resolution,
                  value:
                    data.resolutionRaw?.[
                      data.resolutionRaw.findIndex(e => e.resolution === data.resolution)
                    ],
                }}
                placeholder="Pilih resolusi"
                data={resolutionDropdownData}
                valueField="value"
                labelField="label"
                onChange={async val => {
                  await setResolution(val.value.dataContent, val.label);
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
          </TouchableOpacity>
        </View>

        {data.resolution?.includes('pogo') && (
          <Text style={[globalStyles.text, { color: '#ff6600', fontWeight: 'bold' }]}>
            Kamu menggunakan server pogo!, sangat tidak disarankan untuk skip/seek/menggeser menit
            dikarenakan akan menyebabkan loading yang sangat lama dan kemungkinan akan menghabiskan
            kuota data kamu. Disarankan untuk mengunduh/download video ini lewat tombol dibawah dan
            menontonnya saat proses download sudah selesai secara offline!
          </Text>
        )}

        {data.resolution?.includes('lokal') && (
          <Text style={[globalStyles.text, { color: '#ff6600', fontWeight: 'bold' }]}>
            Kamu menggunakan server "lokal". Perlu di ingat server ini tidak mendukung pemutaran
            melalui aplikasi dan akan menggunakan WebView untuk memutar video melalui server ini,
            jadi fitur download dan "lanjut dari histori" tidak akan bekerja ketika kamu menggunakan
            server "lokal".{'\n'}
            Harap gunakan server ini sebagai alternatif akhir jika server lain tidak berfungsi.
          </Text>
        )}

        <Button
          mode="contained"
          style={{ marginTop: 12, marginHorizontal: 10 }}
          onPress={downloadAnime}>
          <Icon name="download" size={23} /> Download
        </Button>
      </ScrollView>
    </View>
  );
}
export default memo(Video);
