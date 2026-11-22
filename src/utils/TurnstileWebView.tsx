import Icon from '@react-native-vector-icons/material-design-icons';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from 'react-native-paper';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import deviceUserAgent from './deviceUserAgent';

const { height, width } = Dimensions.get('window');

/**
 * Minimal same-origin document used as the Turnstile host. It deliberately does
 * not load the site's JavaScript, images or analytics, which keeps the WebView
 * page footprint small. `baseUrl` makes the document origin the site origin so
 * Turnstile accepts the site key.
 */
const MINIMAL_PAGE_HTML = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
    <style>html,body{margin:0;padding:0;height:100%;background:#0b0b0b;}</style>
  </head>
  <body></body>
</html>`;

// If the minimal host page ever fails on this device, remember it for the rest
// of the JS session so every later solve does not pay for a failed attempt first.
let preferSitePage = false;

type Props = {
  siteKey: string;
  action: string;
  pageUrl: string;
  /** The request this session should solve for. */
  requestId: number;
  visible: boolean;
  onToken: (requestId: number, token: string) => void;
  onInteractive: (requestId: number) => void;
  onError: (requestId: number, error: Error) => void;
  onCancel: () => void;
};

/**
 * On-demand Turnstile session on the target origin.
 *
 * The widget is mounted invisibly and solves on its own, like the website's
 * "probe" widget. While the session is alive, later solves reuse the same page
 * and remount the widget (the same thing the website does for a new gate), so
 * switching episode/movie does not show the challenge again. The overlay is only
 * revealed when Cloudflare actually requires the user to interact. `App.tsx`
 * unmounts this component when the session is idle, which releases the whole
 * WebView engine and its page memory.
 */
export default function TurnstileWebView({
  siteKey,
  action,
  pageUrl,
  requestId,
  visible,
  onToken,
  onInteractive,
  onError,
  onCancel,
}: Props) {
  const theme = useTheme();
  const styles = useStyles();
  const webViewRef = useRef<WebView>(null);
  const readyRef = useRef(false);
  const requestIdRef = useRef(requestId);
  const pendingRequestRef = useRef<number | null>(null);
  const initialRequestIdRef = useRef(requestId);
  const [useSitePage, setUseSitePage] = useState(preferSitePage);
  const fallbackTriggeredRef = useRef(false);

  requestIdRef.current = requestId;

  const sendRequest = useCallback((id: number) => {
    webViewRef.current?.injectJavaScript(
      `window.__aniTurnstileRequest && window.__aniTurnstileRequest(${id}); true;`,
    );
  }, []);

  useEffect(() => {
    if (!requestId) {
      pendingRequestRef.current = null;
      return;
    }
    if (!readyRef.current) {
      pendingRequestRef.current = requestId;
      return;
    }
    pendingRequestRef.current = null;
    sendRequest(requestId);
  }, [requestId, sendRequest]);

  useEffect(() => {
    if (!visible) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      onCancel();
      return true;
    });
    return () => subscription.remove();
  }, [onCancel, visible]);

  useEffect(() => {
    // Safety net: if the minimal host page never manages to mount Turnstile,
    // switch to the real site page instead of waiting for the global timeout.
    if (useSitePage || !requestId || readyRef.current) return;
    const timer = setTimeout(() => {
      if (readyRef.current) return;
      fallbackTriggeredRef.current = true;
      preferSitePage = true;
      setUseSitePage(true);
    }, 12000);
    return () => clearTimeout(timer);
  }, [requestId, useSitePage]);

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      let message: any;
      try {
        message = JSON.parse(event.nativeEvent.data);
      } catch {
        return;
      }
      if (!message || message.source !== 'ani-turnstile') return;

      if (message.type === 'ready') {
        readyRef.current = true;
        const active = requestIdRef.current;
        const pending = pendingRequestRef.current;
        pendingRequestRef.current = null;

        if (pending && pending !== message.initialRequestId) {
          sendRequest(pending);
        } else if (!pending && active && active !== message.initialRequestId) {
          // The document reloaded while a request was in flight.
          sendRequest(active);
        }
        return;
      }

      if (typeof message.requestId !== 'number' || message.requestId !== requestIdRef.current) {
        return;
      }

      if (message.type === 'token' && typeof message.token === 'string') {
        onToken(message.requestId, message.token);
      } else if (message.type === 'interactive') {
        onInteractive(message.requestId);
      } else if (message.type === 'error') {
        if (!useSitePage && !fallbackTriggeredRef.current) {
          // The minimal host page could not render Turnstile (for example an
          // origin/security check). Reload the real site page and try once more
          // instead of failing the playback.
          fallbackTriggeredRef.current = true;
          preferSitePage = true;
          setUseSitePage(true);
          return;
        }
        onError(message.requestId, new Error(message.message || 'Verifikasi Turnstile gagal'));
      }
    },
    [onError, onInteractive, onToken, sendRequest, useSitePage],
  );

  const handleLoadError = useCallback(
    (event: { nativeEvent: { code?: number; description?: string } }) => {
      // -3 (Android ERR_ABORTED) and -999 (iOS NSURLErrorCancelled) also fire on
      // normal redirects and cancelled navigations.
      if (event.nativeEvent.code === -3 || event.nativeEvent.code === -999) return;
      const active = requestIdRef.current;
      if (!active) return;
      onError(
        active,
        new Error(event.nativeEvent.description || 'Gagal memuat halaman verifikasi'),
      );
    },
    [onError],
  );

  const injectedJavaScript = useMemo(
    () => `
      (function () {
        if (window.__aniTurnstileBooted) return;
        window.__aniTurnstileBooted = true;

        var siteKey = ${JSON.stringify(siteKey)};
        var action = ${JSON.stringify(action)};
        var expectedOrigin = '';
        try {
          expectedOrigin = new URL(${JSON.stringify(pageUrl)}).origin;
        } catch (e) {}
        var currentRequest = ${initialRequestIdRef.current};
        var widgetId = null;

        function postFor(requestId, type, data) {
          try {
            window.ReactNativeWebView.postMessage(
              JSON.stringify(
                Object.assign({ source: 'ani-turnstile', type: type, requestId: requestId }, data || {})
              )
            );
          } catch (e) {}
        }

        function post(type, data) {
          postFor(currentRequest, type, data);
        }

        function setHint(text) {
          var hint = document.getElementById('ani-turnstile-hint');
          if (hint) hint.textContent = text;
        }

        // The page is only used as a same-origin host for Turnstile. Keep any
        // background media on the site silent while the widget is mounted.
        function silenceMedia() {
          var nodes = document.querySelectorAll('video,audio');
          for (var i = 0; i < nodes.length; i++) {
            try {
              nodes[i].muted = true;
              nodes[i].pause();
            } catch (e) {}
          }
        }
        silenceMedia();
        setInterval(silenceMedia, 1500);

        // The host page is invisible, so it must never take focus away from the
        // app (for example by auto-focusing a search field and opening the
        // keyboard). The Turnstile iframe is left alone.
        function keepFocusOut() {
          var active = document.activeElement;
          if (!active || active === document.body || active === document.documentElement) return;
          if (active.tagName === 'IFRAME') return;
          var host = document.getElementById('ani-turnstile-host');
          if (host && host.contains(active)) return;
          try {
            active.blur();
          } catch (e) {}
        }
        setInterval(keepFocusOut, 1000);

        function ensureHost() {
          var host = document.getElementById('ani-turnstile-host');
          if (host) return host;

          host = document.createElement('div');
          host.id = 'ani-turnstile-host';
          host.style.cssText =
            'position:fixed;inset:0;z-index:2147483647;display:flex;flex-direction:column;' +
            'align-items:center;justify-content:center;gap:16px;background:#0b0b0b;padding:24px;';

          var box = document.createElement('div');
          box.id = 'ani-turnstile-box';
          box.style.cssText = 'min-height:70px;';
          host.appendChild(box);

          var hint = document.createElement('div');
          hint.id = 'ani-turnstile-hint';
          hint.textContent = 'Memuat verifikasi...';
          hint.style.cssText =
            'color:#aaa;font:13px system-ui;text-align:center;max-width:320px;';
          host.appendChild(hint);

          (document.body || document.documentElement).appendChild(host);
          return host;
        }

        function mount() {
          if (widgetId !== null) return true;
          if (!window.turnstile) return false;

          var box = document.getElementById('ani-turnstile-box');
          if (!box) return false;

          // Bind every callback to the request this widget was rendered for, so a
          // late callback from a removed widget can never answer a newer request.
          var widgetRequest = currentRequest;

          try {
            widgetId = window.turnstile.render(box, {
              sitekey: siteKey,
              action: action,
              theme: 'dark',
              language: 'id',
              appearance: 'interaction-only',
              'response-field': false,
              'refresh-expired': 'auto',
              callback: function (token) {
                if (token) postFor(widgetRequest, 'token', { token: token });
              },
              'before-interactive-callback': function () {
                postFor(widgetRequest, 'interactive');
                setHint('Selesaikan verifikasi untuk melanjutkan');
              },
              'expired-callback': function () {
                setHint('Verifikasi kedaluwarsa, silakan coba lagi');
              },
              'timeout-callback': function () {
                postFor(widgetRequest, 'error', {
                  message: 'Verifikasi timeout, silakan coba lagi',
                });
              },
              'error-callback': function (code) {
                postFor(widgetRequest, 'error', {
                  message: 'Widget Turnstile gagal dimuat' + (code ? ' (' + code + ')' : ''),
                });
                return true;
              },
            });
            setHint('Memverifikasi...');
            post('ready', { initialRequestId: currentRequest });
            return true;
          } catch (error) {
            post('error', { message: String(error) });
            return true;
          }
        }

        // The website remounts its probe widget for every new gate, which makes
        // Turnstile solve again invisibly. Do the same instead of relying on
        // reset(), so the token is always fresh for the new gate.
        function requestToken(id) {
          currentRequest = id;
          // boot() will render the widget once the Turnstile script is ready.
          if (!window.turnstile) return;
          if (widgetId !== null) {
            try {
              window.turnstile.remove(widgetId);
            } catch (error) {}
            widgetId = null;
          }
          ensureHost();
          mount();
        }

        window.__aniTurnstileRequest = requestToken;

        function boot() {
          if (expectedOrigin) {
            var currentOrigin = '';
            try {
              currentOrigin = window.location.origin;
            } catch (e) {}
            if (currentOrigin !== expectedOrigin) {
              // The minimal host page did not get the site origin. The native
              // side will reload the real site page and retry once.
              post('error', { message: 'Origin halaman verifikasi tidak valid', fatal: true });
              return;
            }
          }

          ensureHost();
          if (mount()) return;

          var script = document.createElement('script');
          script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
          script.async = true;
          script.onload = function () {
            mount();
          };
          script.onerror = function () {
            post('error', { message: 'Gagal memuat Turnstile' });
          };
          (document.head || document.documentElement).appendChild(script);

          var tries = 0;
          var timer = setInterval(function () {
            if (mount()) {
              clearInterval(timer);
            } else if (++tries > 200) {
              clearInterval(timer);
              post('error', { message: 'Turnstile tidak merespons' });
            }
          }, 100);
        }

        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', boot);
        } else {
          boot();
        }
      })();
      true;
    `,
    [action, pageUrl, siteKey],
  );

  const source = useMemo(
    () =>
      useSitePage
        ? {
            uri: pageUrl,
            headers: {
              'User-Agent': deviceUserAgent,
              'Accept-Language': 'en-US,en;q=0.9',
            },
          }
        : { html: MINIMAL_PAGE_HTML, baseUrl: pageUrl },
    [pageUrl, useSitePage],
  );

  return (
    <View style={styles.root} pointerEvents={visible ? 'auto' : 'none'}>
      <View style={[StyleSheet.absoluteFill, styles.backdrop, !visible && styles.hidden]} />
      <View style={[styles.contentWrapper, !visible && styles.hidden]}>
        <View style={styles.header}>
          <Text style={styles.headerText}>Verifikasi keamanan</Text>
          <TouchableOpacity onPress={onCancel}>
            <Icon name="close-circle-outline" size={24} color={theme.colors.error} />
          </TouchableOpacity>
        </View>

        <WebView
          ref={webViewRef}
          source={source}
          userAgent={deviceUserAgent}
          injectedJavaScriptBeforeContentLoaded={injectedJavaScript}
          onMessage={handleMessage}
          onError={handleLoadError}
          onLoadStart={() => {
            readyRef.current = false;
          }}
          sharedCookiesEnabled
          thirdPartyCookiesEnabled
          javaScriptEnabled
          domStorageEnabled
          mediaPlaybackRequiresUserAction
          allowsInlineMediaPlayback={false}
          setSupportMultipleWindows={false}
          style={styles.webViewStyle}
        />

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Selesaikan verifikasi di atas untuk melanjutkan. Jika widget tidak muncul, tutup lalu
            coba lagi.
          </Text>
          <TouchableOpacity style={styles.closeButton} onPress={onCancel}>
            <Text style={styles.closeButtonText}>Batalkan & Tutup</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const useStyles = () => {
  const theme = useTheme();
  return useMemo(() => {
    return StyleSheet.create({
      root: {
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        justifyContent: 'center',
        alignItems: 'center',
      },
      hidden: {
        opacity: 0,
      },
      backdrop: {
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
      },
      contentWrapper: {
        backgroundColor: theme.colors.background,
        borderRadius: 12,
        width: width * 0.95,
        height: height * 0.72,
        overflow: 'hidden',
        elevation: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
      },
      header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.surfaceDisabled,
      },
      headerText: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.onBackground,
      },
      webViewStyle: {
        flex: 1,
        minHeight: 250,
      },
      footer: {
        padding: 15,
        borderTopWidth: 1,
        borderTopColor: theme.colors.surfaceDisabled,
        gap: 10,
      },
      footerText: {
        color: theme.colors.onSurface,
        textAlign: 'center',
        fontSize: 13,
      },
      closeButton: {
        padding: 8,
        borderRadius: 50,
        backgroundColor: theme.colors.errorContainer,
      },
      closeButtonText: {
        color: theme.colors.onErrorContainer,
        fontWeight: 'bold',
        fontSize: 14,
        textAlign: 'center',
      },
    });
  }, [
    theme.colors.background,
    theme.colors.errorContainer,
    theme.colors.onBackground,
    theme.colors.onErrorContainer,
    theme.colors.onSurface,
    theme.colors.surfaceDisabled,
  ]);
};
