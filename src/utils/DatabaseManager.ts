import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useRef, useState } from 'react';
import { MMKV } from 'react-native-mmkv';

export type RootState = {
  settings: {
    history: string;
    enableBatteryTimeInfo: string;
    enableNowPlayingNotification: string;
    watchLater: string;
    searchHistory: string;
    'copilot.watchLater_firstTime': string;
    colorScheme: string;
  };
};

export const storage = new MMKV();

export function getState(): RootState {
  const settings: Record<keyof RootState['settings'], string | undefined> = {
    history: undefined,
    enableBatteryTimeInfo: undefined,
    enableNowPlayingNotification: undefined,
    watchLater: undefined,
    searchHistory: undefined,
    'copilot.watchLater_firstTime': undefined,
    colorScheme: undefined,
  };
  storage.getAllKeys().forEach(key => {
    if (Object.keys(settings).includes(key)) {
      const typedKey = key as keyof RootState['settings'];
      settings[typedKey] = storage.getString(key);
    }
  });
  const resolvedSettings = Object.fromEntries(
    Object.entries(settings).map(([key, value]) => [key, value ?? '']),
  ) as RootState['settings'];
  return { settings: resolvedSettings };
}

export function useSelectorIfFocused(
  selector: (state: RootState) => string,
  fetchOnFocus?: boolean,
): string;
export function useSelectorIfFocused<T = string>(
  selector: (state: RootState) => string,
  fetchOnFocus?: boolean,
  modifierFunc?: (result: string) => T,
): T;
export function useSelectorIfFocused<T = string>(
  selector: (state: RootState) => string,
  fetchOnFocus?: boolean,
  modifierFunc?: (result: string) => T,
) {
  const fetch = () => {
    const settings: Record<keyof RootState['settings'], string | undefined> = {
      history: undefined,
      enableBatteryTimeInfo: undefined,
      enableNowPlayingNotification: undefined,
      watchLater: undefined,
      searchHistory: undefined,
      'copilot.watchLater_firstTime': undefined,
      colorScheme: undefined,
    };
    storage.getAllKeys().forEach(key => {
      if (Object.keys(settings).includes(key)) {
        const typedKey = key as keyof RootState['settings'];
        settings[typedKey] = storage.getString(key);
      }
    });
    const resolvedSettings = Object.fromEntries(
      Object.entries(settings).map(([key, value]) => [key, value ?? '']),
    ) as RootState['settings'];
    return modifierFunc
      ? modifierFunc(selector({ settings: resolvedSettings }))
      : selector({ settings: resolvedSettings });
  };
  const [data, setData] = useState<T | string>(fetch);
  const oldData = useRef(data);
  useFocusEffect(
    useCallback(() => {
      if (fetchOnFocus) {
        const newValue = fetch();
        if (JSON.stringify(newValue) !== JSON.stringify(oldData.current)) {
          setData(newValue);
          oldData.current = newValue;
        }
      }
      const listener = storage.addOnValueChangedListener(() => {
        const newValue = fetch();
        setData(newValue);
        oldData.current = newValue;
      });
      return listener.remove;
      // eslint-disable-next-line react-compiler/react-compiler
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );
  return data;
}

// TODO: Remove `hasMigratedFromAsyncStorage` after a while (when everyone has migrated)
export const hasMigratedFromAsyncStorage = storage.getBoolean(
  'IGNORE_DEFAULT_DB_hasMigratedFromAsyncStorage',
);

// TODO: Remove `hasMigratedFromAsyncStorage` after a while (when everyone has migrated)
export async function migrateFromAsyncStorage(): Promise<void> {
  console.log('Migrating from AsyncStorage -> MMKV...');
  const start = global.performance.now();

  const keys = await AsyncStorage.getAllKeys();

  for (const key of keys) {
    try {
      const value = await AsyncStorage.getItem(key);

      if (value != null) {
        storage.set(key, value);
        AsyncStorage.removeItem(key);
      }
    } catch (error) {
      console.error(`Failed to migrate key "${key}" from AsyncStorage to MMKV!`, error);
      throw error;
    }
  }

  storage.set('IGNORE_DEFAULT_DB_hasMigratedFromAsyncStorage', true);

  const end = global.performance.now();
  console.log(`Migrated from AsyncStorage -> MMKV in ${end - start}ms!`);
}
