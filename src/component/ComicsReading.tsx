import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import {
  Appbar,
  Button,
  IconButton,
  Portal,
  ProgressBar,
  Snackbar,
  useTheme,
} from 'react-native-paper';
import SystemNavigationBar from 'react-native-system-navigation-bar';
import WebView, { WebViewMessageEvent } from 'react-native-webview';
import { useBackHandler } from '../hooks/useBackHandler';
import { RootStackNavigator } from '../types/navigation';
import DialogManager from '../utils/dialogManager';
import setHistory from '../utils/historyControl';
import { getKomikuReading } from '../utils/komiku';
import { SystemBars } from 'react-native-edge-to-edge';

type Props = NativeStackScreenProps<RootStackNavigator, 'ComicsReading'>;

export default function ComicsReading(props: Props) {
  const theme = useTheme();
  const abortController = useRef<AbortController>(null);
  abortController.current ??= new AbortController();
  useEffect(() => {
    return () => abortController.current?.abort();
  }, []);

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
  };

  const [moveChapterLoading, setMoveChapterLoading] = useState(false);
  const moveChapter = useCallback(
    (url: string) => {
      if (moveChapterLoading) return;
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
    [moveChapterLoading, props.navigation],
  );

  const { data } = props.route.params;
  const comicImages = props.route.params.data.comicImages;
  const errorIconUrl = `data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiA/Pjxzdmcgdmlld0JveD0iMCAwIDI0IDI0IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxnPjxwYXRoIGQ9Ik0wIDBIMjRWMjRIMHoiIGZpbGw9Im5vbmUiLz48cGF0aCBkPSJNMTIgM2M0LjI4NCAwIDguMjIgMS40OTcgMTEuMzEgMy45OTZMMjIuNDk4IDhIMTh2NS41NzFMMTIgMjEgLjY5IDYuOTk3QzMuNzggNC40OTcgNy43MTQgMyAxMiAzem0xMCAxNnYyaC0ydi0yaDJ6bTAtOXY3aC0ydi03aDJ6Ii8+PC9nPjwvc3ZnPg==`;

  const styles = `
    <style>
      img {
        min-height: 250px;
        width: 100%;
        background-color: #f0f0f0;
        background-repeat: no-repeat;
        background-position: center;
        background-size: 48px 48px;
      }
      img.error {
        background-image: url('${errorIconUrl}');
      }
    </style>
  `;

  const body = comicImages
    .map((link, index) => {
      return `<img loading="lazy" src="${link}" style="width: 100%; display: block;" id="${index}" />`;
    })
    .join('\n');

  const html = `<head><meta name="viewport" content="width=device-width, initial-scale=1.0" />${styles}</head><body style="margin: 0;">${body}</body>`;

  const injectedJavaScript = `
            ${
              props.route.params.historyData
                ? `

  const lastDuration = '${props.route.params.historyData.lastDuration}';
  const target = document.getElementById(lastDuration);
  if (target) {
    target.scrollIntoView({ behavior: 'instant' });
    setTimeout(() => {
      target.scrollIntoView({ behavior: 'smooth' });
    }, 1000);
  };
`
                : ''
            }
    const options = {
      root: null,
      rootMargin: '20px 0px -500px 0px',
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
      img.onload = () => {
        img.classList.remove('error');
        img.style.minHeight = 'auto';
      };
      img.onerror = () => {
        img.classList.add('error');
      };
      observer.observe(img);
    });

    document.addEventListener('click', (e) => {
      if (e.target && e.target.tagName === 'IMG' && e.target.classList.contains('error')) {
        const src = e.target.getAttribute('src');
        if (src) {
          e.target.classList.remove('error');
          e.target.setAttribute('src', '');
          e.target.setAttribute('src', src);
        }
      }
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
          wrapperStyle={{ bottom: 30 }}
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
        style={{ flex: 1 }}
        overScrollMode="never"
        cacheEnabled={false}
        source={{ html }}
        injectedJavaScript={injectedJavaScript}
        onMessage={handleMessage}
        webviewDebuggingEnabled
      />
      <View>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-around',
            display: isFullscreen ? 'none' : 'flex',
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
