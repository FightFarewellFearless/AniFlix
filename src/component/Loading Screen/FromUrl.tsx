import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  ActivityIndicator,
  Text,
  Alert,
  ToastAndroid,
} from 'react-native';
import { StackActions } from '@react-navigation/native';
import globalStyles from '../../assets/style';
import randomTipsArray from '../../assets/loadingTips.json';
import setHistory from '../../utils/historyControl';
import { useDispatch, useSelector } from 'react-redux';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import store, { AppDispatch, RootState } from '../../misc/reduxStore';
import { RootStackNavigator } from '../../types/navigation';
import watchLaterJSON from '../../types/watchLaterJSON';
import controlWatchLater from '../../utils/watchLaterControl';
import AnimeAPI from '../../utils/AnimeAPI';

// import { setDatabase } from '../misc/reduxSlice';

type Props = NativeStackScreenProps<RootStackNavigator, 'FromUrl'>;

function FromUrl(props: Props) {
  const [dots, setDots] = useState<string>('');

  const historyData = useSelector((state: RootState) => state.settings.history);
  const dispatchSettings = useDispatch<AppDispatch>();

  const randomTips = useRef<string>(
    // eslint-disable-next-line no-bitwise
    randomTipsArray[~~(Math.random() * randomTipsArray.length)],
  ).current;
  useEffect((): (() => void) => {
    const abort: AbortController = new AbortController();
    const resolution = props.route.params.historyData?.resolution; // only if FromUrl is called from history component

    AnimeAPI.fromUrl(
      props.route.params.link,
      resolution,
      !!resolution,
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
          if (result.blocked) {
            props.navigation.dispatch(StackActions.replace('Blocked'));
          } else if (result.maintenance) {
            props.navigation.dispatch(
              StackActions.replace('Maintenance', {
                message: result.message,
              }),
            );
          } else if (result.type === 'epsList') {
            props.navigation.dispatch(
              StackActions.replace('EpisodeList', {
                data: result,
                link: props.route.params.link,
              }),
            );
          } else if (result.type === 'singleEps') {
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
              z => z.title === title,
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
          Alert.alert('Error', e.stack);
          props.navigation.goBack();
        }
      })
      .catch(err => {
        if (err.message === 'Aborted') {
          return;
        }
        const errMessage =
          err.message === 'Network request failed'
            ? 'Permintaan gagal.\nPastikan kamu terhubung dengan internet'
            : 'Error tidak diketahui: ' + err.message;
        Alert.alert('Error', errMessage);
        props.navigation.goBack();
      });
    return () => {
      abort.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
