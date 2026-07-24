import { useCallback, useContext, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  ToastAndroid,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from 'react-native-paper';
import Icon from '@react-native-vector-icons/material-design-icons';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { CFBypassIsOpenContext } from './CFBypass';
import deviceUserAgent from './deviceUserAgent';
import { updateAnimeMovieCookie } from './scrapers/animeMovie';

const { height, width } = Dimensions.get('window');

export default CFBypassWebView;
function CFBypassWebView() {
  const theme = useTheme();
  const styles = useStyles();
  const bypassContext = useContext(CFBypassIsOpenContext);
  const webView = useRef<WebView>(null);
  const lastTitle = useRef<string>('');

  const [webTitle, setWebTitle] = useState('');

  const handleNavigationStateChange = useCallback(
    (event: WebViewNavigation) => {
      const challengeTitles = [
        'Just a moment...',
        'Tunggu sebentar...',
        'Loading..',
        'Loading...',
        'Loading',
      ];
      setWebTitle(event.title);

      const isChallengeTitle = (t: string) =>
        Boolean(t) && challengeTitles.some(ct => t.toLowerCase().includes(ct.toLowerCase()));

      const wasChallenge = isChallengeTitle(lastTitle.current);
      const nowNotChallenge = !isChallengeTitle(event.title) || event.title.includes('AnimeSail');

      if (wasChallenge && nowNotChallenge) {
        if (bypassContext.url.includes('154.26.137.28')) {
          updateAnimeMovieCookie();
        }
        bypassContext.setIsOpen(false);
        bypassContext.successCallback.current?.();
        ToastAndroid.show('Bypass berhasil, silahkan lanjutkan!', ToastAndroid.SHORT);
      }
      if (!event.loading && isChallengeTitle(event.title)) {
        lastTitle.current = event.title;
      }
    },
    [bypassContext],
  );

  return (
    <Modal
      onRequestClose={() => bypassContext.setIsOpen(false)}
      visible={bypassContext.isOpen}
      transparent
      animationType="fade">
      <View style={styles.modalContainer}>
        <View style={styles.contentWrapper}>
          <View style={styles.header}>
            <Text style={styles.headerText}>{webTitle}</Text>
            <TouchableOpacity onPress={() => bypassContext.setIsOpen(false)}>
              <Icon name="close-circle-outline" size={24} color={theme.colors.error} />
            </TouchableOpacity>
          </View>

          <WebView
            ref={webView}
            userAgent={deviceUserAgent}
            source={{
              uri: bypassContext.url,
              headers: {
                'User-Agent': deviceUserAgent,
                'Accept-Language': 'en-US,en;q=0.9',
              },
            }}
            incognito={bypassContext.url.includes('154.26.137.28')}
            cacheEnabled={false}
            onNavigationStateChange={handleNavigationStateChange}
            sharedCookiesEnabled={true}
            thirdPartyCookiesEnabled={true}
            setSupportMultipleWindows={false}
            style={styles.webViewStyle}
          />

          <View
            style={{
              padding: 15,
              borderTopWidth: 1,
              borderTopColor: theme.colors.surfaceDisabled,
            }}>
            <Text style={{ color: theme.colors.onSurface, textAlign: 'center', fontSize: 13 }}>
              Selesaikan verifikasi di atas untuk melanjutkan.
            </Text>
            <Text style={{ color: theme.colors.onSurface, textAlign: 'center', fontSize: 13 }}>
              Jika setelah verifikasi selesai namun halaman ini tidak tertutup otomatis, kamu boleh
              menutupnya manual
            </Text>
            <TouchableOpacity
              style={{
                ...styles.closeButton,
                marginTop: 10,
              }}
              onPress={() => {
                bypassContext.setIsOpen(false);
              }}>
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
        height: height * 0.7,
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
    theme.colors.surfaceDisabled,
  ]);
};
