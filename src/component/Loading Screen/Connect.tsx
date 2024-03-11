import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  Linking,
  StyleSheet,
  ToastAndroid,
} from 'react-native';
import { StackActions } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/FontAwesome';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useDispatch } from 'react-redux';

import { AppDispatch } from '../../misc/reduxStore';
import { setDatabase } from '../../misc/reduxSlice';
import globalStyles from '../../assets/style';
import defaultDatabase from '../../misc/defaultDatabaseValue.json';
import { version as appVersion } from '../../../package.json';
import deviceUserAgent from '../../utils/deviceUserAgent';
import Orientation from 'react-native-orientation-locker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackNavigator } from '../../types/navigation';
import { SetDatabaseTarget } from '../../types/redux';
import { Home } from '../../types/anime';
import colorScheme from '../../utils/colorScheme';
import AnimeAPI from '../../utils/AnimeAPI';
import RNFetchBlob from 'react-native-blob-util';

import animeLocalAPI from '../../utils/animeLocalAPI';

type Props = NativeStackScreenProps<RootStackNavigator, 'connectToServer'>;

function Loading(props: Props) {
  useEffect(() => {
    Orientation.unlockAllOrientations(); // to prevent orientation locked during activity changes
    (async () => {
      if ((await AsyncStorage.getItem('lockScreenOrientation')) === 'true') {
        Orientation.lockToPortrait();
      }
    })();
  }, []);
  const [loadStatus, setLoadStatus] = useState('Menyiapkan data');

  const dispatchSettings = useDispatch<AppDispatch>();

  const connectToServer = useCallback(async () => {
    const jsondata: Home | void = await AnimeAPI.home().catch(() => {
      props.navigation.dispatch(StackActions.replace('FailedToConnect'));
    });
    if (jsondata === undefined) {
      return;
    }
    // if (jsondata.maintenance === true) {
    //   props.navigation.dispatch(
    //     StackActions.replace('Maintenance', {
    //       message: jsondata.message,
    //     }),
    //   );
    //   return;
    // }
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
  }, [dispatchSettings]);

  const deleteUnnecessaryUpdate = useCallback(async () => {
    const isExist = await Promise.all([
      // TODO: delete this line in next 2 versions
      RNFetchBlob.fs.exists(
        `/storage/emulated/0/Download/AniFlix-${appVersion}.apk`,
      ),
      RNFetchBlob.fs.exists(
        `${RNFetchBlob.fs.dirs.DownloadDir}/AniFlix-${appVersion}.apk`,
      ),
    ]);
    if (isExist.includes(true)) {
      const existingPath = isExist[0]
        ? `/storage/emulated/0/Download/AniFlix-${appVersion}.apk`
        : `${RNFetchBlob.fs.dirs.DownloadDir}/AniFlix-${appVersion}.apk`;
      await RNFetchBlob.fs.unlink(existingPath);
      ToastAndroid.show('Menghapus update tidak terpakai', ToastAndroid.SHORT);
    }
  }, []);

  const fetchDomain = useCallback(async() => {
    await animeLocalAPI.fetchLatestDomain().catch(() => {
      ToastAndroid.show('Gagal mendapatkan domain terbaru, menggunakan domain default', ToastAndroid.SHORT);
    });
  }, []);

  const checkVersion = useCallback(async () => {
    const data = await fetch(
      'https://api.github.com/repos/FightFarewellFearless/AniFlix/releases?per_page=1',
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
    } else if (data[0]?.tag_name === appVersion) {
      return true;
    }
    else if (data[0] === undefined) {
      ToastAndroid.show('Melewatkan pengecekan versi karna terkena rate limit', ToastAndroid.SHORT);
      return true;
    }
    return data[0];
  }, []);

  useEffect(() => {
    (async () => {
      await prepareData();
      await deleteUnnecessaryUpdate();
      setLoadStatus('Mengecek versi aplikasi');
      const version = await checkVersion();
      if (version === null) {
        props.navigation.dispatch(StackActions.replace('FailedToConnect'));
      } else if (version === true || __DEV__) {
        // skip update when app is in dev mode
        setLoadStatus('Mendapatkan domain');
        await fetchDomain();
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
  }, [
    connectToServer,
    prepareData,
    checkVersion,
    props.navigation,
    deleteUnnecessaryUpdate,
  ]);

  return (
    <View
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        flex: 1,
      }}>
      <ActivityIndicator size="large" />
      <Text style={globalStyles.text}>{loadStatus}, mohon tunggu...</Text>
      <View
        style={{
          position: 'absolute',
          flexDirection: 'row',
          justifyContent: 'space-around',
          bottom: 45,
        }}>
        <TouchableOpacity
          onPress={() => {
            Linking.openURL('https://github.com/FightFarewellFearless/AniFlix');
          }}
          style={[styles.bottomCredits, { marginRight: 8 }]}>
          {/* <Image source={rnLogo} style={{ height: 40, width: 40 }} /> */}
          <Icon name="github" size={43} color={globalStyles.text.color} />
          <Text style={[globalStyles.text, { fontSize: 12 }]}>
            {' '}
            Open-Sourced on github
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            Linking.openURL('https://discord.gg/sbTwxHb9NM');
          }}
          style={styles.bottomCredits}>
          {/* <Image source={rnLogo} style={{ height: 40, width: 40 }} /> */}
          <MaterialIcon name="discord" size={43} color={'#7289d9'} />
          <Text style={[globalStyles.text, { fontSize: 12 }]}>
            {' '}
            Join discord
          </Text>
        </TouchableOpacity>
      </View>
      <Text
        style={[
          globalStyles.text,
          { position: 'absolute', bottom: 0, left: 0 },
        ]}>
        {appVersion}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomCredits: {
    flexDirection: 'row',
    backgroundColor: colorScheme === 'dark' ? '#2b2b2b' : '#a8a8a8',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
});

export default Loading;
