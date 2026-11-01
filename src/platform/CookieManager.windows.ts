export const windowsCookieManager = {
  get: async (url: string) => {
    return (globalThis as any).electronAPI.cookies.get(url);
  },
  set: async (url: string, cookies: Record<string, string>) => {
    for (const [name, value] of Object.entries(cookies)) {
      await (globalThis as any).electronAPI.cookies.set({ url, name, value });
    }
  },
  remove: async (url: string, name?: string) => {
    if (name) {
      await (globalThis as any).electronAPI.cookies.remove({ url, name });
    } else {
      // Remove all cookies for domain - would need to get all first then remove each
      const allCookies = await (globalThis as any).electronAPI.cookies.get(url);
      for (const cookieName of Object.keys(allCookies)) {
        await (globalThis as any).electronAPI.cookies.remove({ url, name: cookieName });
      }
    }
  },
  clear: async () => {
    // Clear all cookies - would need IPC to clear session cookies
    // For now, this is a no-op on Windows
    return;
  },
};

export const CookieManager = windowsCookieManager;
export default windowsCookieManager;
