import { useFocusEffect } from '@react-navigation/core';
import React, { useCallback, useState } from 'react';
import { AppState, View } from 'react-native';
import { SystemBars } from 'react-native-edge-to-edge';
import { Button, IconButton, MD3Theme, Text, useTheme } from 'react-native-paper';
import SystemNavigationBar from 'react-native-system-navigation-bar';
import WebView from 'react-native-webview';

import { useBackHandler } from '@hooks/useBackHandler';

export function useComicsFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useFocusEffect(
    useCallback(() => {
      SystemNavigationBar.fullScreen(isFullscreen);
      if (isFullscreen) {
        SystemNavigationBar.navigationHide();
        SystemBars.setHidden(true);
      } else {
        SystemNavigationBar.navigationShow();
        SystemBars.setHidden(false);
      }
    }, [isFullscreen]),
  );

  useFocusEffect(
    useCallback(() => {
      return () => {
        SystemNavigationBar.fullScreen(false);
        SystemNavigationBar.navigationShow();
        SystemBars.setHidden(false);
      };
    }, []),
  );

  useBackHandler(
    useCallback(() => {
      if (isFullscreen) {
        setIsFullscreen(false);
        return true;
      }
      return false;
    }, [isFullscreen]),
  );

  return { isFullscreen, setIsFullscreen };
}

export function useAutoScroll(webViewRef: React.RefObject<WebView<{}> | null>) {
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(1.0);

  useFocusEffect(
    useCallback(() => {
      const appState = AppState.addEventListener('blur', () => {
        webViewRef.current?.injectJavaScript(`window.stopAutoScroll(); true;`);
        setIsAutoScrolling(false);
      });
      return () => {
        appState.remove();
      };
    }, [webViewRef]),
  );

  const toggleAutoScroll = useCallback(() => {
    const newState = !isAutoScrolling;
    setIsAutoScrolling(newState);

    if (newState) {
      webViewRef.current?.injectJavaScript(`
        window.updateScrollSpeed(${scrollSpeed});
        window.startAutoScroll();
        true;
      `);
    } else {
      webViewRef.current?.injectJavaScript(`window.stopAutoScroll(); true;`);
    }
  }, [isAutoScrolling, scrollSpeed, webViewRef]);

  const changeSpeed = useCallback(
    (delta: number) => {
      setScrollSpeed(prev => {
        const newSpeed = Math.max(0.2, parseFloat((prev + delta).toFixed(1)));
        if (isAutoScrolling) {
          webViewRef.current?.injectJavaScript(`window.updateScrollSpeed(${newSpeed}); true;`);
        }
        return newSpeed;
      });
    },
    [isAutoScrolling, webViewRef],
  );

  return { isAutoScrolling, setIsAutoScrolling, scrollSpeed, toggleAutoScroll, changeSpeed };
}

export function ComicsBottomBar({
  isAutoScrolling,
  toggleAutoScroll,
  scrollSpeed,
  changeSpeed,
  isFullscreen,
  children,
}: {
  isAutoScrolling: boolean;
  toggleAutoScroll: () => void;
  scrollSpeed: number;
  changeSpeed: (delta: number) => void;
  isFullscreen: boolean;
  children?: React.ReactNode;
}) {
  const theme = useTheme();
  return (
    <View
      style={{
        backgroundColor: theme.colors.elevation.level1,
        justifyContent: 'space-around',
        display: isFullscreen ? 'none' : 'flex',
      }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
        <Button
          mode={isAutoScrolling ? 'contained-tonal' : 'text'}
          icon={isAutoScrolling ? 'pause' : 'play'}
          onPress={toggleAutoScroll}
          compact>
          {isAutoScrolling ? 'Stop' : 'Auto Scroll'}
        </Button>
        <View style={{ width: 16 }} />
        <IconButton
          icon="minus"
          size={20}
          onPress={() => changeSpeed(-0.2)}
          disabled={scrollSpeed <= 0.2}
        />
        <Text variant="labelLarge" style={{ marginHorizontal: 4 }}>
          {scrollSpeed.toFixed(1)}x
        </Text>
        <IconButton
          icon="plus"
          size={20}
          onPress={() => changeSpeed(0.2)}
          disabled={scrollSpeed >= 10}
        />
      </View>
      {children && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>{children}</View>
      )}
    </View>
  );
}

export function FullscreenExitButton({
  isFullscreen,
  setIsFullscreen,
}: {
  isFullscreen: boolean;
  setIsFullscreen: (v: boolean) => void;
}) {
  const theme = useTheme();
  return (
    <View
      style={{
        display: isFullscreen ? 'flex' : 'none',
        position: 'absolute',
        top: 5,
        right: 5,
        zIndex: 999,
      }}>
      <IconButton
        onPress={() => setIsFullscreen(false)}
        iconColor={theme.colors.primary}
        icon="fullscreen-exit"
        size={30}
        mode="outlined"
      />
    </View>
  );
}

export const getComicsBgColor = (theme: MD3Theme) => (theme.dark ? '#121212' : '#ffffff');

export function getComicsStyles(theme: MD3Theme) {
  const bgColor = getComicsBgColor(theme);
  const shimmerBase = theme.dark ? '#333333' : '#e0e0e0';
  const shimmerHighlight = theme.dark ? '#444444' : '#f0f0f0';
  const errorTextColor = theme.dark ? '#ffb4ab' : '#ba1a1a';

  const errorSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${errorTextColor}"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>`;
  const errorIconUrl = `data:image/svg+xml;base64,${btoa(errorSvg)}`;

  return `
    <style>
      body { margin: 0; background-color: ${bgColor}; overflow-anchor: auto; }
      .img-wrapper { min-height: 140vw; width: 100%; position: relative; background-color: ${shimmerBase}; overflow: hidden; display: flex; justify-content: center; align-items: center; content-visibility: auto; contain-intrinsic-size: 100vw 140vw; }
      .img-wrapper::before { content: ""; position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(90deg, ${shimmerBase} 25%, ${shimmerHighlight} 50%, ${shimmerBase} 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; z-index: 1; will-change: background-position; }
      @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
      img { width: 100%; height: auto; display: block; opacity: 0; transition: opacity 0.2s ease-in; position: relative; z-index: 2; min-height: 50px; }
      img.loaded { opacity: 1; min-height: auto; }
      .img-wrapper.has-loaded { min-height: auto; background: none; contain-intrinsic-size: auto; }
      .img-wrapper.has-loaded::before { display: none; }
      .img-wrapper.is-error { min-height: 250px; background-color: ${theme.dark ? '#2a2a2a' : '#ffebee'}; cursor: pointer; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; }
      .img-wrapper.is-error::before { display: none; }
      .img-wrapper.is-error::after { content: "Gagal memuat gambar. Ketuk untuk ulangi."; font-family: sans-serif; color: ${errorTextColor}; margin-top: 12px; font-size: 14px; font-weight: 500; }
      .img-wrapper.is-error .error-icon { width: 48px; height: 48px; background-image: url('${errorIconUrl}'); background-repeat: no-repeat; background-position: center; display: block; }
      .img-wrapper.is-error img { display: none; }
    </style>
  `;
}

export const commonComicsJS = `
  function sendToRN(data) { window.ReactNativeWebView.postMessage(JSON.stringify(data)); }

  const PIXELS_PER_SECOND = 60;
  window.autoScrollFrame = null;
  window.scrollSpeed = PIXELS_PER_SECOND;

  window.updateScrollSpeed = (speed) => { window.scrollSpeed = speed * PIXELS_PER_SECOND; };
  window.startAutoScroll = () => {
    if (window.autoScrollFrame) cancelAnimationFrame(window.autoScrollFrame);
    let lastTime = null;
    function step(timestamp) {
      if (!lastTime) lastTime = timestamp;
      const deltaTime = (timestamp - lastTime) / 1000;
      lastTime = timestamp;
      const pixelsToScroll = window.scrollSpeed * deltaTime;
      if (pixelsToScroll > 0) window.scrollBy(0, pixelsToScroll);
      if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 1) {
           window.stopAutoScroll();
           sendToRN({ type: 'END_REACHED' });
      } else { window.autoScrollFrame = requestAnimationFrame(step); }
    }
    window.autoScrollFrame = requestAnimationFrame(step);
  };
  window.stopAutoScroll = () => { if (window.autoScrollFrame) cancelAnimationFrame(window.autoScrollFrame); window.autoScrollFrame = null; };

  const sendScrollUpdate = (id) => { sendToRN({ type: 'SCROLL_UPDATE', id: id }); }
  const historyOptions = { root: null, rootMargin: '20% 0px -50% 0px', threshold: 0 };
  const historyObserver = new IntersectionObserver((entries) => {
    const visibleEntry = entries.find(e => e.isIntersecting);
    if (visibleEntry) sendScrollUpdate(visibleEntry.target.id);
  }, historyOptions);
`;
