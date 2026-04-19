import { use, useCallback, useRef } from 'react';
import { ToastAndroid, View } from 'react-native';
import { WebView } from 'react-native-webview';

import deviceUserAgent from '@utils/deviceUserAgent';
import { BASE_URL } from '@utils/scrapers/comics1';
import { Comics1SessionFetcherContext } from './comics1sessionfetchercontext';

export default function Comics1SessionWebView() {
  const webviewRef = useRef<WebView>(null);
  const context = use(Comics1SessionFetcherContext);
  // useEffect(() => {
  //   // isError = false;z
  // }, []);
  // useEffect(() => {
  //   if (context.isOpen) {
  //     const timeout = setTimeout(() => {
  //       // isError = true;
  //       context.setIsOpen(false);
  //       ToastAndroid.show('Gagal mengambil data komik: timeout', ToastAndroid.SHORT);
  //     }, 15_000);
  //     return () => {
  //       clearTimeout(timeout);
  //     };
  //   }
  // }, [context, context.isOpen]);
  const rejectAllPromisesCollector = useCallback(() => {
    while (context.promisesCollector.current.length > 0) {
      const val = context.promisesCollector.current.shift();
      val?.reject();
    }
    context.setIsOpen(false);
  }, [context]);
  const resolveAllPromisesCollector = useCallback(
    (session: string) => {
      while (context.promisesCollector.current.length > 0) {
        const val = context.promisesCollector.current.shift();
        val?.resolve(decodeURIComponent(session));
      }
      context.setIsOpen(false);
    },
    [context],
  );
  return (
    <View style={{ width: 300, height: 500, display: 'none' }}>
      {context.isOpen && (
        <WebView
          incognito
          cacheEnabled={false}
          domStorageEnabled={false}
          ref={webviewRef}
          userAgent={deviceUserAgent}
          source={{ uri: BASE_URL + '/komik/update' }}
          setSupportMultipleWindows={false}
          injectedJavaScriptBeforeContentLoaded={`
  (function() {
    const PREFIX = '${BASE_URL}';

    // 1. Intercept XMLHttpRequest
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function(method, url) {
      // Save the method and url on the instance so we can access them later
      this._interceptedMethod = method;
      this._interceptedUrl = url;
      return originalOpen.apply(this, arguments);
    };

    XMLHttpRequest.prototype.send = function() {
      // Add a 'load' event listener to fire when the request is fulfilled
      this.addEventListener('load', function() {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'XHR',
          method: this._interceptedMethod,
          url: this._interceptedUrl,
          status: this.status // Optional: sends back the HTTP status code (e.g., 200)
        }));
      }, {once: true});
      
      return originalSend.apply(this, arguments);
    };

    // 2. Intercept Fetch
    const originalFetch = window.fetch;
    window.fetch = function() {
      const arg = arguments;
      let url = typeof arg[0] === 'string' ? arg[0] : arg[0].url;
      let method = arg[1] && arg[1].method ? arg[1].method : 'GET';

      // Call the original fetch, but chain a .then() to wait for it to finish
      return originalFetch.apply(this, arguments).then(function(response) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'FETCH',
          method: method,
          url: url,
          status: response.status // Optional: sends back the HTTP status code
        }));
        return response; 
      });
    };
  })();
  true;
`}
          onMessage={event => {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.url?.startsWith('/api/')) {
              resolveAllPromisesCollector(data.url);
            }
          }}
          onError={() => {
            // isError = true;
            rejectAllPromisesCollector();
            ToastAndroid.show('Gagal mempersiapkan data untuk komik', ToastAndroid.SHORT);
          }}
        />
      )}
    </View>
  );
}
