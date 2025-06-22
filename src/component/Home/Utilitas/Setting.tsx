import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { reloadAppAsync } from 'expo';
import { JSX, memo, ReactElement, useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Appearance,
  ColorSchemeName,
  FlatList,
  Modal,
  PermissionsAndroid,
  Platform,
  StyleSheet,
  Switch,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import useGlobalStyles, { darkText } from '../../../assets/style';
import defaultDatabaseValue from '../../../misc/defaultDatabaseValue.json';
import { SetDatabaseTarget } from '../../../types/databaseTarget';
import { HistoryJSON } from '../../../types/historyJSON';
import { UtilsStackNavigator } from '../../../types/navigation';
import watchLaterJSON from '../../../types/watchLaterJSON';

import { Dropdown, IDropdownRef } from '@pirles/react-native-element-dropdown';
import { Buffer } from 'buffer/';
import * as DocumentPicker from 'expo-document-picker';
import moment from 'moment';
import RNFetchBlob from 'react-native-blob-util';
import { createDocument } from 'react-native-saf-x';
import DialogManager from '../../../utils/dialogManager';
import { TouchableOpacity } from '../../misc/TouchableOpacityRNGH';
import {
  DatabaseManager,
  useKeyValueIfFocused,
  useModifiedKeyValueIfFocused,
} from '../../../utils/DatabaseManager';

const defaultDatabaseValueKeys = Object.keys(defaultDatabaseValue);

interface SettingsData {
  title: string;
  description: string;
  icon: ReactElement<Icon>;
  rightComponent?: JSX.Element;
  handler: () => any;
}

type Props = NativeStackScreenProps<UtilsStackNavigator, 'Setting'>;

function Setting(_props: Props) {
  const globalStyles = useGlobalStyles();
  const styles = useStyles();
  const enableBatteryTimeInfo = useKeyValueIfFocused('enableBatteryTimeInfo');

  const appTheme = useKeyValueIfFocused('colorScheme');
  const appThemeDropdown = useRef<IDropdownRef>(null);

  const batteryTimeInfoSwitch = enableBatteryTimeInfo === 'true';
  const batteryTimeSwitchHandler = useCallback(() => {
    const newValue = String(!batteryTimeInfoSwitch);
    DatabaseManager.set('enableBatteryTimeInfo', newValue);
  }, [batteryTimeInfoSwitch]);

  const nowPlayingNotificationSwitch = useModifiedKeyValueIfFocused(
    'enableNowPlayingNotification',
    res => res === 'true',
  );
  const nowPlayingNotificationSwitchHandler = useCallback(() => {
    const newValue = String(!nowPlayingNotificationSwitch);
    DatabaseManager.set('enableNowPlayingNotification', newValue);
  }, [nowPlayingNotificationSwitch]);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalText, setModalText] = useState('');

  const backupData = useCallback(async () => {
    try {
      const isGranted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      );
      if (isGranted || Number(Platform.Version) >= 33) {
        backup();
      } else {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          backup();
        } else {
          DialogManager.alert(
            'Akses ditolak',
            'Gagal mencadangkan data dikarenakan akses ke penyimpanan di tolak',
          );
        }
      }
      async function backup() {
        const fileuri = 'AniFlix_backup_' + moment().format('YYYY-MM-DD_HH-mm-ss') + '.aniflix.txt';
        const data = Buffer.from(
          JSON.stringify(await DatabaseManager.getDataForBackup()),
          'utf8',
        ).toString('base64');
        const backupFile = await createDocument(data, {
          initialName: fileuri,
          mimeType: 'text/plain',
        });
        if (backupFile) {
          DialogManager.alert('Berhasil', `Data berhasil di backup!`);
        }
      }
    } catch (e: any) {
      DialogManager.alert('Error', e.message);
    }
  }, []);

  const restoreHistoryOrWatchLater = useCallback(
    async (
      restoreDataFromBackup: (HistoryJSON | watchLaterJSON)[],
      target: 'history' | 'watchLater',
    ) => {
      const currentData: typeof restoreDataFromBackup = JSON.parse(
        (await DatabaseManager.getDataForBackup())[target],
      );

      for (const result of restoreDataFromBackup) {
        const dataINDEX = currentData.findIndex(val => val.title === result.title);

        if (dataINDEX >= 0) {
          if (currentData[dataINDEX].date > result.date) {
            continue;
          }
          currentData.splice(dataINDEX, 1);
        }
        currentData.push(result);
      }
      currentData.sort((a, b) => b.date - a.date);
      DatabaseManager.set(target, JSON.stringify(currentData));
    },
    [],
  );

  const restoreSearchHistory = useCallback(async (restoreData: string[]) => {
    const currentSearchHistory: string[] = JSON.parse(
      (await DatabaseManager.getDataForBackup()).searchHistory,
    );
    restoreData.forEach(val => {
      if (!currentSearchHistory.includes(val)) {
        currentSearchHistory.unshift(val);
      }
    });
    DatabaseManager.set('searchHistory', JSON.stringify(currentSearchHistory));
  }, []);

  const restoreData = useCallback(async () => {
    try {
      const doc = await DocumentPicker.getDocumentAsync({
        type: 'text/plain',
        copyToCacheDirectory: true,
      });

      if (!doc.assets) return;

      // RNFS.readFile(doc.fileCopyUri).then(console.log);
      const data = await RNFetchBlob.fs.readFile(doc.assets?.[0].uri, 'utf8');
      const backupDataJSON: typeof defaultDatabaseValue = JSON.parse(
        Buffer.from(data, 'base64').toString('utf8'),
      );
      await RNFetchBlob.fs.unlink(doc.assets?.[0].uri);
      try {
        (Object.keys(backupDataJSON) as SetDatabaseTarget[])
          .filter(value => defaultDatabaseValueKeys.includes(value))
          .forEach(value => {
            if (value === 'history' || value === 'watchLater') {
              restoreHistoryOrWatchLater(JSON.parse(backupDataJSON[value]), value);
            } else {
              const restoredData = backupDataJSON[value];
              if (value === 'colorScheme') {
                Appearance.setColorScheme(
                  restoredData === 'auto' ? undefined : (restoredData as ColorSchemeName),
                );
              } else if (value === 'searchHistory') {
                restoreSearchHistory(JSON.parse(restoredData));
              } else DatabaseManager.set(value, restoredData);
            }
          });
        DialogManager.alert('Restore berhasil!', 'Kamu berhasil kembali ke backup sebelumnya!');
      } catch (e: any) {
        DialogManager.alert('Restore gagal!', e.message);
      }
    } catch (e: any) {
      const errMessage =
        e.message === 'Network Error'
          ? 'Permintaan gagal.\nPastikan kamu terhubung dengan internet'
          : 'Error tidak diketahui: ' + e.message;
      DialogManager.alert('Restore gagal!', errMessage);
    } finally {
      setModalVisible(false);
    }
  }, [restoreHistoryOrWatchLater, restoreSearchHistory]);

  const deleteHistory = useCallback(() => {
    DialogManager.alert(
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
              DatabaseManager.set('history', '[]');
              DialogManager.alert('Histori dihapus', 'Histori tontonan kamu sudah di hapus');
            } catch (e: any) {
              DialogManager.alert('Gagal menghapus histori!', e.message);
            } finally {
              setModalVisible(false);
            }
          },
        },
      ],
    );
  }, []);

  const iconSize = 18;

  const settingsData: SettingsData[] = [
    {
      title: 'Tema aplikasi',
      description: 'Beralih ke tema gelap atau terang',
      icon: <Icon name="paint-brush" style={globalStyles.text} size={iconSize} />,
      rightComponent: (
        <Dropdown
          data={DROPDOWN_THEME_DATA}
          onChange={data => {
            if (data.value === 'light' || data.value === 'dark') {
              Appearance.setColorScheme(data.value);
            } else if (data.value === 'auto') {
              Appearance.setColorScheme(undefined);
            }
            DatabaseManager.set('colorScheme', data.value);
          }}
          ref={appThemeDropdown}
          value={appTheme}
          labelField={'label'}
          valueField={'value'}
          maxHeight={300}
          style={styles.dropdownStyle}
          containerStyle={{
            maxWidth: '50%',
          }}
          itemTextStyle={{
            color: globalStyles.text.color,
            fontSize: 15,
            textAlign: 'center',
          }}
          itemContainerStyle={styles.dropdownItemContainerStyle}
          activeColor="#0f8eb4"
          selectedTextStyle={styles.dropdownSelectedTextStyle}
          placeholderStyle={{ color: globalStyles.text.color }}
        />
      ),
      handler: () => {
        appThemeDropdown.current?.open();
      },
    },
    {
      title: 'Nyalakan informasi baterai dan waktu saat menonton',
      description:
        'Beri tahu saya persentase baterai dan waktu, saat sedang menonton dalam mode fullscreen',
      icon: <Icon name="battery" style={globalStyles.text} size={iconSize} />,
      rightComponent: (
        <Switch value={batteryTimeInfoSwitch} onValueChange={batteryTimeSwitchHandler} />
      ),
      handler: batteryTimeSwitchHandler,
    },
    {
      title: 'Tampilkan notifikasi saat menonton',
      description: 'Tampilkan notifkasi "now playing" saat sedang menonton',
      icon: <Icon name="bell" style={globalStyles.text} size={iconSize} />,
      rightComponent: (
        <Switch
          value={nowPlayingNotificationSwitch}
          onValueChange={nowPlayingNotificationSwitchHandler}
        />
      ),
      handler: nowPlayingNotificationSwitchHandler,
    },
    {
      title: 'Cadangkan data',
      description: 'Cadangkan seluruh data aplikasi',
      icon: <Icon name="cloud-upload" style={globalStyles.text} size={iconSize} />,
      handler: backupData,
    },
    {
      title: 'Pulihkan data',
      description: 'Pulihkan seluruh data aplikasi',
      icon: <Icon name="history" style={globalStyles.text} size={iconSize} />,
      handler: restoreData,
    },
    {
      title: 'Hapus histori tontonan',
      description: 'Menghapus semua histori tontonan kamu',
      icon: <Icon name="trash" style={{ color: 'red' }} size={iconSize} />,
      handler: deleteHistory,
    },
    {
      title: 'Reload aplikasi',
      description: 'Muat ulang aplikasi',
      icon: <Icon name="refresh" style={globalStyles.text} size={iconSize} />,
      handler: () => {
        DialogManager.alert('Reload aplikasi', 'Aplikasi akan di muat ulang', [
          {
            text: 'Batal',
          },
          {
            text: 'Lanjut',
            onPress: () => {
              reloadAppAsync('setting.restart');
            },
          },
        ]);
      },
    },
  ];

  return (
    <View style={{ flex: 1 }}>
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
        renderItem={({ item }) => {
          return <SettingList item={item} />;
        }}
        extraData={styles}
        ItemSeparatorComponent={() => <ItemSeparator />}
      />
    </View>
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
        <Text style={[globalStyles.text, styles.settingListTextTitle]}>{title}</Text>
        <Text style={styles.settingListTextDescription}>{description}</Text>
      </View>
      <View style={styles.settingListRightComponent}>{rightComponent}</View>
    </TouchableOpacity>
  );
}

function useStyles() {
  const globalStyles = useGlobalStyles();
  const colorScheme = useColorScheme();
  return useMemo(
    () =>
      StyleSheet.create({
        dropdownStyle: {
          width: 150,
          backgroundColor: colorScheme === 'dark' ? '#2c2c2c' : '#e9e9e9',
          padding: 5,
          borderRadius: 4,
          borderWidth: 1,
          borderColor: 'black',
        },
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
          textAlign: 'center',
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
        dropdownContainerStyle: {
          width: 120,
        },
        dropdownItemTextStyle: {
          color: globalStyles.text.color,
          fontSize: 15,
          textAlign: 'center',
        },
        dropdownItemContainerStyle: {
          borderColor: colorScheme !== 'dark' ? '#2c2c2c' : '#ccc9c9',
          borderWidth: StyleSheet.hairlineWidth,
          backgroundColor: colorScheme === 'dark' ? '#2c2c2c' : '#ccc9c9',
        },
        dropdownSelectedTextStyle: {
          color: globalStyles.text.color,
          textAlign: 'center',
        },
      }),
    [colorScheme, globalStyles.text.color],
  );
}

const DROPDOWN_THEME_DATA = [
  { label: 'Mengikuti sistem', value: 'auto' },
  { label: 'Tema terang', value: 'light' },
  { label: 'Tema gelap', value: 'dark' },
];

export default memo(Setting);
