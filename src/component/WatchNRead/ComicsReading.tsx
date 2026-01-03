import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, View } from 'react-native';
import { SystemBars } from 'react-native-edge-to-edge';
import {
  Appbar,
  Button,
  IconButton,
  Portal,
  ProgressBar,
  Snackbar,
  Text,
  useTheme,
} from 'react-native-paper';
import SystemNavigationBar from 'react-native-system-navigation-bar';
import WebView, { WebViewMessageEvent } from 'react-native-webview';
import { useBackHandler } from '../../hooks/useBackHandler';
import { RootStackNavigator } from '../../types/navigation';
import DialogManager from '../../utils/dialogManager';
import setHistory from '../../utils/historyControl';
import { getKomikuReading } from '../../utils/scrapers/komiku';

type Props = NativeStackScreenProps<RootStackNavigator, 'ComicsReading'>;

export default function ComicsReading(props: Props) {
  const theme = useTheme();
  const webViewRef = useRef<WebView>(null);

  const abortController = useRef<AbortController>(null);
  abortController.current ??= new AbortController();

  useEffect(() => {
    const appState = AppState.addEventListener('blur', () => {
      webViewRef.current?.injectJavaScript(`window.stopAutoScroll(); true;`);
      setIsAutoScrolling(false);
    });
    return () => {
      appState.remove();
      abortController.current?.abort();
    };
  }, []);

  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(1.0);

  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    SystemNavigationBar.fullScreen(isFullscreen);
    if (isFullscreen) {
      SystemNavigationBar.navigationHide();
      SystemBars.setHidden(true);
    } else {
      SystemNavigationBar.navigationShow();
      SystemBars.setHidden(false);
    }
  }, [isFullscreen]);

  useEffect(() => {
    return () => {
      SystemNavigationBar.fullScreen(false);
      SystemNavigationBar.navigationShow();
      SystemBars.setHidden(false);
    };
  }, []);

  useBackHandler(
    useCallback(() => {
      if (isFullscreen) {
        setIsFullscreen(false);
        return true;
      } else return false;
    }, [isFullscreen]),
  );

  useEffect(() => {
    props.navigation.setOptions({
      headerTitle: props.route.params.data.chapter,
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
  }, [isFullscreen, props.navigation, props.route.params.data.chapter]);

  const [currentlyVisibleImageId, setCurrentlyVisibleImageId] = useState(0);

  const handleMessage = (event: WebViewMessageEvent) => {
    if (!isNaN(Number(event.nativeEvent.data))) {
      const visibleImageId = Number(event.nativeEvent.data);
      setCurrentlyVisibleImageId(visibleImageId);
      setHistory(
        props.route.params.data,
        props.route.params.link,
        true,
        {
          lastDuration: visibleImageId,
        },
        false,
        true,
      );
    } else if (event.nativeEvent.data === 'endReached') {
      setIsAutoScrolling(false);
    }
  };

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
  }, [isAutoScrolling, scrollSpeed]);

  const changeSpeed = (delta: number) => {
    setScrollSpeed(prev => {
      const newSpeed = Math.max(0.2, parseFloat((prev + delta).toFixed(1)));
      if (isAutoScrolling) {
        webViewRef.current?.injectJavaScript(`window.updateScrollSpeed(${newSpeed}); true;`);
      }
      return newSpeed;
    });
  };

  const [moveChapterLoading, setMoveChapterLoading] = useState(false);
  const moveChapter = useCallback(
    (url: string) => {
      if (moveChapterLoading) return;
      if (isAutoScrolling) toggleAutoScroll();

      setMoveChapterLoading(true);
      getKomikuReading(url, abortController.current?.signal)
        .then(res => {
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
        .finally(() => setMoveChapterLoading(false));
    },
    [moveChapterLoading, isAutoScrolling, toggleAutoScroll, props.navigation],
  );

  const { data } = props.route.params;
  const comicImages = props.route.params.data.comicImages;

  const bgColor = theme.dark ? '#121212' : '#ffffff';
  const shimmerBase = theme.dark ? '#333333' : '#e0e0e0';
  const shimmerHighlight = theme.dark ? '#444444' : '#f0f0f0';
  const errorTextColor = theme.dark ? '#ffb4ab' : '#ba1a1a'; // Material Design Error colors

  const errorSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${errorTextColor}"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>`;
  const errorIconUrl = `data:image/svg+xml;base64,${btoa(errorSvg)}`;

  const styles = `
    <style>
      body {
        margin: 0;
        background-color: ${bgColor};
      }
      
      .img-wrapper {
        min-height: 300px;
        width: 100%;
        position: relative;
        background-color: ${shimmerBase};
        overflow: hidden;
        display: flex;
        justify-content: center;
        align-items: center;
      }

      /* Skeleton Loading Animation */
      .img-wrapper::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, ${shimmerBase} 25%, ${shimmerHighlight} 50%, ${shimmerBase} 75%);
        background-size: 200% 100%;
        animation: shimmer 1.5s infinite;
        z-index: 1;
      }

      @keyframes shimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }

      img {
        width: 100%;
        display: block;
        opacity: 0; /* Hidden by default for fade-in */
        transition: opacity 0.4s ease-in;
        position: relative;
        z-index: 2;
        min-height: 50px; /* Prevent total collapse */
      }

      img.loaded {
        opacity: 1;
        min-height: auto;
        background-color: transparent;
      }

      /* Saat gambar sudah load, hilangkan skeleton wrapper */
      .img-wrapper.has-loaded {
        min-height: auto;
        background: none;
      }
      .img-wrapper.has-loaded::before {
        display: none;
      }

      /* Error State Styling */
      .img-wrapper.is-error {
        min-height: 250px;
        background-color: ${theme.dark ? '#2a2a2a' : '#ffebee'};
        cursor: pointer;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        text-align: center;
      }
      .img-wrapper.is-error::before {
        display: none; /* Hide shimmer */
      }
      
      .img-wrapper.is-error::after {
        content: "Gagal memuat gambar. Ketuk untuk ulangi.";
        font-family: sans-serif;
        color: ${errorTextColor};
        margin-top: 12px;
        font-size: 14px;
        font-weight: 500;
      }

      .img-wrapper.is-error .error-icon {
        width: 48px;
        height: 48px;
        background-image: url('${errorIconUrl}');
        background-repeat: no-repeat;
        background-position: center;
        display: block;
      }
      
      .img-wrapper.is-error img {
        display: none;
      }
    </style>
  `;

  const body = comicImages
    .map((link, index) => {
      return `
        <div class="img-wrapper" id="wrap-${index}">
           <div class="error-icon" style="display:none"></div>
           <img 
              loading="lazy" 
              src="${link}" 
              id="${index}"
              onload="onImageLoad(this)"
              onerror="onImageError(this)"
           />
        </div>
      `;
    })
    .join('\n');

  const html = `<head><meta name="viewport" content="width=device-width, initial-scale=1.0" />${styles}</head><body>${body}</body>`;

  const injectedJavaScript = `
    window.onImageLoad = (img) => {
      img.classList.add('loaded');
      const wrapper = document.getElementById('wrap-' + img.id);
      if(wrapper) wrapper.classList.add('has-loaded');
    };

    window.onImageError = (img) => {
       if (img.src && img.src.includes('cdn1')) {
         img.src = img.src.replace('cdn1', 'img');
         return;
       }

       const wrapper = document.getElementById('wrap-' + img.id);
       if(wrapper) {
         wrapper.classList.add('is-error');
         const icon = wrapper.querySelector('.error-icon');
         if(icon) icon.style.display = 'block';
       }
    };

    document.addEventListener('click', (e) => {
      const wrapper = e.target.closest('.img-wrapper.is-error');
      
      if (wrapper) {
        const img = wrapper.querySelector('img');
        if (img) {
          wrapper.classList.remove('is-error');
          const icon = wrapper.querySelector('.error-icon');
          if(icon) icon.style.display = 'none';
          img.style.display = 'block';

          const currentSrc = img.src;
          img.src = ''; 
          img.src = currentSrc;
        }
      }
    });

    const PIXELS_PER_SECOND = 60;
    window.autoScrollFrame = null;
    window.scrollSpeed = PIXELS_PER_SECOND;

    window.updateScrollSpeed = (speed) => {
      window.scrollSpeed = speed * PIXELS_PER_SECOND;
    };

    window.startAutoScroll = () => {
      if (window.autoScrollFrame) cancelAnimationFrame(window.autoScrollFrame);

      let lastTime = null;

      function step(timestamp) {
        if (!lastTime) lastTime = timestamp;

        const deltaTime = (timestamp - lastTime) / 1000;
        lastTime = timestamp;

        const pixelsToScroll = window.scrollSpeed * deltaTime;

        if (pixelsToScroll > 0) {
            window.scrollBy(0, pixelsToScroll);
        }

        if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 1) {
             window.stopAutoScroll();
             window.ReactNativeWebView.postMessage('endReached');
        } else {
           window.autoScrollFrame = requestAnimationFrame(step);
        }
      }
      
      window.autoScrollFrame = requestAnimationFrame(step);
    };

    window.stopAutoScroll = () => {
      if (window.autoScrollFrame) cancelAnimationFrame(window.autoScrollFrame);
      window.autoScrollFrame = null;
    };

    ${
      props.route.params.historyData
        ? `
          setTimeout(() => {
             const lastDuration = '${props.route.params.historyData.lastDuration}';
             const target = document.getElementById(lastDuration);
             if (target) {
               target.scrollIntoView({ behavior: 'instant' });
               setTimeout(() => {
                 target.scrollIntoView({ behavior: 'smooth' });
               }, 500);
             };
          }, 300);
          `
        : ''
    }

    const options = {
      root: null,
      rootMargin: '20px 0px -50% 0px',
      threshold: 0.01
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          window.ReactNativeWebView.postMessage(img.id);
        }
      });
    }, options);

    document.querySelectorAll('img').forEach(img => {
      observer.observe(img);
    });
  `;

  return (
    <View style={{ flex: 1 }}>
      <View
        style={{
          display: isFullscreen ? 'flex' : 'none',
          position: 'absolute',
          top: 5,
          right: 5,
          zIndex: 999,
        }}>
        <IconButton
          onPress={() => {
            setIsFullscreen(false);
          }}
          iconColor={theme.colors.primary}
          icon="fullscreen-exit"
          size={30}
          mode="outlined"
        />
      </View>
      <Portal>
        <Snackbar
          duration={Infinity}
          onDismiss={() => {
            setMoveChapterLoading(false);
          }}
          visible={moveChapterLoading}
          action={{
            label: 'Batal',
            onPress: () => {
              abortController.current?.abort();
              abortController.current = new AbortController();
            },
          }}>
          Mengambil data...
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
        <View
          style={{
            backgroundColor: theme.colors.elevation.level1,
            justifyContent: 'space-around',
            display: isFullscreen ? 'none' : 'flex',
          }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
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

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-around',
            }}>
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
          </View>
        </View>

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
