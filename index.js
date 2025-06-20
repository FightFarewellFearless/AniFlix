/**
 * @format
 */
import 'react-native-gesture-handler';
import { registerRootComponent } from 'expo';
import { Text } from 'react-native';
import App from './App';

require('moment/locale/id');

Text.defaultProps = Text.defaultProps || {};
Text.defaultProps.allowFontScaling = false;

registerRootComponent(App);
