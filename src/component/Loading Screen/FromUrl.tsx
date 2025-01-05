import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  ActivityIndicator,
  Text,
  Alert,
  ToastAndroid,
} from 'react-native';
import { StackActions } from '@react-navigation/native';
import useGlobalStyles from '../../assets/style';
import randomTipsArray from '../../assets/loadingTips.json';
import setHistory from '../../utils/historyControl';
import { useDispatch, useSelector } from 'react-redux';
import { StackScreenProps } from '@react-navigation/stack';
import store, { AppDispatch, RootState } from '../../misc/reduxStore';
import { RootStackNavigator } from '../../types/navigation';
import watchLaterJSON from '../../types/watchLaterJSON';
import controlWatchLater from '../../utils/watchLaterControl';
import AnimeAPI from '../../utils/AnimeAPI';
import Anime_Whitelist from '../../utils/Anime_Whitelist';

import { getMovieDetail, getStreamingDetail } from '../../utils/animeMovie';
import URL from 'url';

// import { setDatabase } from '../misc/reduxSlice';

type Props = StackScreenProps<RootStackNavigator, 'FromUrl'>;

function FromUrl(props: Props) {
  const globalStyles = useGlobalStyles();
  const [dots, setDots] = useState<string>('');


  const historyData = useSelector((state: RootState) => state.settings.history);
  const dispatchSettings = useDispatch<AppDispatch>();

  const randomTips = useRef<string>(
    // eslint-disable-next-line no-bitwise
    randomTipsArray[~~(Math.random() * randomTipsArray.length)],
  ).current;
  useEffect(() => {
    const abort: AbortController = new AbortController();
    const resolution = props.route.params.historyData?.resolution; // only if FromUrl is called from history component
    if (props.route.params.link.includes('nanimex')) {
      props.navigation.goBack();
      Alert.alert('Perhatian!', 'Dikarenakan data yang digunakan berbeda, history lama tidak didukung, sehingga sebagai solusi, kamu harus mencari anime ini secara manual di menu pencarian dan pilih episode yang sesuai.')
      return;
    }
    if (props.route.params.isMovie) {
      if (URL.parse(props.route.params.link)?.pathname?.split('/')[1] === 'anime') {
        getMovieDetail(props.route.params.link, abort.signal).then(result => {
          if (abort.signal.aborted || props.navigation.getState().routes.length === 1) return;
          props.navigation.dispatch(
            StackActions.replace('MovieDetail', {
              data: result,
              link: props.route.params.link
            })
          )
        }).catch(handleError);
      } else {
        getStreamingDetail(props.route.params.link, abort.signal).then(result => {
          if (abort.signal.aborted || props.navigation.getState().routes.length === 1) return;
          props.navigation.dispatch(
            StackActions.replace('Video', {
              data: result,
              link: props.route.params.link,
              historyData: props.route.params.historyData,
              isMovie: true,
            })
          )
          // History
          setHistory(
            result,
            props.route.params.link,
            false,
            props.route.params.historyData,
            historyData,
            dispatchSettings,
            props.route.params.isMovie,
          );

          const episodeIndex = result.title.toLowerCase().indexOf(' episode');
          const title =
            episodeIndex >= 0
              ? result.title.slice(0, episodeIndex)
              : result.title;
          const watchLater: watchLaterJSON[] = JSON.parse(
            store.getState().settings.watchLater,
          );
          const watchLaterIndex = watchLater.findIndex(
            z => z.title.trim() === title.trim(),
          );
          if (watchLaterIndex >= 0) {
            controlWatchLater('delete', watchLaterIndex);
            ToastAndroid.show(
              `${title} dihapus dari daftar tonton nanti`,
              ToastAndroid.SHORT,
            );
          }
        }).catch(handleError);
      }
    } else {
      AnimeAPI.fromUrl(
        props.route.params.link,
        resolution,
        !!resolution,
        undefined,
        abort.signal,
      )
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
              if (result.genres.includes('') && !Anime_Whitelist.list.includes(props.route.params.link)) {
                // Ecchi
                if (abort.signal.aborted || props.navigation.getState().routes.length === 1) return;
                props.navigation.dispatch(
                  StackActions.replace('Blocked', {
                    title: result.title,
                    url: props.route.params.link,
                    data: result,
                  })
                )
                return;
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
              setHistory(
                result,
                props.route.params.link,
                false,
                props.route.params.historyData,
                historyData,
                dispatchSettings,
              );

              const episodeIndex = result.title.toLowerCase().indexOf(' episode');
              const title =
                episodeIndex >= 0
                  ? result.title.slice(0, episodeIndex)
                  : result.title;
              const watchLater: watchLaterJSON[] = JSON.parse(
                store.getState().settings.watchLater,
              );
              const watchLaterIndex = watchLater.findIndex(
                z => z.title.trim() === title.trim(),
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
            Alert.alert('Error', e.message);
            props.navigation.goBack();
          }
        })
        .catch(handleError);
    }
    return () => {
      abort.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleError = useCallback((err: Error) => {
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
  }, [props]);

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
          <Text style={[{ textAlign: 'center' }, globalStyles.text]}>
            {randomTips}
          </Text>
        </View>
      </View>
    </View>
  );
}

export default FromUrl;
