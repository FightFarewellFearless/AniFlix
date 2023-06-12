import React, { useCallback, useContext, useEffect, useState } from 'react';
import { View, ActivityIndicator, Text, Image } from 'react-native';
import { StackActions } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { SettingsContext } from '../misc/context';
import styles from '../assets/style';
import rnLogo from '../assets/RNlogo.png';
import defaultDatabase from '../misc/defaultDatabaseValue.json';

function Loading(props) {
  const [loadStatus, setLoadStatus] = useState('Menyiapkan data');
  const { dispatchSettings } = useContext(SettingsContext);

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
        dispatchSettings({
          target: dataKey,
          value: defaultDatabase[dataKey],
        });
        return;
      }
      dispatchSettings({
        target: dataKey,
        value: data,
      });
    }
  }, [dispatchSettings]);

  useEffect(() => {
    (async () => {
      await prepareData();
      setLoadStatus('Menghubungkan ke server');
      await connectToServer();
    })();
  }, [connectToServer, prepareData]);

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
          bottom: 40,
          alignItems: 'center',
        }}>
        <Image source={rnLogo} style={{ height: 40, width: 40 }} />
        <Text style={[styles.text, { fontSize: 12 }]}>
          Created using react-native
        </Text>
      </View>
      <Text style={[styles.text, { position: 'absolute', bottom: 0, left: 0 }]}>
        {require('../../package.json').version}
      </Text>
    </View>
  );
}

export default Loading;
