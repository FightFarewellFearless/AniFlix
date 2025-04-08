import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import {
  createNativeStackNavigator,
  NativeStackNavigationOptions,
} from '@react-navigation/native-stack';
import * as SplashScreen from 'expo-splash-screen';
import React, { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { Appearance, StatusBar, StyleSheet, Text, useColorScheme, View } from 'react-native';
import ErrorBoundary from 'react-native-error-boundary';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { enableFreeze, enableScreens } from 'react-native-screens';
import useGlobalStyles from './src/assets/style';
import Blank from './src/component/misc/Blank';
import FallbackComponent from './src/component/misc/FallbackErrorBoundary';
import SuspenseLoading from './src/component/misc/SuspenseLoading';
import { EpisodeBaruHomeContext, MovieListHomeContext } from './src/misc/context';
import { EpisodeBaruHome } from './src/types/anime';
import { RootStackNavigator } from './src/types/navigation';
import { Movies } from './src/utils/animeMovie';
import { CFBypassIsOpenContext, setWebViewOpen } from './src/utils/CFBypass';
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
enableScreens(true);

const Stack = createNativeStackNavigator<RootStackNavigator>();

const withSuspense = (Component: React.ComponentType<any>) => (props: any) => (
  <SuspenseLoading>
    <Component {...props} />
  </SuspenseLoading>
);

type Screens = {
  name: keyof RootStackNavigator;
  component: (props: any) => React.JSX.Element;
  options?: NativeStackNavigationOptions;
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
  {
    name: 'Blank',
    component: withSuspense(Blank),
    options: { animation: 'none', presentation: 'transparentModal' },
  },
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
    <ErrorBoundary FallbackComponent={FallbackComponent}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <EpisodeBaruHomeContext
          value={useMemo(() => ({ paramsState, setParamsState }), [paramsState])}>
          <MovieListHomeContext
            value={useMemo(
              () => ({
                paramsState: movieParamsState,
                setParamsState: setMovieParamsState,
              }),
              [movieParamsState],
            )}>
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
              <CFBypassIsOpenContext
                value={useMemo(() => ({ isOpen, url: cfUrl, setIsOpen }), [isOpen, cfUrl])}>
                {isOpen && (
                  <Suspense>
                    <CFBypassWebView />
                  </Suspense>
                )}
              </CFBypassIsOpenContext>
              {__DEV__ && (
                <View style={styles.Dev} pointerEvents="none">
                  <Text style={[globalStyles.text, styles.DevText]}>Dev</Text>
                </View>
              )}
            </NavigationContainer>
          </MovieListHomeContext>
        </EpisodeBaruHomeContext>
      </GestureHandlerRootView>
    </ErrorBoundary>
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
