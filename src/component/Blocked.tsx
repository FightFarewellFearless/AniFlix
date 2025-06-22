import { WEBHOOK_WHITELIST_URL } from '@env';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  Vibration,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Entypo';
import { RootStackNavigator } from '../types/navigation';
import DialogManager from '../utils/dialogManager';
import { JoinDiscord } from './Loading Screen/Connect';

const AnimatedIcon = Animated.createAnimatedComponent(Icon);

type Props = NativeStackScreenProps<RootStackNavigator, 'Blocked'>;

function Blocked(props: Props) {
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
    fetch(WEBHOOK_WHITELIST_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        embeds: [
          {
            color: 0x7289d9,
            title: 'Permintaan Whitelist',
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
                name: 'Genre',
                value: data.genres.join(', '),
              },
              {
                name: 'Deskripsi tambahan',
                value: textInputDescription.current || 'Tidak ada deskripsi tambahan',
              },
            ],
          },
        ],
      }),
    })
      .then(() => {
        DialogManager.alert('Berhasil', 'Permintaan Anda berhasil dikirim!');
      })
      .catch(() => {
        DialogManager.alert('Gagal', 'Permintaan Anda gagal dikirim!');
      });

    textInputDescription.current = '';
  }, [data.genres, data.thumbnailUrl, title, url]);

  return (
    <View style={styles.container}>
      <Modal
        visible={isRequestModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsRequestModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Permintaan Whitelist</Text>
              <TouchableOpacity onPress={() => setIsRequestModalOpen(false)}>
                <Icon name="cross" size={24} color={'#FF3B30'} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDescription}>
              Anda meminta anime/komik{' '}
              <Text style={styles.highlightText}>{props.route.params.title}</Text> untuk dimasukkan
              ke whitelist. Developer akan meninjau anime/komik ini terlebih dahulu sebelum
              menyetujui permintaan.
            </Text>

            <Text style={styles.inputLabel}>Deskripsi Tambahan (opsional)</Text>
            <TextInput
              onChangeText={e => (textInputDescription.current = e)}
              placeholder="Jelaskan alasan anime/komik ini layak di-whitelist..."
              placeholderTextColor={'#8E8E93'}
              multiline
              style={styles.requestInput}
            />

            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setIsRequestModalOpen(false)}>
                <Text style={styles.cancelButtonText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={sendRequest}>
                <Text style={styles.submitButtonText}>Kirim Permintaan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.contentContainer}>
        <View style={styles.iconContainer}>
          <AnimatedIcon
            name="warning"
            size={60}
            style={[styles.animatedIcon, { transform: [{ scale: animatedScale }] }]}
          />
        </View>

        <Text style={styles.title}>Peringatan Konten</Text>

        <Text style={styles.subtitle}>
          Anime/komik ini mengandung genre yang masuk dalam daftar blacklist kebijakan konten kami.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Minta Whitelist</Text>
          <Text style={styles.cardText}>
            Jika Anda yakin konten ini pantas, Anda bisa mengajukan permintaan peninjauan whitelist.
            Kami akan mengevaluasi konten dan memberi kabar melalui Discord jika disetujui.
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.backButton]}
            onPress={() => props.navigation.goBack()}>
            <Icon name="chevron-left" size={16} color={'white'} />
            <Text style={styles.buttonText}>Kembali</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setIsRequestModalOpen(true)}
            style={[styles.button, styles.requestButton]}>
            <Icon name="message" size={16} color={'white'} />
            <Text style={styles.buttonText}>Ajukan Permintaan</Text>
          </TouchableOpacity>
        </View>

        <JoinDiscord />
      </View>
    </View>
  );
}

function useStyles() {
  const colorScheme = useColorScheme();
  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colorScheme === 'dark' ? '#121212' : '#F5F5F5',
        },
        contentContainer: {
          flex: 1,
          padding: 24,
          justifyContent: 'center',
        },
        iconContainer: {
          alignItems: 'center',
          marginBottom: 24,
        },
        animatedIcon: {
          color: '#FF3B30',
        },
        title: {
          fontSize: 28,
          fontWeight: '700',
          textAlign: 'center',
          marginBottom: 8,
          color: colorScheme === 'dark' ? 'white' : 'black',
        },
        subtitle: {
          fontSize: 16,
          textAlign: 'center',
          marginBottom: 32,
          color: colorScheme === 'dark' ? '#AEAEB2' : '#636366',
          lineHeight: 24,
        },
        card: {
          backgroundColor: colorScheme === 'dark' ? '#1C1C1E' : 'white',
          borderRadius: 12,
          padding: 16,
          marginBottom: 32,
          shadowColor: colorScheme === 'dark' ? '#000' : 'rgba(0,0,0,0.1)',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 4,
          elevation: 3,
        },
        cardTitle: {
          fontSize: 18,
          fontWeight: '600',
          marginBottom: 8,
          color: colorScheme === 'dark' ? 'white' : 'black',
        },
        cardText: {
          fontSize: 14,
          color: colorScheme === 'dark' ? '#AEAEB2' : '#636366',
          lineHeight: 20,
        },
        buttonContainer: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: 24,
        },
        button: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 10,
          paddingVertical: 12,
          paddingHorizontal: 16,
          flex: 1,
          marginHorizontal: 8,
        },
        backButton: {
          backgroundColor: colorScheme === 'dark' ? '#2C2C2E' : '#b4b4b4',
        },
        requestButton: {
          backgroundColor: '#34C759',
        },
        buttonText: {
          color: 'white',
          fontSize: 16,
          fontWeight: '500',
          marginLeft: 8,
        },
        modalOverlay: {
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          padding: 24,
        },
        modalContentContainer: {
          backgroundColor: colorScheme === 'dark' ? '#1C1C1E' : 'white',
          borderRadius: 12,
          padding: 20,
        },
        modalHeader: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        },
        modalTitle: {
          fontSize: 20,
          fontWeight: '600',
          color: colorScheme === 'dark' ? 'white' : 'black',
        },
        modalDescription: {
          fontSize: 15,
          color: colorScheme === 'dark' ? '#AEAEB2' : '#636366',
          marginBottom: 20,
          lineHeight: 22,
        },
        inputLabel: {
          fontSize: 14,
          fontWeight: '500',
          color: colorScheme === 'dark' ? 'white' : 'black',
          marginBottom: 8,
        },
        requestInput: {
          backgroundColor: colorScheme === 'dark' ? '#2C2C2E' : '#F2F2F7',
          borderRadius: 8,
          padding: 12,
          minHeight: 100,
          color: colorScheme === 'dark' ? 'white' : 'black',
          marginBottom: 20,
          textAlignVertical: 'top',
        },
        modalButtonContainer: {
          flexDirection: 'row',
          justifyContent: 'space-between',
        },
        modalButton: {
          borderRadius: 8,
          paddingVertical: 12,
          paddingHorizontal: 16,
          flex: 1,
          marginHorizontal: 4,
          alignItems: 'center',
        },
        cancelButton: {
          backgroundColor: colorScheme === 'dark' ? '#2C2C2E' : '#F2F2F7',
        },
        submitButton: {
          backgroundColor: '#34C759',
        },
        cancelButtonText: {
          color: colorScheme === 'dark' ? 'white' : 'black',
          fontWeight: '500',
        },
        submitButtonText: {
          color: 'white',
          fontWeight: '500',
        },
        highlightText: {
          color: '#34C759',
          fontWeight: '600',
        },
      }),
    [colorScheme],
  );
}

export default memo(Blocked);
