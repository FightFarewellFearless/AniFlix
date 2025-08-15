import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  ToastAndroid,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import Markdown from 'react-native-marked';
import Icon from 'react-native-vector-icons/FontAwesome5';

import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Updates from 'expo-updates';
import RNFetchBlob from 'react-native-blob-util';
import Animated, {
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { runOnJS } from 'react-native-worklets';
import { version as appVersion, OTAJSVersion } from '../../package.json';
import useGlobalStyles from '../assets/style';
import { RootStackNavigator } from '../types/navigation';
import DialogManager from '../utils/dialogManager';

type Props = NativeStackScreenProps<RootStackNavigator, 'NeedUpdate'>;

const MB = 1000;

function NeedUpdate(props: Props) {
  const globalStyles = useGlobalStyles();
  const styles = useStyles();

  const [isDownloadStart, setIsDownloadStart] = useState(false);
  const downloadProgress = useSharedValue(0);
  const [isProgress100, setIsProgress100] = useState(true);

  const lastMB = useRef(0);
  const lastMS = useRef(0);
  const [totalMB, setTotalMB] = useState(0);
  const [netSpeed, setNetSpeed] = useState('0 MB/s');
  const [progressPercent, setProgressPercent] = useState(0); // new state

  useAnimatedReaction(
    () => downloadProgress.get(),
    value => {
      if (value === 100) {
        runOnJS(setIsProgress100)(true);
      } else {
        runOnJS(setIsProgress100)(false);
      }
    },
  );

  useEffect(() => {
    if (props.route.params.nativeUpdate) {
      RNFetchBlob.fs
        .exists(
          `${RNFetchBlob.fs.dirs.DownloadDir}/AniFlix-${props.route.params.latestVersion}.apk`,
        )
        .then(value => {
          setIsDownloadStart(value);
          downloadProgress.set(value ? 100 : 0);
        });
    }
  }, [downloadProgress, props.route.params]);

  const downloadUpdate = useCallback(() => {
    setIsDownloadStart(true);
    if (props.route.params.nativeUpdate) {
      RNFetchBlob.config({
        path: `${RNFetchBlob.fs.dirs.DownloadDir}/AniFlix-${props.route.params.latestVersion}.apk`,
      })
        .fetch('GET', props.route.params.download)
        .progress((receivedS, totalS) => {
          const received = Number(receivedS);
          const total = Number(totalS);
          const percent = Math.floor((received / total) * 100);
          downloadProgress.set(withTiming(percent));
          setProgressPercent(percent); // update progress percentage
          setNetSpeed(
            `${(
              (received - lastMB.current) /
              MB /
              MB /
              ((Date.now() - lastMS.current) / 1000)
            ).toFixed(2)} MB/s`,
          );
          lastMB.current = received;
          lastMS.current = Date.now();
          setTotalMB(total);
        })
        .then(async res => {
          setIsDownloadStart(true);
          downloadProgress.set(100);
          await RNFetchBlob.android.actionViewIntent(
            res.path(),
            'application/vnd.android.package-archive',
          );
        })
        .catch(() => {
          setIsDownloadStart(false);
          ToastAndroid.show('Download gagal!', ToastAndroid.SHORT);
        });
    } else {
      setIsDownloadStart(true);
      Updates.fetchUpdateAsync()
        .then(() => {
          downloadProgress.set(100);
          DialogManager.alert('Download selesai', 'Restart aplikasi untuk melakukan update', [
            {
              text: 'Restart',
              onPress: () => {
                Updates.reloadAsync();
              },
            },
          ]);
        })
        .catch(() => {
          setIsDownloadStart(false);
          ToastAndroid.show('Download gagal!', ToastAndroid.SHORT);
        });
    }
    ToastAndroid.show('Mendownload update...', ToastAndroid.SHORT);
    DialogManager.alert(
      'Perhatian',
      'Selama proses download, tolong jangan keluar aplikasi untuk menghindari kesalahan',
    );
  }, [downloadProgress, props.route.params]);

  const installUpdate = useCallback(() => {
    if (props.route.params.nativeUpdate) {
      RNFetchBlob.android.actionViewIntent(
        `${RNFetchBlob.fs.dirs.DownloadDir}/AniFlix-${props.route.params.latestVersion}.apk`,
        'application/vnd.android.package-archive',
      );
    } else {
      Updates.reloadAsync();
    }
  }, [props.route.params]);

  const downloadProgressAnimaton = useAnimatedStyle(() => {
    return {
      width: `${downloadProgress.get()}%`,
    };
  });

  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        <Text style={[globalStyles.text, styles.needUpdate]}>Update baru tersedia!</Text>
        <Text style={[globalStyles.text, styles.desc]}>
          Untuk melanjutkan penggunaan aplikasi harap lakukan update.
        </Text>
      </View>

      <View style={styles.updateInfo}>
        <View style={styles.versionInfo}>
          <Text style={[globalStyles.text, styles.version]}>
            {appVersion}-JS_{OTAJSVersion}
          </Text>
          <Text style={[globalStyles.text, { fontSize: 20 }]}>{'->'}</Text>
          <Text style={[globalStyles.text, styles.latestVersion]}>
            {props.route.params.nativeUpdate ? props.route.params.latestVersion : 'OTA Update'}
          </Text>
        </View>
        <Markdown value={props.route.params.changelog} />
        {!isDownloadStart ? (
          <TouchableOpacity style={styles.download} onPress={downloadUpdate}>
            <Icon name="file-download" color={styles.buttonText.color} size={20} />
            <Text style={[globalStyles.text, styles.buttonText]}>Download update</Text>
          </TouchableOpacity>
        ) : isProgress100 === true ? (
          <View style={styles.installOrRedownload}>
            <TouchableOpacity
              style={[styles.download, { backgroundColor: '#1d1d66' }, { flex: 1 }]}
              onPress={installUpdate}>
              <Icon name="download" color={styles.buttonText.color} size={20} />
              <Text style={[globalStyles.text, styles.buttonText]}>Instal update</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.download, { flex: 1 }]} onPress={downloadUpdate}>
              <Icon name="file-download" color={styles.buttonText.color} size={20} />
              <Text style={[globalStyles.text, styles.buttonText, { textAlign: 'center' }]}>
                Download ulang update
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.download, { flexDirection: 'column' }]}>
            <View style={styles.sliderContainer}>
              <Animated.View style={[styles.slider, downloadProgressAnimaton]} />
              <Text style={styles.progressText}>{progressPercent}%</Text>
            </View>
            <View style={styles.netContainer}>
              <Text style={[globalStyles.text, styles.netSpeed]}>{netSpeed}</Text>
              <Text style={[globalStyles.text, styles.netTotal]}>
                {(totalMB / MB / MB).toFixed(2)} MB
              </Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

function useStyles() {
  const colorScheme = useColorScheme();
  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colorScheme === 'dark' ? '#141414' : '#F5F5F5',
          padding: 20,
        },
        titleContainer: {
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colorScheme === 'dark' ? '#1F1F1F' : '#ffffff',
          paddingVertical: 22,
          borderBottomWidth: 1,
          borderBottomColor: colorScheme === 'dark' ? '#2A2A2A' : '#e0e0e0',
          shadowColor: '#000',
          shadowOpacity: 0.15,
          shadowRadius: 6,
          elevation: 4,
          marginBottom: 20,
          borderRadius: 10,
        },
        needUpdate: {
          fontSize: 26,
          fontWeight: '700',
          color: '#76c7c0',
          marginBottom: 8,
        },
        desc: {
          fontSize: 16,
          color: colorScheme === 'dark' ? '#B0B0B0' : '#6e6e6e',
          textAlign: 'center',
          paddingHorizontal: 20,
        },
        updateInfo: {
          flex: 1,
          backgroundColor: colorScheme === 'dark' ? '#1C1C1C' : '#ffffff',
          borderRadius: 12,
          padding: 20,
          shadowColor: '#000',
          shadowOpacity: 0.1,
          shadowRadius: 10,
          elevation: 3,
        },
        versionInfo: {
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          borderWidth: 1,
          borderColor: colorScheme === 'dark' ? '#3D3D3D' : '#e0e0e0',
          borderRadius: 8,
          paddingVertical: 8,
          paddingHorizontal: 16,
          marginBottom: 16,
          backgroundColor: colorScheme === 'dark' ? '#2A2A2A' : '#fafafa',
        },
        version: {
          fontSize: 18,
          fontWeight: '600',
          color: '#D9534F',
          marginRight: 8,
        },
        latestVersion: {
          fontSize: 18,
          fontWeight: '600',
          color: '#5CB85C',
          marginLeft: 8,
        },
        download: {
          flexDirection: 'row',
          paddingVertical: 14,
          paddingHorizontal: 20,
          backgroundColor: '#5CB85C',
          borderRadius: 30,
          justifyContent: 'center',
          alignItems: 'center',
          marginVertical: 14,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.2,
          shadowRadius: 5,
          elevation: 3,
        },
        sliderContainer: {
          width: '100%',
          backgroundColor: '#ddd',
          height: 18,
          borderRadius: 9,
          justifyContent: 'center',
          alignItems: 'center',
          marginVertical: 14,
        },
        slider: {
          height: 18,
          borderRadius: 9,
          backgroundColor: '#5c96b8',
        },
        progressText: {
          position: 'absolute',
          color: '#fff',
          fontWeight: '600',
          fontSize: 14,
        },
        installOrRedownload: {
          flexDirection: 'row',
          justifyContent: 'space-between',
        },
        netContainer: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginTop: 8,
        },
        netSpeed: {
          flex: 1,
          fontSize: 14,
          fontWeight: '500',
          color: colorScheme === 'dark' ? '#ebebeb' : '#555555',
        },
        netTotal: {
          fontSize: 14,
          fontWeight: '500',
          color: colorScheme === 'dark' ? '#ebebeb' : '#555555',
        },
        buttonText: {
          color: '#fff', // button text color for better readability
          fontWeight: '600',
        },
      }),
    [colorScheme],
  );
}
export default memo(NeedUpdate);
