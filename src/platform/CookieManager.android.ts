import NativeCookieManager from '@preeternal/react-native-cookie-manager';

export const androidCookieManager = {
  get: async (url: string) => {
    return NativeCookieManager.get(url);
  },
  set: async (url: string, cookies: Record<string, string>) => {
    for (const [name, value] of Object.entries(cookies)) {
      await NativeCookieManager.set(url, { name, value } as any);
    }
  },
  remove: async (url: string, name?: string) => {
    if (name) {
      await NativeCookieManager.clearByName(url, name);
    } else {
      await NativeCookieManager.clearAll();
    }
  },
  clear: async () => {
    await NativeCookieManager.clearAll();
  },
};

export const CookieManager = androidCookieManager;
export default androidCookieManager;
