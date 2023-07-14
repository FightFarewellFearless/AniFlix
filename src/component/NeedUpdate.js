import React, { Fragment } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Linking,
  ScrollView,
} from 'react-native';
import { useMarkdown } from 'react-native-marked';
import Icon from 'react-native-vector-icons/FontAwesome5';

import { version as appVersion } from '../../package.json';
import globalStyles from '../assets/style';

function NeedUpdate(props) {
  const markdownElement = useMarkdown(props.route.params.changelog, {
    colorScheme: 'dark',
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
            Linking.openURL(props.route.params.download);
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
    justifyContent: 'center',
  },
});

export default NeedUpdate;
