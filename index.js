/**
 * @format
 */
import 'react-native-gesture-handler';
import { registerRootComponent } from 'expo';
import { enableFreeze, enableScreens } from 'react-native-screens';
enableFreeze(true);
enableScreens(true);
import App from './App';

require('moment/locale/id');

registerRootComponent(App);
