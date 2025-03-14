/**
 * @format
 */
import 'react-native-gesture-handler';
import { AppRegistry, Text } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

import { configureReanimatedLogger } from 'react-native-reanimated';

require('moment/locale/id');

configureReanimatedLogger({
  strict: false,
});

Text.defaultProps = Text.defaultProps || {};
Text.defaultProps.allowFontScaling = false;

AppRegistry.registerComponent(appName, () => App);
