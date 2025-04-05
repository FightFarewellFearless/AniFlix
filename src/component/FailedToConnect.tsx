import { StackActions } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo } from 'react';
import {
  Linking,
  StyleSheet,
  Text,
  ToastAndroid,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import useGlobalStyles, { darkText } from '../assets/style';
import { RootStackNavigator } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackNavigator, 'FailedToConnect'>;

function FailedToConnect(props: Props) {
  const globalStyles = useGlobalStyles();
  const styles = useStyles();
  const openLink = async () => {
    const url = 'https://github.com/FightFarewellFearless/AniFlix/issues/new';
    if (await Linking.canOpenURL(url)) {
      Linking.openURL(url);
    } else {
      ToastAndroid.show('https tidak didukung!', ToastAndroid.SHORT);
    }
  };

  const tryagain = () => {
    props.navigation.dispatch(StackActions.replace('connectToServer'));
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
        <Text style={[{ textAlign: 'center', fontWeight: '400' }, globalStyles.text]}>
          Gagal terhubung ke server{'\n'}
          Pastikan kamu terhubung ke internet dan coba lagi.{'\n'}
          Jika masalah berlanjut, silahkan laporkan ke github issue: {'\n'}{' '}
          <Text onPress={openLink} style={{ color: '#0066CC' }}>
            Buat issues baru di github
          </Text>
          {'\n'} Atau join discord dengan klik tombol "Join discord" dibawah
        </Text>
        <Text style={[globalStyles.text, { fontSize: 12, fontWeight: 'bold' }]}>
          Jika kamu menggunakan DNS pastikan untuk tidak menggunakan versi "security" DNS tersebut{' '}
          (jika ada).
        </Text>
        <Text style={[globalStyles.text, { fontSize: 12, fontWeight: 'bold' }]}>
          Direkomendasikan menggunakan DNS 1.1.1.1 atau 8.8.8.8
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
          <Text style={[{ fontSize: 17, fontWeight: 'bold' }, { color: darkText }]}>
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
              Linking.openURL('https://github.com/FightFarewellFearless/AniFlix');
            }}
            style={[styles.bottomCredits, { marginRight: 8 }]}>
            {/* <Image source={rnLogo} style={{ height: 40, width: 40 }} /> */}
            <Icon name="github" size={43} color={globalStyles.text.color} />
            <Text style={[globalStyles.text, { fontSize: 12 }]}> Open-Sourced on github</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              Linking.openURL('https://discord.gg/sbTwxHb9NM');
            }}
            style={styles.bottomCredits}>
            {/* <Image source={rnLogo} style={{ height: 40, width: 40 }} /> */}
            <Icon name="discord" size={43} color={'#7289d9'} />
            <Text style={[globalStyles.text, { fontSize: 12 }]}> Join discord</Text>
          </TouchableOpacity>
        </View>
      </View>
      <Text style={[globalStyles.text, { position: 'absolute', bottom: 0 }]}>
        {require('../../package.json').version}
      </Text>
    </View>
  );
}

function useStyles() {
  const colorScheme = useColorScheme();

  return useMemo(
    () =>
      StyleSheet.create({
        bottomCredits: {
          flexDirection: 'row',
          backgroundColor: colorScheme === 'dark' ? '#2b2b2b' : '#a8a8a8',
          padding: 10,
          borderRadius: 8,
          alignItems: 'center',
        },
      }),
    [colorScheme],
  );
}

export default React.memo(FailedToConnect);
