import { useFocusEffect } from '@react-navigation/native';
import { EventEmitter } from 'expo';
import { useCallback, useRef, useState } from 'react';

import { Database } from '@/platform/DatabaseManager';
import { HistoryItemKey, SetDatabaseTarget } from '@/types/databaseTarget';
import { HistoryJSON } from '@/types/historyJSON';

export type DataKey = SetDatabaseTarget | HistoryItemKey;

export type AppDatabase = Omit<
  Record<SetDatabaseTarget | 'history', string>,
  'historyKeyCollectionsOrder'
>;

export class DatabaseManager {
  static #event = new EventEmitter<Record<string, (value: string) => void>>();

  static async set(key: string, value: string) {
    await Database.setItem(key, value);
    this.#event.emit('valueChanged', key);
  }
  static setSync(key: DataKey, value: string) {
    Database.setItemSync(key, value);
    this.#event.emit('valueChanged', key);
  }
  static get(key: DataKey) {
    return Database.getItem(key);
  }
  static getSync(key: DataKey) {
    return Database.getItemSync(key);
  }
  static getAllKeys() {
    return Database.getAllKeys();
  }
  static getAllKeysSync() {
    return Database.getAllKeysSync();
  }
  static async delete(key: string) {
    await Database.removeItem(key);
    this.#event.emit('valueChanged', key);
  }
  static deleteSync(key: DataKey) {
    Database.removeItemSync(key);
    this.#event.emit('valueChanged', key);
  }

  static async getDataForBackup(): Promise<AppDatabase> {
    const historyKeyOrder: HistoryItemKey[] = JSON.parse(
      (await this.get('historyKeyCollectionsOrder')) ?? '[]',
    );
    const history = await toOldHistoryStructure(historyKeyOrder);

    return {
      audioMixingMode: (await this.get('audioMixingMode'))!,
      colorScheme: (await this.get('colorScheme'))!,
      enableBatteryTimeInfo: (await this.get('enableBatteryTimeInfo'))!,
      enableNowPlayingNotification: (await this.get('enableNowPlayingNotification'))!,
      history: JSON.stringify(history),
      searchHistory: (await this.get('searchHistory'))!,
      watchLater: (await this.get('watchLater'))!,
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

export function toNewHistoryStructure(oldHistory: HistoryJSON[]): {
  keyCollectionsOrder: HistoryItemKey[];
  newHistory: { key: HistoryItemKey; data: HistoryJSON }[];
} {
  return {
    keyCollectionsOrder: oldHistory.map(
      x =>
        `historyItem:${x.title.trim()}:${x.isComics ?? 'false'}:${x.isMovie ?? 'false'}:${x.isNovel ?? 'false'}` as const,
    ),
    newHistory: oldHistory.map(x => ({
      key: `historyItem:${x.title.trim()}:${x.isComics ?? 'false'}:${x.isMovie ?? 'false'}:${x.isNovel ?? 'false'}`,
      data: x,
    })),
  };
}
export async function toOldHistoryStructure(keyCollectionsOrder: HistoryItemKey[]) {
  const history: HistoryJSON[] = [];
  for (const key of keyCollectionsOrder) {
    const data = await DatabaseManager.get(key);
    if (!data) continue;
    const dataJson = JSON.parse(data) as HistoryJSON;
    history.push(dataJson);
  }
  return history;
}
export async function DANGER_MIGRATE_OLD_HISTORY(oldHistoryString: HistoryJSON[]) {
  const newHistory = toNewHistoryStructure(oldHistoryString);
  await DatabaseManager.set(
    'historyKeyCollectionsOrder',
    JSON.stringify(newHistory.keyCollectionsOrder),
  );
  for (const data of newHistory.newHistory) {
    await DatabaseManager.set(data.key, JSON.stringify(data.data));
  }
}
