import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Platform,
  Pressable,
  TVFocusGuideView,
  View,
  useTVEventHandler,
  findNodeHandle,
} from 'react-native';
import { FileSystem } from '@/platform/FileSystem';
import { Appbar, ProgressBar, useTheme } from 'react-native-paper';
import WebView, { WebViewMessageEvent } from 'react-native-webview';
import AdmZip from 'adm-zip';

import { RootStackNavigator } from '@/types/navigation';
import { cleanCbzDir, getCbzDir } from '@utils/cbzCleaner';
import {
  ComicsBottomBar,
  FullscreenExitButton,
  commonComicsJS,
  getComicsBgColor,
  getComicsStyles,
  getTvComicsStyles,
  tvDpadScrollJS,
  useAutoScroll,
  useComicsFullscreen,
} from './SharedComics';

type Props = NativeStackScreenProps<RootStackNavigator, 'CbzReader'>;

export default function CbzReader(props: Props) {
  const theme = useTheme();
  const webViewRef = useRef<WebView>(null);

  const { isFullscreen, setIsFullscreen } = useComicsFullscreen();
  const { isAutoScrolling, setIsAutoScrolling, scrollSpeed, toggleAutoScroll, changeSpeed } =
    useAutoScroll(webViewRef);
  const [currentlyVisibleImageId, setCurrentlyVisibleImageId] = useState(0);

  // --- Comics preparation ---
  const [comicImages, setComicsImages] = useState<string[]>([]);
  useEffect(() => {
    (async () => {
      const cbzDirPath = await getCbzDir();
      const newSource = cbzDirPath + 'a.cbz';
      await cleanCbzDir();

      // Copy file using FileSystem
      await FileSystem.cp(props.route.params.fileUrl, newSource);

      // Extract zip using adm-zip on Windows, react-native-zip-archive on Android
      if (
        Platform.OS === 'windows' ||
        (typeof window !== 'undefined' && (window as any).electronAPI?.isWindows)
      ) {
        const zip = new AdmZip(newSource);
        zip.extractAllTo(cbzDirPath, true);
        const fs = await import('fs');
        fs.unlinkSync(newSource);
        const files = fs.readdirSync(cbzDirPath);
        setComicsImages(files.map(file => 'file://' + cbzDirPath + file));
      } else {
        await FileSystem.cp(props.route.params.fileUrl, newSource);
        // For Android, use react-native-zip-archive via platform abstraction
        // (kept as-is for Android compatibility)
        const { unzip } = await import('react-native-zip-archive');
        await unzip(newSource, cbzDirPath);
        await FileSystem.unlink(newSource);
        const files = await FileSystem.ls(cbzDirPath);
        setComicsImages(files.map(file => 'file://' + cbzDirPath + file));
      }
    })();
  }, [props.route.params.fileUrl]);
  // --- Layout & Handlers ---

  useEffect(() => {
    props.navigation.setOptions({
      headerTitle: 'Baca offline',
      headerShown: !isFullscreen,
      header: headerProps => (
        <Appbar.Header>
          {headerProps.back && (
            <Appbar.BackAction
              onPress={() => {
                headerProps.navigation.goBack();
              }}
            />
          )}
          <Appbar.Content
            titleStyle={{ fontWeight: 'bold' }}
            title={
              typeof headerProps.options.headerTitle === 'string'
                ? headerProps.options.headerTitle
                : ''
            }
          />
          <Appbar.Action
            icon={isFullscreen ? 'fullscreen-exit' : 'fullscreen'}
            onPress={() => {
              setIsFullscreen(f => !f);
            }}
          />
        </Appbar.Header>
      ),
    });
  }, [isFullscreen, props.navigation, setIsFullscreen]);

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'SCROLL_UPDATE') {
        const visibleImageId = Number(data.id);
        if (!isNaN(visibleImageId)) {
          if (visibleImageId !== currentlyVisibleImageId) {
            setCurrentlyVisibleImageId(visibleImageId);
          }
        }
      } else if (data.type === 'END_REACHED') {
        setIsAutoScrolling(false);
      }
    } catch {
      if (event.nativeEvent.data === 'endReached') {
        setIsAutoScrolling(false);
      }
    }
  };

  // --- HTML Generation ---

  const bgColor = getComicsBgColor(theme);
  const styles = getComicsStyles(theme);
  const tvStyles = getTvComicsStyles();

  const body = comicImages
    .map((link, index) => {
      return `
        <div class="img-wrapper" id="wrap-${index}">
           <div class="error-icon" style="display:none"></div>
           <img 
              src="${link}" 
              id="${index}"
              loading="lazy"
              onload="this.classList.add('loaded'); this.parentElement.classList.add('has-loaded');"
              onerror="this.parentElement.classList.add('is-error');"
           />
        </div>
      `;
    })
    .join('\n');

  const html = `<head><meta name="viewport" content="width=device-width, initial-scale=1.0" />${styles}${tvStyles}</head><body>${body}</body>`;

  const injectedJavaScript = `
    ${commonComicsJS}
    const allImages = document.querySelectorAll('img');
    allImages.forEach(img => {
      historyObserver.observe(img);
    });

    ${tvDpadScrollJS}
  `;

  // --- TV D-Pad Event Handler ---
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
            webViewRef.current?.injectJavaScript(`window.tvScrollBy(-200); true;`);
          } else if (evt.eventType === 'down') {
            webViewRef.current?.injectJavaScript(`window.tvScrollBy(200); true;`);
          }
        }
      },
      [tvWebViewFocused],
    ),
  );

  // TV sidebar layout
  if (Platform.isTV) {
    return (
      <TVFocusGuideView autoFocus style={{ flex: 1, flexDirection: 'row' }}>
        <FullscreenExitButton isFullscreen={isFullscreen} setIsFullscreen={setIsFullscreen} />

        {/* WebView area */}
        <Pressable
          ref={webViewPressableRef}
          nextFocusUp={webViewPressableNode || undefined}
          nextFocusDown={webViewPressableNode || undefined}
          style={{ flex: 1 }}
          focusable={true}
          hasTVPreferredFocus={isFullscreen}
          onFocus={() => setTvWebViewFocused(true)}
          onBlur={() => setTvWebViewFocused(false)}>
          <WebView
            ref={webViewRef}
            style={{ flex: 1, backgroundColor: bgColor }}
            overScrollMode="never"
            cacheEnabled={false}
            source={{ html }}
            injectedJavaScript={injectedJavaScript}
            onMessage={handleMessage}
            showsVerticalScrollIndicator={false}
            androidLayerType="hardware"
            originWhitelist={['*']}
            allowFileAccess={true}
            allowUniversalAccessFromFileURLs={true}
            allowFileAccessFromFileURLs={true}
          />
        </Pressable>

        {/* TV Sidebar */}
        <View style={{ justifyContent: 'center', display: isFullscreen ? 'none' : 'flex' }}>
          <ComicsBottomBar
            isAutoScrolling={isAutoScrolling}
            toggleAutoScroll={toggleAutoScroll}
            scrollSpeed={scrollSpeed}
            changeSpeed={changeSpeed}
            isFullscreen={isFullscreen}
            tvSidebar={true}
            toggleFullscreen={() => setIsFullscreen(f => !f)}
          />

          <ProgressBar
            style={{
              marginBottom: isFullscreen ? 4 : 0,
              height: 4,
              width: 180,
            }}
            progress={currentlyVisibleImageId / (comicImages.length - 1)}
          />
        </View>
      </TVFocusGuideView>
    );
  }

  // Mobile layout (unchanged)
  return (
    <View style={{ flex: 1 }}>
      <FullscreenExitButton isFullscreen={isFullscreen} setIsFullscreen={setIsFullscreen} />

      <WebView
        ref={webViewRef}
        style={{ flex: 1, backgroundColor: bgColor }}
        overScrollMode="never"
        cacheEnabled={false}
        source={{ html }}
        injectedJavaScript={injectedJavaScript}
        onMessage={handleMessage}
        showsVerticalScrollIndicator={false}
        androidLayerType="hardware"
        originWhitelist={['*']}
        allowFileAccess={true}
        allowUniversalAccessFromFileURLs={true}
        allowFileAccessFromFileURLs={true}
      />

      <View>
        <ComicsBottomBar
          isAutoScrolling={isAutoScrolling}
          toggleAutoScroll={toggleAutoScroll}
          scrollSpeed={scrollSpeed}
          changeSpeed={changeSpeed}
          isFullscreen={isFullscreen}
        />

        <ProgressBar
          style={{
            marginBottom: isFullscreen ? 4 : 0,
            height: 4,
          }}
          progress={currentlyVisibleImageId / (comicImages.length - 1)}
        />
      </View>
    </View>
  );
}
