import SQLiteKV from 'expo-sqlite/kv-store';

export const androidDatabase = {
  setItem: (key: string, value: string) => SQLiteKV.setItem(key, value),
  setItemSync: (key: string, value: string) => SQLiteKV.setItemSync(key, value),
  getItem: (key: string) => SQLiteKV.getItem(key),
  getItemSync: (key: string) => SQLiteKV.getItemSync(key),
  removeItem: (key: string) => SQLiteKV.removeItem(key),
  removeItemSync: (key: string) => SQLiteKV.removeItemSync(key),
  getAllKeys: () => SQLiteKV.getAllKeys(),
  getAllKeysSync: () => SQLiteKV.getAllKeysSync(),
};

export const Database = androidDatabase;
export const DatabaseManager = androidDatabase;
export default androidDatabase;
