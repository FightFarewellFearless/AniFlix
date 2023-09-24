import React, { Fragment } from 'react';
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
        <TouchableOpacity
          style={styles.download}
          onPress={() => {
            ToastAndroid.show('Mendownload update...', ToastAndroid.SHORT);
            Alert.alert(
              'Perhatian',
              'Selama proses download, tolong jangan keluar aplikasi untuk menghindari kesalahan',
            );
            RNFetchBlob.config({
              addAndroidDownloads: {
                useDownloadManager: true,
                path: `/storage/emulated/0/Download/AniFlix-${props.route.params.latestVersion}.apk`,
                title: 'Sedang memperbarui',
                description: 'Pembaruan aplikasi',
                mime: 'application/vnd.android.package-archive',
                mediaScannable: true,
                notification: true,
              },
            })
              .fetch('GET', props.route.params.download)
              .then(async res => {
                await RNFetchBlob.android.actionViewIntent(
                  res.path(),
                  'application/vnd.android.package-archive',
                );
              });
          }}>
          <Icon
            name="file-download"
            color={globalStyles.text.color}
            size={20}
          />
          <Text style={globalStyles.text}>Download update</Text>
        </TouchableOpacity>
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
});

export default NeedUpdate;
