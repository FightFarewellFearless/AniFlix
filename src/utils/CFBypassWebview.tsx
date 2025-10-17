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
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { CFBypassIsOpenContext } from './CFBypass';
import deviceUserAgent from './deviceUserAgent';

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
      const lastTitleLang = ['Just a moment...', 'Tunggu sebentar...'];
      setWebTitle(event.title);
      if (lastTitleLang.includes(lastTitle.current) && lastTitleLang.includes(event.title)) {
        bypassContext.setIsOpen(false);
        ToastAndroid.show('Bypass berhasil, silahkan lanjutkan!', ToastAndroid.SHORT);
      }
      if (!event.loading && lastTitleLang.includes(event.title)) {
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
            <TouchableOpacity
              style={{
                ...styles.closeButton,
                marginTop: 10,
              }}
              onPress={() => {
                ToastAndroid.show('Proses dibatalkan.', ToastAndroid.SHORT);
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
