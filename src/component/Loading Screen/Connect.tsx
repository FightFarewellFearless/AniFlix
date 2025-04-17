import { StackActions } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ExpoOrientation from 'expo-screen-orientation';
import * as Updates from 'expo-updates';
import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  StyleSheet,
  Text,
  ToastAndroid,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import RNFetchBlob from 'react-native-blob-util';
import Reanimated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/FontAwesome';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { version as appVersion, OTAJSVersion } from '../../../package.json';
import runningText from '../../assets/runningText.json';
import useGlobalStyles from '../../assets/style';
import defaultDatabase from '../../misc/defaultDatabaseValue.json';
import { EpisodeBaruHome } from '../../types/anime';
import { SetDatabaseTarget } from '../../types/databaseTarget';
import { RootStackNavigator } from '../../types/navigation';
import AnimeAPI from '../../utils/AnimeAPI';
import animeLocalAPI from '../../utils/animeLocalAPI';
import {
  hasMigratedFromAsyncStorage,
  migrateFromAsyncStorage,
  storage,
} from '../../utils/DatabaseManager';
import deviceUserAgent from '../../utils/deviceUserAgent';

const AnimeMovieWebView = React.lazy(() =>
  import('../../utils/animeMovie').then(a => ({ default: a.AnimeMovieWebView })),
);

export const JoinDiscord = () => {
  const styles = useStyles();
  return (
    <TouchableOpacity
      onPress={() => Linking.openURL('https://discord.gg/sbTwxHb9NM')}
      style={styles.socialButton}>
      <MaterialIcon name="discord" size={24} color={'#7289d9'} />
      <Text style={styles.socialButtonText}>Join Discord</Text>
    </TouchableOpacity>
  );
};

type Props = NativeStackScreenProps<RootStackNavigator, 'connectToServer'>;

function Loading(props: Props) {
  const styles = useStyles();
  const globalStyles = useGlobalStyles();

  useEffect(() => {
    ExpoOrientation.lockAsync(ExpoOrientation.OrientationLock.PORTRAIT);
  }, []);

  const [loadStatus, setLoadStatus] = useState({
    'Menyiapkan database': false,
    'Mengecek versi aplikasi': false,
    'Mendapatkan domain terbaru': false,
    'Mempersiapkan data anime movie': false,
    'Menghubungkan ke server': false,
  });

  const [isAnimeMovieWebViewOpen, setIsAnimeMovieWebViewOpen] = useState(false);
  const [progressValue, setProgressValue] = useState(0);
  const progressValueAnimation = useSharedValue(0);

  const connectToServer = useCallback(async () => {
    const jsondata: EpisodeBaruHome | void = await AnimeAPI.home().catch(() => {
      props.navigation.dispatch(StackActions.replace('FailedToConnect'));
    });
    if (jsondata === undefined) return;
    props.navigation.dispatch(StackActions.replace('Home', { data: jsondata }));
  }, [props.navigation]);

  const prepareData = useCallback(async () => {
    if (!hasMigratedFromAsyncStorage) {
      await migrateFromAsyncStorage();
      ToastAndroid.show('Migrasi dari AsyncStorage ke MMKV berhasil', ToastAndroid.SHORT);
    }

    const arrOfDefaultData = Object.keys(defaultDatabase) as SetDatabaseTarget[];
    const allKeys = storage.getAllKeys();
    for (const dataKey of arrOfDefaultData) {
      const data = storage.getString(dataKey);
      if (data === undefined) {
        storage.set(dataKey, defaultDatabase[dataKey]);
        continue;
      }
    }
    const isInDatabase = (value: string): value is SetDatabaseTarget => {
      return (arrOfDefaultData as readonly string[]).includes(value);
    };
    for (const dataKey of allKeys) {
      if (!isInDatabase(dataKey) && !dataKey.startsWith('IGNORE_DEFAULT_DB_')) {
        storage.delete(dataKey);
      }
    }
  }, []);

  const deleteUnnecessaryUpdate = useCallback(async () => {
    const isExist = await Promise.all([
      RNFetchBlob.fs.exists(`/storage/emulated/0/Download/AniFlix-${appVersion}.apk`),
      RNFetchBlob.fs.exists(`${RNFetchBlob.fs.dirs.DownloadDir}/AniFlix-${appVersion}.apk`),
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
      ToastAndroid.show(
        'Gagal mendapatkan domain terbaru, menggunakan domain default',
        ToastAndroid.SHORT,
      );
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
      .catch(() => {});
    clearTimeout(timoeut);
    if (data === undefined) {
      ToastAndroid.show('Error saat mengecek versi', ToastAndroid.SHORT);
      return true;
    } else if (data[0]?.tag_name === appVersion) {
      return true;
    } else if (data[0] === undefined) {
      ToastAndroid.show('Melewatkan pengecekan versi karna terkena rate limit', ToastAndroid.SHORT);
      return true;
    }
    return data[0];
  }, []);

  const onAnimeMovieReady = useCallback(() => {
    setLoadStatus(old => ({
      ...old,
      'Mempersiapkan data anime movie': true,
    }));
    setIsAnimeMovieWebViewOpen(false);
    connectToServer();
  }, [connectToServer]);

  useEffect(() => {
    (async () => {
      await prepareData();
      await deleteUnnecessaryUpdate();
      setLoadStatus(old => ({
        ...old,
        'Menyiapkan database': true,
      }));

      const nativeAppVersion = await checkNativeAppVersion();
      if (nativeAppVersion === null) {
        props.navigation.dispatch(StackActions.replace('FailedToConnect'));
      } else if (nativeAppVersion === true || __DEV__) {
        const OTAUpdate = await Updates.checkForUpdateAsync().catch(() => {
          ToastAndroid.show('Gagal mengecek update', ToastAndroid.SHORT);
          return null;
        });

        if (OTAUpdate !== null && OTAUpdate.isAvailable) {
          const changelog = await fetch(
            'https://raw.githubusercontent.com/FightFarewellFearless/AniFlix/refs/heads/master/CHANGELOG.md',
            {
              headers: {
                'User-Agent': deviceUserAgent,
                'Cache-Control': 'no-cache',
              },
            },
          )
            .then(d => d.text())
            .catch(() => 'Gagal mendapatkan changelog');
          props.navigation.dispatch(
            StackActions.replace('NeedUpdate', {
              changelog,
              size: 0,
              nativeUpdate: false,
            }),
          );
          return;
        }

        setLoadStatus(old => ({
          ...old,
          'Mengecek versi aplikasi': true,
        }));
        await fetchDomain();
        setLoadStatus(old => ({
          ...old,
          'Mendapatkan domain terbaru': true,
        }));
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
    fetchDomain,
  ]);

  useEffect(() => {
    const completedSteps = Object.values(loadStatus).filter(Boolean).length;
    const totalSteps = Object.keys(loadStatus).length;
    const progress = (completedSteps / totalSteps) * 100;
    setProgressValue(progress);
    progressValueAnimation.set(withTiming(progress));
  }, [loadStatus, progressValueAnimation]);

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${progressValueAnimation.get()}%`,
  }));

  const quotes = useMemo(() => runningText[Math.floor(runningText.length * Math.random())], []);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {isAnimeMovieWebViewOpen && (
          <Suspense>
            <AnimeMovieWebView
              isWebViewShown={isAnimeMovieWebViewOpen}
              setIsWebViewShown={setIsAnimeMovieWebViewOpen}
              onAnimeMovieReady={onAnimeMovieReady}
            />
          </Suspense>
        )}

        <View style={styles.header}>
          <Text style={styles.appName}>AniFlix</Text>
          <Text style={styles.subtitle}>Loading your anime experience...</Text>
        </View>

        <View style={styles.quoteCard}>
          <MaterialIcon name="format-quote-open" size={24} color={styles.quoteIcon.color} />
          <Text style={styles.quoteText}>"{quotes.quote}"</Text>
          <Text style={styles.quoteAuthor}>— {quotes.by}</Text>
          <MaterialIcon
            name="format-quote-close"
            size={24}
            color={styles.quoteIcon.color}
            style={styles.quoteCloseIcon}
          />
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <Reanimated.View style={[styles.progressFill, progressBarStyle]} />
          </View>
          <Text style={styles.progressText}>{Math.round(progressValue)}%</Text>
        </View>

        <View style={styles.statusContainer}>
          {Object.entries(loadStatus).map(([key, value]) => (
            <View style={styles.statusItem} key={key}>
              {value ? (
                <MaterialIcon name="check-circle" size={20} color="#4CAF50" />
              ) : (
                <ActivityIndicator size="small" color={styles.loadingIndicator.color} />
              )}
              <Text style={styles.statusText}>{key}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.socialButtons}>
          <TouchableOpacity
            onPress={() => Linking.openURL('https://github.com/FightFarewellFearless/AniFlix')}
            style={styles.socialButton}>
            <Icon name="github" size={24} color={globalStyles.text.color} />
            <Text style={styles.socialButtonText}>GitHub</Text>
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
  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: isDark ? '#121212' : '#f5f5f5',
          padding: 24,
          justifyContent: 'space-between',
        },
        content: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
        },
        header: {
          alignItems: 'center',
          marginBottom: 32,
        },
        appName: {
          fontSize: 32,
          fontWeight: 'bold',
          color: isDark ? '#BB86FC' : '#6200EE',
          marginBottom: 8,
        },
        subtitle: {
          fontSize: 16,
          color: isDark ? '#aaa' : '#666',
        },
        quoteCard: {
          backgroundColor: isDark ? '#1E1E1E' : '#fff',
          borderRadius: 12,
          padding: 20,
          marginBottom: 24,
          width: '100%',
          elevation: 2,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        quoteIcon: {
          color: isDark ? '#BB86FC' : '#6200EE',
          opacity: 0.6,
        },
        quoteCloseIcon: {
          alignSelf: 'flex-end',
          marginTop: -10,
        },
        quoteText: {
          fontSize: 16,
          fontStyle: 'italic',
          color: isDark ? '#e0e0e0' : '#333',
          textAlign: 'center',
          marginVertical: 8,
          lineHeight: 24,
        },
        quoteAuthor: {
          fontSize: 14,
          fontWeight: 'bold',
          color: isDark ? '#BB86FC' : '#6200EE',
          textAlign: 'right',
          marginTop: 8,
        },
        progressContainer: {
          width: '100%',
          marginBottom: 24,
          alignItems: 'center',
        },
        progressBar: {
          height: 8,
          width: '100%',
          backgroundColor: isDark ? '#333' : '#e0e0e0',
          borderRadius: 4,
          overflow: 'hidden',
          marginBottom: 8,
        },
        progressFill: {
          height: '100%',
          backgroundColor: isDark ? '#BB86FC' : '#6200EE',
          borderRadius: 4,
        },
        progressText: {
          fontSize: 14,
          color: isDark ? '#aaa' : '#666',
        },
        statusContainer: {
          width: '100%',
          backgroundColor: isDark ? '#1E1E1E' : '#fff',
          borderRadius: 12,
          padding: 16,
          elevation: 2,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        statusItem: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 8,
        },
        statusText: {
          fontSize: 14,
          color: isDark ? '#e0e0e0' : '#333',
          marginLeft: 12,
        },
        footer: {
          alignItems: 'center',
          paddingTop: 16,
        },
        socialButtons: {
          flexDirection: 'row',
          justifyContent: 'center',
          marginBottom: 16,
        },
        socialButton: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: isDark ? '#252525' : '#e0e0e0',
          paddingVertical: 8,
          paddingHorizontal: 16,
          borderRadius: 20,
          marginHorizontal: 8,
        },
        socialButtonText: {
          fontSize: 14,
          fontWeight: '500',
          color: isDark ? '#e0e0e0' : '#333',
          marginLeft: 8,
        },
        versionText: {
          fontSize: 12,
          color: isDark ? '#666' : '#999',
          marginBottom: 8,
        },
        loadingIndicator: {
          color: isDark ? '#BB86FC' : '#6200EE',
        },
      }),
    [isDark],
  );
}

export default Loading;
