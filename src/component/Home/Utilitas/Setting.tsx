import { Dropdown, IDropdownRef } from '@pirles/react-native-element-dropdown';
import Icon, { FontAwesomeIconName } from '@react-native-vector-icons/fontawesome';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Buffer } from 'buffer/';
import { reloadAppAsync } from 'expo';
import * as DocumentPicker from 'expo-document-picker';
import { AudioMixingMode } from 'expo-video';
import moment from 'moment';
import { JSX, memo, useCallback, useRef, useState } from 'react';
import {
  Appearance,
  ColorSchemeName,
  PermissionsAndroid,
  Platform,
  ScrollView,
  View,
} from 'react-native';
import RNFetchBlob from 'react-native-blob-util';
import {
  ActivityIndicator,
  Divider,
  List,
  Modal,
  Portal,
  Surface,
  Switch,
  TouchableRipple,
  useTheme,
} from 'react-native-paper';
import { useSharedValue } from 'react-native-reanimated';
import { createDocument } from 'react-native-saf-x';
import defaultDatabaseValue from '../../../misc/defaultDatabaseValue.json';
import { HistoryItemKey } from '../../../types/databaseTarget';
import { HistoryJSON } from '../../../types/historyJSON';
import { UtilsStackNavigator } from '../../../types/navigation';
import watchLaterJSON from '../../../types/watchLaterJSON';
import {
  DANGER_MIGRATE_OLD_HISTORY,
  DatabaseManager,
  useKeyValueIfFocused,
  useModifiedKeyValueIfFocused,
} from '../../../utils/DatabaseManager';
import DialogManager from '../../../utils/dialogManager';
import ReText from '../../misc/ReText';
import { HistoryDatabaseCache } from '../Saya/History';

const defaultDatabaseValueKeys = Object.keys(defaultDatabaseValue);

type BackupJSON = Omit<typeof defaultDatabaseValue, 'historyKeyCollectionsOrder'> & {
  history: string;
};

interface SettingsData {
  title: string;
  description: string;
  iconName: FontAwesomeIconName;
  iconColor?: string;
  rightComponent?: JSX.Element;
  handler: () => any;
}

type Props = NativeStackScreenProps<UtilsStackNavigator, 'Setting'>;

function Setting(_props: Props) {
  const theme = useTheme();
  const enableBatteryTimeInfo = useKeyValueIfFocused('enableBatteryTimeInfo');

  const appTheme = useKeyValueIfFocused('colorScheme');
  const appThemeDropdown = useRef<IDropdownRef>(null);

  const audioMixingMode = useKeyValueIfFocused('audioMixingMode');
  const AMMDropdown = useRef<IDropdownRef>(null);

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
  const modalText = useSharedValue('');

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
        modalText.set('Membuat Backup Data...');
        setModalVisible(true);
        const data = Buffer.from(
          JSON.stringify(await DatabaseManager.getDataForBackup()),
          'utf8',
        ).toString('base64');
        setModalVisible(false);
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
  }, [modalText]);

  const restoreHistoryOrWatchLater = useCallback(
    async (
      restoreDataFromBackup: (HistoryJSON | watchLaterJSON)[],
      target: 'history' | 'watchLater',
    ) => {
      const currentData: typeof restoreDataFromBackup = JSON.parse(
        (await DatabaseManager.getDataForBackup())[target],
      );

      for (const result of restoreDataFromBackup) {
        const dataINDEX = currentData.findIndex(
          val =>
            val.title?.trim() === result.title?.trim() &&
            val.isComics === result.isComics &&
            val.isMovie === result.isMovie,
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
      if (target === 'history') {
        await DANGER_MIGRATE_OLD_HISTORY(currentData as HistoryJSON[]);
      } else {
        await DatabaseManager.set('watchLater', JSON.stringify(currentData));
      }
    },
    [],
  );

  const restoreSearchHistory = useCallback(async (restoreData: string[]) => {
    const currentSearchHistory: string[] = JSON.parse(
      (await DatabaseManager.getDataForBackup()).searchHistory,
    );
    restoreData.reverse().forEach(val => {
      if (!currentSearchHistory.includes(val)) {
        currentSearchHistory.unshift(val);
      }
    });
    await DatabaseManager.set('searchHistory', JSON.stringify(currentSearchHistory));
  }, []);

  const restoreData = useCallback(async () => {
    try {
      const doc = await DocumentPicker.getDocumentAsync({
        type: 'text/plain',
        copyToCacheDirectory: true,
      });

      if (!doc.assets) return;

      const data = await RNFetchBlob.fs.readFile(doc.assets?.[0].uri, 'utf8');
      const backupDataJSON: BackupJSON = JSON.parse(Buffer.from(data, 'base64').toString('utf8'));
      await RNFetchBlob.fs.unlink(doc.assets?.[0].uri);
      modalText.set('Memulihkan data kamu mohon tunggu...');
      setModalVisible(true);
      try {
        for (const value of Object.keys(backupDataJSON) as (keyof BackupJSON)[]) {
          if (defaultDatabaseValueKeys.includes(value) || value === 'history') {
            if (value === 'history' || value === 'watchLater') {
              modalText.set('Memulihkan daftar ' + value);
              await restoreHistoryOrWatchLater(JSON.parse(backupDataJSON[value]), value);
            } else {
              const restoredData = backupDataJSON[value];
              if (value === 'colorScheme') {
                modalText.set('Memulihkan tema aplikasi');
                Appearance.setColorScheme(
                  restoredData === 'auto' ? undefined : (restoredData as ColorSchemeName),
                );
              } else if (value === 'searchHistory') {
                modalText.set('Memulihkan histori pencarian');
                await restoreSearchHistory(JSON.parse(restoredData));
              } else {
                modalText.set('Memulihkan ' + value);
                await DatabaseManager.set(value, restoredData);
              }
            }
          }
        }
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
  }, [modalText, restoreHistoryOrWatchLater, restoreSearchHistory]);

  const clearHistory = useCallback(() => {
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
            modalText.set('Menghapus histori tontonan kamu...');
            setModalVisible(true);
            await new Promise(res => setTimeout(res, 1));
            try {
              const keyOrder: HistoryItemKey[] = JSON.parse(
                DatabaseManager.getSync('historyKeyCollectionsOrder') ?? '[]',
              );
              for (const key of keyOrder) {
                modalText.set(`Menghapus\n${key.split(':').slice(1, -2).join(':')}`);
                await DatabaseManager.delete(key);
              }
              DatabaseManager.set('historyKeyCollectionsOrder', '[]');
              HistoryDatabaseCache.clear();
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
  }, [modalText]);

  const dropdownStyles = {
    style: {
      width: 140,
      backgroundColor: theme.colors.elevation.level2,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      borderWidth: 0,
    },
    containerStyle: {
      borderRadius: 8,
      backgroundColor: theme.colors.elevation.level2,
      borderWidth: 0,
    },
    itemTextStyle: {
      color: theme.colors.onSurface,
      fontSize: 13,
    },
    itemContainerStyle: {
      backgroundColor: theme.colors.elevation.level2,
    },
    selectedTextStyle: {
      color: theme.colors.onSurface,
      fontSize: 13,
    },
  };

  const settingsData: SettingsData[] = [
    {
      title: 'Tema aplikasi',
      description: 'Beralih ke tema gelap atau terang',
      iconName: 'paint-brush',
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
          activeColor={theme.colors.primaryContainer}
          placeholderStyle={{ color: theme.colors.onSurfaceVariant }}
          {...dropdownStyles}
        />
      ),
      handler: () => {
        appThemeDropdown.current?.open();
      },
    },
    {
      title: 'Mode mixing audio',
      description: 'Tentukan perilaku audio saat aplikasi lain memutar suara',
      iconName: 'music',
      rightComponent: (
        <Dropdown
          data={DROPDOWN_AUDIOMIXING_DATA}
          onChange={data => {
            DatabaseManager.set('audioMixingMode', data.value);
          }}
          ref={AMMDropdown}
          value={audioMixingMode}
          labelField={'label'}
          valueField={'value'}
          maxHeight={300}
          activeColor={theme.colors.primaryContainer}
          placeholderStyle={{ color: theme.colors.onSurfaceVariant }}
          {...dropdownStyles}
        />
      ),
      handler: () => {
        AMMDropdown.current?.open();
      },
    },
    {
      title: 'Info baterai & waktu',
      description: 'Tampilkan persentase baterai dan jam saat mode layar penuh',
      iconName: 'battery-3',
      rightComponent: (
        <Switch value={batteryTimeInfoSwitch} onValueChange={batteryTimeSwitchHandler} />
      ),
      handler: batteryTimeSwitchHandler,
    },
    {
      title: 'Notifikasi & PiP',
      description: 'Aktifkan notifikasi "Now Playing" dan fitur Picture-in-Picture',
      iconName: 'bell',
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
      description: 'Simpan seluruh data aplikasi ke file',
      iconName: 'cloud-upload',
      handler: backupData,
    },
    {
      title: 'Pulihkan data',
      description: 'Kembalikan data aplikasi dari file backup',
      iconName: 'history',
      handler: restoreData,
    },
    {
      title: 'Hapus histori',
      description: 'Hapus permanen semua riwayat tontonan',
      iconName: 'trash',
      iconColor: theme.colors.error,
      handler: clearHistory,
    },
    {
      title: 'Muat ulang',
      description: 'Restart aplikasi secara manual',
      iconName: 'refresh',
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
  ] as const;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Portal>
        <Modal
          visible={modalVisible}
          contentContainerStyle={{
            backgroundColor: theme.colors.surface,
            margin: 20,
            padding: 24,
            borderRadius: 16,
            alignItems: 'center',
          }}>
          <ActivityIndicator size={24} style={{ marginBottom: 16 }} />
          <ReText
            style={{
              color: theme.colors.onSurface,
              textAlign: 'center',
              fontWeight: 'bold',
            }}
            text={modalText}
          />
        </Modal>
      </Portal>

      <ScrollView contentContainerStyle={{ paddingVertical: 8 }}>
        {settingsData.map((item, index) => (
          <Surface
            key={item.title}
            elevation={0}
            style={{ backgroundColor: theme.colors.background }}>
            <TouchableRipple
              onPress={item.handler}
              rippleColor={theme.colors.primaryContainer}
              background={{ color: theme.colors.primaryContainer, foreground: true }}>
              <View>
                <List.Item
                  title={item.title}
                  description={item.description}
                  titleStyle={{
                    fontSize: 16,
                    fontWeight: '500',
                    color: item.iconColor || theme.colors.onSurface,
                  }}
                  descriptionStyle={{
                    color: theme.colors.onSurfaceVariant,
                    fontSize: 12,
                    marginTop: 4,
                  }}
                  descriptionNumberOfLines={3}
                  left={() => (
                    <View style={{ justifyContent: 'center', paddingLeft: 8, paddingRight: 8 }}>
                      <Icon
                        name={item.iconName}
                        size={20}
                        color={item.iconColor || theme.colors.primary}
                      />
                    </View>
                  )}
                  right={() =>
                    item.rightComponent ? (
                      <View style={{ justifyContent: 'center', paddingRight: 8 }}>
                        {item.rightComponent}
                      </View>
                    ) : null
                  }
                />
                {index < settingsData.length - 1 && <Divider style={{ marginLeft: 56 }} />}
              </View>
            </TouchableRipple>
          </Surface>
        ))}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const DROPDOWN_THEME_DATA = [
  { label: 'Sistem', value: 'auto' },
  { label: 'Terang', value: 'light' },
  { label: 'Gelap', value: 'dark' },
];

const DROPDOWN_AUDIOMIXING_DATA: { label: string; value: AudioMixingMode }[] = [
  { label: 'Otomatis', value: 'auto' },
  { label: 'Mute Lain', value: 'doNotMix' },
  { label: 'Campur', value: 'mixWithOthers' },
  { label: 'Kecilkan Lain', value: 'duckOthers' },
];

export default memo(Setting);
