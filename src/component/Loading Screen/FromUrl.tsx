import { StackActions, useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useRef, useState } from 'react';
import { Text, ToastAndroid, View } from 'react-native'; // <-- Tambahkan TouchableOpacity
import randomTipsArray from '../../assets/loadingTips.json';
import runningTextArray from '../../assets/runningText.json';
import useGlobalStyles from '../../assets/style';
import { RootStackNavigator } from '../../types/navigation';
import watchLaterJSON from '../../types/watchLaterJSON';
import AnimeAPI from '../../utils/AnimeAPI';
import setHistory from '../../utils/historyControl';
import controlWatchLater from '../../utils/watchLaterControl';

import { Button } from 'react-native-paper';
import URL from 'url';
import { DatabaseManager } from '../../utils/DatabaseManager';
import DialogManager from '../../utils/dialogManager';
import { generateUrlWithLatestDomain } from '../../utils/domainChanger';
import { replaceLast } from '../../utils/replaceLast';
import { getMovieDetail, getStreamingDetail } from '../../utils/scrapers/animeMovie';
import {
  ComicsDetail,
  getComicsDetailFromUrl,
  getComicsReading,
} from '../../utils/scrapers/comicsv2';
import { getFilmDetails, HashProgressData } from '../../utils/scrapers/film';
import {
  getKomikuDetailFromUrl,
  getKomikuReading,
  KomikuDetail,
} from '../../utils/scrapers/komiku';
import { setFilmStreamHistory } from '../../utils/setFilmStreamHistory';
import LoadingIndicator from '../misc/LoadingIndicator';

type Props = NativeStackScreenProps<RootStackNavigator, 'FromUrl'>;

function FromUrl(props: Props) {
  const globalStyles = useGlobalStyles();

  const [hashProgress, setHashProgress] = useState<HashProgressData | null>(null);
  const speedUpRef = useRef<(() => void) | null>(null);

  const onProgressUpdate = useCallback((data: HashProgressData, trigger?: () => void) => {
    setHashProgress(data);
    if (trigger) speedUpRef.current = trigger;
  }, []);

  const randomTips = useRef<string>(
    // eslint-disable-next-line no-bitwise
    randomTipsArray[~~(Math.random() * randomTipsArray.length)],
  ).current;

  const randomQuote = useRef(
    // eslint-disable-next-line no-bitwise
    runningTextArray[~~(Math.random() * runningTextArray.length)] ?? {},
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
  useFocusEffect(
    useCallback(() => {
      props.navigation.setOptions({ headerTitle: props.route.params.title });
      const abort: AbortController = new AbortController();
      let link: string;
      try {
        // fix invalid url crash
        link = generateUrlWithLatestDomain(props.route.params.link);
      } catch {
        link = props.route.params.link;
      }
      if (link === undefined) {
        props.navigation.goBack();
        DialogManager.alert(
          'Error',
          'Link tidak ditemukan!\nMohon informasikan hal ini ke server discord kami ' +
            '(dapat ditemukan di beranda aplikasi). ' +
            'Lengkap dengan judul anime/film/komik yang kamu cari.',
        );
        return;
      }
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
                const title =
                  episodeIndex >= 0 ? result.title.slice(0, episodeIndex) : result.title;
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
                  ToastAndroid.show(
                    `${title} dihapus dari daftar tonton nanti`,
                    ToastAndroid.SHORT,
                  );
                }
              }
            } catch (e: any) {
              DialogManager.alert('Error', e.message);
              props.navigation.goBack();
            }
          })
          .catch(handleError);
      } else if (props.route.params.type === 'film') {
        if (props.route.params.link.includes('tv12.idlix')) {
          props.navigation.goBack();
          DialogManager.alert(
            'Perhatian!',
            'Dikarenakan perubahan terkait data film, history film lama tidak didukung, sehingga sebagai solusi, kamu harus mencari film ini secara manual di menu pencarian dan pilih episode yang sesuai.',
          );
          return;
        }
        getFilmDetails(link, abort.signal, onProgressUpdate)
          .then(async data => {
            if (abort.signal.aborted || props.navigation.getState().routes.length === 1) return;
            if (data.type === 'detail') {
              props.navigation.dispatch(
                StackActions.replace('FilmDetail', {
                  data,
                  link: link,
                }),
              );
            } else if (
              data.type === 'stream' &&
              (props.route.params.historyData ||
                props.navigation.getState().routes.find(z => z.name === 'FilmDetail'))
            ) {
              props.navigation.dispatch(
                StackActions.replace('Video_Film', {
                  data,
                  link,
                  historyData: props.route.params.historyData,
                }),
              );
              await setFilmStreamHistory(link, data, props.route.params.historyData);
            } else {
              props.navigation.dispatch(
                StackActions.replace('FilmDetail', {
                  data,
                  link,
                }),
              );
            }
          })
          .catch(handleError);
      } else {
        const isKomiku = link.includes('komiku');
        const isKomikindo = link.includes('komikindo');
        const isSoftkomik = link.includes('softkomik');
        const isSoftkomikGoToDetail = isSoftkomik && !link.includes('/chapter/');
        const isKomikuGoToDetail = isKomiku && link.includes('/manga/');
        const isKomikindoGoToDetail =
          isKomikindo && !(link.includes('-chapter-') || link.includes('-chapte-'));
        const goToDetail = isKomikuGoToDetail || isKomikindoGoToDetail || isSoftkomikGoToDetail;
        if (goToDetail) {
          const fetchComicsPromise = (
            link.includes('komikindo') || link.includes('softkomik')
              ? getComicsDetailFromUrl(link, abort.signal)
              : getKomikuDetailFromUrl(link, abort.signal)
          ) as Promise<ComicsDetail | KomikuDetail>;
          fetchComicsPromise
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
      onProgressUpdate,
    ]),
  );

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

        {hashProgress ? (
          <View style={{ alignItems: 'center', marginTop: 24, width: '100%' }}>
            <Text
              style={[
                globalStyles.text,
                {
                  fontSize: 16,
                  fontWeight: 'bold',
                  textAlign: 'center',
                  color: hashProgress.isCompleted ? '#4CAF50' : globalStyles.text.color,
                },
              ]}>
              {hashProgress.isCompleted
                ? 'Proteksi Berhasil Dipecahkan!'
                : 'Memecahkan Proteksi Keamanan'}
            </Text>

            <Text style={[globalStyles.text, { fontSize: 13, opacity: 0.7, marginTop: 4 }]}>
              Tingkat Kesulitan: {hashProgress.difficulty}
            </Text>

            <View
              style={{
                backgroundColor: hashProgress.isCompleted
                  ? 'rgba(76, 175, 80, 0.1)'
                  : 'rgba(255, 255, 255, 0.08)',
                borderColor: hashProgress.isCompleted ? '#4CAF50' : 'transparent',
                borderWidth: 1,
                paddingVertical: 12,
                paddingHorizontal: 32,
                borderRadius: 12,
                marginTop: 20,
                marginBottom: 20,
              }}>
              <Text
                style={[
                  globalStyles.text,
                  {
                    fontSize: 28,
                    fontWeight: 'bold',
                    textAlign: 'center',
                    color: hashProgress.isCompleted ? '#4CAF50' : globalStyles.text.color,
                  },
                ]}>
                {hashProgress.elapsed} detik
              </Text>
            </View>

            {hashProgress.canSpeedUp && !hashProgress.isSpeedingUp && !hashProgress.isCompleted && (
              <Button
                onPress={() => speedUpRef.current?.()}
                style={{
                  marginBottom: 16,
                  width: '80%',
                  alignItems: 'center',
                }}
                mode="contained-tonal">
                🚀 Percepat Proses
              </Button>
            )}

            {hashProgress.isSpeedingUp && !hashProgress.isCompleted && (
              <Text
                style={[
                  globalStyles.text,
                  {
                    color: '#4CAF50',
                    fontSize: 13,
                    marginBottom: 16,
                    fontStyle: 'italic',
                  },
                ]}>
                ⚡ Mempercepat dengan multi-core...
              </Text>
            )}

            {!hashProgress.isCompleted ? (
              <>
                <Text
                  style={[
                    globalStyles.text,
                    { textAlign: 'center', fontSize: 12, opacity: 0.6, lineHeight: 18 },
                  ]}>
                  Proses ini mungkin memakan waktu lama tergantung performa perangkat.
                </Text>
                <Text
                  style={[
                    globalStyles.text,
                    {
                      textAlign: 'center',
                      fontSize: 12,
                      opacity: 0.8,
                      marginTop: 8,
                      color: '#ef233c',
                      fontWeight: 'bold',
                    },
                  ]}>
                  Tekan tombol KEMBALI untuk batal.
                </Text>
              </>
            ) : (
              <Text
                style={[
                  globalStyles.text,
                  {
                    textAlign: 'center',
                    fontSize: 13,
                    marginTop: 8,
                    color: '#4CAF50',
                    fontWeight: 'bold',
                  },
                ]}>
                Menyiapkan Video...
              </Text>
            )}
          </View>
        ) : (
          <>
            <Text
              style={[globalStyles.text, { fontWeight: 'bold', marginBottom: 20, marginTop: 20 }]}>
              Mengambil data... Mohon tunggu sebentar!
            </Text>
            <Text style={[globalStyles.text, { textAlign: 'center', fontStyle: 'italic' }]}>
              "{randomQuote.quote}"
            </Text>
            <Text
              style={[
                globalStyles.text,
                { textAlign: 'center', marginTop: 5, fontWeight: 'bold' },
              ]}>
              — {randomQuote.by}
            </Text>
          </>
        )}
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
