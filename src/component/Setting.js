import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
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

function Setting(props) {
  const [switchValue, setSwitch] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [restoreVisible, setRestoreVisible] = useState(false);
  const [modalText, setModalText] = useState('');
  const [backupCode, setBackupCode] = useState('');

  useEffect(() => {
    AsyncStorage.getItem('enableNextPartNotification').then(data => {
      setSwitch(data === 'true' || data === null);
    });
  }, []);

  const nextPartNotification = () => {
    const newValue = !switchValue;
    setSwitch(newValue);
    AsyncStorage.setItem('enableNextPartNotification', newValue.toString());
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
            ).toLocaleDateString()}`,
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
                        currentHistory.splice(dataINDEX, 1);
                      }
                      currentHistory.splice(0, 0, {
                        title: result.title,
                        episode: result.episode,
                        link: result.link,
                        thumbnailUrl: result.thumbnailUrl,
                        date: result.date,
                      });
                    }
                    currentHistory = currentHistory.sort(
                      (a, b) => b.date - a.date,
                    );
                    await AsyncStorage.setItem(
                      'history',
                      JSON.stringify(currentHistory),
                    );
                    Alert.alert(
                      'Restore berhasil!',
                      'Kamu berhasil kembali ke backup sebelumnya! (Histori yang baru tidak akan menghilang)',
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

  return (
    <ScrollView>
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
      <Modal transparent visible={restoreVisible}>
        <TouchableWithoutFeedback onPress={() => setRestoreVisible(false)}>
          <View style={styles.modalContainer}>
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
                <Text style={globalStyles.text}>Masukkan kode backup:</Text>
                <TextInput
                  placeholderTextColor={globalStyles.text.color}
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
                    },
                  ]}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
      <SettingList
        text="Nyalakan notifikasi part selanjutnya"
        icon={<Icon name="cube" size={15} />}
        rightComponent={
          <Switch value={switchValue} onValueChange={nextPartNotification} />
        }
        handler={nextPartNotification}
      />

      <SettingList
        text="Backup histori tontonan"
        icon={<Icon name="cloud-upload" size={15} />}
        handler={backupHistory}
      />

      <SettingList
        text="Restore histori tontonan"
        icon={<Icon name="history" size={15} />}
        handler={() => restoreHistory()}
      />
    </ScrollView>
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
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    flex: 0.25,
    backgroundColor: '#504f4f',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingListContainer: {
    flex: 1,
    backgroundColor: '#303030',
    marginHorizontal: 15,
    borderRadius: 7,
    flexDirection: 'row',
    paddingVertical: 5,
    marginVertical: 15,
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
});

export default Setting;
