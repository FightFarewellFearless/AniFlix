import React, { useCallback, useEffect, useRef, useState, memo } from 'react';
import {
  Text,
  View,
  Animated,
  Vibration,
  StyleSheet,
  useColorScheme,
  Modal,
  Alert,
} from 'react-native';
import { TouchableOpacity } from 'react-native'; //rngh
import Icon from 'react-native-vector-icons/Entypo';
import useGlobalStyles from '../assets/style';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackNavigator } from '../types/navigation';
import { JoinDiscord } from './Loading Screen/Connect';
import { TextInput } from 'react-native';
import { WEBHOOK_URL } from '@env';

const AnimatedIcon = Animated.createAnimatedComponent(Icon);

type Props = StackScreenProps<RootStackNavigator, 'Blocked'>;

function Blocked(props: Props) {
  const globalStyles = useGlobalStyles();
  const styles = useStyles();
  const [animatedScale] = useState(() => new Animated.Value(1));

  const { title, url, data } = props.route.params;

  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

  const [animated] = useState(() =>
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedScale, {
          toValue: 1.3,
          duration: 150,
          delay: 500,
          useNativeDriver: true,
        }),
        Animated.timing(animatedScale, {
          toValue: 1,
          duration: 200,
          delay: 20,
          useNativeDriver: true,
        }),
      ]),
      {
        iterations: -1,
      },
    ),
  );
  useEffect(() => {
    animated.start();
    Vibration.vibrate([500, 150, 90, 200]);
    return () => {
      animated.stop();
    };
  }, [animated]);

  const textInputDescription = useRef<string>('');
  const sendRequest = useCallback(() => {
    setIsRequestModalOpen(false);
    fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        embeds: [
          {
            color: 0x7289d9,
            title: 'Whitelist Request',
            thumbnail: {
              url: data.thumbnailUrl,
            },
            fields: [
              {
                name: 'Judul',
                value: title,
              },
              {
                name: 'URL',
                value: url,
              },
              {
                name: 'Genres',
                value: data.genres.join(', '),
              },
              {
                name: 'Deskripsi lanjut oleh user',
                value: textInputDescription.current || 'Tidak ada deskripsi',
              },
            ],
          },
        ],
      }),
    })
      .then(() => {
        Alert.alert('Sukses', 'Permintaan kamu berhasil dikirim!');
      })
      .catch(() => {
        Alert.alert('Gagal', 'Permintaan kamu gagal dikirim!');
      });

    textInputDescription.current = '';
  }, [data.genres, data.thumbnailUrl, title, url]);

  return (
    <View style={{ justifyContent: 'center', alignItems: 'center', flex: 1 }}>
      <Modal
        visible={isRequestModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsRequestModalOpen(false)}>
        <View
          style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.658)', justifyContent: 'center' }}>
          <View style={styles.modalContentContainer}>
            <TouchableOpacity
              style={{ alignItems: 'flex-end' }}
              onPress={() => setIsRequestModalOpen(false)}>
              <Icon name="cross" size={43} color={'red'} />
            </TouchableOpacity>
            <Text style={[globalStyles.text, styles.requestTitleText]}>
              Kamu akan meminta anime{' '}
              <Text style={{ color: '#7289d9' }}>{props.route.params.title} </Text>
              untuk di whitelist
            </Text>

            <Text style={[globalStyles.text]}>
              Developer akan melihat terlebih dahulu apakah anime ini aman untuk ditonton semua
              umur, dan jika benar, developer akan menambahkan anime ini ke daftar whitelist
            </Text>

            <Text style={[globalStyles.text, styles.requestDescriptionTitle]}>
              Tulis deskripsi (opsional)
            </Text>
            <TextInput
              onChangeText={e => (textInputDescription.current = e)}
              placeholder="Tuliskan alasanmu disini (opsional)"
              placeholderTextColor={'#c5c5c5'}
              multiline
              style={styles.requestInput}
            />

            <TouchableOpacity style={styles.modalAccButton} onPress={sendRequest}>
              <Icon name="check" size={25} color={'#7289d9'} />
              <Text style={[globalStyles.text, styles.modalAccButtonText]}>Kirim</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <View>
        <AnimatedIcon
          name="warning"
          size={45}
          style={[styles.animatedIcon, { transform: [{ scale: animatedScale }] }]}
        />
      </View>
      <Text style={[{ fontSize: 18, fontWeight: 'bold', textAlign: 'center' }, globalStyles.text]}>
        Eitss!!! Tunggu dulu, anime yang ingin kamu tonton mengandung genre yang di blacklist
      </Text>
      <Text style={[globalStyles.text, { textAlign: 'center' }]}>
        Jika ingin menonton anime ini kamu bisa request ke developer untuk whitelist anime ini
        menggunakan tombol dibawah ini.
      </Text>
      <Text style={[globalStyles.text, styles.devDescText]}>
        Developer akan me-review terlebih dahulu anime ini, kemudian jika dirasa aman, maka
        permintaan whitelist akan disetujui dan kamu bisa menontonnya.{'\n'}
        Pengumuman akan diumumkan di server discord
      </Text>
      <View style={{ flexDirection: 'row' }}>
        <TouchableOpacity style={styles.button} onPress={() => props.navigation.goBack()}>
          <Icon name="back" size={15} style={{ color: 'black' }} />
          <Text style={{ color: 'black', fontSize: 15 }}> Kembali</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setIsRequestModalOpen(true)}
          style={[styles.button, { backgroundColor: 'lightgreen' }]}>
          <Icon name="message" size={15} style={{ color: 'black' }} />
          <Text style={{ color: 'black', fontSize: 15 }}> Request Whitelist</Text>
        </TouchableOpacity>
      </View>
      <JoinDiscord />
    </View>
  );
}

function useStyles() {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    animatedIcon: {
      color: '#ff0000',
      alignSelf: 'center',
      justifyContent: 'center',
    },
    button: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 6,
      padding: 3,
      margin: 5,
      backgroundColor: 'lightblue',
    },
    devDescText: {
      textAlign: 'center',
      color: colorScheme === 'dark' ? 'lightgreen' : 'darkgreen',
    },
    requestTitleText: {
      textAlign: 'center',
      fontWeight: 'bold',
      fontSize: 17,
    },
    requestDescriptionTitle: {
      fontSize: 16,
      fontWeight: 'bold',
    },
    requestInput: {
      backgroundColor: '#4e4e4e',
      padding: 10,
      margin: 10,
      borderRadius: 6,
      color: '#c5c5c5',
    },
    modalContentContainer: {
      width: '100%',
      padding: 8,
      gap: 7,
      backgroundColor: colorScheme === 'dark' ? '#383838' : 'white',
      justifyContent: 'center',
    },
    modalAccButton: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 6,
      padding: 3,
      margin: 5,
      alignSelf: 'center',
      backgroundColor: 'lightgreen',
    },
    modalAccButtonText: {
      color: 'black',
      fontSize: 15,
      fontWeight: 'bold',
    },
  });
}

export default memo(Blocked);
