import { useFocusEffect } from '@react-navigation/core';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  findNodeHandle,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TVFocusGuideView,
  useColorScheme,
  useTVEventHandler,
  View,
} from 'react-native';
import { Appbar, Button, Portal, Snackbar, useTheme } from 'react-native-paper';
import WebView, { WebViewMessageEvent } from 'react-native-webview';

import { RootStackNavigator } from '@/types/navigation';
import DialogManager from '@utils/dialogManager';
import setHistory from '@utils/historyControl';
import { getNovelReading } from '@utils/scrapers/novel';

type Props = NativeStackScreenProps<RootStackNavigator, 'NovelReading'>;

export default function NovelReading(props: Props) {
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const webViewRef = useRef<WebView>(null);
  const abortController = useRef<AbortController>(null);

  useFocusEffect(
    useCallback(() => {
      abortController.current = new AbortController();
      return () => {
        abortController.current?.abort();
      };
    }, []),
  );

  const [fontSize, setFontSize] = useState(18);
  const [isSnackBarOpen, setIsSnackBarOpen] = useState(false);
  const [snackBarText, setSnackBarText] = useState('');

  const { data } = props.route.params;

  const isDark = colorScheme === 'dark';
  const bgColor = isDark ? '#121212' : '#ffffff';
  const textColor = isDark ? '#e0e0e0' : '#222222';
  const dividerColor = isDark ? '#2e2e2e' : '#e0e0e0';

  // --- TV D-Pad Event Handler & Focus management ---
  const [tvWebViewFocused, setTvWebViewFocused] = useState(true);
  const [webViewPressableNode, setWebViewPressableNode] = useState<number | null>(null);
  const webViewPressableRef = useCallback((node: any) => {
    if (node) {
      setWebViewPressableNode(findNodeHandle(node));
    }
  }, []);

  useTVEventHandler(
    useCallback(
      evt => {
        if (!Platform.isTV) return;
        if (!tvWebViewFocused) return;
        if (evt && evt.eventKeyAction === 1) {
          if (evt.eventType === 'up') {
            webViewRef.current?.injectJavaScript(
              `window.scrollBy({ top: -200, behavior: 'smooth' }); true;`,
            );
          } else if (evt.eventType === 'down') {
            webViewRef.current?.injectJavaScript(
              `window.scrollBy({ top: 200, behavior: 'smooth' }); true;`,
            );
          }
        }
      },
      [tvWebViewFocused],
    ),
  );

  useEffect(() => {
    props.navigation.setOptions({
      headerTitle: data.chapter,
      headerShown: true,
      header: headerProps => (
        <Appbar.Header style={{ backgroundColor: theme.colors.surface }}>
          {headerProps.back && (
            <Appbar.BackAction
              onPress={() => {
                headerProps.navigation.goBack();
              }}
            />
          )}
          <Appbar.Content titleStyle={{ fontWeight: 'bold' }} title={data.chapter} />
          <Appbar.Action
            icon="minus"
            disabled={fontSize <= 12}
            onPress={() => setFontSize(prev => Math.max(12, prev - 2))}
          />
          <Appbar.Action
            icon="plus"
            disabled={fontSize >= 30}
            onPress={() => setFontSize(prev => Math.min(30, prev + 2))}
          />
        </Appbar.Header>
      ),
    });
  }, [data.chapter, fontSize, props.navigation, theme.colors.surface]);

  const htmlContent = useMemo(() => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <style>
          body {
            background-color: ${bgColor};
            color: ${textColor};
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            padding: 24px 20px;
            font-size: ${fontSize}px;
            line-height: 1.8;
            letter-spacing: 0.3px;
          }
          p {
            margin-bottom: 20px;
          }
          h1, h2, h3, h4, h5, h6 {
            color: ${isDark ? '#ffffff' : '#000000'};
            margin-top: 24px;
            margin-bottom: 12px;
            font-weight: bold;
          }
          hr {
            border: 0;
            border-top: 1px solid ${dividerColor};
            margin: 24px 0;
          }
          a {
            color: ${theme.colors.primary};
            text-decoration: none;
          }
          img {
            max-width: 100%;
            height: auto;
            display: block;
            margin: 16px auto;
            border-radius: 8px;
          }
        </style>
      </head>
      <body>
        <div id="content">${data.htmlReading}</div>
        <script>
          function sendToRN(data) {
            window.ReactNativeWebView.postMessage(JSON.stringify(data));
          }

          let lastScrollPercent = 0;
          window.addEventListener('scroll', () => {
            const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
            if (scrollHeight <= 0) return;
            const scrollPercent = Math.min(100, Math.max(0, Math.round((window.scrollY / scrollHeight) * 100)));
            if (scrollPercent !== lastScrollPercent) {
              lastScrollPercent = scrollPercent;
              sendToRN({ type: 'SCROLL_UPDATE', percent: scrollPercent });
            }
          });

          ${
            Platform.isTV
              ? `
            document.addEventListener('keydown', function(e) {
              if (e.key === 'ArrowDown' || e.keyCode === 40 || e.key === 'ArrowUp' || e.keyCode === 38) {
                // Handled in React Native TV event handler
              } else if (e.key === 'ArrowLeft' || e.keyCode === 37) {
                e.preventDefault();
                sendToRN({ type: 'CHAPTER_NAV', direction: 'prev' });
              } else if (e.key === 'ArrowRight' || e.keyCode === 39) {
                e.preventDefault();
                sendToRN({ type: 'CHAPTER_NAV', direction: 'next' });
              }
            });
          `
              : ''
          }
        </script>
      </body>
      </html>
    `;
  }, [data.htmlReading, bgColor, textColor, fontSize, isDark, dividerColor, theme.colors.primary]);

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === 'SCROLL_UPDATE') {
        const percent = msg.percent;
        setHistory(
          props.route.params.data,
          props.route.params.link,
          true,
          { lastDuration: percent },
          false,
          false,
          true,
        );
      } else if (msg.type === 'CHAPTER_NAV') {
        if (msg.direction === 'prev' && data.prev) {
          moveChapter(data.prev);
        } else if (msg.direction === 'next' && data.next) {
          moveChapter(data.next);
        }
      }
    } catch {}
  };

  const onLoadEnd = () => {
    if (props.route.params.historyData?.lastDuration) {
      const percent = props.route.params.historyData.lastDuration;
      webViewRef.current?.injectJavaScript(`
        setTimeout(() => {
          const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
          window.scrollTo(0, scrollHeight * ${percent / 100});
        }, 300);
        true;
      `);
    }
  };

  const moveChapter = useCallback(
    (url: string) => {
      if (isSnackBarOpen) return;

      setSnackBarText('Mengambil data...');
      setIsSnackBarOpen(true);
      getNovelReading(url, abortController.current?.signal)
        .then(res => {
          props.navigation.setParams({
            data: res,
            link: url,
            historyData: undefined,
          });
          setHistory(res, url, false, undefined, false, false, true);
        })
        .catch(err => {
          if (err.name === 'AbortError') return;
          DialogManager.alert('Gagal mengambil data', err.message);
        })
        .finally(() => setIsSnackBarOpen(false));
    },
    [isSnackBarOpen, props.navigation],
  );

  if (Platform.isTV) {
    return (
      <TVFocusGuideView
        autoFocus
        style={{ flex: 1, flexDirection: 'row', backgroundColor: bgColor }}>
        <Portal>
          <Snackbar
            visible={isSnackBarOpen}
            onDismiss={() => setIsSnackBarOpen(false)}
            duration={3000}>
            {snackBarText}
          </Snackbar>
        </Portal>

        {/* WebView area — takes remaining space */}
        <Pressable
          ref={webViewPressableRef}
          nextFocusUp={webViewPressableNode || undefined}
          nextFocusDown={webViewPressableNode || undefined}
          style={{ flex: 1 }}
          focusable={true}
          hasTVPreferredFocus={true}
          onFocus={() => setTvWebViewFocused(true)}
          onBlur={() => setTvWebViewFocused(false)}>
          <WebView
            ref={webViewRef}
            originWhitelist={['*']}
            source={{ html: htmlContent }}
            style={styles.webview}
            onMessage={handleMessage}
            onLoadEnd={onLoadEnd}
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
          />
        </Pressable>

        {/* TV Sidebar layout on the right side */}
        <View
          style={{
            width: 170,
            backgroundColor: theme.colors.surface,
            padding: 15,
            justifyContent: 'center',
            alignItems: 'center',
            borderLeftWidth: 1,
            borderLeftColor: theme.colors.outlineVariant,
          }}>
          <TVNavButton
            label="Sebelumnya"
            disabled={!data.prev || isSnackBarOpen}
            onPress={() => data.prev && moveChapter(data.prev)}
          />
          <TVNavButton
            label="Selanjutnya"
            disabled={!data.next || isSnackBarOpen}
            onPress={() => data.next && moveChapter(data.next)}
          />
        </View>
      </TVFocusGuideView>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        style={styles.webview}
        onMessage={handleMessage}
        onLoadEnd={onLoadEnd}
        showsVerticalScrollIndicator={true}
        nestedScrollEnabled={true}
      />
      <View style={[styles.bottomBar, { backgroundColor: theme.colors.surface }]}>
        <Button
          mode="outlined"
          disabled={!data.prev || isSnackBarOpen}
          onPress={() => data.prev && moveChapter(data.prev)}
          style={styles.navButton}>
          Sebelumnya
        </Button>
        <Button
          mode="contained"
          disabled={!data.next || isSnackBarOpen}
          onPress={() => data.next && moveChapter(data.next)}
          style={styles.navButton}>
          Selanjutnya
        </Button>
      </View>

      <Portal>
        <Snackbar
          visible={isSnackBarOpen}
          onDismiss={() => setIsSnackBarOpen(false)}
          duration={3000}>
          {snackBarText}
        </Snackbar>
      </Portal>
    </View>
  );
}

// TV-only chapter nav button with focus highlight
function TVNavButton({
  label,
  disabled,
  onPress,
}: {
  label: string;
  disabled?: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <Pressable
      focusable={!disabled}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onPress={onPress}
      disabled={disabled}
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        width: 140,
        backgroundColor: disabled
          ? theme.colors.surfaceDisabled
          : focused
            ? theme.colors.primaryContainer
            : theme.colors.elevation.level2,
        borderWidth: focused ? 2 : 0,
        borderColor: focused ? theme.colors.primary : 'transparent',
        opacity: disabled ? 0.4 : 1,
        marginVertical: 6,
      }}>
      <Text
        style={{
          fontWeight: 'bold',
          color: disabled
            ? theme.colors.onSurfaceDisabled
            : focused
              ? theme.colors.onPrimaryContainer
              : theme.colors.onSurface,
        }}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  navButton: {
    flex: 1,
    marginHorizontal: 5,
  },
});
