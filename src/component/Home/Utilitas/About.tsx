import { ImageBackground, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from "react-native";
import appPackage from "../../../../package.json";
import { JoinDiscord } from "../../Loading Screen/Connect";
import DarkOverlay from "../../misc/DarkOverlay";
import { darkText } from "../../../assets/style";
import { useMemo } from "react";
import Icon from "react-native-vector-icons/FontAwesome";

const tokyo = require('../../../assets/tokyo.jpg');

export default function About() {
  const globalStyles = useMemo(() => ({
    text: {
      color: darkText,
    }
  }), []);
  const styles = useStyles();
  return (
    <ImageBackground source={tokyo} resizeMode="cover" style={{ flex: 1 }}>
      <DarkOverlay transparent={0.75} />
    <ScrollView style={styles.container}>
      <Text style={styles.header}>
        AniFlix {appPackage.version}-JS_{appPackage.OTAJSVersion}{'\n'}
        <Text style={{ fontSize: 14, fontWeight: 'bold' }}>Oleh Pirles</Text>
      </Text>
      <Text style={[globalStyles.text, styles.applicationInfo]}>
        AniFlix adalah aplikasi streaming anime yang dibuat oleh Fight Farewell Fearless AKA Pirles.{`\n`}
        Aplikasi ini dibangun diatas Framework React Native dan Expo.{'\n\n'}
        Dibangun untuk tujuan pembelajaran mobile development sang developer.{'\n'}
      </Text>
      <Text style={[globalStyles.text, styles.applicationInfo]}>
        Semua anime yang terdapat di aplikasi ini bukan milik kami,
        kami hanya menyediakan layanan streaming dengan membagikan link yang memang beredar di internet.{'\n'}
      </Text>
      <Text style={[globalStyles.text, styles.applicationInfo]}>
        Terimakasih karena sudah menggunakan aplikasi ini.
      </Text>


      <Text style={styles.header}>
        Kontak
      </Text>
      <Text style={[globalStyles.text, styles.applicationInfo]}>
        Jika ada pertanyaan, kritik, saran, atau bug yang ingin dilaporkan, silahkan hubungi kami melalui server discord dibawah ini
      </Text>
      <View style={{ alignItems: 'center' }}>
        <JoinDiscord />
      </View>

      <Text style={styles.header}>
        Kredit
      </Text>
      <Button title="Background yang digunakan sekarang" icon="external-link" onPress={() => {
        Linking.openURL('https://www.rawpixel.com/image/13191506/tokyo-architecture-cityscape-building-generated-image-rawpixel#eyJrZXlzIjoibW9iaWxlIHdhbGxwYXBlciIsInNvcnRlZEtleXMiOiJtb2JpbGUgd2FsbHBhcGVyIn0=');
      }} />
      <Button title="Quotes yang digunakan di aplikasi" icon="external-link" onPress={() => {
        Linking.openURL('https://github.com/lakuapik/quotes-indonesia');
      }} />

      <Text style={styles.header}>
        Open Source Library
      </Text>
      {appPackage.dependencies && appPackage.devDependencies && Object.entries({...appPackage.dependencies, ...appPackage.devDependencies}).map(([key, value]) => {
        return (
          <Button key={key} title={key + ' : ' + value} onPress={() => {
            Linking.openURL(`https://www.npmjs.com/package/${key}`);
          }} />
        )
      })}
    </ScrollView>
    </ImageBackground>
  )
}

function Button({ title, onPress, icon }: { title: string, onPress: () => void, icon?: string }) {
  const styles = useStyles();
  return (
    <TouchableOpacity onPress={onPress} style={styles.button}>
      {icon && <Icon name={icon} size={14} style={{ alignSelf: 'center' }} color={'black'} />}
      <Text style={styles.buttonText}>{title}</Text>
    </TouchableOpacity>
  )
}

function useStyles() {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
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
      backgroundColor: '#0084ff',
      flexDirection: 'row',
      padding: 10,
      margin: 2,
      borderRadius: 5,
    },
    buttonText: {
      fontWeight: 'bold',
      fontSize: 17,
      color: 'black',
    }
  })
}