import React, { Component } from 'react';
import styles from '../assets/style';
import { StackActions } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  Linking,
  Text,
  ToastAndroid,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';
import rnLogo from '../assets/RNlogo.png';

class FailedToConnect extends Component {
  constructor(props) {
    super(props);
  }

  async openLink() {
    const url =
      'https://github.com/FightFarewellFearless/anime-react-native/issues/new';
    if (await Linking.canOpenURL(url)) {
      Linking.openURL(url);
    } else {
      ToastAndroid.show('https tidak didukung!', ToastAndroid.SHORT);
    }
  }

  tryagain = () => {
    this.props.navigation.dispatch(StackActions.replace('loading'));
  };

  render() {
    return (
      <View style={{ flex: 1 }}>
        <View
          style={{
            justifyContent: 'center',
            alignItems: 'center',
            flex: 1,
          }}>
          <View style={{ position: 'absolute', top: 15 }}>
            <Text style={{ color: '#da2424' }}>
              Aplikasi masih dalam tahap pengembangan
            </Text>
          </View>
          <Icon name="server-network-off" style={styles.text} size={40} />
          <Text style={[{ textAlign: 'center' }, styles.text]}>
            Gagal terhubung ke server{'\n'}
            Pastikan kamu terhubung ke internet dan coba lagi.{'\n'}
            Jika masalah berlanjut, kemungkinan server sedang down atau ada
            masalah lain. silahkan laporkan ke github issue: {'\n'}{' '}
            <Text onPress={this.openLink} style={{ color: '#0066CC' }}>
              Buat issues baru di github
            </Text>
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: '#8a1c00',
              borderRadius: 5,
              padding: 3,
              marginTop: 14,
            }}
            onPress={this.tryagain}>
            <Text style={[{ fontSize: 17 }, styles.text]}>
              <Icon name="refresh" size={17} /> Coba lagi
            </Text>
          </TouchableOpacity>
          <View
            style={{
              position: 'absolute',
              bottom: 40,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <Image source={rnLogo} style={{ height: 40, width: 40 }} />
            <Text style={[styles.text, { fontSize: 12 }]}>
              Created using react-native
            </Text>
          </View>
        </View>
        <Text style={[styles.text, { position: 'absolute', bottom: 0 }]}>
          {require('../../package.json').version}
        </Text>
      </View>
    );
  }
}

export default FailedToConnect;
