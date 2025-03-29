import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, StackNavigationOptions } from '@react-navigation/stack';
import * as SplashScreen from 'expo-splash-screen';
import React, { lazy, Suspense, useEffect, useState } from 'react';
import { Appearance, StatusBar, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider } from 'react-redux';

import { enableFreeze } from 'react-native-screens';
import useGlobalStyles from './src/assets/style';
import SuspenseLoading from './src/component/misc/SuspenseLoading';
import { EpisodeBaruHomeContext, MovieListHomeContext } from './src/misc/context';
import store from './src/misc/reduxStore';
import { EpisodeBaruHome } from './src/types/anime';
import { RootStackNavigator } from './src/types/navigation';
import { Movies } from './src/utils/animeMovie';
import { CFBypassIsOpen, setWebViewOpen } from './src/utils/CFBypass';
import { storage } from './src/utils/DatabaseManager';

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
const SeeMore = lazy(() => import('./src/component/Home/SeeMore'));

SplashScreen.preventAutoHideAsync();
enableFreeze(true);

const Stack = createStackNavigator<RootStackNavigator>();

const withSuspense = (Component: React.ComponentType<any>) => (props: any) => (
  <SuspenseLoading>
    <Component {...props} />
  </SuspenseLoading>
);

type Screens = {
  name: keyof RootStackNavigator;
  component: (props: any) => React.JSX.Element;
  options?: StackNavigationOptions;
}[];

const screens: Screens = [
  { name: 'Home', component: withSuspense(Home), options: undefined },
  { name: 'AnimeDetail', component: withSuspense(AniDetail), options: undefined },
  { name: 'MovieDetail', component: withSuspense(MovieDetail), options: undefined },
  { name: 'FromUrl', component: withSuspense(FromUrl), options: undefined },
  { name: 'Video', component: withSuspense(Video), options: undefined },
  { name: 'connectToServer', component: withSuspense(Connecting), options: undefined },
  { name: 'NeedUpdate', component: withSuspense(NeedUpdate), options: undefined },
  { name: 'Blocked', component: withSuspense(Blocked), options: undefined },
  { name: 'FailedToConnect', component: withSuspense(FailedToConnect), options: undefined },
  { name: 'SeeMore', component: withSuspense(SeeMore), options: { headerShown: true } },
];

function App() {
  const [isOpen, setIsOpen] = useState(false);
  const [cfUrl, setCfUrl] = useState('');

  const [paramsState, setParamsState] = useState<EpisodeBaruHome>({
    jadwalAnime: {},
    newAnime: [],
  });
  const [movieParamsState, setMovieParamsState] = useState<Movies[]>([]);

  const colorScheme = useColorScheme();
  const globalStyles = useGlobalStyles();

  useEffect(() => {
    setWebViewOpen.openWebViewCF = (isOpenCF: boolean, url: string) => {
      setIsOpen(isOpenCF);
      setCfUrl(url);
    };
  }, []);

  useEffect(() => {
    const colorSchemeValue = storage.getString('colorScheme');
    if (
      colorSchemeValue !== 'auto' &&
      (colorSchemeValue === 'light' || colorSchemeValue === 'dark')
    ) {
      Appearance.setColorScheme(colorSchemeValue);
    }
    StatusBar.setHidden(false);
    SplashScreen.hideAsync();
  }, []);

  useEffect(() => {
    StatusBar.setBackgroundColor(colorScheme === 'dark' ? '#0A0A0A' : '#FFFFFF');
    StatusBar.setBarStyle(colorScheme === 'dark' ? 'light-content' : 'dark-content');
  }, [colorScheme]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <EpisodeBaruHomeContext.Provider value={{ paramsState, setParamsState }}>
        <MovieListHomeContext.Provider
          value={{ paramsState: movieParamsState, setParamsState: setMovieParamsState }}>
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
                {screens.map(({ name, component, options }) => (
                  <Stack.Screen key={name} name={name} options={options}>
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
        </MovieListHomeContext.Provider>
      </EpisodeBaruHomeContext.Provider>
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
