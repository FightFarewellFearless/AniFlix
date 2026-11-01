import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { View } from 'react-native';

/**
 * Electron implementation of `react-native-webview`.
 *
 * The real package is a native module and renders the text
 * "React Native WebView does not support this platform." inside a browser, so
 * every webview based feature (video player, comic/novel reader, Cloudflare
 * bypass, comics session fetcher) was dead in the Electron build.
 *
 * This shim renders a real Electron `<webview>` element instead:
 *
 * - `source={{ uri }}`  -> `src` attribute
 * - `source={{ html }}` -> written to a temp file by the main process (a
 *                          `<webview>` refuses to navigate to `data:` URLs)
 * - `onMessage`         -> `ipc-message` from the guest preload bridge
 * - `injectJavaScript`  -> `webview.executeJavaScript` (works cross origin)
 */

export type WebViewMessageEvent = {
  nativeEvent: { data: string };
};

export type WebViewErrorEvent = {
  nativeEvent: { description: string; code: number };
};

export type WebViewNavigation = {
  url: string;
  title: string;
  loading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  navigationType: string;
};

export type WebViewSource = {
  uri?: string;
  html?: string;
  baseUrl?: string;
  headers?: Record<string, string>;
};

export type WebViewHandles = {
  injectJavaScript: (code: string) => void;
  stopLoading: () => void;
  reload: () => void;
  goBack: () => void;
  goForward: () => void;
  postMessage: (data: string) => void;
  requestFocus: () => void;
};

type WebViewProps = {
  source?: WebViewSource;
  style?: any;
  userAgent?: string;
  injectedJavaScript?: string;
  injectedJavaScriptBeforeContentLoaded?: string;
  onMessage?: (event: WebViewMessageEvent) => void;
  onLoadStart?: () => void;
  onLoad?: () => void;
  onLoadEnd?: () => void;
  onError?: (event: WebViewErrorEvent) => void;
  onHttpError?: (event: any) => void;
  onNavigationStateChange?: (event: WebViewNavigation) => void;
  onShouldStartLoadWithRequest?: (request: {
    url: string;
    navigationType?: string;
    title?: string;
  }) => boolean;
  // Android/iOS only props (originWhitelist, cacheEnabled, incognito, ...) are
  // intentionally accepted and ignored.
  [key: string]: any;
};

type GuestConfig = { id: string; url: string; preload: string; partition: string };

const webviewApi = () =>
  typeof window === 'undefined' ? undefined : (window as any).electronAPI?.webview;

function WebViewComponent(props: WebViewProps, ref: React.Ref<WebViewHandles>) {
  const {
    source,
    style,
    userAgent,
    injectedJavaScript,
    injectedJavaScriptBeforeContentLoaded,
    onMessage,
    onLoadStart,
    onLoad,
    onLoadEnd,
    onError,
    onNavigationStateChange,
    onShouldStartLoadWithRequest,
    // Everything else is an Android/iOS only prop and has no DOM equivalent.
    ...ignoredPlatformProps
  } = props;
  void ignoredPlatformProps;

  const hostRef = useRef<any>(null);
  const guestRef = useRef<any>(null);
  const configRef = useRef<GuestConfig | null>(null);
  const [config, setConfig] = useState<GuestConfig | null>(null);

  // DOM listeners are attached once per guest, so the latest callbacks have to
  // be read through a ref instead of being captured in the listener closure.
  const callbacksRef = useRef({
    onMessage,
    onLoadStart,
    onLoad,
    onLoadEnd,
    onError,
    onNavigationStateChange,
    onShouldStartLoadWithRequest,
    injectedJavaScript,
  });
  callbacksRef.current = {
    onMessage,
    onLoadStart,
    onLoad,
    onLoadEnd,
    onError,
    onNavigationStateChange,
    onShouldStartLoadWithRequest,
    injectedJavaScript,
  };

  // Ask the main process for the guest configuration (url + preload script).
  useEffect(() => {
    const api = webviewApi();
    if (!api) {
      return;
    }

    let cancelled = false;
    let createdId: string | null = null;

    api
      .create({
        uri: source?.uri,
        html: source?.html,
        baseUrl: source?.baseUrl,
        userAgent,
        headers: source?.headers,
        injectedJavaScriptBeforeContentLoaded,
      })
      .then((created: GuestConfig) => {
        createdId = created.id;
        if (cancelled) {
          api.dispose(created.id);
          return;
        }

        const previous = configRef.current;
        configRef.current = created;
        setConfig(created);

        if (previous && previous.id !== created.id) {
          api.dispose(previous.id);
        }
      })
      .catch((error: any) => {
        if (cancelled) {
          return;
        }
        console.error('[WebView] unable to create guest', error);
        callbacksRef.current.onError?.({
          nativeEvent: { description: String(error), code: -1 },
        });
      });

    return () => {
      cancelled = true;
      if (createdId) {
        api.dispose(createdId);
        if (configRef.current?.id === createdId) {
          configRef.current = null;
        }
      }
    };
    // `source` is compared by its pieces so that a new object with the same
    // content does not recreate the whole guest.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    source?.uri,
    source?.html,
    source?.baseUrl,
    userAgent,
    injectedJavaScriptBeforeContentLoaded,
  ]);

  // Attach the actual <webview> element for the current configuration.
  useEffect(() => {
    const host = hostRef.current;
    if (!host || !config) {
      return;
    }

    const guest: any = document.createElement('webview');
    guest.style.cssText =
      'position:absolute;top:0;left:0;width:100%;height:100%;border:0;background:transparent;';
    // The renderer itself runs with webSecurity disabled (the app performs
    // cross origin requests and reads local CBZ images), the guests need the
    // same treatment.
    guest.setAttribute(
      'webpreferences',
      'webSecurity=no, allowRunningInsecureContent=yes, backgroundThrottling=no',
    );
    if (userAgent) {
      guest.setAttribute('useragent', userAgent);
    }
    guest.setAttribute('preload', config.preload);
    guest.setAttribute('partition', config.partition);
    guest.setAttribute('src', config.url);

    const emitNavigationState = () => {
      const handler = callbacksRef.current.onNavigationStateChange;
      if (!handler) {
        return;
      }
      let state: WebViewNavigation;
      try {
        state = {
          url: guest.getURL(),
          title: guest.getTitle(),
          loading: guest.isLoading(),
          canGoBack: guest.canGoBack(),
          canGoForward: guest.canGoForward(),
          navigationType: 'other',
        };
      } catch {
        return;
      }
      handler(state);
    };

    const handleIpcMessage = (event: any) => {
      if (event.channel !== 'message') {
        return;
      }
      callbacksRef.current.onMessage?.({
        nativeEvent: { data: event.args?.[0] },
      });
    };

    const handleDidStartLoading = () => {
      callbacksRef.current.onLoadStart?.();
      emitNavigationState();
    };

    const handleDidStopLoading = () => {
      emitNavigationState();
    };

    const handleDidFinishLoad = () => {
      callbacksRef.current.onLoad?.();
      callbacksRef.current.onLoadEnd?.();
      emitNavigationState();

      const code = callbacksRef.current.injectedJavaScript;
      if (code) {
        try {
          guest.executeJavaScript(code);
        } catch {
          // guest already destroyed
        }
      }
    };

    const handleDidFailLoad = (event: any) => {
      // -3 === ERR_ABORTED, which is what a cancelled navigation reports.
      if (event.errorCode === -3 || event.isMainFrame === false) {
        return;
      }
      callbacksRef.current.onError?.({
        nativeEvent: {
          code: event.errorCode ?? -1,
          description: event.errorDescription ?? 'Failed to load',
        },
      });
    };

    const handleWillNavigate = (event: any) => {
      const handler = callbacksRef.current.onShouldStartLoadWithRequest;
      if (!handler) {
        return;
      }
      let url = '';
      try {
        url = event.url || guest.getURL();
      } catch {
        // ignore
      }
      const allowed = handler({ url, navigationType: 'click', title: '' });
      if (allowed === false) {
        // A `<webview>` `will-navigate` event cannot be cancelled, only the
        // pending load can be aborted (this is what react-native-webview's
        // `onShouldStartLoadWithRequest: false` does on the native side).
        event.preventDefault?.();
        try {
          guest.stop();
        } catch {
          // ignore
        }
      }
    };

    guest.addEventListener('ipc-message', handleIpcMessage);
    guest.addEventListener('did-start-loading', handleDidStartLoading);
    guest.addEventListener('did-stop-loading', handleDidStopLoading);
    guest.addEventListener('did-finish-load', handleDidFinishLoad);
    guest.addEventListener('did-fail-load', handleDidFailLoad);
    guest.addEventListener('did-navigate', emitNavigationState);
    guest.addEventListener('did-navigate-in-page', emitNavigationState);
    guest.addEventListener('page-title-updated', emitNavigationState);
    guest.addEventListener('will-navigate', handleWillNavigate);

    host.appendChild(guest);
    guestRef.current = guest;

    return () => {
      guest.removeEventListener('ipc-message', handleIpcMessage);
      guest.removeEventListener('did-start-loading', handleDidStartLoading);
      guest.removeEventListener('did-stop-loading', handleDidStopLoading);
      guest.removeEventListener('did-finish-load', handleDidFinishLoad);
      guest.removeEventListener('did-fail-load', handleDidFailLoad);
      guest.removeEventListener('did-navigate', emitNavigationState);
      guest.removeEventListener('did-navigate-in-page', emitNavigationState);
      guest.removeEventListener('page-title-updated', emitNavigationState);
      guest.removeEventListener('will-navigate', handleWillNavigate);

      guestRef.current = null;
      try {
        guest.remove();
      } catch {
        // ignore
      }
    };
  }, [config, userAgent]);

  useImperativeHandle(
    ref,
    () => ({
      injectJavaScript: (code: string) => {
        try {
          guestRef.current?.executeJavaScript(code);
        } catch {
          // guest not ready yet
        }
      },
      stopLoading: () => {
        try {
          guestRef.current?.stop();
        } catch {
          // ignore
        }
      },
      reload: () => {
        try {
          guestRef.current?.reload();
        } catch {
          // ignore
        }
      },
      goBack: () => {
        try {
          guestRef.current?.goBack();
        } catch {
          // ignore
        }
      },
      goForward: () => {
        try {
          guestRef.current?.goForward();
        } catch {
          // ignore
        }
      },
      postMessage: (data: string) => {
        try {
          guestRef.current?.executeJavaScript(
            `window.dispatchEvent(new MessageEvent('message', { data: ${JSON.stringify(
              data,
            )} })); true;`,
          );
        } catch {
          // ignore
        }
      },
      requestFocus: () => {
        try {
          guestRef.current?.focus();
        } catch {
          // ignore
        }
      },
    }),
    [],
  );

  return <View ref={hostRef} style={[styles.host, style]} />;
}

const styles = {
  host: {
    position: 'relative' as const,
    overflow: 'hidden' as const,
  },
};

export const WebView = forwardRef(WebViewComponent) as unknown as React.ComponentType<
  WebViewProps & { ref?: React.Ref<WebViewHandles> }
>;

export default WebView;
