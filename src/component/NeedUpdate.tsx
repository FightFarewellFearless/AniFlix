import React, {
  Fragment,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ToastAndroid,
  Alert,
  useColorScheme,
} from 'react-native';
import { TouchableOpacity } from 'react-native'; //rngh
import { useMarkdown } from 'react-native-marked';
import Icon from 'react-native-vector-icons/FontAwesome5';

import { version as appVersion } from '../../package.json';
import useGlobalStyles from '../assets/style';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackNavigator } from '../types/navigation';
import RNFetchBlob from 'react-native-blob-util';
import Animated, {
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import * as Updates from 'expo-updates';

type Props = StackScreenProps<RootStackNavigator, 'NeedUpdate'>;

const MB = 1000;

function NeedUpdate(props: Props) {
  "use no memo";
  const globalStyles = useGlobalStyles();
  const colorScheme = useColorScheme();
  const styles = useStyles();
  const markdownElement = useMarkdown(props.route.params.changelog, {
    colorScheme: colorScheme,
  });

  const [isDownloadStart, setIsDownloadStart] = useState(false);
  const downloadProgress = useSharedValue(0);
  const [isProgress100, setIsProgress100] = useState(true);

  const lastMB = useRef(0);
  const lastMS = useRef(0);
  const totalMB = useRef(0);
  const [netSpeed, setNetSpeed] = useState('0 MB/s');

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
  }, [downloadProgress]);

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
          downloadProgress.set(withTiming(
            Math.floor((received / total) * 100),
          ));
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
          totalMB.current = total;
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
      // CodePush.sync({
      //   installMode: CodePush.InstallMode.ON_NEXT_RESTART,
      // }, status => {
      //   switch (status) {
      //     case CodePush.SyncStatus.DOWNLOADING_PACKAGE:
      //       setIsDownloadStart(true);
      //       break;
      //     case CodePush.SyncStatus.UPDATE_INSTALLED:
      //       setIsDownloadStart(true);
      //       downloadProgress.value = 100;
      //       break;
      //     default:
      //       setIsDownloadStart(false);
      //       break;
      //   }
      // }, ({ receivedBytes, totalBytes }) => {
      //   setNetSpeed(
      //     `${(
      //       (receivedBytes - lastMB.current) /
      //       MB /
      //       MB /
      //       ((Date.now() - lastMS.current) / 1000)
      //     ).toFixed(2)} MB/s`,
      //   )
      //   lastMB.current = receivedBytes;
      //   lastMS.current = Date.now();
      //   totalMB.current = totalBytes;
      //   downloadProgress.value = Math.floor(
      //     (receivedBytes / totalBytes) * 100,
      //   );
      // }).then(() => {
      //   setIsDownloadStart(true);
      //   downloadProgress.value = 100;
      //   Alert.alert("Download selesai", "Restart aplikasi untuk melakukan update", 
      //     [
      //       { text: "Restart", onPress: () => {
      //         CodePush.restartApp();
      //       } },
      //     ]
      //   );
      // }).catch(() => {
      //   setIsDownloadStart(false);
      //   ToastAndroid.show('Download gagal!', ToastAndroid.SHORT);
      // });
      setIsDownloadStart(true);
      Updates.fetchUpdateAsync().then(update => {
        downloadProgress.set(100);
        Alert.alert("Download selesai", "Restart aplikasi untuk melakukan update", 
          [
            { text: "Restart", onPress: () => {
              Updates.reloadAsync();
            } },
          ]
        );
      }).catch(() => {
        setIsDownloadStart(false);
        ToastAndroid.show('Download gagal!', ToastAndroid.SHORT);
      })
    };
    ToastAndroid.show('Mendownload update...', ToastAndroid.SHORT);
    Alert.alert(
      'Perhatian',
      'Selama proses download, tolong jangan keluar aplikasi untuk menghindari kesalahan',
    );
  }, [
    downloadProgress,
  ]);

  const installUpdate = useCallback(() => {
    if(props.route.params.nativeUpdate) {
      RNFetchBlob.android.actionViewIntent(
        `${RNFetchBlob.fs.dirs.DownloadDir}/AniFlix-${props.route.params.latestVersion}.apk`,
        'application/vnd.android.package-archive',
      );
    } else {
      // CodePush.restartApp();
      Updates.reloadAsync();
    };
  }, []);

  const downloadProgressAnimaton = useAnimatedStyle(() => {
    return {
      width: `${downloadProgress.get()}%`,
    };
  });

  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        <Text style={[globalStyles.text, styles.needUpdate]}>
          Update baru tersedia!
        </Text>
        <Text style={[globalStyles.text, styles.desc]}>
          Untuk melanjutkan penggunaan aplikasi harap lakukan update.
        </Text>
      </View>

      <View style={styles.updateInfo}>
        <View style={styles.versionInfo}>
          <Text style={[globalStyles.text, styles.version]}>{appVersion}</Text>
          <Text style={[globalStyles.text, { fontSize: 20 }]}>{'->'}</Text>
          <Text style={[globalStyles.text, styles.latestVersion]}>
            {props.route.params.nativeUpdate ? props.route.params.latestVersion : "OTA Update"}
          </Text>
        </View>
        <ScrollView>
          {markdownElement.map((el, i) => (
            <Fragment key={`changelog_${i}`}>{el}</Fragment>
          ))}
        </ScrollView>
        {!isDownloadStart ? (
          <TouchableOpacity style={styles.download} onPress={downloadUpdate}>
            <Icon
              name="file-download"
              color={globalStyles.text.color}
              size={20}
            />
            <Text style={globalStyles.text}>Download update</Text>
          </TouchableOpacity>
        ) : isProgress100 === true ? (
          <View style={styles.installOrRedownload}>
            <TouchableOpacity
              // containerStyle={{ flex: 1 }}
              style={[styles.download, { backgroundColor: '#1d1d66' }, { flex: 1 }]}
              onPress={installUpdate}>
              <Icon name="download" color={globalStyles.text.color} size={20} />
              <Text style={globalStyles.text}>Instal update</Text>
            </TouchableOpacity>
            <TouchableOpacity
              // containerStyle={{ flex: 1 }}
              style={[styles.download, { flex: 1 }]}
              onPress={downloadUpdate}>
              <Icon
                name="file-download"
                color={globalStyles.text.color}
                size={20}
              />
              <Text style={globalStyles.text}>Download ulang update</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.download, { flexDirection: 'column' }]}>
            <View style={styles.sliderContainer}>
              <Animated.View
                style={[styles.slider, downloadProgressAnimaton]}
              />
            </View>
            <View style={styles.netContainer}>
              <Text style={[globalStyles.text, styles.netSpeed]}>
                {netSpeed}
              </Text>
              <Text style={[globalStyles.text, styles.netTotal]}>
                {(totalMB.current / MB / MB).toFixed(2)} MB
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
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    titleContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colorScheme === 'dark' ? '#5f5f5f' : '#cccccc',
      flex: 0.3,
    },
    needUpdate: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#07b607',
    },
    desc: {
      textAlign: 'center',
    },
    updateInfo: {
      flex: 1,
    },
    versionInfo: {
      flexDirection: 'row',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colorScheme === 'dark' ? 'white' : 'black',
      borderRadius: 3,
    },
    version: {
      fontSize: 22,
      textAlign: 'center',
      fontWeight: 'bold',
      color: '#960303',
    },
    latestVersion: {
      fontSize: 22,
      textAlign: 'center',
      fontWeight: 'bold',
      color: '#089603',
    },
    download: {
      flexDirection: 'row',
      padding: 10,
      backgroundColor: '#008b13',
      borderRadius: 5,
      justifyContent: 'center',
    },
    sliderContainer: {
      width: '100%',
      backgroundColor: 'gray',
      height: 10,
      borderRadius: 5,
    },
    slider: {
      height: 10,
      borderRadius: 5,
      backgroundColor: '#105494',
    },
    installOrRedownload: {
      flexDirection: 'row',
    },
    netContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    netSpeed: {
      fontSize: 14,
      fontWeight: 'bold',
    },
    netTotal: {
      fontSize: 14,
      fontWeight: 'bold',
    },
  });
}

export default NeedUpdate;
