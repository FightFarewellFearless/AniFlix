/**
 * @format
 */
import 'react-native-gesture-handler';
import { AppRegistry, Text } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import { polyfill as polyfillEncoding } from 'react-native-polyfill-globals/src/encoding';
import { polyfill as polyfillReadableStream } from 'react-native-polyfill-globals/src/readable-stream';
import { polyfill as polyfillFetch } from 'react-native-polyfill-globals/src/fetch';

import { configureReanimatedLogger } from 'react-native-reanimated';

require('moment/locale/id');

configureReanimatedLogger({
  strict: false,
});

polyfillEncoding();
polyfillReadableStream();
polyfillFetch();

Text.defaultProps = Text.defaultProps || {};
Text.defaultProps.allowFontScaling = false;

AppRegistry.registerComponent(appName, () => App);
