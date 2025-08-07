import { StackActions } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useRef } from 'react';
import { Text, ToastAndroid, View } from 'react-native';
import randomTipsArray from '../../assets/loadingTips.json';
import useGlobalStyles from '../../assets/style';
import { RootStackNavigator } from '../../types/navigation';
import watchLaterJSON from '../../types/watchLaterJSON';
import Anime_Whitelist from '../../utils/Anime_Whitelist';
import AnimeAPI from '../../utils/AnimeAPI';
import setHistory from '../../utils/historyControl';
import controlWatchLater from '../../utils/watchLaterControl';

import URL from 'url';
import { getMovieDetail, getStreamingDetail } from '../../utils/animeMovie';
import { DatabaseManager } from '../../utils/DatabaseManager';
import DialogManager from '../../utils/dialogManager';
import { getKomikuDetailFromUrl, getKomikuReading } from '../../utils/komiku';
import LoadingIndicator from '../misc/LoadingIndicator';
import { replaceLast } from '../../utils/replaceLast';

type Props = NativeStackScreenProps<RootStackNavigator, 'FromUrl'>;

function FromUrl(props: Props) {
  const globalStyles = useGlobalStyles();

  const randomTips = useRef<string>(
    // eslint-disable-next-line no-bitwise
    randomTipsArray[~~(Math.random() * randomTipsArray.length)],
  ).current;
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
        err.message === 'Network Error' || err.message === 'Network request failed'
          ? 'Permintaan gagal: Jaringan Error\nPastikan kamu terhubung dengan internet'
          : 'Error tidak diketahui: ' + err.message;
      DialogManager.alert('Error', errMessage);
      props.navigation.goBack();
    },
    [props.navigation],
  );
  useEffect(() => {
    props.navigation.setOptions({ headerTitle: props.route.params.title });
    const abort: AbortController = new AbortController();
    const resolution = props.route.params.historyData?.resolution; // only if FromUrl is called from history component
    if (props.route.params.link.includes('nanimex')) {
      props.navigation.goBack();
      DialogManager.alert(
        'Perhatian!',
        'Dikarenakan data yang digunakan berbeda, history lama tidak didukung, sehingga sebagai solusi, kamu harus mencari anime ini secara manual di menu pencarian dan pilih episode yang sesuai.',
      );
      return;
    }
    if (props.route.params.type === 'movie') {
      if (URL.parse(props.route.params.link)?.pathname?.split('/')[1] === 'anime') {
        getMovieDetail(props.route.params.link, abort.signal)
          .then(result => {
            if (abort.signal.aborted || props.navigation.getState().routes.length === 1) return;
            if ('isError' in result) {
              DialogManager.alert(
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
          .then(async result => {
            if (abort.signal.aborted || props.navigation.getState().routes.length === 1) return;
            if ('isError' in result) {
              DialogManager.alert(
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
            // History
            setHistory(
              result,
              props.route.params.link,
              false,
              props.route.params.historyData,
              props.route.params.type === 'movie',
            );

            const episodeIndex = result.title.toLowerCase().indexOf(' episode');
            const title = episodeIndex >= 0 ? result.title.slice(0, episodeIndex) : result.title;
            const watchLater: watchLaterJSON[] = JSON.parse(
              (await DatabaseManager.get('watchLater'))!,
            );
            const watchLaterIndex = watchLater.findIndex(
              z => z.title.trim() === title.trim() && z.isMovie === true,
            );
            if (watchLaterIndex >= 0) {
              controlWatchLater('delete', watchLaterIndex);
              ToastAndroid.show(`${title} dihapus dari daftar tonton nanti`, ToastAndroid.SHORT);
            }
          })
          .catch(handleError);
      }
    } else if (props.route.params.type === 'anime' || props.route.params.type === undefined) {
      AnimeAPI.fromUrl(props.route.params.link, resolution, !!resolution, undefined, abort.signal)
        .then(async result => {
          if (result === 'Unsupported') {
            DialogManager.alert(
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
                DialogManager.alert(
                  'Perhatian!',
                  'Anime ini mengandung genre ecchi. Namun telah di tinjau dan di whitelist oleh developer karena masih dalam kategori aman. Mohon bijak dalam menonton.',
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

              // History
              setHistory(result, props.route.params.link, false, props.route.params.historyData);

              const episodeIndex = result.title.toLowerCase().indexOf(' episode');
              const title = episodeIndex >= 0 ? result.title.slice(0, episodeIndex) : result.title;
              const watchLater: watchLaterJSON[] = JSON.parse(
                (await DatabaseManager.get('watchLater'))!,
              );
              const normalizeWatchLaterTitle = (str: string) => {
                let resultString = str.split('(Episode')[0].trim();
                if (resultString.endsWith('BD')) {
                  return replaceLast(resultString, 'BD', '');
                }
                return resultString;
              };
              const watchLaterIndex = watchLater.findIndex(
                z =>
                  (z.link === result.episodeData.animeDetail ||
                    normalizeWatchLaterTitle(z.title.trim()) === title.trim()) &&
                  !z.isMovie &&
                  !z.isComics,
              );
              if (watchLaterIndex >= 0) {
                controlWatchLater('delete', watchLaterIndex);
                ToastAndroid.show(`${title} dihapus dari daftar tonton nanti`, ToastAndroid.SHORT);
              }
            }
          } catch (e: any) {
            DialogManager.alert('Error', e.message);
            props.navigation.goBack();
          }
        })
        .catch(handleError);
    } else {
      if (props.route.params.link.includes('/manga/')) {
        getKomikuDetailFromUrl(props.route.params.link, abort.signal)
          .then(result => {
            if (abort.signal.aborted || props.navigation.getState().routes.length === 1) return;
            if (
              result.genres.includes('Ecchi') &&
              !Anime_Whitelist.list.includes(props.route.params.link)
            ) {
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
              DialogManager.alert(
                'Perhatian!',
                'Komik ini mengandung genre ecchi. Namun telah di tinjau dan di whitelist oleh developer karena masih dalam kategori aman. Mohon bijak dalam membaca.',
              );
            }
            props.navigation.dispatch(
              StackActions.replace('ComicsDetail', {
                data: result,
                link: props.route.params.link,
              }),
            );
          })
          .catch(handleError);
      } else {
        getKomikuReading(props.route.params.link, abort.signal)
          .then(async result => {
            if (abort.signal.aborted || props.navigation.getState().routes.length === 1) return;
            props.navigation.dispatch(
              StackActions.replace('ComicsReading', {
                data: result,
                historyData: props.route.params.historyData,
                link: props.route.params.link,
              }),
            );
            setHistory(
              result,
              props.route.params.link,
              false,
              props.route.params.historyData,
              false,
              true,
            );
            const chapterIndex = result.title.toLowerCase().indexOf(' chapter');
            const title = chapterIndex >= 0 ? result.title.slice(0, chapterIndex) : result.title;
            const watchLater: watchLaterJSON[] = JSON.parse(
              (await DatabaseManager.get('watchLater'))!,
            );
            const watchLaterIndex = watchLater.findIndex(
              z => z.title.trim() === title.trim() && z.isComics === true,
            );
            if (watchLaterIndex >= 0) {
              controlWatchLater('delete', watchLaterIndex);
              ToastAndroid.show(`${title} dihapus dari daftar tonton nanti`, ToastAndroid.SHORT);
            }
          })
          .catch(handleError);
      }
    }
    return () => {
      abort.abort();
    };
  }, [
    handleError,
    props.navigation,
    props.route.params.historyData,
    props.route.params.link,
    props.route.params.title,
    props.route.params.type,
  ]);

  return (
    <View style={{ flex: 1 }}>
      <View
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          flex: 1,
        }}>
        <LoadingIndicator size={15} />
        <Text style={[globalStyles.text, { fontWeight: 'bold' }]}>
          Mengambil data... Mohon tunggu sebentar!
        </Text>
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
