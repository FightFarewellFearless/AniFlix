import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  ActivityIndicator,
  Text,
  Alert,
  BackHandler,
  NativeEventSubscription,
} from 'react-native';
import { StackActions } from '@react-navigation/native';
import globalStyles from '../assets/style';
import randomTipsArray from '../assets/loadingTips.json';
import setHistory from '../utils/historyControl';
import { useDispatch, useSelector } from 'react-redux';
import deviceUserAgent from '../utils/deviceUserAgent';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Blocked,
  EpsList,
  FromUrlMaintenance,
  RootStackNavigator,
  SingleEps,
} from '../types/anime';
import { AppDispatch, RootState } from '../misc/reduxStore';

// import { setDatabase } from '../misc/reduxSlice';

type Props = NativeStackScreenProps<RootStackNavigator, 'FromUrl'>;

function FromUrl(props: Props) {
  const [unmount, setUnmount] = useState<boolean>(false);
  const [dots, setDots] = useState<string>('');

  const historyData = useSelector((state: RootState) => state.settings.history);
  const dispatchSettings = useDispatch<AppDispatch>();

  const randomTips = useRef<string>(
    // eslint-disable-next-line no-bitwise
    randomTipsArray[~~(Math.random() * randomTipsArray.length)],
  ).current;
  useEffect((): (() => void) => {
    const abort: AbortController = new AbortController();
    const backhandler: NativeEventSubscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        setUnmount(true);
        abort.abort();
        return false;
      },
    );
    const resolution = props.route.params.historyData?.resolution; // only if FromUrl is called from history component
    const providedResolution =
      resolution !== undefined ? `&res=${resolution}` : '';

    fetch(
      'https://animeapi.aceracia.repl.co/v3/fromUrl?link=' +
        props.route.params.link +
        providedResolution,
      {
        signal: abort.signal,
        headers: {
          'User-Agent': deviceUserAgent,
        },
      },
    )
      .then(async (results: Response) => {
        if (results === undefined) {
          return;
        }
        const resulted = await results.text();
        try {
          const result: Blocked | EpsList | SingleEps | FromUrlMaintenance =
            JSON.parse(resulted);
          if (results && unmount === false) {
            if (result.blocked) {
              props.navigation.dispatch(StackActions.replace('Blocked'));
            } else if (result.maintenance) {
              props.navigation.dispatch(StackActions.replace('Maintenance'));
            } else if (result.type === 'epsList') {
              props.navigation.dispatch(
                StackActions.replace('EpisodeList', {
                  data: result,
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
            }
          }
        } catch (e: any) {
          if (resulted === 'Unsupported') {
            Alert.alert(
              'Tidak didukung!',
              'Anime yang kamu tuju tidak memiliki data yang didukung!',
            );
          } else {
            Alert.alert('Error', e.stack);
          }
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
      backhandler.remove();
    };
  }, [
    dispatchSettings,
    historyData,
    props.navigation,
    props.route.params.historyData,
    props.route.params.link,
    unmount,
  ]);

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