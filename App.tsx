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
import { Appbar, Button, Dialog, PaperProvider, Portal } from 'react-native-paper';

import { SafeAreaProvider } from 'react-native-safe-area-context';
import { enableFreeze, enableScreens } from 'react-native-screens';
import SystemNavigationBar from 'react-native-system-navigation-bar';
import useGlobalStyles from './src/assets/style';
import ErrorScreen from './src/component/misc/ErrorScreen';
import FallbackComponent from './src/component/misc/FallbackErrorBoundary';
import SafeAreaWrapper from './src/component/misc/SafeAreaWrapper';
import SuspenseLoading from './src/component/misc/SuspenseLoading';
import { EpisodeBaruHomeContext, MovieListHomeContext } from './src/misc/context';
import { navigationRef, replaceAllWith } from './src/misc/NavigationService';
import { EpisodeBaruHome } from './src/types/anime';
import { RootStackNavigator } from './src/types/navigation';
import { Movies } from './src/utils/animeMovie';
import { CFBypassIsOpenContext, setWebViewOpen } from './src/utils/CFBypass';
import { storage } from './src/utils/DatabaseManager';
import DialogManager from './src/utils/dialogManager';

const AniDetail = lazy(() => import('./src/component/AniDetail'));
const Home = lazy(() => import('./src/component/Home/Home'));
const Video = lazy(() => import('./src/component/Video'));
const Blocked = lazy(() => import('./src/component/Blocked'));
const FailedToConnect = lazy(() => import('./src/component/FailedToConnect'));
const NeedUpdate = lazy(() => import('./src/component/NeedUpdate'));
const MovieDetail = lazy(() => import('./src/component/MovieDetail'));
const ComicsDetail = lazy(() => import('./src/component/ComicsDetail'));
const CFBypassWebView = lazy(() => import('./src/utils/CFBypassWebview'));
const Connecting = lazy(() => import('./src/component/Loading Screen/Connect'));
const FromUrl = lazy(() => import('./src/component/Loading Screen/FromUrl'));
const SeeMore = lazy(() => import('./src/component/Home/SeeMore'));

SplashScreen.preventAutoHideAsync();
enableFreeze(true);
enableScreens(true);

const Stack = createNativeStackNavigator<RootStackNavigator>();

const withSuspenseAndSafeArea = (Component: React.ComponentType<any>, safeArea = true) => {
  const SuspenseComponent = (props: any) => (
    <SuspenseLoading>
      <Component {...props} />
    </SuspenseLoading>
  );
  return (props: any) =>
    safeArea ? (
      <SafeAreaWrapper>{<SuspenseComponent {...props} />}</SafeAreaWrapper>
    ) : (
      <SuspenseComponent {...props} />
    );
};

// TEMP|TODO|WORKAROUND: fix random crash "value is undefined expected an object"
if (!__DEV__) {
  ErrorUtils.setGlobalHandler((error, isFatal) => {
    if (error instanceof Error && isFatal) {
      console.error('[Suppressed Error]:', error);
      if (error.message.includes('Value is undefined, expected an Object')) {
        return;
      }
      replaceAllWith('ErrorScreen', { error });
    }
  });
}

type Screens = {
  name: keyof RootStackNavigator;
  component: (props: any) => React.JSX.Element;
  options?: NativeStackNavigationOptions;
}[];

const screens: Screens = [
  { name: 'Home', component: withSuspenseAndSafeArea(Home), options: undefined },
  { name: 'AnimeDetail', component: withSuspenseAndSafeArea(AniDetail), options: undefined },
  { name: 'MovieDetail', component: withSuspenseAndSafeArea(MovieDetail), options: undefined },
  { name: 'ComicsDetail', component: withSuspenseAndSafeArea(ComicsDetail), options: undefined },
  { name: 'FromUrl', component: withSuspenseAndSafeArea(FromUrl), options: undefined },
  { name: 'Video', component: withSuspenseAndSafeArea(Video, false), options: undefined },
  { name: 'connectToServer', component: withSuspenseAndSafeArea(Connecting), options: undefined },
  { name: 'NeedUpdate', component: withSuspenseAndSafeArea(NeedUpdate), options: undefined },
  { name: 'Blocked', component: withSuspenseAndSafeArea(Blocked), options: undefined },
  {
    name: 'FailedToConnect',
    component: withSuspenseAndSafeArea(FailedToConnect),
    options: undefined,
  },
  { name: 'SeeMore', component: withSuspenseAndSafeArea(SeeMore), options: { headerShown: true } },
  {
    name: 'ErrorScreen',
    component: ErrorScreen,
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
    SystemNavigationBar.setNavigationColor(colorScheme === 'dark' ? '#0A0A0A' : '#FFFFFF');
  }, [colorScheme]);

  // Dialog related
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogContent, setDialogContent] = useState({
    title: '',
    message: '',
    buttons: [] as { text: string; onPress: () => void }[],
  });
  useEffect(() => {
    DialogManager.setupDialog(setDialogVisible, setDialogContent);
  }, []);

  return (
    <SafeAreaProvider>
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
                ref={navigationRef}
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
                <PaperProvider>
                  <Portal>
                    <Dialog
                      visible={dialogVisible}
                      dismissable={false}
                      dismissableBackButton
                      onDismiss={() => setDialogVisible(false)}>
                      <Dialog.Title>{dialogContent.title}</Dialog.Title>
                      <Dialog.Content>
                        <Text style={globalStyles.text}>{dialogContent.message}</Text>
                      </Dialog.Content>
                      <Dialog.Actions>
                        {dialogContent.buttons.map((button, index) => (
                          <Button
                            key={index}
                            onPress={() => {
                              button.onPress();
                              setDialogVisible(false);
                            }}>
                            {button.text}
                          </Button>
                        ))}
                      </Dialog.Actions>
                    </Dialog>
                  </Portal>
                  <Stack.Navigator
                    initialRouteName="connectToServer"
                    screenOptions={{
                      headerShown: false,
                      header: props => (
                        <Appbar.Header>
                          {props.back && (
                            <Appbar.BackAction
                              onPress={() => {
                                props.navigation.goBack();
                              }}
                            />
                          )}
                          <Appbar.Content
                            titleStyle={{ fontWeight: 'bold' }}
                            title={
                              typeof props.options.headerTitle === 'string'
                                ? props.options.headerTitle
                                : ''
                            }
                          />
                        </Appbar.Header>
                      ),
                    }}>
                    {screens.map(({ name, component, options }) => (
                      <Stack.Screen key={name} name={name} options={options}>
                        {component}
                      </Stack.Screen>
                    ))}
                  </Stack.Navigator>
                </PaperProvider>
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
    </SafeAreaProvider>
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
