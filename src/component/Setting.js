import React, { useContext, useState, useCallback, useRef } from 'react';
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
  FlatList,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import Clipboard from '@react-native-clipboard/clipboard';
import { useFocusEffect } from '@react-navigation/native';
import globalStyles from '../assets/style';
import { HomeContext } from '../misc/context';

import { useDispatch, useSelector } from 'react-redux';

import { setDatabase } from '../misc/reduxSlice';
import Orientation from 'react-native-orientation-locker';
import deviceUserAgent from '../utils/deviceUserAgent';

function Setting(props) {
  const enableNextPartNotification = useSelector(
    state => state.settings.enableNextPartNotification,
  );
  const enableBatteryTimeInfo = useSelector(
    state => state.settings.enableBatteryTimeInfo,
  );
  const history = useSelector(state => state.settings.history);

  const dispatchSettings = useDispatch();

  // const [notificationSwitch, setNotificationSwitch] = useState(false);
  const notificationSwitch = enableNextPartNotification === 'true';
  const setNotificationSwitch = value => {
    dispatchSettings(
      setDatabase({
        target: 'enableNextPartNotification',
        value,
      }),
    );
  };
  // const [batteryTimeInfoSwitch, setBatteryTimeInfoSwitch] = useState(false);
  const batteryTimeInfoSwitch = enableBatteryTimeInfo === 'true';
  const setBatteryTimeInfoSwitch = value => {
    dispatchSettings(
      setDatabase({
        target: 'enableBatteryTimeInfo',
        value,
      }),
    );
  };
  // const [downloadFrom, setDownloadFrom] = useState('native');
  const downloadFrom = useSelector(state => state.settings.downloadFrom);
  const setDownloadFrom = useCallback(
    value => {
      dispatchSettings(
        setDatabase({
          target: 'downloadFrom',
          value,
        }),
      );
    },
    [dispatchSettings],
  );

  const lockScreenOrientation = useSelector(
    state => state.settings.lockScreenOrientation,
  );
  const lockScreenOrientationSwitch = lockScreenOrientation === 'true';
  const toggleScreenOrientation = useCallback(() => {
    const newValue = lockScreenOrientation !== 'true';

    if (newValue === true) {
      Orientation.lockToPortrait();
    } else {
      Orientation.unlockAllOrientations();
    }

    dispatchSettings(
      setDatabase({
        target: 'lockScreenOrientation',
        value: newValue,
      }),
    );
  }, [dispatchSettings, lockScreenOrientation]);

  const [modalVisible, setModalVisible] = useState(false);
  const [restoreVisible, setRestoreVisible] = useState(false);
  const [modalText, setModalText] = useState('');
  const [backupCode, setBackupCode] = useState('');

  const { paramsState } = useContext(HomeContext);

  const scaleAnim = useRef(new Animated.Value(0.8)).current;

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
          toValue: 0.8,
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
  };

  const batteryTimeSwitchHandler = () => {
    const newValue = !batteryTimeInfoSwitch;
    setBatteryTimeInfoSwitch(newValue);
  };

  const backupHistory = useCallback(() => {
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
              const historyData = history;
              if (historyData === '[]') {
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
                    'User-Agent': deviceUserAgent,
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
  }, [history]);

  const restoreHistory = useCallback(
    async code => {
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
            {
              headers: {
                'User-Agent': deviceUserAgent,
              },
            },
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
                    const currentHistory = JSON.parse(history);
                    const backup = JSON.parse(backupData.backupData);
                    setModalVisible(true);
                    setModalText(
                      'Mohon tunggu, ini bisa memakan beberapa waktu...',
                    );
                    await new Promise(res => setTimeout(res, 1)); // make sure to not restoring too early
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
                        currentHistory.push(result);
                      }
                      currentHistory.sort((a, b) => b.date - a.date);
                      dispatchSettings(
                        setDatabase({
                          target: 'history',
                          value: JSON.stringify(currentHistory),
                        }),
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
    },
    [dispatchSettings, history],
  );

  const deleteHistory = useCallback(() => {
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
            await new Promise(res => setTimeout(res, 1));
            try {
              dispatchSettings(
                setDatabase({
                  target: 'history',
                  value: '[]',
                }),
              );
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
  }, [dispatchSettings]);

  const toggleDownloadFrom = useCallback(async () => {
    const newDownloadFrom = downloadFrom === 'native' ? 'browser' : 'native';
    setDownloadFrom(newDownloadFrom);
  }, [downloadFrom, setDownloadFrom]);

  const iconSize = 18;

  const settingsData = [
    {
      title: 'Nyalakan notifikasi part selanjutnya',
      description:
        'Beri tahu saya saat akan berpindah part anime secara otomatis',
      icon: <Icon name="cube" style={globalStyles.text} size={iconSize} />,
      rightComponent: (
        <Switch
          value={notificationSwitch}
          onValueChange={nextPartNotification}
        />
      ),
      handler: nextPartNotification,
    },
    {
      title: 'Nyalakan informasi baterai dan jam',
      description:
        'Beri tahu saya persentase baterai dan waktu saat sedang streaming fullscreen',
      icon: <Icon name="battery" style={globalStyles.text} size={iconSize} />,
      rightComponent: (
        <Switch
          value={batteryTimeInfoSwitch}
          onValueChange={batteryTimeSwitchHandler}
        />
      ),
      handler: batteryTimeSwitchHandler,
    },
    {
      title: 'Kunci orientasi',
      description: 'Mengunci orientasi ke portrait',
      icon: <Icon name="lock" style={globalStyles.text} size={iconSize} />,
      rightComponent: (
        <Switch
          value={lockScreenOrientationSwitch}
          onValueChange={toggleScreenOrientation}
        />
      ),
      handler: toggleScreenOrientation,
    },
    {
      title: 'Download anime melalui',
      description:
        'Download anime melalui browser atau download manager bawaan android',
      icon: <Icon name="download" style={globalStyles.text} size={iconSize} />,
      rightComponent: (
        <Text
          style={{
            color: downloadFrom === 'native' ? '#09a709' : '#ff7300',
            borderWidth: 1,
            borderColor: 'yellow',
            padding: 5,
            margin: 2,
          }}>
          {downloadFrom}
        </Text>
      ),
      handler: toggleDownloadFrom,
    },
    {
      title: 'Cadangkan histori tontonan',
      description: 'Cadangkan histori tontonan saya',
      icon: (
        <Icon name="cloud-upload" style={globalStyles.text} size={iconSize} />
      ),
      handler: backupHistory,
    },
    {
      title: 'Pulihkan histori tontonan',
      description: 'Pulihkan histori tontonan menggunakan kode backup',
      icon: <Icon name="history" style={globalStyles.text} size={iconSize} />,
      handler: () => restoreHistory(),
    },
    {
      title: 'Hapus histori tontonan',
      description: 'Menghapus semua histori tontonan kamu',
      icon: <Icon name="trash" style={{ color: 'red' }} size={iconSize} />,
      handler: deleteHistory,
    },
  ];

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
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

      <FlatList
        data={settingsData}
        keyExtractor={keyExtractor}
        renderItem={SettingList}
        ItemSeparatorComponent={
          <View
            style={{
              width: '100%',
              borderBottomWidth: 0.5,
              borderColor: 'white',
            }}
          />
        }
      />
    </Animated.View>
  );
}

function keyExtractor(item) {
  return item.title;
}

function SettingList({ item }) {
  const icon = item.icon;
  const title = item.title;
  const description = item.description;
  const handler = item.handler;
  const rightComponent = item.rightComponent;

  return (
    <TouchableOpacity style={styles.settingListContainer} onPress={handler}>
      <View style={styles.settingListIcon}>{icon}</View>
      <View style={styles.settingListText}>
        <Text style={[globalStyles.text, styles.settingListTextTitle]}>
          {title}
        </Text>
        <Text style={styles.settingListTextDescription}>{description}</Text>
      </View>
      <View style={styles.settingListRightComponent}>{rightComponent}</View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  settingListContainer: {
    flex: 1,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    alignContent: 'center',
  },
  settingListIcon: {
    alignSelf: 'center',
    padding: 5,
  },
  settingListText: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'column',
  },
  settingListTextTitle: {
    fontWeight: 'bold',
  },
  settingListTextDescription: {
    textAlign: 'center',
    color: 'gray',
  },
  settingListRightComponent: {
    alignItems: 'flex-end',
  },
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
  acceptRestoreModalButton: {
    backgroundColor: 'green',
    padding: 7,
    borderRadius: 3,
    marginTop: 10,
  },
});

export default Setting;
