import React, {
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Animated,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import globalStyles from '../assets/style';
import Icon from 'react-native-vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Clipboard from '@react-native-clipboard/clipboard';
import { HomeContext } from '../misc/context';
import { useFocusEffect } from '@react-navigation/native';

function Setting(props) {
  const [notificationSwitch, setNotificationSwitch] = useState(false);
  const [batteryTimeInfoSwitch, setBatteryTimeInfoSwitch] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [restoreVisible, setRestoreVisible] = useState(false);
  const [modalText, setModalText] = useState('');
  const [backupCode, setBackupCode] = useState('');
  const { paramsState } = useContext(HomeContext);

  const scaleAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    AsyncStorage.getItem('enableNextPartNotification').then(data => {
      setNotificationSwitch(data === 'true' || data === null);
    });
    AsyncStorage.getItem('enableBatteryTimeInfo').then(data => {
      setBatteryTimeInfoSwitch(data === 'true');
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      Animated.timing(scaleAnim, {
        toValue: 1,
        // speed: 18,
        duration: 150,
        useNativeDriver: true,
      }).start();
      return () => {
        Animated.timing(scaleAnim, {
          toValue: 0.5,
          // speed: 18,
          duration: 250,
          useNativeDriver: true,
        }).start();
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const nextPartNotification = () => {
    const newValue = !notificationSwitch;
    setNotificationSwitch(newValue);
    AsyncStorage.setItem('enableNextPartNotification', newValue.toString());
  };

  const batteryTimeSwitchHandler = () => {
    const newValue = !batteryTimeInfoSwitch;
    setBatteryTimeInfoSwitch(newValue);
    AsyncStorage.setItem('enableBatteryTimeInfo', newValue.toString());
  };

  const backupHistory = () => {
    Alert.alert(
      'Backup histori',
      'Saat backup sedang berlangsung, kamu tidak bisa membatalkannya. Mau lanjut?',
      [
        {
          text: 'Batal',
        },
        {
          text: 'Lanjut dan backup',
          onPress: async () => {
            setModalText('Backup sedang berlangsung...');
            setModalVisible(true);
            try {
              const historyData = await AsyncStorage.getItem('history');
              if (historyData === null || historyData === '[]') {
                Alert.alert(
                  'Tidak ada histori!',
                  'kamu tidak memiliki histori tontonan, Backup dibatalkan',
                );
                return;
              }
              const fetchData = await fetch(
                'https://animeapi.aceracia.repl.co/backupHistory',
                {
                  method: 'POST',
                  body: JSON.stringify({
                    history: historyData,
                  }),
                  headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json',
                  },
                },
              ).then(a => a.json());
              Alert.alert(
                'Backup berhasil!',
                `Histori tontonan kamu sudah berhasil di backup ke server.\nGunakan kode "${fetchData.id}" saat kamu ingin mengembalikan ke backup saat ini`,
                [
                  {
                    text: 'OK',
                  },
                  {
                    text: 'Salin kode',
                    onPress: () => {
                      Clipboard.setString(fetchData.id);
                    },
                  },
                ],
              );
            } catch (e) {
              Alert.alert(
                'Backup gagal!',
                `Backup gagal karna alasan berikut:\n${e.message}`,
              );
            } finally {
              setModalVisible(false);
            }
          },
        },
      ],
    );
  };

  const restoreHistory = async code => {
    if (code === undefined) {
      setRestoreVisible(true);
    } else {
      if (code === '') {
        return;
      }
      setRestoreVisible(false);
      setModalText('Mengecek apakah kode valid...');
      setModalVisible(true);
      try {
        const backupData = await fetch(
          'https://animeapi.aceracia.repl.co/getBackup?id=' + code,
        ).then(a => a.json());
        if (backupData.error) {
          Alert.alert('Restore gagal!', backupData.message);
        } else {
          Alert.alert(
            'Bersiap untuk restore backup kamu!',
            `Kode tersedia dan siap untuk di restore.\nbackupID: ${code}\ntanggal backup: ${new Date(
              backupData.dateStamp,
            ).toLocaleDateString()}\n(Histori terbaru tidak akan ditimpa)`,
            [
              {
                text: 'Batal',
              },
              {
                text: 'lakukan restore',
                onPress: async () => {
                  let currentHistory = await AsyncStorage.getItem('history');
                  if (currentHistory === null) {
                    currentHistory = '[]';
                  }
                  currentHistory = JSON.parse(currentHistory);
                  const backup = JSON.parse(backupData.backupData);
                  setModalVisible(true);
                  setModalText(
                    'Mohon tunggu, ini bisa memakan beberapa waktu...',
                  );
                  try {
                    for (const result of backup) {
                      const dataINDEX = currentHistory.findIndex(
                        val => val.title === result.title,
                      );
                      if (dataINDEX >= 0) {
                        if (currentHistory[dataINDEX].date > result.date) {
                          continue;
                        }
                        currentHistory.splice(dataINDEX, 1);
                      }
                      currentHistory.push({
                        title: result.title,
                        episode: result.episode,
                        link: result.link,
                        thumbnailUrl: result.thumbnailUrl,
                        date: result.date,
                      });
                    }
                    currentHistory.sort((a, b) => b.date - a.date);
                    await AsyncStorage.setItem(
                      'history',
                      JSON.stringify(currentHistory),
                    );
                    Alert.alert(
                      'Restore berhasil!',
                      'Kamu berhasil kembali ke backup sebelumnya!',
                    );
                  } catch (e) {
                    Alert.alert('Restore gagal!', e.message);
                  } finally {
                    setModalVisible(false);
                  }
                },
              },
            ],
          );
        }
      } catch (e) {
        Alert.alert('Restore gagal!', e.message);
      } finally {
        setModalVisible(false);
      }
    }
  };

  const deleteHistory = () => {
    Alert.alert(
      'Peringatan!!!',
      'Ini akan menghapus semua histori tontonan kamu.\nApakah kamu yakin ingin lanjut?',
      [
        {
          text: 'Batal',
        },
        {
          text: 'Lanjut dan hapus',
          onPress: async () => {
            setModalText('Menghapus histori tontonan kamu...');
            setModalVisible(true);
            try {
              await AsyncStorage.setItem('history', '[]');
              Alert.alert(
                'Histori dihapus',
                'Histori tontonan kamu sudah di hapus',
              );
            } catch (e) {
              Alert.alert('Gagal menghapus histori!', e.message);
            } finally {
              setModalVisible(false);
            }
          },
        },
      ],
    );
  };

  return (
    <Animated.ScrollView style={{ transform: [{ scale: scaleAnim }] }}>
      <View style={styles.waktuServer}>
        <Text style={globalStyles.text}>Waktu server: </Text>
        <Text style={globalStyles.text}>{paramsState.waktuServer}</Text>
      </View>
      {/* Modal backup */}
      <Modal transparent visible={modalVisible}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <ActivityIndicator size="large" />
            <Text style={globalStyles.text}>{modalText}</Text>
          </View>
        </View>
      </Modal>
      {/* Modal restore */}
      <Modal
        transparent
        visible={restoreVisible}
        onRequestClose={() => setRestoreVisible(false)}>
        <TouchableWithoutFeedback onPress={() => setRestoreVisible(false)}>
          <View style={[styles.modalContainer]}>
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.modalContent,
                  { minHeight: 100, minWidth: 250 },
                ]}>
                <TouchableOpacity
                  style={{ position: 'absolute', top: 0, right: 0 }}
                  onPress={() => setRestoreVisible(false)}>
                  <Icon name="close" size={28} style={{ color: 'red' }} />
                </TouchableOpacity>
                <Text style={[globalStyles.text]}>Masukkan kode backup:</Text>
                <TextInput
                  placeholderTextColor="#707070"
                  placeholder="Kode"
                  keyboardType="numeric"
                  value={backupCode}
                  onChangeText={text => setBackupCode(text)}
                  onSubmitEditing={() => restoreHistory(backupCode)}
                  style={[
                    globalStyles.text,
                    {
                      borderWidth: 1,
                      backgroundColor: '#474747',
                      height: 45,
                      width: 100,
                      textAlign: 'center',
                      justifyContent: 'center',
                    },
                  ]}
                />
                <TouchableOpacity
                  style={styles.acceptRestoreModalButton}
                  onPress={() => restoreHistory(backupCode)}>
                  <Text style={[globalStyles.text]}>Restore</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
      <SettingList
        text="Nyalakan notifikasi part selanjutnya"
        icon={<Icon name="cube" style={globalStyles.text} size={15} />}
        rightComponent={
          <Switch
            value={notificationSwitch}
            onValueChange={nextPartNotification}
          />
        }
        handler={nextPartNotification}
      />

      <SettingList
        text="Nyalakan informasi baterai dan jam"
        icon={<Icon name="battery" style={globalStyles.text} size={15} />}
        rightComponent={
          <Switch
            value={batteryTimeInfoSwitch}
            onValueChange={batteryTimeSwitchHandler}
          />
        }
        handler={batteryTimeSwitchHandler}
      />

      <SettingList
        text="Backup histori tontonan"
        icon={<Icon name="cloud-upload" style={globalStyles.text} size={15} />}
        handler={backupHistory}
      />

      <SettingList
        text="Restore histori tontonan"
        icon={<Icon name="history" style={globalStyles.text} size={15} />}
        handler={() => restoreHistory()}
      />

      <SettingList
        text="Hapus histori tontonan"
        icon={<Icon name="trash" style={{ color: 'red' }} size={15} />}
        handler={() => deleteHistory()}
      />
    </Animated.ScrollView>
  );
}

function SettingList(props) {
  const icon = props.icon;
  const text = props.text;
  const handler = props.handler;
  const rightComponent = props.rightComponent;

  return (
    <TouchableOpacity style={styles.settingListContainer} onPress={handler}>
      <View style={styles.settingListIcon}>{icon}</View>
      <View style={styles.settingListText}>
        <Text style={globalStyles.text}>{text}</Text>
      </View>
      <View style={styles.settingListRightComponent}>{rightComponent}</View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  waktuServer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#835604',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0000008a',
  },
  modalContent: {
    flex: 0.15,
    backgroundColor: '#383838',
    borderWidth: 1,
    borderColor: 'gray',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingListContainer: {
    flex: 1,
    backgroundColor: '#303030',
    borderWidth: 1,
    borderColor: 'gray',
    marginHorizontal: 14,
    marginVertical: 14,
    borderRadius: 7,
    flexDirection: 'row',
    paddingVertical: 5,
    alignItems: 'center',
    alignContent: 'center',
  },
  settingListIcon: {
    borderRightWidth: 1,
    borderRightColor: '#cfcfcf',
    paddingRight: 8,
    paddingLeft: 4,
    alignSelf: 'center',
  },
  settingListText: {
    flex: 1,
    alignItems: 'center',
  },
  settingListRightComponent: {
    alignItems: 'flex-end',
  },
  acceptRestoreModalButton: {
    backgroundColor: 'green',
    padding: 7,
    borderRadius: 3,
    marginTop: 10,
  },
});

export default Setting;
