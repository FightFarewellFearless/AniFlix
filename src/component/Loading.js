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

import { setDatabase } from '../misc/reduxSlice';
import styles from '../assets/style';
import rnLogo from '../assets/RNlogo.png';
import defaultDatabase from '../misc/defaultDatabaseValue.json';
import { version as appVersion } from '../../package.json';

function Loading(props) {
  const [loadStatus, setLoadStatus] = useState('Menyiapkan data');

  const dispatchSettings = useDispatch();

  const connectToServer = useCallback(async () => {
    const jsondata = await fetch('https://animeapi.aceracia.repl.co/v2/home')
      .then(data => data.json())
      .catch(e => {
        props.navigation.dispatch(StackActions.replace('FailedToConnect'));
      });
    if (jsondata === undefined) {
      return;
    }
    props.navigation.dispatch(
      StackActions.replace('Home', {
        data: jsondata,
      }),
    );
  }, [props.navigation]);

  const prepareData = useCallback(async () => {
    const arrOfData = Object.keys(defaultDatabase);
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
  }, [dispatchSettings]);

  const checkVersion = useCallback(async () => {
    const [data] = await fetch(
      'https://api.github.com/repos/FightFarewellFearless/anime-react-native/releases',
    ).then(d => d.json());
    if (data.tag_name === appVersion) {
      return true;
    }
    return data;
  }, []);

  useEffect(() => {
    (async () => {
      await prepareData();
      setLoadStatus('Mengecek versi aplikasi');
      const version = await checkVersion();
      if (version === true || __DEV__) {
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
