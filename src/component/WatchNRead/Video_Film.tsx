import Icon from '@react-native-vector-icons/fontawesome';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { VideoView } from 'expo-video';
import tr from 'googletrans';
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
  AppState,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Text,
  ToastAndroid,
  useColorScheme,
  View,
} from 'react-native';
import Orientation from 'react-native-orientation-locker';
import ReAnimated, { useAnimatedRef } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TouchableOpacity } from '@component/misc/TouchableOpacityRNGH';

import useGlobalStyles, { darkText, lightText } from '@assets/style';
import setHistory from '@utils/historyControl';

import { useFilmTokenRotate } from '@/hooks/useFilmTokenRotate';
import { RootStackNavigator } from '@/types/navigation';
import Skeleton from '@component/misc/Skeleton';
import VideoPlayer, { parseSubtitles, PlayerRef } from '@component/VideoPlayer';
import { Picker, PickerRef } from '@expo/ui/community/picker';
import { useBackHandler } from '@hooks/useBackHandler';
import { useFocusEffect } from '@react-navigation/core';
import { useKeyValueIfFocused } from '@utils/DatabaseManager';
import DialogManager from '@utils/dialogManager';
import {
  FILM_BASE_URL,
  getFilmDetails,
  middleServerCallback,
  STREAMING_MIDDLE_SERVER_PORT,
} from '@utils/scrapers/film';
import { TVFocusGuideView } from 'react-native';
import { createServer, Server } from 'react-native-nitro-http-server';
import { ActivityIndicator, Button } from 'react-native-paper';
import LoadingIndicator from '../misc/LoadingIndicator';
import {
  LoadingModal,
  TimeInfo,
  useBatteryAndClock,
  useFullscreenControl,
  useSynopsisControl,
  useVideoStyles,
} from './SharedVideo';

type Props = NativeStackScreenProps<RootStackNavigator, 'Video_Film'>;

function Video_Film(props: Props) {
  const colorScheme = useColorScheme();
  const globalStyles = useGlobalStyles();
  const styles = useVideoStyles();

  const enableBatteryTimeInfo = useKeyValueIfFocused('enableBatteryTimeInfo');

  const historyData = useRef(props.route.params.historyData);

  const [showSynopsis, setShowSynopsis] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(props.route.params.data);

  const currentData = useRef(data);
  currentData.current = data;

  const [currentResolution, setCurrentResolution] = useState('Auto');
  const dropdownResolutionRef = useRef<PickerRef>(null);
  const dropdownServerModeRef = useRef<PickerRef>(null);

  const { activeTokenRef, checkAndRotateToken } = useFilmTokenRotate(data);
  const checkAndRotateTokenRef = useRef(checkAndRotateToken);
  checkAndRotateTokenRef.current = checkAndRotateToken;

  const [isLocalServerReady, setIsLocalServerReady] = useState(false);
  const [serverMode, setServerMode] = useState<'local' | 'server' | undefined>(undefined);

  useFocusEffect(
    useCallback(() => {
      fetch('https://vortexdownloader.rwbcode.com/health')
        .then(a => {
          if (a.status === 200) {
            setServerMode('server');
          } else {
            setServerMode('local');
          }
        })
        .catch(() => {
          setServerMode('local');
        });
    }, []),
  );

  useFocusEffect(
    useCallback(() => {
      if (serverMode !== 'local') return;
      let server: Server;
      async function autoRestartWhenInactive() {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 500);
          await fetch(`http://127.0.0.1:${STREAMING_MIDDLE_SERVER_PORT}/`, {
            method: 'HEAD',
            signal: controller.signal,
          });
          clearTimeout(timeout);
        } catch {
          server?.close?.();
          // setIsLocalServerReady(false);
          await new Promise(resolve => setTimeout(resolve, 500));
          server = createServer({ requestTimeout: Infinity }, (req, res) => {
            middleServerCallback(req, res, checkAndRotateTokenRef, activeTokenRef);
          });
          server.listen(STREAMING_MIDDLE_SERVER_PORT, () => {
            setIsLocalServerReady(true);
          });
        }
      }
      const probe = AppState.addEventListener('change', async state => {
        if (state !== 'active') return;
        await autoRestartWhenInactive();
      });
      server = createServer({ requestTimeout: Infinity }, (req, res) => {
        middleServerCallback(req, res, checkAndRotateTokenRef, activeTokenRef);
      });
      server.listen(STREAMING_MIDDLE_SERVER_PORT, () => {
        setIsLocalServerReady(true);
      });

      const heartBeat = setInterval(() => {
        autoRestartWhenInactive();
      }, 15_000);
      return () => {
        clearInterval(heartBeat);
        server?.close?.();
        // setIsLocalServerReady(false);
        probe.remove();
      };
    }, [activeTokenRef, serverMode]),
  );

  const currentLink = useRef(props.route.params.link);
  const firstTimeLoad = useRef(true);
  const videoRef = useRef<VideoView>(null);
  const playerRef = useRef<PlayerRef>(null);

  const synopsisTextRef = useAnimatedRef<Text>();

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
      true,
    );
  }, []);
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
    useFullscreenControl(() => {
      dropdownResolutionRef.current?.blur();
      dropdownServerModeRef.current?.blur();
    });

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
      headerTitle:
        data.title + (data.episode ? ` Season ${data.season} Episode ${data.episode}` : ''),
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

  const handleProgress = useCallback(
    (currentTime: number) => {
      updateHistory(currentTime);
    },
    [updateHistory],
  );

  const [waitTime, setWaitTime] = useState(0);
  const [totalWaitTime, setTotalWaitTime] = useState(0);

  const episodeDataControl = useCallback(
    async (dataLink: string) => {
      if (loading) {
        return;
      }
      setLoading(true);
      const result = await getFilmDetails(
        dataLink,
        abortController.current?.signal,
        (wait, total) => {
          setWaitTime(wait);
          setTotalWaitTime(total);
        },
      ).catch(err => {
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
        setCurrentResolution('Auto');
        setHistory(result, dataLink, undefined, undefined, true);
      }
      setLoading(false);
      firstTimeLoad.current = false;
      historyData.current = undefined;
      currentLink.current = dataLink;
      lastSavedTimeRef.current = 0;
      currentTimeRef.current = 0;
    },
    [loading],
  );

  const cancelLoading = useCallback(() => {
    abortController.current?.abort();
    setLoading(false);
    setWaitTime(0);
    setTotalWaitTime(0);
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
      if (!isPaused) {
        videoRef.current.props.player.play();
      }
    }
    ToastAndroid.show('Otomatis kembali ke durasi terakhir', ToastAndroid.SHORT);
  }, [isPaused]);

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
  }, [data?.synopsis, data?.rating, data?.genres, measureAndUpdateSynopsisLayout]);

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

  // Subtitle translation and language check
  const translationAbortController = useRef<AbortController>(null);
  useFocusEffect(
    useCallback(() => {
      void loading;
      translationAbortController.current = new AbortController();
      return () => {
        translationAbortController.current?.abort();
      };
    }, [loading]),
  );
  const [isSubNotID, setIsSubNotID] = useState(false);
  const [isUsingTranslatedSub, setIsUsingTranslatedSub] = useState(false);
  const [subTranslationLoading, setSubTranslationLoading] = useState(false);
  const originalSub = useRef<string>(null);
  const translatedSub = useRef<string[]>([]);
  useEffect(() => {
    return () => {
      setIsSubNotID(false);
      setIsUsingTranslatedSub(false);
      setSubTranslationLoading(false);
    };
  }, [data]);

  const onSubtitleLoad = useCallback(async (subtitleText: string) => {
    originalSub.current = subtitleText;
    // check language source
    try {
      const trRes = await tr(subtitleText.slice(0, 500), {
        to: 'id',
        signal: translationAbortController.current?.signal,
      });
      if (trRes.src !== 'id') {
        setIsSubNotID(true);
      }
    } catch {}
  }, []);
  const applyTranslation = useCallback(async () => {
    setSubTranslationLoading(true);
    try {
      const splittedSub = splitStringByLimit(originalSub.current ?? '');
      const allTrRes = await Promise.all(
        splittedSub.map(string => {
          return tr(string, {
            to: 'id',
            signal: translationAbortController.current?.signal,
          });
        }),
      );
      allTrRes.forEach(res => {
        translatedSub.current.push(res.text);
      });
      playerRef.current?.overwriteSubtitleObj(await parseSubtitles(translatedSub.current.join('')));
      setIsUsingTranslatedSub(true);
    } catch (e: any) {
      if (e.message === 'canceled') return;
      ToastAndroid.show('Gagal menerjemahkan subtitle', ToastAndroid.SHORT);
    } finally {
      setSubTranslationLoading(false);
    }
  }, []);
  const restoreOriginalSub = useCallback(async () => {
    setSubTranslationLoading(true);
    playerRef.current?.overwriteSubtitleObj(await parseSubtitles(originalSub.current ?? ''));
    setIsUsingTranslatedSub(false);
    setSubTranslationLoading(false);
  }, []);

  const downloadFilm = useCallback(() => {
    Linking.openURL(
      `https://vortexdownloader.rwbcode.com/?data=${Buffer.from(
        JSON.stringify({
          title:
            data.title + (data.episode ? ` Season ${data.season} Episode ${data.episode}` : ''),
          streamingLink: data.streamingLink,
          subtitleLink: data.subtitleLink,
          claim: data.claim,
          redeemUrl: data.redeemUrl,
        }),
      ).toString('hex')}`,
    ).catch(err => {
      const errMessage =
        err.message === 'No app can handle this url'
          ? 'Tidak dapat membuka tautan, tidak ada aplikasi yang dapat menangani tautan ini'
          : 'Error tidak diketahui: ' + err.message;
      DialogManager.alert('Error', errMessage);
    });
  }, [data]);

  const resolutionDropdownData = useMemo(() => {
    const list = [];
    list.push({ label: 'Auto', value: 'Auto' });
    if (data.type === 'stream' && data.variants && data.variants.length > 0) {
      data.variants.forEach(v => {
        list.push({
          label: v.name || v.resolution,
          value: v.name || v.resolution,
        });
      });
    }
    return list;
  }, [data]);

  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, flexDirection: Platform.isTV && !fullscreen ? 'row' : 'column' }}>
      {/* Loading modal */}
      <LoadingModal
        waitTime={waitTime}
        totalWaitTime={totalWaitTime}
        setIsPaused={setIsPaused}
        isLoading={loading}
        cancelLoading={cancelLoading}
      />
      {/* VIDEO ELEMENT */}
      <TVFocusGuideView
        autoFocus
        style={[
          fullscreen
            ? styles.fullscreen
            : Platform.isTV
              ? { width: '45%', height: '100%', backgroundColor: 'black' }
              : styles.notFullscreen,
        ]}>
        <View
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: 'black',
            zIndex: 0,
            position: 'absolute',
          }}
        />
        {isLocalServerReady || serverMode === 'server' ? (
          <VideoPlayer
            title={
              data.title + (data.episode ? ` Season ${data.season} Episode ${data.episode}` : '')
            }
            thumbnailURL={data.thumbnailUrl}
            streamingURL={
              serverMode === 'local'
                ? `http://localhost:${STREAMING_MIDDLE_SERVER_PORT}/manifest?url=${encodeURIComponent(data.streamingLink)}&res=${encodeURIComponent(currentResolution)}`
                : `https://vortexdownloader.rwbcode.com/api/proxy-playlist/stream.m3u8?url=${encodeURIComponent(data.streamingLink)}&res=${encodeURIComponent(currentResolution)}&redeemUrl=${data.redeemUrl}&claim=${data.claim}`
            }
            isHls={true}
            subtitleURL={data.subtitleLink}
            onSubtitleLoad={onSubtitleLoad}
            style={{ flex: 1, zIndex: 1 }}
            videoRef={videoRef}
            ref={playerRef}
            fullscreen={fullscreen}
            onFullscreenUpdate={fullscreenUpdate}
            onDurationChange={handleProgress}
            onLoad={handleVideoLoad}
            batteryAndClock={batteryAndClock}
            headers={{
              origin: FILM_BASE_URL,
              referer: FILM_BASE_URL + '/',
              Accept: '*/*',
            }}
          />
        ) : (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <LoadingIndicator size={15} />
          </View>
        )}
      </TVFocusGuideView>
      {/* END OF VIDEO ELEMENT */}
      {/* mengecek apakah sedang dalam keadaan fullscreen atau tidak
        jika ya, maka hanya menampilkan video saja 
       */}
      <ScrollView
        style={{ flex: 1, display: fullscreen ? 'none' : 'flex' }}
        contentContainerStyle={{
          paddingBottom: insets.bottom,
          paddingHorizontal: Platform.isTV ? 16 : 0,
        }}>
        {data.subtitleLink === undefined && (
          <View style={styles.container}>
            <Text style={[globalStyles.text, { marginLeft: 5, fontSize: 16, fontWeight: '500' }]}>
              <Icon
                name="info-circle"
                size={20}
                color={colorScheme === 'dark' ? 'white' : 'black'}
              />{' '}
              Subtitle tidak tersedia untuk film ini!
            </Text>
          </View>
        )}
        {isSubNotID && (
          <View style={styles.container}>
            <Text style={[globalStyles.text, { marginLeft: 5, fontSize: 16, fontWeight: '500' }]}>
              <Icon name="language" size={20} color={colorScheme === 'dark' ? 'white' : 'black'} />{' '}
              Subtitle terdeteksi bukan berbahasa Indonesia.{'\n'}
              <Text style={{ fontSize: 12 }}>
                Kamu bisa mencoba fitur terjemahan otomatis dengan menekan tombol dibawah, namun
                harap perhatikan bahwa tingkat akurasi tidak dijamin, dan beberapa hasil mungkin
                akan kehilangan konteks bahasa
              </Text>
            </Text>
            <Button
              onPress={isUsingTranslatedSub ? restoreOriginalSub : applyTranslation}
              disabled={subTranslationLoading}
              mode="contained-tonal"
              icon="google-translate">
              {isUsingTranslatedSub
                ? 'Kembalikan subtitle asli'
                : 'Terjemahkan ke dalam bahasa Indonesia'}
            </Button>
            {subTranslationLoading && <ActivityIndicator />}
          </View>
        )}
        <Pressable
          style={({ focused }) => [
            styles.container,
            Platform.isTV ? { opacity: focused ? 0.4 : 1 } : undefined,
          ]}
          onPressIn={onSynopsisPressIn}
          onPressOut={onSynopsisPressOut}
          // onLayout={onSynopsisLayout}
          onPress={onSynopsisPress}
          disabled={synopsisTextLength < 3}>
          <Text style={[globalStyles.text, styles.infoTitle]}>
            {data.title + (data.episode ? ` Season ${data.season} Episode ${data.episode}` : '')}
          </Text>

          {data !== undefined ? (
            <ReAnimated.Text
              ref={synopsisTextRef}
              style={[globalStyles.text, styles.infoSinopsis, infoContainerStyle]}
              numberOfLines={!showSynopsis && hadSynopsisMeasured ? 2 : undefined}>
              {data?.synopsis || 'Tidak ada sinopsis'}
            </ReAnimated.Text>
          ) : (
            <Skeleton stopOnBlur={false} width={150} height={20} />
          )}
          {!hadSynopsisMeasured && data !== undefined && (
            <Skeleton stopOnBlur={false} width={150} height={20} />
          )}

          <View style={[styles.infoGenre]}>
            {data === undefined ? (
              <View style={{ gap: 5, flexDirection: 'row' }}>
                <Skeleton stopOnBlur={false} width={50} height={20} />
                <Skeleton stopOnBlur={false} width={50} height={20} />
                <Skeleton stopOnBlur={false} width={50} height={20} />
              </View>
            ) : (
              data.genres.map(genre => (
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
                  backgroundColor: data?.next || data?.prev ? 'green' : 'red',
                },
              ]}>
              {data?.next || data?.prev ? 'TV Series' : 'Film'}
            </Text>
            <Text style={[{ color: lightText }, styles.releaseYear]}>
              <Icon name="calendar" color={styles.releaseYear.color} /> {data?.releaseDate}
            </Text>
            <Text style={[globalStyles.text, styles.rating]}>
              <Icon name="star" color="black" /> {data?.rating}
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

        <View style={[styles.container, { marginTop: 5 }]}>
          <Text style={[globalStyles.text, { marginBottom: 5, fontWeight: 'bold' }]}>Resolusi</Text>
          <TouchableOpacity
            onPress={() => {
              dropdownResolutionRef.current?.focus();
            }}>
            <View pointerEvents="box-only">
              <Picker
                ref={dropdownResolutionRef}
                selectedValue={currentResolution}
                onValueChange={val => {
                  saveProgressToHistory();
                  firstTimeLoad.current = true;
                  setCurrentResolution(val);
                  ToastAndroid.show(`Resolusi diubah ke ${val}`, ToastAndroid.SHORT);
                }}
                key={currentResolution}>
                {resolutionDropdownData.map(item => (
                  <Picker.Item key={item.value} label={item.label} value={item.value} />
                ))}
              </Picker>
            </View>
          </TouchableOpacity>
        </View>

        {serverMode && (
          <View style={[styles.container, { marginTop: 5 }]}>
            <Text
              style={[globalStyles.text, { marginBottom: 5, fontWeight: 'bold', fontSize: 16 }]}>
              Sumber server streaming
            </Text>
            <TouchableOpacity
              onPress={() => {
                dropdownServerModeRef.current?.focus();
              }}>
              <View pointerEvents="box-only">
                <Picker
                  ref={dropdownServerModeRef}
                  selectedValue={serverMode}
                  onValueChange={val => {
                    saveProgressToHistory();
                    firstTimeLoad.current = true;
                    setServerMode(val);
                  }}
                  key={serverMode}>
                  <Picker.Item label="Server" value="server" />
                  <Picker.Item label="Local Host" value="local" />
                </Picker>
              </View>
            </TouchableOpacity>
            <Text style={[globalStyles.text, { marginBottom: 5 }]}>
              * <Text style={{ fontWeight: 'bold' }}>Server</Text> : Memproxy permintaan mu ke
              server. Lebih stabil tapi mungkin sedikit lebih lambat, tergantung banyaknya
              permintaan{'\n'}* <Text style={{ fontWeight: 'bold' }}>Local Host</Text> : Mungkin
              lebih cepat tapi kurang stabil (Bisa pilih ini kalau server bermasalah atau down)
            </Text>
            <Text style={[globalStyles.text, { fontSize: 12, fontStyle: 'italic' }]}>
              Otomatis dipilih berdasarkan ketersediaan server saat pertama kali loading
            </Text>
          </View>
        )}

        <Button
          mode="contained-tonal"
          icon={'link'}
          style={{ marginTop: 12, marginHorizontal: 10 }}
          onPress={downloadFilm}>
          Download video / subtitle
        </Button>
      </ScrollView>
    </View>
  );
}

function splitStringByLimit(text: string, charLimit = 8000): string[] {
  const result: string[] = [];

  for (let i = 0; i < text.length; i += charLimit) {
    result.push(text.slice(i, i + charLimit));
  }

  return result;
}

export default memo(Video_Film);
