import Icon from '@react-native-vector-icons/fontawesome';
import Fontisto from '@react-native-vector-icons/fontisto';
import MaterialIcon from '@react-native-vector-icons/material-design-icons';
import { StackActions } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Updates from 'expo-updates';
import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  StyleSheet,
  Text,
  ToastAndroid,
  TouchableOpacity,
  useColorScheme,
  View,
  ScrollView,
} from 'react-native';
import RNFetchBlob from 'react-native-blob-util';
import Orientation from 'react-native-orientation-locker';
import { useTheme } from 'react-native-paper';
import {
  default as Reanimated,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { version as appVersion, OTAJSVersion } from '../../../package.json';
import runningText from '../../assets/runningText.json';
import useGlobalStyles from '../../assets/style';
import defaultDatabase from '../../misc/defaultDatabaseValue.json';
import { EpisodeBaruHome } from '../../types/anime';
import { SetDatabaseTarget } from '../../types/databaseTarget';
import { RootStackNavigator } from '../../types/navigation';
import AnimeAPI from '../../utils/AnimeAPI';
import animeLocalAPI from '../../utils/scrapers/animeSeries';
import { AnimeMovieWebView } from '../../utils/scrapers/animeMovie';
import { DANGER_MIGRATE_OLD_HISTORY, DatabaseManager } from '../../utils/DatabaseManager';
import deviceUserAgent from '../../utils/deviceUserAgent';

export const JoinDiscord = () => {
  const styles = useStyles();
  return (
    <TouchableOpacity
      onPress={() => Linking.openURL('https://discord.gg/sbTwxHb9NM')}
      style={styles.socialButton}>
      <Fontisto name="discord" size={24} color={'#7289d9'} />
      <Text style={styles.socialButtonText}>Join Discord</Text>
    </TouchableOpacity>
  );
};

type Props = NativeStackScreenProps<RootStackNavigator, 'connectToServer'>;

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

  const [isAnimeMovieWebViewOpen, setIsAnimeMovieWebViewOpen] = useState(false);
  const [progressValue, setProgressValue] = useState(0);
  const progressValueAnimation = useSharedValue(0);

  const fetchAnimeData = useCallback(async () => {
    const jsondata: EpisodeBaruHome | void = await AnimeAPI.home().catch(() => {
      // props.navigation.dispatch(StackActions.replace('FailedToConnect'));
      ToastAndroid.show('Gagal menghubungkan ke server anime', ToastAndroid.SHORT);
    });
    setLoadStatus(old => ({
      ...old,
      'Menghubungkan ke server': true,
    }));
    if (jsondata === undefined) {
      return {
        newAnime: [],
        jadwalAnime: [],
      };
    }
    return jsondata;
  }, []);

  const prepareData = useCallback(async () => {
    const arrOfDefaultData = Object.keys(defaultDatabase) as SetDatabaseTarget[];
    const allKeys = await DatabaseManager.getAllKeys();
    for (const dataKey of arrOfDefaultData) {
      const data = await DatabaseManager.get(dataKey);
      if (data === null || data === undefined) {
        await DatabaseManager.set(dataKey, defaultDatabase[dataKey]);
        continue;
      }
    }
    // History migration to individual key per item
    // @ts-expect-error
    const history = await DatabaseManager.get('history');
    if (history) {
      ToastAndroid.show('Mengoptimalkan data history...', ToastAndroid.SHORT);
      await DANGER_MIGRATE_OLD_HISTORY(JSON.parse(history));
    }
    const isInDatabase = (key: string): key is SetDatabaseTarget => {
      return (arrOfDefaultData as readonly string[]).includes(key);
    };
    for (const dataKey of allKeys) {
      if (
        !isInDatabase(dataKey) &&
        !dataKey.startsWith('IGNORE_DEFAULT_DB_') &&
        !dataKey.startsWith('historyItem:')
      ) {
        DatabaseManager.delete(dataKey);
      }
    }
  }, []);

  const deleteUnnecessaryUpdate = useCallback(async () => {
    const downloadPath = `${RNFetchBlob.fs.dirs.DownloadDir}/AniFlix-${appVersion}.apk`;
    const isExist = await RNFetchBlob.fs.exists(downloadPath);
    if (isExist) {
      await RNFetchBlob.fs.unlink(downloadPath);
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

  const moviePromiseResolve = useRef<(val?: unknown) => void>(null);
  const [animeMoviePromise] = useState(
    () => new Promise(res => (moviePromiseResolve.current = res)),
  );
  const onAnimeMovieReady = useCallback(() => {
    setLoadStatus(old => ({
      ...old,
      'Mempersiapkan data anime movie': true,
    }));
    setIsAnimeMovieWebViewOpen(false);
    moviePromiseResolve.current?.();
  }, []);

  const connectToServers = useCallback(async () => {
    setIsAnimeMovieWebViewOpen(true);
    const animeData = await fetchAnimeData();
    Promise.all([animeData, animeMoviePromise]).then(([anime]) => {
      if (anime === undefined) {
        return;
      }
      props.navigation.dispatch(StackActions.replace('Home', { data: anime }));
    });
  }, [animeMoviePromise, fetchAnimeData, props.navigation]);

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
        let isOtaDone = false;
        async function OTADone() {
          if (isOtaDone) return;
          setLoadStatus(old => ({
            ...old,
            'Mengecek versi aplikasi': true,
          }));
          await fetchDomain();
          setLoadStatus(old => ({
            ...old,
            'Mendapatkan domain terbaru': true,
          }));
          connectToServers();
          isOtaDone = true;
        }
        const OTAUpdate = await Updates.checkForUpdateAsync().catch(() => {
          ToastAndroid.show('Gagal mengecek OTA update', ToastAndroid.SHORT);
          return null;
        });

        setTimeout(() => {
          if (isOtaDone) return;
          ToastAndroid.show('Pengecekan versi dilewati', ToastAndroid.SHORT);
          OTADone();
        }, 6_000);

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
        await OTADone();
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
    fetchAnimeData,
    prepareData,
    checkNativeAppVersion,
    props.navigation,
    deleteUnnecessaryUpdate,
    fetchDomain,
    connectToServers,
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
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
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
    </ScrollView>
  );
}

function useStyles() {
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          flexGrow: 1,
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
          color: theme.colors.primary,
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
          elevation: 2,
        },
        quoteIcon: {
          color: theme.colors.primary,
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
          color: theme.colors.primary,
          textAlign: 'right',
          marginTop: 8,
        },
        progressContainer: {
          flexShrink: 0,
          flexWrap: 'nowrap',
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
          backgroundColor: theme.colors.primary,
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
          flexWrap: 'wrap',
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
          color: theme.colors.primary,
        },
      }),
    [isDark, theme.colors.primary],
  );
}

export default Loading;
