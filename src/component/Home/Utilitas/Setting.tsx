import { useFocusEffect } from '@react-navigation/native';
import React, {
  ReactElement,
  useCallback,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Modal,
  PermissionsAndroid,
  Platform,
  StyleSheet,
  Switch,
  Text,
  View,
  useColorScheme
} from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/FontAwesome';
import useGlobalStyles, { darkText } from '../../../assets/style';

import { useDispatch } from 'react-redux';

import { StackScreenProps } from '@react-navigation/stack';
import useSelectorIfFocused from '../../../hooks/useSelectorIfFocused';
import defaultDatabaseValue from '../../../misc/defaultDatabaseValue.json';
import { setDatabase } from '../../../misc/reduxSlice';
import store, { AppDispatch, RootState } from '../../../misc/reduxStore';
import { HistoryJSON } from '../../../types/historyJSON';
import { UtilsStackNavigator } from '../../../types/navigation';
import { SetDatabaseTarget } from '../../../types/redux';
import watchLaterJSON from '../../../types/watchLaterJSON';

import { Buffer } from 'buffer/';
import moment from 'moment';
import * as DocumentPicker from 'expo-document-picker';
import RNFetchBlob from 'react-native-blob-util';
import { createDocument } from 'react-native-saf-x';

const defaultDatabaseValueKeys = Object.keys(defaultDatabaseValue);

interface SettingsData {
  title: string;
  description: string;
  icon: ReactElement<Icon>;
  rightComponent?: JSX.Element;
  handler: () => any;
}

type Props = StackScreenProps<UtilsStackNavigator, 'Setting'>;

function Setting(_props: Props) {
  const globalStyles = useGlobalStyles();
  const styles = useStyles();
  const enableBatteryTimeInfo = useSelectorIfFocused(
    (state: RootState) => state.settings.enableBatteryTimeInfo,
    true,
  );

  const dispatchSettings = useDispatch<AppDispatch>();

  const batteryTimeInfoSwitch = enableBatteryTimeInfo === 'true';
  const setBatteryTimeInfoSwitch = (value: string) => {
    dispatchSettings(
      setDatabase({
        target: 'enableBatteryTimeInfo',
        value,
      }),
    );
  };


  const [modalVisible, setModalVisible] = useState(false);
  const [modalText, setModalText] = useState('');

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

  const batteryTimeSwitchHandler = () => {
    const newValue = String(!batteryTimeInfoSwitch);
    setBatteryTimeInfoSwitch(newValue);
  };

  const backupData = useCallback(async () => {
    try {
      const isGranted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE);
      if (isGranted || Number(Platform.Version) >= 33) {
        backup();
      } else {
        const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE);
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          backup();
        } else {
          Alert.alert('Akses ditolak', 'Gagal mencadangkan data dikarenakan akses ke penyimpanan di tolak');
        }
      }
      async function backup() {
        const fileuri = 'AniFlix_backup_' + moment().format('YYYY-MM-DD_HH-mm-ss') + '.aniflix.txt';
        const data = Buffer.from(JSON.stringify(store.getState().settings), 'utf8').toString('base64');
        const backupData = await createDocument(data, { initialName: fileuri, mimeType: 'text/plain' });
        if( backupData ) {
          Alert.alert('Berhasil', `Data berhasil di backup!`);
        }
      }
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  }, []);

  const restoreData = useCallback(
    async () => {

      try {
        const doc = await DocumentPicker.getDocumentAsync({
          type: 'text/plain',
          copyToCacheDirectory: true,
        });

        if(!doc.assets) return;

        // RNFS.readFile(doc.fileCopyUri).then(console.log);
        const data = await RNFetchBlob.fs.readFile(doc.assets?.[0].uri, 'utf8');
        const backupDataJSON = JSON.parse(Buffer.from(data, 'base64').toString('utf8'));
        await RNFetchBlob.fs.unlink(doc.assets?.[0].uri);
        try {
          (
            Object.keys(backupDataJSON) as SetDatabaseTarget[]
          ).filter(value => defaultDatabaseValueKeys.includes(value)).forEach(value => {
            if (value === 'history' || value === 'watchLater') {
              restoreHistoryOrWatchLater(
                JSON.parse(backupDataJSON[value]),
                value,
              );
            } else {
              dispatchSettings(
                setDatabase({
                  target: value,
                  value: backupDataJSON[value],
                }),
              );
            }
          });
          Alert.alert(
            'Restore berhasil!',
            'Kamu berhasil kembali ke backup sebelumnya!',
          );
        } catch (e: any) {
          Alert.alert('Restore gagal!', e.message);
        }
      } catch (e: any) {
        const errMessage =
          e.message === 'Network Error'
            ? 'Permintaan gagal.\nPastikan kamu terhubung dengan internet'
            : 'Error tidak diketahui: ' + e.message;
        Alert.alert('Restore gagal!', errMessage);
      } finally {
        setModalVisible(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
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
            } catch (e: any) {
              Alert.alert('Gagal menghapus histori!', e.message);
            } finally {
              setModalVisible(false);
            }
          },
        },
      ],
    );
  }, [dispatchSettings]);

  const restoreHistoryOrWatchLater = (
    restoreDataFromBackup: (HistoryJSON | watchLaterJSON)[],
    target: 'history' | 'watchLater',
  ) => {
    const currentData: typeof restoreDataFromBackup = JSON.parse(
      store.getState().settings[target],
    );

    for (const result of restoreDataFromBackup) {
      const dataINDEX = currentData.findIndex(
        val => val.title === result.title,
      );

      if (dataINDEX >= 0) {
        if (currentData[dataINDEX].date > result.date) {
          continue;
        }
        currentData.splice(dataINDEX, 1);
      }
      currentData.push(result);
    }
    currentData.sort((a, b) => b.date - a.date);
    dispatchSettings(
      setDatabase({
        target,
        value: JSON.stringify(currentData),
      }),
    );
  };

  const iconSize = 18;

  const settingsData: SettingsData[] = [
    {
      title: 'Nyalakan informasi baterai dan waktu',
      description:
        'Beri tahu saya persentase baterai dan waktu, saat sedang menonton dalam mode fullscreen',
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
      title: 'Cadangkan data',
      description: 'Cadangkan seluruh data aplikasi',
      icon: (
        <Icon name="cloud-upload" style={globalStyles.text} size={iconSize} />
      ),
      handler: backupData,
    },
    {
      title: 'Pulihkan data',
      description: 'Pulihkan seluruh data aplikasi',
      icon: <Icon name="history" style={globalStyles.text} size={iconSize} />,
      handler: () => restoreData(),
    },
    {
      title: 'Hapus histori tontonan',
      description: 'Menghapus semua histori tontonan kamu',
      icon: <Icon name="trash" style={{ color: 'red' }} size={iconSize} />,
      handler: deleteHistory,
    },
  ];

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }], flex: 1 }}>
      <Modal transparent visible={modalVisible}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <ActivityIndicator size="large" />
            <Text style={globalStyles.text}>{modalText}</Text>
          </View>
        </View>
      </Modal>

      <FlatList
        data={settingsData}
        keyExtractor={keyExtractor}
        renderItem={SettingListComponent}
        extraData={styles}
        ItemSeparatorComponent={() => <ItemSeparator />}
      />
    </Animated.View>
  );
}

function ItemSeparator() {
  const colorScheme = useColorScheme();
  return (
    <View
      style={{
        width: '100%',
        borderBottomWidth: 0.5,
        borderColor: colorScheme === 'dark' ? 'white' : 'black',
      }}
    />
  );
}

function keyExtractor(item: SettingsData) {
  return item.title;
}

function SettingListComponent(props: any) {
  return <SettingList {...props} />;
}

function SettingList({ item }: { item: SettingsData }) {
  const globalStyles = useGlobalStyles();
  const styles = useStyles();
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

function useStyles() {
  const globalStyles = useGlobalStyles();
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    settingListContainer: {
      flex: 1,
      paddingVertical: 10,
      flexDirection: 'row',
      alignItems: 'center',
      alignContent: 'center',
    },
    settingListIcon: {
      padding: 5,
      width: '10%',
      maxWidth: 50,
      alignItems: 'center',
      borderRightWidth: 1,
      borderRightColor: colorScheme === 'dark' ? 'white' : 'black',
      marginRight: 5,
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
      backgroundColor: colorScheme === 'dark' ? '#aa6f00' : '#ce8600',
    },
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#0000008a',
    },
    modalContent: {
      flex: 0.15,
      backgroundColor: colorScheme === 'dark' ? '#202020' : '#e9e9e9',
      borderWidth: 1,
      borderColor: '#525252',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalRestoreButtonText: {
      fontWeight: 'bold',
      color: darkText,
    },
    acceptRestoreModalButton: {
      backgroundColor: '#005300',
      padding: 7,
      borderRadius: 3,
    },
    cancelRestoreModalButton: {
      backgroundColor: '#b40000',
      padding: 7,
      marginRight: 2,
      borderRadius: 3,
    },
    modalRestorePart: { flex: 1 },
    modalRestoreText: {
      fontWeight: 'bold',
      fontSize: 17,
    },
    dropdownStyle: {
      width: 100,
      backgroundColor: colorScheme === 'dark' ? '#2c2c2c' : '#e9e9e9',
      padding: 5,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: 'black',
    },
    dropdownContainerStyle: {
      width: 120,
    },
    dropdownItemTextStyle: {
      color: globalStyles.text.color,
      fontSize: 15,
      textAlign: 'center',
    },
    dropdownItemContainerStyle: {
      backgroundColor: colorScheme === 'dark' ? '#2c2c2c' : '#ccc9c9',
    },
    dropdownSelectedTextStyle: {
      color: globalStyles.text.color,
    },
  });
};

export default Setting;
