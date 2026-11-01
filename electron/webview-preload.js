import { contextBridge, ipcRenderer } from 'electron';

/**
 * Preload script that is injected into every Electron `<webview>` guest.
 *
 * It exposes the same `window.ReactNativeWebView` bridge that the native
 * `react-native-webview` module provides, so the pages that are rendered
 * inside the webview (comic reader, novel reader, video player, ...) can
 * talk to the React Native application with `window.ReactNativeWebView.postMessage(...)`.
 *
 * `injectedJavaScriptBeforeContentLoaded` is passed in by the host through the
 * `aniflix-webview-preload` query parameter of the preload URL. It is
 * evaluated before any page script runs, which is required for the
 * XMLHttpRequest / fetch interception used by the session fetchers.
 */
const bridge = {
  postMessage: (data: unknown) => {
    ipcRenderer.sendToHost('message', data);
  },
};

try {
  contextBridge.exposeInMainWorld('ReactNativeWebView', bridge);
} catch {
  // contextIsolation disabled - fall back to a plain global
  (window as any).ReactNativeWebView = bridge;
}

// Execute the host provided "before content loaded" script.
try {
  const params = new URLSearchParams(window.location.search);
  const beforeContentLoaded = params.get('aniflix-webview-preload');
  if (beforeContentLoaded) {
    // eslint-disable-next-line no-eval
    (0, eval)(beforeContentLoaded);
  }
} catch (error) {
  console.error('[aniflix] failed to run injectedJavaScriptBeforeContentLoaded', error);
}
