/**
 * @format
 */
import 'react-native-gesture-handler';
import { AppRegistry, Text } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

require('moment/locale/id');

Text.defaultProps = Text.defaultProps || {};
Text.defaultProps.allowFontScaling = false;

AppRegistry.registerComponent(appName, () => App);
