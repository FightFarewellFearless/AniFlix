import { StackActions } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Text, ToastAndroid, View } from 'react-native';
import randomTipsArray from '../../assets/loadingTips.json';
import useGlobalStyles from '../../assets/style';
import { RootStackNavigator } from '../../types/navigation';
import watchLaterJSON from '../../types/watchLaterJSON';
import AnimeAPI from '../../utils/AnimeAPI';
import Anime_Whitelist from '../../utils/Anime_Whitelist';
import setHistory from '../../utils/historyControl';
import controlWatchLater from '../../utils/watchLaterControl';

import URL from 'url';
import { getMovieDetail, getStreamingDetail } from '../../utils/animeMovie';
import { getState, RootState, useSelectorIfFocused } from '../../utils/DatabaseManager';

type Props = NativeStackScreenProps<RootStackNavigator, 'FromUrl'>;

function FromUrl(props: Props) {
  const globalStyles = useGlobalStyles();
  const [dots, setDots] = useState<string>('');

  const historyData = useSelectorIfFocused((state: RootState) => state.settings.history);

  const randomTips = useRef<string>(
    // eslint-disable-next-line no-bitwise
    randomTipsArray[~~(Math.random() * randomTipsArray.length)],
  ).current;
  useEffect(() => {
    const abort: AbortController = new AbortController();
    const resolution = props.route.params.historyData?.resolution; // only if FromUrl is called from history component
    if (props.route.params.link.includes('nanimex')) {
      props.navigation.goBack();
      Alert.alert(
        'Perhatian!',
        'Dikarenakan data yang digunakan berbeda, history lama tidak didukung, sehingga sebagai solusi, kamu harus mencari anime ini secara manual di menu pencarian dan pilih episode yang sesuai.',
      );
      return;
    }
    if (props.route.params.isMovie) {
      if (URL.parse(props.route.params.link)?.pathname?.split('/')[1] === 'anime') {
        getMovieDetail(props.route.params.link, abort.signal)
          .then(result => {
            if (abort.signal.aborted || props.navigation.getState().routes.length === 1) return;
            if ('isError' in result) {
              Alert.alert(
                'Error',
                'Inisialisasi data movie gagal! Silahkan buka ulang aplikasi/reload/ketuk teks merah pada beranda untuk mencoba mengambil data yang diperlukan',
              );
              props.navigation.goBack();
              return;
            }
            props.navigation.dispatch(
              StackActions.replace('MovieDetail', {
                data: result,
                link: props.route.params.link,
              }),
            );
          })
          .catch(handleError);
      } else {
        getStreamingDetail(props.route.params.link, abort.signal)
          .then(result => {
            if (abort.signal.aborted || props.navigation.getState().routes.length === 1) return;
            if ('isError' in result) {
              Alert.alert(
                'Error',
                'Inisialisasi data movie gagal! Silahkan buka ulang aplikasi/reload/ketuk teks merah pada beranda untuk mencoba mengambil data yang diperlukan',
              );
              props.navigation.goBack();
              return;
            }
            props.navigation.dispatch(
              StackActions.replace('Video', {
                data: result,
                link: props.route.params.link,
                historyData: props.route.params.historyData,
                isMovie: true,
              }),
            );
            // TEMP|TODO|WORKAROUND: Temporary fix for bottom-tabs extra padding
            setTimeout(() => {
              props.navigation.dispatch(StackActions.push('Blank'));
              setTimeout(() => {
                props.navigation.goBack();
              }, 0);
            }, 500);
            // History
            setHistory(
              result,
              props.route.params.link,
              false,
              props.route.params.historyData,
              historyData,
              props.route.params.isMovie,
            );

            const episodeIndex = result.title.toLowerCase().indexOf(' episode');
            const title = episodeIndex >= 0 ? result.title.slice(0, episodeIndex) : result.title;
            const watchLater: watchLaterJSON[] = JSON.parse(getState().settings.watchLater);
            const watchLaterIndex = watchLater.findIndex(z => z.title.trim() === title.trim());
            if (watchLaterIndex >= 0) {
              controlWatchLater('delete', watchLaterIndex);
              ToastAndroid.show(`${title} dihapus dari daftar tonton nanti`, ToastAndroid.SHORT);
            }
          })
          .catch(handleError);
      }
    } else {
      AnimeAPI.fromUrl(props.route.params.link, resolution, !!resolution, undefined, abort.signal)
        .then(async result => {
          if (result === 'Unsupported') {
            Alert.alert(
              'Tidak didukung!',
              'Anime yang kamu tuju tidak memiliki data yang didukung!',
            );
            props.navigation.goBack();
            return;
          }
          try {
            if (result.type === 'animeDetail') {
              if (
                result.genres.includes('') &&
                !Anime_Whitelist.list.includes(props.route.params.link)
              ) {
                // Ecchi
                if (abort.signal.aborted || props.navigation.getState().routes.length === 1) return;
                props.navigation.dispatch(
                  StackActions.replace('Blocked', {
                    title: result.title,
                    url: props.route.params.link,
                    data: result,
                  }),
                );
                return;
              }
              if (Anime_Whitelist.list.includes(props.route.params.link)) {
                Alert.alert(
                  'Perhatian!',
                  'Anime ini mungkin mengandung konten dewasa seperti ecchi. Namun telah di whitelist dan diizinkan tayang. Mohon bijak dalam menonton.',
                );
              }
              if (abort.signal.aborted || props.navigation.getState().routes.length === 1) return;
              props.navigation.dispatch(
                StackActions.replace('AnimeDetail', {
                  data: result,
                  link: props.route.params.link,
                }),
              );
            } else if (result.type === 'animeStreaming') {
              if (abort.signal.aborted || props.navigation.getState().routes.length === 1) return;
              props.navigation.dispatch(
                StackActions.replace('Video', {
                  data: result,
                  link: props.route.params.link,
                  historyData: props.route.params.historyData,
                }),
              );
              // TEMP|TODO|WORKAROUND: Temporary fix for bottom-tabs extra padding
              setTimeout(() => {
                props.navigation.dispatch(StackActions.push('Blank'));
                setTimeout(() => {
                  props.navigation.goBack();
                }, 0);
              }, 500);

              // History
              setHistory(
                result,
                props.route.params.link,
                false,
                props.route.params.historyData,
                historyData,
              );

              const episodeIndex = result.title.toLowerCase().indexOf(' episode');
              const title = episodeIndex >= 0 ? result.title.slice(0, episodeIndex) : result.title;
              const watchLater: watchLaterJSON[] = JSON.parse(getState().settings.watchLater);
              const watchLaterIndex = watchLater.findIndex(z => z.title.trim() === title.trim());
              if (watchLaterIndex >= 0) {
                controlWatchLater('delete', watchLaterIndex);
                ToastAndroid.show(`${title} dihapus dari daftar tonton nanti`, ToastAndroid.SHORT);
              }
            }
          } catch (e: any) {
            Alert.alert('Error', e.message);
            props.navigation.goBack();
          }
        })
        .catch(handleError);
    }
    return () => {
      abort.abort();
      global.gc?.();
    };
    // eslint-disable-next-line react-compiler/react-compiler
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleError = useCallback(
    (err: Error) => {
      if (err.message === 'Silahkan selesaikan captcha') {
        props.navigation.goBack();
        return;
      }
      if (err.message === 'canceled' || err.message === 'Aborted') {
        return;
      }
      const errMessage =
        err.message === 'Network Error'
          ? 'Permintaan gagal.\nPastikan kamu terhubung dengan internet'
          : 'Error tidak diketahui: ' + err.message;
      Alert.alert('Error', errMessage);
      props.navigation.goBack();
    },
    [props],
  );

  useEffect(() => {
    const dotsInterval = setInterval(() => {
      if (dots === '...') {
        setDots('');
        return;
      }
      setDots(dots + '.');
    }, 250);
    return () => {
      clearInterval(dotsInterval);
    };
  }, [dots]);

  return (
    <View style={{ flex: 1 }}>
      <View
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          flex: 1,
        }}>
        <ActivityIndicator size="large" />
        <Text style={globalStyles.text}>Loading{dots}</Text>
      </View>
      {/* tips */}
      <View style={{ alignItems: 'center' }}>
        <View style={{ position: 'absolute', bottom: 10 }}>
          <Text style={[{ textAlign: 'center' }, globalStyles.text]}>{randomTips}</Text>
        </View>
      </View>
    </View>
  );
}

export default FromUrl;
