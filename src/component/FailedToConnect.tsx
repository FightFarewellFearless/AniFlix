import { StackActions } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo } from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import Fontisto from 'react-native-vector-icons/Fontisto';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import useGlobalStyles from '../assets/style';
import { RootStackNavigator } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackNavigator, 'FailedToConnect'>;

function FailedToConnect(props: Props) {
  const globalStyles = useGlobalStyles();
  const styles = useStyles();

  const openLink = async () => {
    const url = 'https://github.com/FightFarewellFearless/AniFlix/issues/new';
    Linking.canOpenURL(url)
      .then(supported => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          console.log("Don't know how to open URI: " + url);
        }
      })
      .catch(err => console.error('An error occurred', err));
  };

  const tryagain = () => {
    props.navigation.dispatch(StackActions.replace('connectToServer'));
  };

  return (
    <View style={[styles.container]}>
      <View style={styles.content}>
        <Icon name="server-network-off" size={60} color="#E57373" style={styles.icon} />
        <Text style={[styles.title, globalStyles.text]}>Koneksi Gagal</Text>
        <Text style={[styles.subtitle, globalStyles.text]}>
          Tidak dapat terhubung ke server. Harap periksa koneksi internet Anda dan coba lagi.
        </Text>

        <TouchableOpacity style={styles.retryButton} onPress={tryagain}>
          <Icon name="refresh" size={20} color="#fff" />
          <Text style={styles.retryButtonText}>Coba Lagi</Text>
        </TouchableOpacity>

        <View style={styles.helpSection}>
          <Text style={[styles.helpText, globalStyles.text]}>
            Jika masalah berlanjut, laporkan di GitHub:
          </Text>
          <TouchableOpacity onPress={openLink}>
            <Text style={styles.linkText}>Buat issue baru di GitHub</Text>
          </TouchableOpacity>
          <Text style={[styles.helpText, globalStyles.text]}>
            Atau bergabung dengan server Discord kami dengan mengklik tombol "Gabung Discord" di
            bawah.
          </Text>
        </View>

        <View style={styles.dnsSection}>
          <Text style={[styles.dnsText, globalStyles.text]}>
            Jika kamu menggunakan DNS, pastikan untuk tidak menggunakan DNS versi "keamanan" (jika
            ada).
          </Text>
          <Text style={[styles.dnsText, globalStyles.text]}>
            DNS yang disarankan: 1.1.1.1 atau 8.8.8.8
          </Text>
        </View>

        <View style={styles.bottomActions}>
          <TouchableOpacity
            onPress={() => {
              Linking.openURL('https://github.com/FightFarewellFearless/AniFlix');
            }}
            style={styles.bottomCreditButton}>
            <Icon name="github" size={30} color={globalStyles.text.color} />
            <Text style={[styles.bottomCreditText, globalStyles.text]}>Open-Sourced on GitHub</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              Linking.openURL('https://discord.gg/sbTwxHb9NM');
            }}
            style={styles.bottomCreditButton}>
            <Fontisto name="discord" size={30} color="#7289d9" />
            <Text style={[styles.bottomCreditText, globalStyles.text]}>Gabung Discord</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={[styles.versionText, globalStyles.text]}>
        Versi: {require('../../package.json').version}
      </Text>
    </View>
  );
}

const useStyles = () => {
  const colorScheme = useColorScheme();

  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        },
        content: {
          width: '80%',
          alignItems: 'center',
        },
        icon: {
          marginBottom: 20,
        },
        title: {
          fontSize: 24,
          fontWeight: 'bold',
          marginBottom: 10,
        },
        subtitle: {
          fontSize: 16,
          textAlign: 'center',
          marginBottom: 20,
        },
        retryButton: {
          backgroundColor: '#2979FF',
          paddingVertical: 12,
          paddingHorizontal: 24,
          borderRadius: 8,
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 20,
        },
        retryButtonText: {
          color: '#fff',
          fontSize: 18,
          fontWeight: 'bold',
          marginLeft: 8,
        },
        helpSection: {
          marginBottom: 20,
          alignItems: 'center',
        },
        helpText: {
          fontSize: 14,
          textAlign: 'center',
          marginBottom: 5,
        },
        linkText: {
          color: '#2979FF',
          fontSize: 14,
          textAlign: 'center',
          textDecorationLine: 'underline',
        },
        dnsSection: {
          marginBottom: 20,
          alignItems: 'center',
        },
        dnsText: {
          fontSize: 12,
          textAlign: 'center',
        },
        bottomActions: {
          flexDirection: 'row',
          justifyContent: 'space-around',
          width: '100%',
          marginBottom: 20,
        },
        bottomCreditButton: {
          alignItems: 'center',
          padding: 10,
          borderRadius: 5,
          backgroundColor: colorScheme === 'dark' ? '#292929' : '#dbdbdb',
        },
        bottomCreditText: {
          fontSize: 12,
        },
        versionText: {
          position: 'absolute',
          bottom: 10,
          fontSize: 12,
        },
      }),
    [colorScheme],
  );
};

export default React.memo(FailedToConnect);
