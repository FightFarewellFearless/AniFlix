/**
 * @format
 */
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
require('moment/locale/id');

AppRegistry.registerComponent(appName, () => App);
