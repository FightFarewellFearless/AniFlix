import { LegendList } from '@legendapp/list';
import { ImageBackground } from 'expo-image';
import { memo, useMemo } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/FontAwesome';
import appPackage from '../../../../package.json';
import { darkText } from '../../../assets/style';
import { JoinDiscord } from '../../Loading Screen/Connect';
import DarkOverlay from '../../misc/DarkOverlay';
import { TouchableOpacity } from '../../misc/TouchableOpacityRNGH';

const tokyo = require('../../../assets/tokyo.jpg');

function About() {
  const globalStyles = useMemo(
    () => ({
      text: {
        color: darkText,
      },
    }),
    [],
  );
  const styles = useStyles();
  return (
    <ImageBackground source={tokyo} contentFit="cover" style={{ flex: 1 }}>
      <DarkOverlay transparent={0.75} />
      <LegendList style={styles.container}>
        <Text style={styles.header}>
          AniFlix {appPackage.version}-JS_{appPackage.OTAJSVersion}
          {'\n'}
          <Text style={{ fontSize: 14, fontWeight: 'bold' }}>Oleh Pirles</Text>
        </Text>
        <Text style={[globalStyles.text, styles.applicationInfo]}>
          AniFlix adalah aplikasi streaming anime yang dibuat oleh Fight Farewell Fearless AKA
          Pirles.{`\n`}
          Aplikasi ini dibangun diatas Framework React Native dan Expo.{'\n\n'}
          Dibangun untuk tujuan pembelajaran mobile development sang developer.{'\n'}
        </Text>
        <Text style={[globalStyles.text, styles.applicationInfo]}>
          Semua anime yang terdapat di aplikasi ini bukan milik kami, kami hanya menyediakan layanan
          streaming dengan membagikan link yang memang beredar di internet.{'\n'}
        </Text>
        <Text style={[globalStyles.text, styles.applicationInfo]}>
          Terimakasih karena sudah menggunakan aplikasi ini.
        </Text>

        <Text style={styles.header}>Kontak</Text>
        <Text style={[globalStyles.text, styles.applicationInfo]}>
          Jika ada pertanyaan, kritik, saran, atau bug yang ingin dilaporkan, silahkan hubungi kami
          melalui server discord dibawah ini
        </Text>
        <View style={{ alignItems: 'center' }}>
          <JoinDiscord />
        </View>

        <Text style={styles.header}>Kredit</Text>
        <Button
          title="Background yang digunakan sekarang"
          icon="external-link"
          onPress={() => {
            Linking.openURL(
              'https://www.rawpixel.com/image/13191506/tokyo-architecture-cityscape-building-generated-image-rawpixel#eyJrZXlzIjoibW9iaWxlIHdhbGxwYXBlciIsInNvcnRlZEtleXMiOiJtb2JpbGUgd2FsbHBhcGVyIn0=',
            );
          }}
        />
        <Button
          title="Quotes yang digunakan di aplikasi"
          icon="external-link"
          onPress={() => {
            Linking.openURL('https://github.com/lakuapik/quotes-indonesia');
          }}
        />

        <Text style={styles.header}>Open Source Library</Text>
        {appPackage.dependencies &&
          appPackage.devDependencies &&
          Object.entries({ ...appPackage.dependencies, ...appPackage.devDependencies }).map(
            ([key, value]) => {
              return (
                <Button
                  key={key}
                  title={key + ' : ' + value}
                  onPress={() => {
                    Linking.openURL(`https://www.npmjs.com/package/${key}`);
                  }}
                />
              );
            },
          )}
      </LegendList>
    </ImageBackground>
  );
}

function Button({ title, onPress, icon }: { title: string; onPress: () => void; icon?: string }) {
  const styles = useStyles();
  const theme = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={styles.button}>
      {icon && (
        <Icon
          name={icon}
          size={14}
          style={{ alignSelf: 'center' }}
          color={theme.colors.onPrimary}
        />
      )}
      <Text style={styles.buttonText}>{title}</Text>
    </TouchableOpacity>
  );
}

function useStyles() {
  const theme = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
        },
        header: {
          fontSize: 24,
          textAlign: 'center',
          marginVertical: 10,
          color: darkText,
        },
        applicationInfo: {
          fontSize: 16,
          marginHorizontal: 10,
        },
        button: {
          gap: 4,
          backgroundColor: theme.colors.primary,
          flexDirection: 'row',
          padding: 10,
          margin: 2,
          borderRadius: 5,
        },
        buttonText: {
          fontWeight: 'bold',
          fontSize: 17,
          color: theme.colors.onPrimary,
        },
      }),
    [theme.colors.onPrimary, theme.colors.primary],
  );
}

export default memo(About);
