import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  ActivityIndicator,
  Text,
  Linking,
  StyleSheet,
  ToastAndroid,
  useColorScheme,
} from 'react-native';
import { TouchableOpacity } from 'react-native'; //rngh
import { StackActions } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/FontAwesome';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useDispatch } from 'react-redux';

import { AppDispatch } from '../../misc/reduxStore';
import { setDatabase } from '../../misc/reduxSlice';
import useGlobalStyles from '../../assets/style';
import defaultDatabase from '../../misc/defaultDatabaseValue.json';
import { version as appVersion, OTAJSVersion } from '../../../package.json';
import deviceUserAgent from '../../utils/deviceUserAgent';
import Orientation from 'react-native-orientation-locker';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackNavigator } from '../../types/navigation';
import { SetDatabaseTarget } from '../../types/redux';
import { EpisodeBaruHome } from '../../types/anime';
import AnimeAPI from '../../utils/AnimeAPI';
import RNFetchBlob from 'react-native-blob-util';

import animeLocalAPI from '../../utils/animeLocalAPI';

import * as Updates from 'expo-updates';
import { AnimeMovieWebView } from '../../utils/animeMovie';
import runningText from '../../assets/runningText.json';

export const JoinDiscord = () => {
  const styles = useStyles();
  const globalStyles = useGlobalStyles();
  return <TouchableOpacity
    onPress={() => {
      Linking.openURL('https://discord.gg/sbTwxHb9NM');
    }}
    style={styles.bottomCredits}>
    {/* <Image source={rnLogo} style={{ height: 40, width: 40 }} /> */}
    <MaterialIcon name="discord" size={43} color={'#7289d9'} />
    <Text style={[globalStyles.text, { fontSize: 12, fontWeight: 'bold' }]}>
      {' '}
      Join discord
    </Text>
  </TouchableOpacity>
}

type Props = StackScreenProps<RootStackNavigator, 'connectToServer'>;

function Loading(props: Props) {
  const styles = useStyles();
  const globalStyles = useGlobalStyles();
  useEffect(() => {
    Orientation.lockToPortrait();
  }, []);

  const [loadStatus, setLoadStatus] = useState({
    'Menyiapkan database': false,
    'Mengecek versi aplikasi': false,
    'Mendapatkan domain terbaru': false,
    'Mempersiapkan data anime movie': false,
    'Menghubungkan ke server': false,
  });

  const [isAnimeMovieWebViewOpen, setIsAnimeMovieWebViewOpen] = useState(true);

  const dispatchSettings = useDispatch<AppDispatch>();

  const connectToServer = useCallback(async () => {
    const jsondata: EpisodeBaruHome | void = await AnimeAPI.home().catch(() => {
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
    const arrOfDefaultData = Object.keys(defaultDatabase) as SetDatabaseTarget[];
    const allKeys = await AsyncStorage.getAllKeys();
    for (const dataKey of arrOfDefaultData) {
      const data = await AsyncStorage.getItem(dataKey);
      if (data === null) {
        dispatchSettings(
          setDatabase({
            target: dataKey,
            value: defaultDatabase[dataKey],
          }),
        );
        continue;
      }
      dispatchSettings(
        setDatabase({
          target: dataKey,
          value: data,
        }),
      );
    }
    const isInDatabase = (value: string): value is SetDatabaseTarget => {
      return (arrOfDefaultData as readonly string[]).includes(value);
    }
    for (const dataKey of allKeys) {
      if (!isInDatabase(dataKey)) {
        AsyncStorage.removeItem(dataKey);
      }
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

  const fetchDomain = useCallback(async () => {
    await animeLocalAPI.fetchLatestDomain().catch(() => {
      ToastAndroid.show('Gagal mendapatkan domain terbaru, menggunakan domain default', ToastAndroid.SHORT);
    });
  }, []);

  const checkNativeAppVersion = useCallback(async () => {
    const abort = new AbortController();
    const timoeut = setTimeout(() => abort.abort(), 5000);
    const data = await fetch(
      'https://api.github.com/repos/FightFarewellFearless/AniFlix/releases?per_page=1',
      {
        signal: abort.signal,
        headers: {
          'User-Agent': deviceUserAgent,
        },
      },
    )
      .then(d => d.json())
      .catch(() => { });
    clearTimeout(timoeut);
    if (data === undefined) {
      ToastAndroid.show('Error saat mengecek versi', ToastAndroid.SHORT);
      return true;
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
      setLoadStatus(old => {
        return {
          ...old,
          'Menyiapkan database': true,
        }
      });
      const nativeAppVersion = await checkNativeAppVersion();
      if (nativeAppVersion === null) {
        props.navigation.dispatch(StackActions.replace('FailedToConnect'));
      } else if (nativeAppVersion === true ||
        __DEV__ // skip update when app is in dev mode
      ) {

        const OTAUpdate = await Updates.checkForUpdateAsync().catch(() => {
          ToastAndroid.show('Gagal mengecek update', ToastAndroid.SHORT);
          return null;
        });

        if (OTAUpdate !== null && OTAUpdate.isAvailable) {
          const changelog = await fetch('https://raw.githubusercontent.com/FightFarewellFearless/AniFlix/refs/heads/master/CHANGELOG.md', {
            headers: {
              'User-Agent': deviceUserAgent,
              'Cache-Control': 'no-cache',
            },
          }).then(d => d.text()).catch(() => 'Gagal mendapatkan changelog');
          props.navigation.dispatch(
            StackActions.replace('NeedUpdate', {
              changelog,
              // size: "OTAUpdate.packageSize",
              size: 0,
              nativeUpdate: false,
            }),
          );
          return;
        };

        setLoadStatus(old => {
          return {
            ...old,
            'Mengecek versi aplikasi': true,
          }
        });
        await fetchDomain();
        setLoadStatus(old => {
          return {
            ...old,
            'Mendapatkan domain terbaru': true,
          }
        });
        setIsAnimeMovieWebViewOpen(true);
      } else {
        const latestVersion = nativeAppVersion.tag_name;
        const changelog = nativeAppVersion.body;
        const download = nativeAppVersion.assets[0].browser_download_url;

        props.navigation.dispatch(
          StackActions.replace('NeedUpdate', {
            latestVersion,
            changelog,
            download,
            nativeUpdate: true,
          }),
        );
      }
    })();
  }, [
    connectToServer,
    prepareData,
    checkNativeAppVersion,
    props.navigation,
    deleteUnnecessaryUpdate,
  ]);

  const onAnimeMovieReady = useCallback(() => {
    setLoadStatus(old => {
      return {
        ...old,
        'Mempersiapkan data anime movie': true,
      }
    });
    setIsAnimeMovieWebViewOpen(false);
    connectToServer();
  }, []);

  const quotes = useMemo(() => runningText[~~(runningText.length * Math.random())], []);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <AnimeMovieWebView
          isWebViewShown={isAnimeMovieWebViewOpen}
          setIsWebViewShown={setIsAnimeMovieWebViewOpen}
          onAnimeMovieReady={onAnimeMovieReady}
        />
        <View style={styles.quotesBox}>
          <Text style={[globalStyles.text, { fontSize: 16, fontStyle: 'italic', textAlign: 'center', fontFamily: 'serif' }]}>
            "{quotes.quote}"{'\n'}
            <Text style={[globalStyles.text, { fontSize: 14, fontWeight: 'bold', textAlign: 'center', marginTop: 10 }]}>
              - {quotes.by}
            </Text>
          </Text>
        </View>
        <Text style={[globalStyles.text, { fontSize: 18, marginBottom: 10 }]}>
          Tunggu sebentar ya.. lagi loading
        </Text>
        {Object.entries(loadStatus).map(([key, value]) => (
          <View style={{ flexDirection: 'row', alignItems: 'center' }} key={key}>
            {!value ? (
              <ActivityIndicator size="small" color={styles.loadingIndicator.color} />
            ) : (
              <Icon name="check" size={14} color="green" />
            )}
            <Text style={globalStyles.text}>{' ' + key}</Text>
          </View>
        ))}
      </View>
      <View style={styles.footer}>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            onPress={() => Linking.openURL('https://github.com/FightFarewellFearless/AniFlix')}
            style={[styles.bottomCredits, { marginRight: 8 }]}
          >
            <Icon name="github" size={43} color={globalStyles.text.color} />
            <Text style={[globalStyles.text, { fontSize: 12, fontWeight: 'bold' }]}>
              {' '}
              Open-Sourced on github
            </Text>
          </TouchableOpacity>
          <JoinDiscord />
        </View>
        <Text style={styles.versionText}>
          {appVersion}-JS_{OTAJSVersion}
        </Text>
      </View>
    </View>
  );
}

function useStyles() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  return StyleSheet.create({
    quotesBox: {
      position: 'absolute',
      top: 10,
      padding: 20,
      marginVertical: 20,
      borderRadius: 10,
      borderColor: isDark ? '#444' : '#ccc',
      borderWidth: 1,
      elevation: 2,
    },
    loadingIndicator: {
      color: isDark ? '#BB86FC' : '#6200EE',
    },
    container: {
      flex: 1,
      backgroundColor: isDark ? '#141414' : '#ffffff',
      padding: 20,
      justifyContent: 'space-between',
    },
    content: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    footer: {
      alignItems: 'center',
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
    },
    buttonRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      width: '100%',
      marginBottom: 10,
    },
    versionText: {
      fontSize: 12,
      color: isDark ? '#aaa' : '#888',
    },
    bottomCredits: {
      flexDirection: 'row',
      backgroundColor: isDark ? '#2b2b2b' : '#d8d8d8',
      padding: 10,
      borderRadius: 8,
      alignItems: 'center',
      elevation: 4,
    },
  });
}

export default Loading;
