/**
 * @format
 */
global.Buffer = require('buffer/').Buffer;
import 'react-native-gesture-handler';
import { registerRootComponent } from 'expo';
import { enableFreeze, enableScreens } from 'react-native-screens';
enableFreeze(true);
enableScreens(true);

import dns from 'react-native-nitro-dns';
dns.setServers(['1dot1dot1dot1.cloudflare-dns.com']);
dns.setNativeInterceptionEnabled(true);

import App from './App';

require('moment/locale/id');

registerRootComponent(App);
