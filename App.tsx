import React, { lazy, Suspense, useEffect, useState } from 'react';
import { Appearance, StatusBar, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider } from 'react-redux';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SplashScreen from 'expo-splash-screen';

import useGlobalStyles from './src/assets/style';
import store from './src/misc/reduxStore';
import { RootStackNavigator } from './src/types/navigation';
import { enableFreeze } from 'react-native-screens';
import { CFBypassIsOpen, setWebViewOpen } from './src/utils/CFBypass';
import SuspenseLoading from './src/component/misc/SuspenseLoading';

const AniDetail = lazy(() => import('./src/component/AniDetail'));
const Home = lazy(() => import('./src/component/Home/Home'));
const Video = lazy(() => import('./src/component/Video'));
const Blocked = lazy(() => import('./src/component/Blocked'));
const FailedToConnect = lazy(() => import('./src/component/FailedToConnect'));
const NeedUpdate = lazy(() => import('./src/component/NeedUpdate'));
const MovieDetail = lazy(() => import('./src/component/MovieDetail'));
const CFBypassWebView = lazy(() => import('./src/utils/CFBypassWebview'));
const Connecting = lazy(() => import('./src/component/Loading Screen/Connect'));
const FromUrl = lazy(() => import('./src/component/Loading Screen/FromUrl'));

SplashScreen.preventAutoHideAsync();
enableFreeze(true);

const Stack = createStackNavigator<RootStackNavigator>();

const withSuspense = (Component: React.ComponentType<any>) => (props: any) => (
  <SuspenseLoading>
    <Component {...props} />
  </SuspenseLoading>
);

const screens = [
  { name: 'Home', component: withSuspense(Home) },
  { name: 'AnimeDetail', component: withSuspense(AniDetail) },
  { name: 'MovieDetail', component: withSuspense(MovieDetail) },
  { name: 'FromUrl', component: withSuspense(FromUrl) },
  { name: 'Video', component: withSuspense(Video) },
  { name: 'connectToServer', component: withSuspense(Connecting) },
  { name: 'NeedUpdate', component: withSuspense(NeedUpdate) },
  { name: 'Blocked', component: withSuspense(Blocked) },
  { name: 'FailedToConnect', component: withSuspense(FailedToConnect) },
] as const;

function App() {
  const [isOpen, setIsOpen] = useState(false);
  const [cfUrl, setCfUrl] = useState('');
  const colorScheme = useColorScheme();
  const globalStyles = useGlobalStyles();

  useEffect(() => {
    setWebViewOpen.openWebViewCF = (isOpenCF: boolean, url: string) => {
      setIsOpen(isOpenCF);
      setCfUrl(url);
    };
  }, []);

  useEffect(() => {
    AsyncStorage.getItem('colorScheme').then(value => {
      if (value !== 'auto' && (value === 'light' || value === 'dark')) {
        Appearance.setColorScheme(value);
      }
    });
    StatusBar.setHidden(false);
    SplashScreen.hideAsync();
  }, []);

  useEffect(() => {
    StatusBar.setBackgroundColor(colorScheme === 'dark' ? '#0A0A0A' : '#FFFFFF');
    StatusBar.setBarStyle(colorScheme === 'dark' ? 'light-content' : 'dark-content');
  }, [colorScheme]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer
        theme={
          colorScheme === 'dark'
            ? {
                ...DarkTheme,
                colors: {
                  ...DarkTheme.colors,
                  background: '#0A0A0A',
                },
              }
            : undefined
        }>
        <Provider store={store}>
          <Stack.Navigator
            initialRouteName="connectToServer"
            screenOptions={{
              headerShown: false,
            }}>
            {screens.map(({ name, component }) => (
              <Stack.Screen key={name} name={name}>
                {component}
              </Stack.Screen>
            ))}
          </Stack.Navigator>
        </Provider>
        <CFBypassIsOpen.Provider value={{ isOpen, url: cfUrl, setIsOpen }}>
          {isOpen && (
            <Suspense>
              <CFBypassWebView />
            </Suspense>
          )}
        </CFBypassIsOpen.Provider>
        {__DEV__ && (
          <View style={styles.Dev} pointerEvents="none">
            <Text style={[globalStyles.text, styles.DevText]}>Dev</Text>
          </View>
        )}
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  Dev: {
    position: 'absolute',
    bottom: 40,
    zIndex: 100,
    backgroundColor: '#c2c2047e',
    padding: 5,
    paddingHorizontal: 20,
    borderTopRightRadius: 40,
    borderBottomLeftRadius: 40,
  },
  DevText: {
    fontWeight: 'bold',
    fontSize: 17,
  },
});

export default App;
