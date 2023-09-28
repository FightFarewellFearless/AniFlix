import React, { Fragment, useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ToastAndroid,
  Alert,
} from 'react-native';
import { useMarkdown } from 'react-native-marked';
import Icon from 'react-native-vector-icons/FontAwesome5';

import { version as appVersion } from '../../package.json';
import globalStyles from '../assets/style';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackNavigator } from '../types/navigation';
import colorScheme from '../utils/colorScheme';
import RNFetchBlob from 'rn-fetch-blob';
import Animated, {
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

type Props = NativeStackScreenProps<RootStackNavigator, 'NeedUpdate'>;

function NeedUpdate(props: Props) {
  const markdownElement = useMarkdown(props.route.params.changelog, {
    colorScheme: colorScheme,
  });

  const [isDownloadStart, setIsDownloadStart] = useState(false);
  const downloadProgress = useSharedValue(0);
  const [isProgress100, setIsProgress100] = useState(true);

  useAnimatedReaction(
    () => downloadProgress.value,
    value => {
      if (value === 100) {
        runOnJS(setIsProgress100)(true);
      } else {
        runOnJS(setIsProgress100)(false);
      }
    },
  );

  useEffect(() => {
    RNFetchBlob.fs
      .exists(
        `/storage/emulated/0/Download/AniFlix-${props.route.params.latestVersion}.apk`,
      )
      .then(value => {
        setIsDownloadStart(value);
        downloadProgress.value = value ? 100 : 0;
      });
  }, [downloadProgress, props.route.params.latestVersion]);

  const downloadUpdate = useCallback(() => {
    setIsDownloadStart(true);
    ToastAndroid.show('Mendownload update...', ToastAndroid.SHORT);
    Alert.alert(
      'Perhatian',
      'Selama proses download, tolong jangan keluar aplikasi untuk menghindari kesalahan',
    );
    RNFetchBlob.config({
      path: `/storage/emulated/0/Download/AniFlix-${props.route.params.latestVersion}.apk`,
    })
      .fetch('GET', props.route.params.download)
      .progress((received, total) => {
        downloadProgress.value = withTiming(
          Math.floor((received / total) * 100),
        );
      })
      .then(async res => {
        setIsDownloadStart(true);
        downloadProgress.value = 100;
        await RNFetchBlob.android.actionViewIntent(
          res.path(),
          'application/vnd.android.package-archive',
        );
      })
      .catch(() => {
        setIsDownloadStart(false);
        ToastAndroid.show('Download gagal!', ToastAndroid.SHORT);
      });
  }, [
    downloadProgress,
    props.route.params.download,
    props.route.params.latestVersion,
  ]);

  const installUpdate = useCallback(() => {
    RNFetchBlob.android.actionViewIntent(
      `/storage/emulated/0/Download/AniFlix-${props.route.params.latestVersion}.apk`,
      'application/vnd.android.package-archive',
    );
  }, [props.route.params.latestVersion]);

  const downloadProgressAnimaton = useAnimatedStyle(() => {
    return {
      width: `${downloadProgress.value}%`,
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
            {props.route.params.latestVersion}
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
              style={[styles.download, { flex: 1, backgroundColor: '#1d1d66' }]}
              onPress={installUpdate}>
              <Icon name="download" color={globalStyles.text.color} size={20} />
              <Text style={globalStyles.text}>Instal update</Text>
            </TouchableOpacity>
            <TouchableOpacity
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
          <View style={styles.download}>
            <View style={styles.sliderContainer}>
              <Animated.View
                style={[styles.slider, downloadProgressAnimaton]}
              />
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
    height: 20,
    borderRadius: 5,
  },
  slider: {
    height: 20,
    borderRadius: 5,
    backgroundColor: '#105494',
  },
  installOrRedownload: {
    flexDirection: 'row',
  },
});

export default NeedUpdate;
