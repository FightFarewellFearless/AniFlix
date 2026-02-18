import { StackActions } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useRef } from 'react';
import { Text, ToastAndroid, View } from 'react-native';
import randomTipsArray from '../../assets/loadingTips.json';
import runningTextArray from '../../assets/runningText.json';
import useGlobalStyles from '../../assets/style';
import { RootStackNavigator } from '../../types/navigation';
import watchLaterJSON from '../../types/watchLaterJSON';
import AnimeAPI from '../../utils/AnimeAPI';
import setHistory from '../../utils/historyControl';
import controlWatchLater from '../../utils/watchLaterControl';

import URL from 'url';
import { DatabaseManager } from '../../utils/DatabaseManager';
import DialogManager from '../../utils/dialogManager';
import { replaceLast } from '../../utils/replaceLast';
import { getMovieDetail, getStreamingDetail } from '../../utils/scrapers/animeMovie';
import { getComicsDetailFromUrl, getComicsReading } from '../../utils/scrapers/comicsv2';
import { getFilmDetails } from '../../utils/scrapers/film';
import { getKomikuDetailFromUrl, getKomikuReading } from '../../utils/scrapers/komiku';
import LoadingIndicator from '../misc/LoadingIndicator';

type Props = NativeStackScreenProps<RootStackNavigator, 'FromUrl'>;

function FromUrl(props: Props) {
  const globalStyles = useGlobalStyles();

  const randomTips = useRef<string>(
    // eslint-disable-next-line no-bitwise
    randomTipsArray[~~(Math.random() * randomTipsArray.length)],
  ).current;

  const randomQuote = useRef(
    // eslint-disable-next-line no-bitwise
    runningTextArray[~~(Math.random() * runningTextArray.length)],
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
    const link = props.route.params.link;
    const resolution = props.route.params.historyData?.resolution; // only if FromUrl is called from history component
    if (link.includes('nanimex')) {
      props.navigation.goBack();
      DialogManager.alert(
        'Perhatian!',
        'Dikarenakan data yang digunakan berbeda, history lama tidak didukung, sehingga sebagai solusi, kamu harus mencari anime ini secara manual di menu pencarian dan pilih episode yang sesuai.',
      );
      return;
    }
    if (props.route.params.type === 'movie') {
      if (URL.parse(link)?.pathname?.split('/')[1] === 'anime') {
        getMovieDetail(link, abort.signal)
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
                link: link,
              }),
            );
          })
          .catch(handleError);
      } else {
        getStreamingDetail(link, abort.signal)
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
                link: link,
                historyData: props.route.params.historyData,
                isMovie: true,
              }),
            );
            // History
            setHistory(
              result,
              link,
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
      AnimeAPI.fromUrl(link, resolution, !!resolution, undefined, abort.signal)
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
              if (result.genres.includes('')) {
                DialogManager.alert(
                  'Perhatian!',
                  'Anime ini mengandung genre ecchi. Mohon bijak dalam menonton.',
                );
              }
              if (abort.signal.aborted || props.navigation.getState().routes.length === 1) return;
              props.navigation.dispatch(
                StackActions.replace('AnimeDetail', {
                  data: result,
                  link: link,
                }),
              );
            } else if (result.type === 'animeStreaming') {
              if (abort.signal.aborted || props.navigation.getState().routes.length === 1) return;
              props.navigation.dispatch(
                StackActions.replace('Video', {
                  data: result,
                  link: link,
                  historyData: props.route.params.historyData,
                }),
              );

              // History
              setHistory(result, link, false, props.route.params.historyData);

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
    } else if (props.route.params.type === 'film') {
      getFilmDetails(link, abort.signal)
        .then(async data => {
          if (abort.signal.aborted || props.navigation.getState().routes.length === 1) return;
          if (data.type === 'detail') {
            props.navigation.dispatch(
              StackActions.replace('FilmDetail', {
                data,
                link: link,
              }),
            );
          } else {
            props.navigation.dispatch(
              StackActions.replace('Video_Film', {
                data,
                link: link,
                historyData: props.route.params.historyData,
              }),
            );
            const isFilm = URL.parse(link).host!?.includes('idlix') && link.includes('/episode/');
            const episodeIndex = data.title.toLowerCase().lastIndexOf('x');
            const title = (
              isFilm
                ? data.title.split(': ').slice(0, -1).join(': ')
                : episodeIndex >= 0
                  ? data.title.slice(0, episodeIndex)
                  : data.title
            ).trim();
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
            setHistory(data, link, false, props.route.params.historyData, true);
          }
        })
        .catch(handleError);
    } else {
      const isKomiku = link.includes('komiku');
      const isKomikindo = link.includes('komikindo');
      const isSoftkomik = link.includes('softkomik');
      const isSoftkomikGoToDetail = isSoftkomik && !link.includes('/chapter/');
      const isKomikuGoToDetail = isKomiku && link.includes('/manga/');
      const isKomikindoGoToDetail = isKomikindo && !link.includes('-chapter-');
      const goToDetail = isKomikuGoToDetail || isKomikindoGoToDetail || isSoftkomikGoToDetail;
      if (goToDetail) {
        (link.includes('komikindo') || link.includes('softkomik')
          ? getComicsDetailFromUrl
          : getKomikuDetailFromUrl)(link, abort.signal)
          .then(result => {
            if (abort.signal.aborted || props.navigation.getState().routes.length === 1) return;
            if (result.genres.includes('Ecchi')) {
              DialogManager.alert(
                'Perhatian!',
                'Komik ini mengandung genre ecchi. Mohon bijak dalam membaca.',
              );
            }
            props.navigation.dispatch(
              StackActions.replace('ComicsDetail', {
                data: result,
                link: link,
              }),
            );
          })
          .catch(handleError);
      } else {
        (link.includes('komikindo') || link.includes('softkomik')
          ? getComicsReading
          : getKomikuReading)(link, abort.signal)
          .then(async result => {
            if (abort.signal.aborted || props.navigation.getState().routes.length === 1) return;
            props.navigation.dispatch(
              StackActions.replace('ComicsReading', {
                data: result,
                historyData: props.route.params.historyData,
                link: link,
              }),
            );
            setHistory(result, link, false, props.route.params.historyData, false, true);
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
    props.route.params.title,
    props.route.params.type,
    props.route.params.link,
  ]);

  return (
    <View style={{ flex: 1 }}>
      <View
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          flex: 1,
          paddingHorizontal: 24,
        }}>
        <LoadingIndicator size={15} />
        <Text style={[globalStyles.text, { fontWeight: 'bold', marginBottom: 20 }]}>
          Mengambil data... Mohon tunggu sebentar!
        </Text>
        <Text style={[globalStyles.text, { textAlign: 'center', fontStyle: 'italic' }]}>
          "{randomQuote.quote}"
        </Text>
        <Text
          style={[globalStyles.text, { textAlign: 'center', marginTop: 5, fontWeight: 'bold' }]}>
          — {randomQuote.by}
        </Text>
      </View>
      <View style={{ alignItems: 'center' }}>
        <View style={{ position: 'absolute', bottom: 10 }}>
          <Text style={[{ textAlign: 'center' }, globalStyles.text]}>{randomTips}</Text>
        </View>
      </View>
    </View>
  );
}

export default FromUrl;
