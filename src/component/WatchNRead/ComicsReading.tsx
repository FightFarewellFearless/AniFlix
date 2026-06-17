import { useFocusEffect } from '@react-navigation/core';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Linking,
  Platform,
  Pressable,
  TVFocusGuideView,
  View,
  findNodeHandle,
  useTVEventHandler,
} from 'react-native';
import { Appbar, Button, Portal, ProgressBar, Snackbar, useTheme } from 'react-native-paper';
import WebView, { WebViewMessageEvent } from 'react-native-webview';

import { RootStackNavigator } from '@/types/navigation';
import DialogManager from '@utils/dialogManager';
import setHistory from '@utils/historyControl';
import { getComicsReading } from '@utils/scrapers/comicsv2';
import { getKomikuReading } from '@utils/scrapers/komiku';
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

type Props = NativeStackScreenProps<RootStackNavigator, 'ComicsReading'>;

export default function ComicsReading(props: Props) {
  const theme = useTheme();
  const webViewRef = useRef<WebView>(null);

  const abortController = useRef<AbortController>(null);
  const imageFetchOnRNAbortController = useRef<AbortController>(null);

  useFocusEffect(
    useCallback(() => {
      abortController.current = new AbortController();
      imageFetchOnRNAbortController.current = new AbortController();
      return () => {
        abortController.current?.abort();
        imageFetchOnRNAbortController.current?.abort();
      };
    }, []),
  );

  const [isSnackBarOpen, setIsSnackBarOpen] = useState(false);
  const [snackBarText, setSnackBarText] = useState('');

  const { isFullscreen, setIsFullscreen } = useComicsFullscreen();
  const { isAutoScrolling, setIsAutoScrolling, scrollSpeed, toggleAutoScroll, changeSpeed } =
    useAutoScroll(webViewRef);
  const [currentlyVisibleImageId, setCurrentlyVisibleImageId] = useState(0);

  // --- Layout & Handlers ---

  const comicsDownloadLoading = useRef(false);
  const startComicsDownload = useCallback(() => {
    if (comicsDownloadLoading.current) return;
    comicsDownloadLoading.current = true;
    fetch('https://vortexdownloader.rwbcode.com/api/requestComicsDownloadId', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: props.route.params.data.title + ' - ' + props.route.params.data.chapter,
        comicImages: props.route.params.data.comicImages,
        sourceLink: props.route.params.link,
      }),
      signal: abortController.current?.signal,
    })
      .then(res => res.json())
      .then(res => {
        Linking.openURL(`https://vortexdownloader.rwbcode.com/api/getComicsDownload/${res.id}`);
      })
      .finally(() => {
        setIsSnackBarOpen(false);
        comicsDownloadLoading.current = false;
      })
      .catch(err => {
        if (err.name === 'AbortError') return;
        DialogManager.alert('Gagal memulai unduhan', err.message);
      });
    setSnackBarText('Menyiapkan unduhan...');
    setIsSnackBarOpen(true);
  }, [
    props.route.params.data.chapter,
    props.route.params.data.comicImages,
    props.route.params.data.title,
    props.route.params.link,
  ]);
  useEffect(() => {
    props.navigation.setOptions({
      headerTitle: props.route.params.link.includes('softkomik')
        ? 'Chapter ' + props.route.params.data.chapter
        : props.route.params.data.chapter,
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
          <Appbar.Action icon={'download'} onPress={startComicsDownload} />
          <Appbar.Action
            icon={isFullscreen ? 'fullscreen-exit' : 'fullscreen'}
            onPress={() => {
              setIsFullscreen(f => !f);
            }}
          />
        </Appbar.Header>
      ),
    });
  }, [
    isFullscreen,
    props.navigation,
    props.route.params.data.chapter,
    props.route.params.data.comicImages,
    props.route.params.data.title,
    props.route.params.link,
    setIsFullscreen,
    startComicsDownload,
  ]);

  // --- Fetch Logic ---

  const fetchImageAndSendToWebView = async (id: number, url: string) => {
    try {
      const response = await fetch(url, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
          ...(props.route.params.link.includes('softkomik') ||
          props.route.params.link.includes('komiku')
            ? { Referer: new URL(props.route.params.link).href }
            : {}),
        },
        cache: 'no-cache',
        signal: imageFetchOnRNAbortController.current?.signal,
      });

      const blob = await response.blob();
      const reader = new FileReader();

      reader.onloadend = () => {
        const base64data = reader.result;
        if (typeof base64data === 'string') {
          const safeBase64 = base64data.replace(/(\r\n|\n|\r)/gm, '');

          webViewRef.current?.injectJavaScript(`
            window.requestAnimationFrame(() => {
              window.receiveImageBase64(${id}, "${safeBase64}");
            });
            true;
          `);
        }
      };

      reader.onerror = () => {
        webViewRef.current?.injectJavaScript(`window.onImageErrorById(${id}); true;`);
      };

      reader.readAsDataURL(blob);
    } catch {
      webViewRef.current?.injectJavaScript(`window.onImageErrorById(${id}); true;`);
    }
  };

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'SCROLL_UPDATE') {
        const visibleImageId = Number(data.id);
        if (!isNaN(visibleImageId)) {
          if (visibleImageId !== currentlyVisibleImageId) {
            setCurrentlyVisibleImageId(visibleImageId);
            setHistory(
              props.route.params.data,
              props.route.params.link,
              true,
              { lastDuration: visibleImageId },
              false,
              true,
            );
          }
        }
      } else if (data.type === 'REQUEST_IMAGE') {
        fetchImageAndSendToWebView(data.id, data.url);
      } else if (data.type === 'END_REACHED') {
        setIsAutoScrolling(false);
      } else if (data.type === 'CHAPTER_NAV' && Platform.isTV) {
        // TV D-Pad left/right chapter navigation from WebView
        if (data.direction === 'prev' && props.route.params.data.prevChapter) {
          moveChapter(props.route.params.data.prevChapter);
        } else if (data.direction === 'next' && props.route.params.data.nextChapter) {
          moveChapter(props.route.params.data.nextChapter);
        }
      }
    } catch {
      if (event.nativeEvent.data === 'endReached') {
        setIsAutoScrolling(false);
      }
    }
  };

  const moveChapter = useCallback(
    (url: string) => {
      if (isSnackBarOpen) return;
      if (isAutoScrolling) toggleAutoScroll();

      setSnackBarText('Mengambil data...');
      setIsSnackBarOpen(true);
      (url.includes('komikindo') || url.includes('softkomik')
        ? getComicsReading
        : getKomikuReading)(url, abortController.current?.signal)
        .then(res => {
          imageFetchOnRNAbortController.current?.abort();
          imageFetchOnRNAbortController.current = new AbortController();
          props.navigation.setParams({
            data: res,
            link: url,
            historyData: undefined,
          });
          setHistory(res, url, false, undefined, false, true);
        })
        .catch(err => {
          if (err.name === 'AbortError') return;
          DialogManager.alert('Gagal mengambil data', err.message);
        })
        .finally(() => setIsSnackBarOpen(false));
    },
    [isSnackBarOpen, isAutoScrolling, toggleAutoScroll, props.navigation],
  );

  const { data } = props.route.params;
  const comicImages = props.route.params.data.comicImages;

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
              data-src="${link}" 
              id="${index}"
           />
        </div>
      `;
    })
    .join('\n');

  const html = `<head><meta name="viewport" content="width=device-width, initial-scale=1.0" />${styles}${tvStyles}</head><body>${body}</body>`;

  const injectedJavaScript = `
    ${commonComicsJS}
    window.receiveImageBase64 = (id, base64Data) => {
        const img = document.getElementById(id);
        const wrapper = document.getElementById('wrap-' + id);
        if (!img || !wrapper) return;

        const bufferImg = new Image();
        bufferImg.src = base64Data;
        bufferImg.decode()
            .then(() => {
                const wrapperRect = wrapper.getBoundingClientRect();
                const isAboveViewport = wrapperRect.top < 0;

                const oldHeight = wrapper.offsetHeight;
                const oldScrollY = window.scrollY;

                img.src = base64Data;
                img.classList.add('loaded');
                img.removeAttribute('data-fetching');
            
                wrapper.classList.add('has-loaded');
                wrapper.classList.remove('is-error'); 
            
                const newHeight = wrapper.offsetHeight;
                const delta = newHeight - oldHeight;

                if (isAboveViewport && delta !== 0) {
                    window.scrollTo(0, oldScrollY + delta);
                }
                window.fetchObserver.unobserve(img);
              })
              .catch((err) => {
                img.src = base64Data;
                img.removeAttribute('data-fetching');
        });
    };

    window.onImageErrorById = (id) => {
       const wrapper = document.getElementById('wrap-' + id);
       const img = document.getElementById(id);
       
       if (img) img.removeAttribute('data-fetching');
       if (wrapper) {
         wrapper.classList.add('is-error');
         const icon = wrapper.querySelector('.error-icon');
         if(icon) icon.style.display = 'block';
       }
    };

    // Retry Listener
    document.addEventListener('click', (e) => {
      const wrapper = e.target.closest('.img-wrapper.is-error');
      if (wrapper) {
        const img = wrapper.querySelector('img');
        if (img) {
          wrapper.classList.remove('is-error');
          const icon = wrapper.querySelector('.error-icon');
          if(icon) icon.style.display = 'none';
          img.style.display = 'block';

          sendToRN({ type: 'REQUEST_IMAGE', id: img.id, url: img.dataset.src });
          img.setAttribute('data-fetching', 'true');
        }
      }
    });

    // --- Restore History ---
    ${
      props.route.params.historyData
        ? `
          setTimeout(() => {
             const lastDuration = '${props.route.params.historyData.lastDuration}';
             const target = document.getElementById(lastDuration);
             if (target) {
               target.scrollIntoView({ behavior: 'instant', block: 'end' });
               setTimeout(() => {
                 target.scrollIntoView({ behavior: 'smooth', block: 'end' });
               }, 500);
             };
          }, 300);
          `
        : ''
    }

    // 2. Fetch Observer
    const fetchOptions = {
      root: null,
      rootMargin: '250% 0px 250% 0px',
      threshold: 0.01
    };

    window.fetchObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const img = entry.target;

        if (entry.isIntersecting) {
            if (!img.loadTimer) {
              img.loadTimer = setTimeout(() => {
                if (!img.classList.contains('loaded') && !img.hasAttribute('data-fetching')) {
                  img.setAttribute('data-fetching', 'true');
                  sendToRN({
                    type: 'REQUEST_IMAGE',
                    id: img.id,
                    url: img.dataset.src
                  });
                }
                img.loadTimer = null;
              }, 150); 
            }
        } else {
            if (img.loadTimer) {
                clearTimeout(img.loadTimer);
                img.loadTimer = null;
            }
        }
      });
    }, fetchOptions);

    // Init Observers
    const allImages = document.querySelectorAll('img');
    allImages.forEach(img => {
      historyObserver.observe(img);
      window.fetchObserver.observe(img);
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
        <Portal>
          <Snackbar
            duration={Infinity}
            onDismiss={() => setIsSnackBarOpen(false)}
            visible={isSnackBarOpen}
            action={{
              label: 'Batal',
              onPress: () => {
                abortController.current?.abort();
                abortController.current = new AbortController();
              },
            }}>
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
            toggleFullscreen={() => setIsFullscreen(f => !f)}>
            {data.prevChapter && (
              <TVChapterButton
                label="Sebelumnya"
                icon="arrow-left"
                onPress={() => moveChapter(data.prevChapter!)}
              />
            )}
            {data.nextChapter && (
              <TVChapterButton
                label="Selanjutnya"
                icon="arrow-right"
                onPress={() => moveChapter(data.nextChapter!)}
              />
            )}
          </ComicsBottomBar>

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
      <Portal>
        <Snackbar
          duration={Infinity}
          onDismiss={() => setIsSnackBarOpen(false)}
          visible={isSnackBarOpen}
          action={{
            label: 'Batal',
            onPress: () => {
              abortController.current?.abort();
              abortController.current = new AbortController();
            },
          }}>
          {snackBarText}
        </Snackbar>
      </Portal>

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
      />

      <View>
        <ComicsBottomBar
          isAutoScrolling={isAutoScrolling}
          toggleAutoScroll={toggleAutoScroll}
          scrollSpeed={scrollSpeed}
          changeSpeed={changeSpeed}
          isFullscreen={isFullscreen}>
          {data.prevChapter && (
            <Button
              icon="arrow-left"
              onPress={() => {
                moveChapter(data.prevChapter!);
              }}>
              Sebelumnya
            </Button>
          )}
          {data.nextChapter && (
            <Button
              icon="arrow-right"
              onPress={() => {
                moveChapter(data.nextChapter!);
              }}
              contentStyle={{ flexDirection: 'row-reverse' }}>
              Selanjutnya
            </Button>
          )}
        </ComicsBottomBar>

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

// TV-only chapter nav button with focus highlight
function TVChapterButton({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <Pressable
      focusable={true}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 8,
        width: '100%',
        backgroundColor: focused ? theme.colors.primaryContainer : 'transparent',
        borderWidth: focused ? 2 : 0,
        borderColor: focused ? theme.colors.primary : 'transparent',
      }}>
      <Button icon={icon} compact>
        {label}
      </Button>
    </Pressable>
  );
}
