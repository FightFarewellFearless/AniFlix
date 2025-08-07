import { useContext, useRef } from 'react';
import { Modal, Text, ToastAndroid, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { BASE } from './animeLocalAPI';
import { CFBypassIsOpenContext } from './CFBypass';
import deviceUserAgent from './deviceUserAgent';

export default CFBypassWebView;
function CFBypassWebView() {
  const bypassContext = useContext(CFBypassIsOpenContext);
  const webView = useRef<WebView>(null);
  const lastTitle = useRef('');
  return (
    <Modal
      onRequestClose={() => bypassContext.setIsOpen(false)}
      visible={bypassContext.isOpen}
      transparent
      animationType="fade">
      <View style={{ justifyContent: 'center', flex: 1, backgroundColor: '#00000060' }}>
        <View style={{ height: '50%', width: '100%', justifyContent: 'center' }}>
          <Text style={{ textAlign: 'center', fontSize: 20, fontWeight: 'bold', color: 'white' }}>
            Selesaikan captcha dibawah ini untuk melanjutkan
          </Text>
          <WebView
            ref={webView}
            userAgent={deviceUserAgent}
            source={{
              uri: bypassContext.url,
              headers: {
                'User-Agent': deviceUserAgent,
              },
            }}
            onNavigationStateChange={event => {
              // console.log(event.title, lastTitle.current)
              if (
                (event.title === 'about:blank' ||
                  event.title.startsWith(BASE.domain + '/') ||
                  event.title === '') &&
                lastTitle.current !== 'Just a moment...'
              ) {
                return;
              }
              if (event.title !== 'Just a moment...') {
                bypassContext.setIsOpen(false);
                ToastAndroid.showWithGravity(
                  'Bypass berhasil, silahkan lanjutkan!',
                  ToastAndroid.SHORT,
                  ToastAndroid.CENTER,
                );
              }
              lastTitle.current = event.title;
            }}
            incognito
            sharedCookiesEnabled={true}
            thirdPartyCookiesEnabled={true}
            setSupportMultipleWindows={false}
          />
          <TouchableOpacity
            style={{
              backgroundColor: '#ff8800',
              padding: 7,
              borderRadius: 10,
              alignSelf: 'center',
            }}
            onPress={() => bypassContext.setIsOpen(false)}>
            <Text style={{ color: 'black', fontWeight: 'bold', fontSize: 15, textAlign: 'center' }}>
              Tutup Dan Batalkan
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
