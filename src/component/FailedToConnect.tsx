import React from 'react';
import globalStyles, { darkText } from '../assets/style';
import { StackActions } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  Linking,
  Text,
  ToastAndroid,
  TouchableOpacity,
  View,
  StyleSheet,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackNavigator } from '../types/navigation';
import colorScheme from '../utils/colorScheme';

type Props = NativeStackScreenProps<RootStackNavigator, 'FailedToConnect'>;

function FailedToConnect(props: Props) {
  const openLink = async () => {
    const url = 'https://github.com/FightFarewellFearless/AniFlix/issues/new';
    if (await Linking.canOpenURL(url)) {
      Linking.openURL(url);
    } else {
      ToastAndroid.show('https tidak didukung!', ToastAndroid.SHORT);
    }
  };

  const tryagain = () => {
    props.navigation.dispatch(StackActions.replace('loading'));
  };

  return (
    <View style={{ flex: 1 }}>
      <View
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          flex: 1,
        }}>
        <Icon
          name="server-network-off"
          style={[
            globalStyles.text,
            {
              textShadowColor: 'red',
              textShadowOffset: { width: 1, height: 0 },
              textShadowRadius: 5,
            },
          ]}
          size={40}
        />
        <Text
          style={[
            { textAlign: 'center', fontWeight: '400' },
            globalStyles.text,
          ]}>
          Gagal terhubung ke server{'\n'}
          Pastikan kamu terhubung ke internet dan coba lagi.{'\n'}
          Jika masalah berlanjut, kemungkinan server sedang down atau ada
          masalah lain. silahkan laporkan ke github issue: {'\n'}{' '}
          <Text onPress={openLink} style={{ color: '#0066CC' }}>
            Buat issues baru di github
          </Text>
          {'\n'} Atau bisa dengan join discord dengan klik tombol dibawah
        </Text>
        <TouchableOpacity
          style={{
            backgroundColor: '#008a83',
            borderRadius: 5,
            padding: 3,
            marginTop: 14,
            zIndex: 1,
            elevation: 7,
            shadowColor: 'white',
          }}
          onPress={tryagain}>
          <Text
            style={[{ fontSize: 17, fontWeight: 'bold' }, { color: darkText }]}>
            <Icon name="refresh" size={17} /> Coba lagi
          </Text>
        </TouchableOpacity>
        <View
          style={{
            position: 'absolute',
            flexDirection: 'row',
            justifyContent: 'space-around',
            bottom: 45,
          }}>
          <TouchableOpacity
            onPress={() => {
              Linking.openURL(
                'https://github.com/FightFarewellFearless/AniFlix',
              );
            }}
            style={[styles.bottomCredits, { marginRight: 8 }]}>
            {/* <Image source={rnLogo} style={{ height: 40, width: 40 }} /> */}
            <Icon name="github" size={43} color={globalStyles.text.color} />
            <Text style={[globalStyles.text, { fontSize: 12 }]}>
              {' '}
              Open-Sourced on github
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              Linking.openURL('https://discord.gg/sbTwxHb9NM');
            }}
            style={styles.bottomCredits}>
            {/* <Image source={rnLogo} style={{ height: 40, width: 40 }} /> */}
            <Icon name="discord" size={43} color={'#7289d9'} />
            <Text style={[globalStyles.text, { fontSize: 12 }]}>
              {' '}
              Join discord
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      <Text style={[globalStyles.text, { position: 'absolute', bottom: 0 }]}>
        {require('../../package.json').version}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomCredits: {
    flexDirection: 'row',
    backgroundColor: colorScheme === 'dark' ? '#2b2b2b' : '#a8a8a8',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
});

export default FailedToConnect;
