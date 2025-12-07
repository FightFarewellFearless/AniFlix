import { WEBHOOK_REPORT_ERROR } from '@env';
import { reloadAppAsync } from 'expo';
import React, { useMemo } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { DeviceInfoModule } from 'react-native-nitro-device-info';
import { SafeAreaView } from 'react-native-safe-area-context';
import useGlobalStyles from '../../assets/style';

export type Props = { error: Error };

const FallbackComponent = (props: Props) => {
  const globalStyles = useGlobalStyles();
  const styles = useStyles();
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={[styles.title, globalStyles.text]}>Ups!</Text>
        <Text style={[styles.subtitle, globalStyles.text]}>Telah terjadi crash</Text>
        <Text style={[styles.error, globalStyles.text]}>{props.error.toString()}</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => {
            reloadAppAsync();
          }}>
          <Text style={[styles.buttonText, globalStyles.text]}>Reload aplikasi</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: 'red' }]}
          onPress={() => reportToDev(props.error)}>
          <Text style={[styles.buttonText, globalStyles.text]}>Laporkan error ke developer</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default FallbackComponent;

function useStyles() {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  return useMemo(() => {
    return StyleSheet.create({
      container: {
        backgroundColor: isDarkMode ? '#242424' : '#fafafa',
        flex: 1,
        justifyContent: 'center',
      },
      content: {
        marginHorizontal: 16,
      },
      title: {
        fontSize: 48,
        fontWeight: '300',
        paddingBottom: 16,
      },
      subtitle: {
        fontSize: 32,
        fontWeight: '800',
      },
      error: {
        paddingVertical: 16,
      },
      button: {
        backgroundColor: '#2196f3',
        borderRadius: 50,
        padding: 16,
        marginBottom: 8,
      },
      buttonText: {
        color: '#fff',
        fontWeight: '600',
        textAlign: 'center',
      },
    });
  }, [isDarkMode]);
}

function reportToDev(error: Error) {
  fetch(WEBHOOK_REPORT_ERROR, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      embeds: [
        {
          color: 0x7289d9,
          title: 'Error report',
          description: `**Short:** ${error.toString()}\n**Stack:** ${
            error.stack?.slice(0, 1000) ?? 'No stack trace'
          }\n**Message:** ${error.message ?? 'No message'}`,
          fields: [
            {
              name: 'System version',
              value: DeviceInfoModule.systemVersion,
            },
            {
              name: 'Brand',
              value: DeviceInfoModule.brand,
            },
            {
              name: 'Manufacturer name',
              value: DeviceInfoModule.manufacturer,
            },
            {
              name: 'Product',
              value: DeviceInfoModule.product,
            },
          ],
        },
      ],
    }),
  })
    .then(() => {
      Alert.alert('Sukses', 'Laporan berhasil dikirim!');
    })
    .catch(() => {
      Alert.alert('Gagal', 'Laporan gagal dikirim!');
    });
}
