const memoryStore = new Map<string, string>();
const storage = typeof globalThis.localStorage === 'undefined' ? null : globalThis.localStorage;

const readValue = (key: string) =>
  storage?.getItem(`aniflix:${key}`) ?? memoryStore.get(key) ?? null;
const writeValue = (key: string, value: string) => {
  memoryStore.set(key, value);
  storage?.setItem(`aniflix:${key}`, value);
};
const removeValue = (key: string) => {
  memoryStore.delete(key);
  storage?.removeItem(`aniflix:${key}`);
};
const allKeys = () => {
  const keys = new Set<string>(memoryStore.keys());
  if (storage) {
    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index);
      if (key?.startsWith('aniflix:')) keys.add(key.slice('aniflix:'.length));
    }
  }
  return [...keys];
};

export const windowsDatabase = {
  setItem: (key: string, value: string) => {
    writeValue(key, value);
    return Promise.resolve();
  },
  setItemSync: (key: string, value: string) => {
    writeValue(key, value);
  },
  getItem: (key: string) => {
    return Promise.resolve(readValue(key));
  },
  getItemSync: (key: string) => {
    return readValue(key);
  },
  removeItem: (key: string) => {
    removeValue(key);
    return Promise.resolve();
  },
  removeItemSync: (key: string) => {
    removeValue(key);
  },
  getAllKeys: () => {
    return Promise.resolve(allKeys());
  },
  getAllKeysSync: () => {
    return allKeys();
  },
};

export const Database = windowsDatabase;
export default windowsDatabase;
