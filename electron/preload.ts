import { contextBridge, ipcRenderer } from 'electron';

// Define the API type
export interface ElectronAPI {
  // Dialogs
  saveFile: (options: any) => Promise<any>;
  openFile: (options: any) => Promise<any>;

  // Shell
  openExternal: (urlString: string) => Promise<boolean>;

  // Notifications (replaces ToastAndroid)
  showNotification: (options: { title: string; body?: string }) => Promise<{ shown: boolean }>;

  // App paths
  getAppPath: (name: string) => Promise<string>;

  // HLS proxy
  hlsProxy: (data: {
    url: string;
    headers?: Record<string, string>;
    range?: string;
  }) => Promise<any>;

  filmRequest: (data: {
    url: string;
    method: string;
    headers?: Record<string, string>;
    body?: string;
  }) => Promise<{ status: number; body: string }>;

  // Media request headers (`Referer`, `Origin`, `User-Agent`) for <video> and
  // hls.js, which cannot set browser controlled headers themselves.
  media: {
    setHeaders: (data: {
      url: string;
      headers?: Record<string, string>;
    }) => Promise<{ success: boolean }>;
    clearHeaders: () => Promise<{ success: boolean }>;
  };

  // Cookies (replaces @preeternal/react-native-cookie-manager)
  cookies: {
    get: (url: string) => Promise<Record<string, string>>;
    set: (data: { url: string; name: string; value: string }) => Promise<{ success: boolean }>;
    remove: (data: { url: string; name: string }) => Promise<{ success: boolean }>;
  };

  // Power save blocker (replaces expo-keep-awake)
  power: {
    startBlocker: () => Promise<{ id: number }>;
    stopBlocker: (id: number) => Promise<{ success: boolean }>;
  };

  // Deep link listener
  onDeepLink: (callback: (url: string) => void) => () => void;

  // Update listener
  onUpdateAvailable: (callback: () => void) => () => void;
  onUpdateDownloaded: (callback: (data: any) => void) => () => void;

  // Environment
  isWindows: boolean;
  platform: string;

  // <webview> support for the react-native-webview shim
  webview: {
    create: (payload: {
      uri?: string;
      html?: string;
      baseUrl?: string;
      userAgent?: string;
      headers?: Record<string, string>;
      injectedJavaScriptBeforeContentLoaded?: string;
    }) => Promise<{ id: string; url: string; preload: string; partition: string }>;
    dispose: (id: string) => Promise<{ success: boolean }>;
  };
}

// Expose protected API to renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Dialogs
  saveFile: (options: any) => ipcRenderer.invoke('dialog:saveFile', options),
  openFile: (options: any) => ipcRenderer.invoke('dialog:openFile', options),

  // Shell
  openExternal: (urlString: string) => ipcRenderer.invoke('shell:openExternal', urlString),

  // Notifications (replaces ToastAndroid)
  showNotification: (options: { title: string; body?: string }) =>
    ipcRenderer.invoke('notification:show', options),

  // App paths
  getAppPath: (name: string) => ipcRenderer.invoke('app:getPath', name),

  // HLS proxy
  hlsProxy: (data: { url: string; headers?: Record<string, string>; range?: string }) =>
    ipcRenderer.invoke('hls:proxy', data),

  filmRequest: (data: {
    url: string;
    method: string;
    headers?: Record<string, string>;
    body?: string;
  }) => ipcRenderer.invoke('film:request', data),

  // Media request headers
  media: {
    setHeaders: (data: { url: string; headers?: Record<string, string> }) =>
      ipcRenderer.invoke('media:setHeaders', data),
    clearHeaders: () => ipcRenderer.invoke('media:clearHeaders'),
  },

  // Cookies (replaces @preeternal/react-native-cookie-manager)
  cookies: {
    get: (url: string) => ipcRenderer.invoke('cookies:get', url),
    set: (data: { url: string; name: string; value: string }) =>
      ipcRenderer.invoke('cookies:set', data),
    remove: (data: { url: string; name: string }) => ipcRenderer.invoke('cookies:remove', data),
  },

  // Power save blocker (replaces expo-keep-awake)
  power: {
    startBlocker: () => ipcRenderer.invoke('power:startBlocker'),
    stopBlocker: (id: number) => ipcRenderer.invoke('power:stopBlocker', id),
  },

  // Deep link listener
  onDeepLink: (callback: (url: string) => void) => {
    ipcRenderer.on('deep-link-received', (_, url: string) => callback(url));
    return () => ipcRenderer.removeAllListeners('deep-link-received');
  },

  // Update listener
  onUpdateAvailable: (callback: () => void) => {
    ipcRenderer.on('update-available', () => callback());
    return () => ipcRenderer.removeAllListeners('update-available');
  },
  onUpdateDownloaded: (callback: (data: any) => void) => {
    ipcRenderer.on('update-downloaded', (_, data: any) => callback(data));
    return () => ipcRenderer.removeAllListeners('update-downloaded');
  },

  // Environment
  isWindows: true,
  platform: 'win32',

  // <webview> support for the react-native-webview shim
  webview: {
    create: (payload: {
      uri?: string;
      html?: string;
      baseUrl?: string;
      userAgent?: string;
      headers?: Record<string, string>;
      injectedJavaScriptBeforeContentLoaded?: string;
    }) => ipcRenderer.invoke('webview:create', payload),
    dispose: (id: string) => ipcRenderer.invoke('webview:dispose', id),
  },
}) as unknown as ElectronAPI;

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
