/**
 * @format
 */
import 'react-native-gesture-handler';
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import { polyfill as polyfillEncoding } from 'react-native-polyfill-globals/src/encoding';
import { polyfill as polyfillReadableStream } from 'react-native-polyfill-globals/src/readable-stream';
import { polyfill as polyfillFetch } from 'react-native-polyfill-globals/src/fetch';

import codePush from 'react-native-code-push';

require('moment/locale/id');

polyfillEncoding();
polyfillReadableStream();
polyfillFetch();

AppRegistry.registerComponent(appName, () => codePush({ checkFrequency: codePush.CheckFrequency.MANUAL })(App));
