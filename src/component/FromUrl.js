import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  ActivityIndicator,
  Text,
  Alert,
  BackHandler,
} from 'react-native';
import { StackActions } from '@react-navigation/native';
import globalStyles from '../assets/style';
import randomTipsArray from '../assets/loadingTips.json';
import useSetHistory from '../utils/historyControl';

function FromUrl(props) {
  const [unmount, setUnmount] = useState(false);
  const [dots, setDots] = useState('');

  const setHistory = useSetHistory();

  const randomTips =
    // eslint-disable-next-line no-bitwise
    useRef(randomTipsArray[~~(Math.random() * randomTipsArray.length)]).current;

  useEffect(() => {
    const abort = new AbortController();
    const backhandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        setUnmount(true);
        abort.abort();
        return false;
      },
    );
    // await new Promise(res => setTimeout(res, 1500));
    if (props.route.params.type === 'search') {
      fetch(
        'https://animeapi.aceracia.repl.co/v2/search?q=' +
          props.route.params.query,
        {
          signal: abort.signal,
        },
      )
        .then(async results => {
          if (results && unmount === false) {
            const result = await results.json();
            props.navigation.dispatch(
              StackActions.replace('Search', {
                data: result,
                query: props.route.params.query,
              }),
            );
          }
        })
        .catch(err => {
          if (err.message === 'Aborted') {
            return;
          }
          Alert.alert('Error', err.message);
          props.navigation.goBack();
        });
    } else {
      const resolution = props.route.params.historyData?.resolution; // only if FromUrl is called from history component
      const providedResolution =
        resolution !== undefined ? `&res=${resolution}` : '';

      fetch(
        'https://animeapi.aceracia.repl.co/v2/fromUrl?link=' +
          props.route.params.link +
          providedResolution,
        {
          signal: abort.signal,
        },
      )
        .then(async results => {
          if (results === undefined) {
            return;
          }
          const resulted = await results.text();
          try {
            const result = JSON.parse(resulted);
            if (results && unmount === false) {
              if (result.blocked) {
                props.navigation.dispatch(StackActions.replace('Blocked'));
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
                );
              }
            }
          } catch (e) {
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
          Alert.alert('Error', err.message);
          props.navigation.goBack();
        });
    }
    return () => {
      backhandler.remove();
    };
  }, [
    props.navigation,
    props.route.params.historyData,
    props.route.params.link,
    props.route.params.query,
    props.route.params.type,
    setHistory,
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
