import Icon from '@react-native-vector-icons/material-design-icons';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Dimensions, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from 'react-native-paper';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import deviceUserAgent from './deviceUserAgent';

const { height, width } = Dimensions.get('window');

const VERIFICATION_TIMEOUT_MS = 120_000;

type Props = {
  siteKey: string;
  action: string;
  pageUrl: string;
  onSuccess: (token: string) => void;
  onError: (error: Error) => void;
  onCancel: () => void;
};

export default function TurnstileWebView({
  siteKey,
  action,
  pageUrl,
  onSuccess,
  onError,
  onCancel,
}: Props) {
  const theme = useTheme();
  const styles = useStyles();
  const settledRef = useRef(false);

  const handleCancel = useCallback(() => {
    if (settledRef.current) return;
    settledRef.current = true;
    onCancel();
  }, [onCancel]);

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      if (settledRef.current) return;
      try {
        const message = JSON.parse(event.nativeEvent.data);
        if (message.source !== 'ani-turnstile') return;
        if (message.type === 'token' && typeof message.token === 'string') {
          settledRef.current = true;
          onSuccess(message.token);
        } else if (message.type === 'error') {
          settledRef.current = true;
          onError(new Error(message.message || 'Verifikasi Turnstile gagal'));
        }
      } catch {}
    },
    [onError, onSuccess],
  );

  const handleLoadError = useCallback(
    (event: { nativeEvent: { code?: number; description?: string } }) => {
      // -3 (Android ERR_ABORTED) and -999 (iOS NSURLErrorCancelled) also fire on
      // normal redirects and cancelled navigations.
      if (event.nativeEvent.code === -3 || event.nativeEvent.code === -999) return;
      if (settledRef.current) return;
      settledRef.current = true;
      onError(new Error(event.nativeEvent.description || 'Gagal memuat halaman verifikasi'));
    },
    [onError],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      if (settledRef.current) return;
      settledRef.current = true;
      onError(new Error('Waktu verifikasi habis'));
    }, VERIFICATION_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [onError]);

  const injectedJavaScript = useMemo(
    () => `
      (function () {
        if (window.__aniTurnstileBooted) return;
        window.__aniTurnstileBooted = true;

        var siteKey = ${JSON.stringify(siteKey)};
        var action = ${JSON.stringify(action)};
        var rendered = false;
        var sent = false;

        function send(type, data) {
          if (sent) return;
          if (type === 'token') sent = true;
          window.ReactNativeWebView.postMessage(
            JSON.stringify(Object.assign({ source: 'ani-turnstile', type: type }, data || {}))
          );
        }

        function setHint(text) {
          var hint = document.getElementById('ani-turnstile-hint');
          if (hint) hint.textContent = text;
        }

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
          if (rendered) return true;
          if (!window.turnstile) return false;

          var box = document.getElementById('ani-turnstile-box');
          if (!box) return false;

          try {
            window.turnstile.render(box, {
              sitekey: siteKey,
              action: action,
              theme: 'dark',
              language: 'id',
              appearance: 'interaction-only',
              callback: function (token) {
                if (token) send('token', { token: token });
              },
              'before-interactive-callback': function () {
                setHint('Selesaikan verifikasi untuk melanjutkan');
              },
              'expired-callback': function () {
                setHint('Verifikasi kedaluwarsa, silakan coba lagi');
              },
              'timeout-callback': function () {
                setHint('Verifikasi timeout, silakan coba lagi');
              },
              'error-callback': function () {
                send('error', { message: 'Widget Turnstile gagal dimuat' });
                return true;
              },
            });
            rendered = true;
            setHint('Memverifikasi...');
            return true;
          } catch (error) {
            send('error', { message: String(error) });
            return true;
          }
        }

        function boot() {
          ensureHost();
          if (mount()) return;

          var script = document.createElement('script');
          script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
          script.async = true;
          script.onload = function () {
            mount();
          };
          script.onerror = function () {
            send('error', { message: 'Gagal memuat Turnstile' });
          };
          (document.head || document.documentElement).appendChild(script);

          var tries = 0;
          var timer = setInterval(function () {
            if (mount()) {
              clearInterval(timer);
            } else if (++tries > 200) {
              clearInterval(timer);
              send('error', { message: 'Turnstile tidak merespons' });
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
    [action, siteKey],
  );

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
      statusBarTranslucent>
      <View style={styles.modalContainer}>
        <View style={styles.contentWrapper}>
          <View style={styles.header}>
            <Text style={styles.headerText}>Verifikasi keamanan</Text>
            <TouchableOpacity onPress={handleCancel}>
              <Icon name="close-circle-outline" size={24} color={theme.colors.error} />
            </TouchableOpacity>
          </View>

          <WebView
            source={{
              uri: pageUrl,
              headers: {
                'User-Agent': deviceUserAgent,
                'Accept-Language': 'en-US,en;q=0.9',
              },
            }}
            userAgent={deviceUserAgent}
            injectedJavaScriptBeforeContentLoaded={injectedJavaScript}
            onMessage={handleMessage}
            onError={handleLoadError}
            sharedCookiesEnabled
            thirdPartyCookiesEnabled
            cacheEnabled={false}
            javaScriptEnabled
            domStorageEnabled
            setSupportMultipleWindows={false}
            style={styles.webViewStyle}
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Selesaikan verifikasi di atas untuk melanjutkan. Jika widget tidak muncul, tutup lalu
              coba lagi.
            </Text>
            <TouchableOpacity style={styles.closeButton} onPress={handleCancel}>
              <Text style={styles.closeButtonText}>Batalkan & Tutup</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const useStyles = () => {
  const theme = useTheme();
  return useMemo(() => {
    return StyleSheet.create({
      modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
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
