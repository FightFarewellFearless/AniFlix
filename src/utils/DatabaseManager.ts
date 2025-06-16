import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useRef, useState } from 'react';
import { MMKV } from 'react-native-mmkv';
import defaultDatabase from '../misc/defaultDatabaseValue.json';

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
      settings[typedKey] = storage.getString(key) ?? defaultDatabase[typedKey];
    }
  });
  const resolvedSettings = settings as RootState['settings'];
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
        settings[typedKey] = storage.getString(key) ?? defaultDatabase[typedKey];
      }
    });
    const resolvedSettings = settings as RootState['settings'];
    return modifierFunc
      ? modifierFunc(selector({ settings: resolvedSettings }))
      : selector({ settings: resolvedSettings });
  };
  const stableFetch = useRef(fetch);
  stableFetch.current = fetch;
  const [data, setData] = useState<T | string>(fetch);
  const oldData = useRef(data);
  useFocusEffect(
    useCallback(() => {
      if (fetchOnFocus) {
        const newValue = stableFetch.current();
        if (JSON.stringify(newValue) !== JSON.stringify(oldData.current)) {
          setData(newValue);
          oldData.current = newValue;
        }
      }
      const listener = storage.addOnValueChangedListener(() => {
        const newValue = stableFetch.current();
        setData(newValue);
        oldData.current = newValue;
      });
      return listener.remove;
    }, [fetchOnFocus]),
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

  const keys = await AsyncStorage.getAllKeys();

  for (const key of keys) {
    try {
      const value = await AsyncStorage.getItem(key);

      if (value != null) {
        storage.set(key, value);
        AsyncStorage.removeItem(key);
      }
    } catch (error) {
      throw error;
    }
  }

  storage.set('IGNORE_DEFAULT_DB_hasMigratedFromAsyncStorage', true);
}
