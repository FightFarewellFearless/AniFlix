import React, { Fragment, useEffect, useState } from 'react';
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

type Props = NativeStackScreenProps<RootStackNavigator, 'NeedUpdate'>;

function NeedUpdate(props: Props) {
  const markdownElement = useMarkdown(props.route.params.changelog, {
    colorScheme: colorScheme,
  });

  const [isDownloadStart, setIsDownloadStart] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  useEffect(() => {
    RNFetchBlob.fs
      .exists(
        `/storage/emulated/0/Download/AniFlix-${props.route.params.latestVersion}.apk`,
      )
      .then(value => {
        setIsDownloadStart(value);
        setDownloadProgress(value ? 100 : 0);
      });
  }, [props.route.params.latestVersion]);

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
          <TouchableOpacity
            style={styles.download}
            onPress={() => {
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
                  setDownloadProgress(Math.floor((received / total) * 100));
                })
                .then(async res => {
                  setIsDownloadStart(true);
                  setDownloadProgress(100);
                  await RNFetchBlob.android.actionViewIntent(
                    res.path(),
                    'application/vnd.android.package-archive',
                  );
                })
                .catch(() => {
                  setIsDownloadStart(false);
                  ToastAndroid.show('Download gagal!', ToastAndroid.SHORT);
                });
            }}>
            <Icon
              name="file-download"
              color={globalStyles.text.color}
              size={20}
            />
            <Text style={globalStyles.text}>Download update</Text>
          </TouchableOpacity>
        ) : downloadProgress === 100 ? (
          <TouchableOpacity
            style={styles.download}
            onPress={() => {
              RNFetchBlob.android.actionViewIntent(
                `/storage/emulated/0/Download/AniFlix-${props.route.params.latestVersion}.apk`,
                'application/vnd.android.package-archive',
              );
            }}>
            <Icon name="download" color={globalStyles.text.color} size={20} />
            <Text style={globalStyles.text}>Instal update</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.download}>
            <View style={styles.sliderContainer}>
              <View
                style={[
                  styles.slider,
                  {
                    width: `${downloadProgress}%`,
                  },
                ]}
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
    backgroundColor: 'blue',
  },
});

export default NeedUpdate;
