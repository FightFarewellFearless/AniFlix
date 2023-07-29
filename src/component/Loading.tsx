import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  ActivityIndicator,
  Text,
  Image,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { StackActions } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useDispatch } from 'react-redux';

import store, { AppDispatch } from '../misc/reduxStore';
import { setDatabase } from '../misc/reduxSlice';
import styles from '../assets/style';
const rnLogo = require('../assets/RNlogo.png');
import defaultDatabase from '../misc/defaultDatabaseValue.json';
import { version as appVersion } from '../../package.json';
import deviceUserAgent from '../utils/deviceUserAgent';
import Orientation from 'react-native-orientation-locker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackNavigator } from '../types/navigation';
import { SetDatabaseTarget } from '../types/redux';
import { Home } from '../types/anime';

type Props = NativeStackScreenProps<RootStackNavigator, 'loading'>;

function Loading(props: Props) {
  const [loadStatus, setLoadStatus] = useState('Menyiapkan data');

  const dispatchSettings = useDispatch<AppDispatch>();

  const connectToServer = useCallback(async () => {
    const jsondata: Home | undefined = await fetch(
      'https://animeapi.aceracia.repl.co/v3/home',
      {
        headers: {
          'User-Agent': deviceUserAgent,
        },
      },
    )
      .then(data => data.json())
      .catch(() => {
        props.navigation.dispatch(StackActions.replace('FailedToConnect'));
      });
    if (jsondata === undefined) {
      return;
    }
    if (jsondata.maintenance === true) {
      props.navigation.dispatch(StackActions.replace('Maintenance'));
      return;
    }
    props.navigation.dispatch(
      StackActions.replace('Home', {
        data: jsondata,
      }),
    );
  }, [props.navigation]);

  const prepareData = useCallback(async () => {
    const arrOfData = Object.keys(defaultDatabase) as SetDatabaseTarget[];
    for (const dataKey of arrOfData) {
      const data = await AsyncStorage.getItem(dataKey);
      if (data === null) {
        dispatchSettings(
          setDatabase({
            target: dataKey,
            value: defaultDatabase[dataKey],
          }),
        );
        return;
      }
      dispatchSettings(
        setDatabase({
          target: dataKey,
          value: data,
        }),
      );
    }
    setTimeout(() => {
      if (store.getState().settings.lockScreenOrientation === 'true') {
        Orientation.lockToPortrait();
      }
    }, 1000);
  }, [dispatchSettings]);

  const checkVersion = useCallback(async () => {
    const data = await fetch(
      'https://api.github.com/repos/FightFarewellFearless/anime-react-native/releases?per_page=1',
      {
        headers: {
          'User-Agent': deviceUserAgent,
        },
      },
    )
      .then(d => d.json())
      .catch(() => {});
    if (data === undefined) {
      return null;
    } else if (data[0].tag_name === appVersion) {
      return true;
    }
    return data[0];
  }, []);

  useEffect(() => {
    (async () => {
      await prepareData();
      setLoadStatus('Mengecek versi aplikasi');
      const version = await checkVersion();
      if (version === null) {
        props.navigation.dispatch(StackActions.replace('FailedToConnect'));
      } else if (version === true || __DEV__) {
        // skip update when app is in dev mode
        setLoadStatus('Menghubungkan ke server');
        await connectToServer();
      } else {
        const latestVersion = version.tag_name;
        const changelog = version.body;
        const download = version.assets[0].browser_download_url;

        props.navigation.dispatch(
          StackActions.replace('NeedUpdate', {
            latestVersion,
            changelog,
            download,
          }),
        );
      }
    })();
  }, [connectToServer, prepareData, checkVersion, props.navigation]);

  return (
    <View
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        flex: 1,
      }}>
      <View style={{ position: 'absolute', top: 15 }}>
        <Text style={{ color: '#da2424' }}>
          Aplikasi masih dalam tahap pengembangan
        </Text>
      </View>
      <ActivityIndicator size="large" />
      <Text style={styles.text}>{loadStatus}, mohon tunggu...</Text>
      <View
        style={{
          position: 'absolute',
          bottom: 45,
          alignItems: 'center',
        }}>
        <TouchableOpacity
          onPress={() => {
            Linking.openURL(
              'https://github.com/FightFarewellFearless/anime-react-native',
            );
          }}
          style={{
            flexDirection: 'row',
            backgroundColor: '#2b2b2b',
            padding: 10,
            borderRadius: 8,
            alignItems: 'center',
          }}>
          <Image source={rnLogo} style={{ height: 40, width: 40 }} />
          <Icon name="github" size={43} color={styles.text.color} />
          <Text style={[styles.text, { fontSize: 12 }]}>
            {' '}
            Open-Sourced on github
          </Text>
        </TouchableOpacity>
      </View>
      <Text style={[styles.text, { position: 'absolute', bottom: 0, left: 0 }]}>
        {appVersion}
      </Text>
    </View>
  );
}

export default Loading;
