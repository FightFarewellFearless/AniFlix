import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { EventEmitter } from 'expo';
import SQLiteKV from 'expo-sqlite/kv-store';
import { useCallback, useRef, useState } from 'react';
import defaultDatabase from '../misc/defaultDatabaseValue.json';
import { MMKV } from 'react-native-mmkv';

export type DataKey = keyof typeof defaultDatabase;

export type AppDatabase = {
  history: string;
  enableBatteryTimeInfo: string;
  enableNowPlayingNotification: string;
  watchLater: string;
  searchHistory: string;
  colorScheme: string;
};

const storage = new MMKV();

// TODO: Remove `hasMigratedFromAsyncStorage` after a while (when everyone has migrated)
export const hasMigratedFromAsyncStorage = storage.getBoolean(
  'IGNORE_DEFAULT_DB_hasMigratedFromAsyncStorage',
);

// TODO: Remove `hasMigratedFromAsyncStorage` after a while (when everyone has migrated)
export async function migrateFromAsyncStorage(): Promise<void> {
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

export const hasMigratedFromMMKV =
  SQLiteKV.getItemSync('IGNORE_DEFAULT_DB_hasMigratedFromMMKV') === 'true';
export async function migrateFromMMKV(): Promise<void> {
  const keys = storage.getAllKeys();

  for (const key of keys) {
    try {
      const value = storage.getString(key);

      if (value != null) {
        await SQLiteKV.setItem(key, value);
        storage.delete(key);
      }
    } catch (error) {
      throw error;
    }
  }

  SQLiteKV.setItemSync('IGNORE_DEFAULT_DB_hasMigratedFromMMKV', 'true');
}

export class DatabaseManager {
  static #event = new EventEmitter<Record<string, (value: string) => void>>();

  static async set(key: string, value: string) {
    await SQLiteKV.setItem(key, value);
    this.#event.emit('valueChanged', key);
  }
  static setSync(key: DataKey, value: string) {
    SQLiteKV.setItemSync(key, value);
    this.#event.emit('valueChanged', key);
  }
  static get(key: DataKey) {
    return SQLiteKV.getItem(key);
  }
  static getSync(key: DataKey) {
    return SQLiteKV.getItemSync(key);
  }
  static getAllKeys() {
    return SQLiteKV.getAllKeys();
  }
  static getAllKeysSync() {
    return SQLiteKV.getAllKeysSync();
  }
  static async delete(key: string) {
    await SQLiteKV.removeItem(key);
    this.#event.emit('valueChanged', key);
  }
  static deleteSync(key: DataKey) {
    SQLiteKV.removeItemSync(key);
    this.#event.emit('valueChanged', key);
  }

  static async getDataForBackup(): Promise<AppDatabase> {
    return {
      history: (await this.get('history'))!,
      enableBatteryTimeInfo: (await this.get('enableBatteryTimeInfo'))!,
      enableNowPlayingNotification: (await this.get('enableNowPlayingNotification'))!,
      watchLater: (await this.get('watchLater'))!,
      searchHistory: (await this.get('searchHistory'))!,
      colorScheme: (await this.get('colorScheme'))!,
    };
  }

  static listenOnValueChanged(callback: (key: string) => void) {
    return this.#event.addListener('valueChanged', callback);
  }
}

export function useKeyValueIfFocused(key: DataKey) {
  const [value, setValue] = useState(() => DatabaseManager.getSync(key));
  useFocusEffect(
    useCallback(() => {
      setValue(DatabaseManager.getSync(key));
      const listener = DatabaseManager.listenOnValueChanged(async changeKey => {
        if (key === changeKey) {
          setValue(await DatabaseManager.get(key));
        }
      });

      return () => listener.remove();
    }, [key]),
  );
  return value;
}
export function useModifiedKeyValueIfFocused<T>(
  key: DataKey,
  modifyValueFunc: (value: string) => T,
) {
  const value = useKeyValueIfFocused(key);
  const [modifiedValue, setModifiedValue] = useState(() => modifyValueFunc(value!));
  const modifyFuncRef = useRef(modifyValueFunc);
  modifyFuncRef.current = modifyValueFunc;
  useFocusEffect(
    useCallback(() => {
      setModifiedValue(modifyFuncRef.current(value!));
    }, [value]),
  );
  return modifiedValue;
}
