import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React, { lazy, Suspense, useEffect, useState } from 'react';
import { ActivityIndicator, StatusBar, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { Provider } from 'react-redux';

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import useGlobalStyles from './src/assets/style';
import Connecting from './src/component/Loading Screen/Connect';
import FromUrl from './src/component/Loading Screen/FromUrl';
import store from './src/misc/reduxStore';
import { RootStackNavigator } from './src/types/navigation';
// import AniDetail from './src/component/AniDetail';
const AniDetail = lazy(() => import('./src/component/AniDetail'));
// import Home from './src/component/Home/Home';
const Home = lazy(() => import('./src/component/Home/Home'));
// const FromUrl = lazy(() => import('./src/component/Loading Screen/FromUrl'));
// import Video from './src/component/Video';
const Video = lazy(() => import('./src/component/Video'));
// import Blocked from './src/component/Blocked';
const Blocked = lazy(() => import('./src/component/Blocked'));
// import FailedToConnect from './src/component/FailedToConnect';
const FailedToConnect = lazy(() => import('./src/component/FailedToConnect'));
// import NeedUpdate from './src/component/NeedUpdate';
const NeedUpdate = lazy(() => import('./src/component/NeedUpdate'));
// import { enableScreens } from 'react-native-screens';
import { enableFreeze } from 'react-native-screens';
import MovieDetail from './src/component/MovieDetail';
import { CFBypassIsOpen, setWebViewOpen } from './src/utils/CFBypass';
const CFBypassWebView = lazy(() => import('./src/utils/CFBypassWebview'));

import * as SplashScreen from 'expo-splash-screen';
SplashScreen.preventAutoHideAsync();

enableFreeze(true);
// enableScreens(false);

function Loading() {
  return (
    <ActivityIndicator
      style={{ flex: 1, justifyContent: 'center', alignSelf: 'center' }}
      size="large"
    />
  );
}

const Stack = createStackNavigator<RootStackNavigator>();
function App() {
  const [isOpen, setIsOpen] = useState(false);
  const [cfUrl, setCfUrl] = useState('');
  useEffect(() => {
    setWebViewOpen.openWebViewCF = (isOpenCF: boolean, url: string) => {
      setIsOpen(isOpenCF);
      setCfUrl(url);
    };
  }, []);
  const colorScheme = useColorScheme();
  useEffect(() => {
    StatusBar.setHidden(false);
    SplashScreen.hideAsync();
  }, []);
  useEffect(() => {
    StatusBar.setBackgroundColor(colorScheme === 'dark' ? '#0A0A0A' : '#FFFFFF');
    StatusBar.setBarStyle(colorScheme === 'dark' ? 'light-content' : 'dark-content');
  }, [colorScheme]);
  const globalStyles = useGlobalStyles();

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
              // animation: 'fade_from_bottom',
            }}>
            <Stack.Screen name="Home">
              {props => (
                <Suspense fallback={<Loading />}>
                  <Home navigation={props.navigation} route={props.route} />
                </Suspense>
              )}
            </Stack.Screen>
            <Stack.Screen name="AnimeDetail">
              {props => (
                <Suspense fallback={<Loading />}>
                  <AniDetail {...props} />
                </Suspense>
              )}
            </Stack.Screen>
            <Stack.Screen name="MovieDetail">
              {props => (
                <Suspense fallback={<Loading />}>
                  <MovieDetail {...props} />
                </Suspense>
              )}
            </Stack.Screen>
            <Stack.Screen name="FromUrl">
              {props => (
                <Suspense fallback={<Loading />}>
                  <FromUrl {...props} />
                </Suspense>
              )}
            </Stack.Screen>
            <Stack.Screen name="Video">
              {props => (
                <Suspense fallback={<Loading />}>
                  <Video {...props} />
                </Suspense>
              )}
            </Stack.Screen>
            <Stack.Screen name="connectToServer">
              {props => (
                <Suspense fallback={<Loading />}>
                  <Connecting {...props} />
                </Suspense>
              )}
            </Stack.Screen>
            <Stack.Screen name="NeedUpdate">
              {props => (
                <Suspense fallback={<Loading />}>
                  <NeedUpdate {...props} />
                </Suspense>
              )}
            </Stack.Screen>
            <Stack.Screen name="Blocked">
              {props => (
                <Suspense fallback={<Loading />}>
                  <Blocked {...props} />
                </Suspense>
              )}
            </Stack.Screen>
            <Stack.Screen name="FailedToConnect">
              {props => (
                <Suspense fallback={<Loading />}>
                  <FailedToConnect {...props} />
                </Suspense>
              )}
            </Stack.Screen>
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
