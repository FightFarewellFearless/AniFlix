import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { Button, Portal, ProgressBar, Snackbar } from 'react-native-paper';
import WebView, { WebViewMessageEvent } from 'react-native-webview';
import { RootStackNavigator } from '../types/navigation';
import DialogManager from '../utils/dialogManager';
import { getKomikuReading } from '../utils/komiku';
import setHistory from '../utils/historyControl';
import { storage } from '../utils/DatabaseManager';

type Props = NativeStackScreenProps<RootStackNavigator, 'ComicsReading'>;

export default function ComicsReading(props: Props) {
  const comicImages = props.route.params.data.comicImages;

  const spinnerUrl = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHN0eWxlPSJtYXJnaW46IGF1dG87IGJhY2tncm91bmQ6IG5vbmU7IGRpc3BsYXk6IGJsb2NrOyBzaGFwZS1yZW5kZXJpbmc6IGF1dG87IiB3aWR0aD0iNDhweCIgaGVpZ2h0PSI0OHB4IiB2aWV3Qm94PSIwIDAgMTAwIDEwMCIgcHJlc2VydmVBc3BlY3RSYXRpbz0ieE1pZFlNaWQiPgo8Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSIzMiIgc3Ryb2tlLXdpZHRoPSI4IiBzdHJva2U9IiM5M2RiZTkiIHN0cm9rZS1kYXNoYXJyYXk9IjUwLjI2NTQ4MjQ1NzQzNjY5IDUwLjI2NTQ4MjQ1NzQzNjY5IiBmaWxsPSJub25lIiBzdHJva2UtbGluZWNhcD0icm91bmQiPgo8YW5pbWF0ZVRyYW5zZm9ybSBhdHRyaWJ1dGVOYW1lPSJ0cmFuc2Zvcm0iIHR5cGU9InJvdGF0ZSIgcmVwZWF0Q291bnQ9ImluZGVmaW5pdGUiIGR1cj0iMXMiIHZhbHVlcz0iMCA1MCA1MDszNjAgNTAgNTAiIGtleVRpbWVzPSIwOzEiPjwvYW5pbWF0ZVRyYW5zZm9ybT4KPC9jaXJjbGU+Cjwvc3ZnPg==`;
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
      img.loading {
        background-image: url('${spinnerUrl}');
      }
      img.error {
        background-image: url('${errorIconUrl}');
      }
    </style>
  `;

  const body = comicImages
    .map((link, index) => {
      return `<img data-src="${link}" src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=" style="width: 100%; display: block;" id="${index}" />`;
    })
    .join('\n');

  const html = `<head><meta name="viewport" content="width=device-width, initial-scale=1.0" />${styles}</head><body style="margin: 0;">${body}</body>`;

  const injectedJavaScript = `
            ${
              props.route.params.historyData
                ? `

  const element = document.getElementById('${props.route.params.historyData.lastDuration}');
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' });
  };
`
                : ''
            }
    const options = {
      root: null,
      rootMargin: '200px',
      threshold: 0.01
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          const src = img.getAttribute('data-src');

          if (src) {
            img.classList.add('loading');
            img.setAttribute('src', src);
          }
          
          window.ReactNativeWebView.postMessage(entry.target.id);
        }
      });
    }, options);

    document.querySelectorAll('img[data-src]').forEach(img => {
      img.onload = () => {
        img.classList.remove('loading', 'error');
        img.style.minHeight = 'auto';
        img.removeAttribute('data-src');
      };
      img.onerror = () => {
        img.classList.remove('loading');
        img.classList.add('error');
      };
      observer.observe(img);
    });

    document.addEventListener('click', (e) => {
      if (e.target && e.target.tagName === 'IMG' && e.target.classList.contains('error')) {
        const src = e.target.getAttribute('data-src');
        if (src) {
          e.target.classList.remove('error');
          e.target.classList.add('loading');
          e.target.setAttribute('src', src);
        }
      }
    });
  `;

  const abortController = useRef<AbortController>(null);
  abortController.current ??= new AbortController();
  useEffect(() => {
    return () => abortController.current?.abort();
  }, []);

  useEffect(() => {
    props.navigation.setOptions({
      headerTitle: props.route.params.data.chapter,
    });
  }, [props.navigation, props.route.params.data.chapter]);

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
      storage.getString('history') ?? '[]',
      false,
      true,
    );
  };

  const [moveChapterLoading, setMoveChapterLoading] = useState(false);
  const moveChapter = useCallback(
    (url: string) => {
      setMoveChapterLoading(true);
      getKomikuReading(url, abortController.current?.signal)
        .then(res => {
          props.navigation.setParams({
            data: res,
            link: url,
            historyData: undefined,
          });
        })
        .catch(err => {
          if (err.name === 'AbortError') return;
          DialogManager.alert('Gagal mengambil data', err.message);
        })
        .finally(() => setMoveChapterLoading(false));
    },
    [props.navigation],
  );
  console.log(props.route.params.historyData);
  const { data } = props.route.params;

  return (
    <View style={{ flex: 1 }}>
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
        cacheEnabled={false}
        source={{ html }}
        injectedJavaScript={injectedJavaScript}
        onMessage={handleMessage}
        webviewDebuggingEnabled
      />
      <View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
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
        <ProgressBar progress={currentlyVisibleImageId / (comicImages.length - 1)} />
      </View>
    </View>
  );
}
