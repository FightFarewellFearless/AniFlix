import {
  LinkingOptions,
  NavigationContainer,
  DarkTheme as ReactNavigationDarkTheme,
  DefaultTheme as ReactNavigationDefaultTheme,
} from '@react-navigation/native';
import {
  createNativeStackNavigator,
  NativeStackNavigationOptions,
} from '@react-navigation/native-stack';
import * as SplashScreen from 'expo-splash-screen';
import React, { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Appearance, Linking, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { SystemBars } from 'react-native-edge-to-edge';
import ErrorBoundary from 'react-native-error-boundary';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import {
  adaptNavigationTheme,
  Appbar,
  Button,
  Dialog,
  PaperProvider,
  Portal,
} from 'react-native-paper';

import ReactNativeBlobUtil from 'react-native-blob-util';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import SystemNavigationBar from 'react-native-system-navigation-bar';
import { MDDark, MDLight } from './src/assets/MaterialTheme';
import useGlobalStyles from './src/assets/style';
import ErrorScreen from './src/component/misc/ErrorScreen';
import FallbackComponent from './src/component/misc/FallbackErrorBoundary';
import {
  ComicsListContext,
  EpisodeBaruHomeContext,
  FilmListHomeContext,
  MovieListHomeContext,
  SeriesListHomeContext,
} from './src/misc/context';
import { navigationRef, replaceAllWith } from './src/misc/NavigationService';
import { withSuspenseAndSafeArea } from './src/misc/withSuspenseAndSafeArea.tsx';
import { EpisodeBaruHome } from './src/types/anime';
import { RootStackNavigator } from './src/types/navigation';
import { cleanCbzDir } from './src/utils/cbzCleaner.ts';
import { CFBypassIsOpenContext, setWebViewOpen } from './src/utils/CFBypass';
import {
  Comics1ChapterSessionFetcherContext,
  comics1FetchChapterSession,
} from './src/utils/comics1SessionFetcher/comics1chaptersessionfetchercontext.ts';
import Comics1ChapterSessionWebView from './src/utils/comics1SessionFetcher/comics1chaptersessionfetcherwebview.tsx';
import {
  comics1FetchSession,
  Comics1SessionFetcherContext,
  PromiseResRej,
} from './src/utils/comics1SessionFetcher/comics1sessionfetchercontext.ts';
import Comics1SessionWebView from './src/utils/comics1SessionFetcher/comics1sessionfetcherwebview.tsx';
import { DatabaseManager } from './src/utils/DatabaseManager';
import DialogManager from './src/utils/dialogManager';
import { Movies } from './src/utils/scrapers/animeMovie';
import { LatestComicsRelease } from './src/utils/scrapers/comicsv2';
import { FilmHomePage } from './src/utils/scrapers/film';

cleanCbzDir();

const { DarkTheme, LightTheme } = adaptNavigationTheme({
  reactNavigationLight: ReactNavigationDefaultTheme,
  reactNavigationDark: ReactNavigationDarkTheme,
});

const CombinedDefaultTheme = {
  ...MDLight,
  ...LightTheme,
  colors: {
    ...LightTheme.colors,
    ...MDLight.colors,
  },
};
const CombinedDarkTheme = {
  ...MDDark,
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    ...MDDark.colors,
  },
};

let CbzReader: React.ComponentType<any>;
let AniDetail: React.ComponentType<any>;
let Home: React.ComponentType<any>;
let Video: React.ComponentType<any>;
let Video_Film: React.ComponentType<any>;
let FailedToConnect: React.ComponentType<any>;
let NeedUpdate: React.ComponentType<any>;
let MovieDetail: React.ComponentType<any>;
let FilmDetail: React.ComponentType<any>;
let ComicsDetail: React.ComponentType<any>;
let ComicsReading: React.ComponentType<any>;
let CFBypassWebView: React.ComponentType<any>;
let Connecting: React.ComponentType<any>;
let FromUrl: React.ComponentType<any>;
let SeeMore: React.ComponentType<any>;

if (__DEV__) {
  CbzReader = require('./src/component/WatchNRead/CbzReader.tsx').default;
  AniDetail = require('./src/component/EpisodeDetail/AniDetail').default;
  Home = require('./src/component/Home/Home').default;
  Video = require('./src/component/WatchNRead/Video').default;
  Video_Film = require('./src/component/WatchNRead/Video_Film').default;
  FailedToConnect = require('./src/component/NeedAttention/FailedToConnect').default;
  NeedUpdate = require('./src/component/NeedAttention/NeedUpdate').default;
  MovieDetail = require('./src/component/EpisodeDetail/MovieDetail').default;
  FilmDetail = require('./src/component/EpisodeDetail/FilmDetail').default;
  ComicsDetail = require('./src/component/EpisodeDetail/ComicsDetail').default;
  ComicsReading = require('./src/component/WatchNRead/ComicsReading').default;
  CFBypassWebView = require('./src/utils/CFBypassWebview').default;
  Connecting = require('./src/component/Loading Screen/Connect').default;
  FromUrl = require('./src/component/Loading Screen/FromUrl').default;
  SeeMore = require('./src/component/Home/SeeMore').default;
} else {
  CbzReader = lazy(() => import('./src/component/WatchNRead/CbzReader.tsx'));
  AniDetail = lazy(() => import('./src/component/EpisodeDetail/AniDetail'));
  Home = lazy(() => import('./src/component/Home/Home'));
  Video = lazy(() => import('./src/component/WatchNRead/Video'));
  Video_Film = lazy(() => import('./src/component/WatchNRead/Video_Film'));
  FailedToConnect = lazy(() => import('./src/component/NeedAttention/FailedToConnect'));
  NeedUpdate = lazy(() => import('./src/component/NeedAttention/NeedUpdate'));
  MovieDetail = lazy(() => import('./src/component/EpisodeDetail/MovieDetail'));
  FilmDetail = lazy(() => import('./src/component/EpisodeDetail/FilmDetail'));
  ComicsDetail = lazy(() => import('./src/component/EpisodeDetail/ComicsDetail'));
  ComicsReading = lazy(() => import('./src/component/WatchNRead/ComicsReading'));
  CFBypassWebView = lazy(() => import('./src/utils/CFBypassWebview'));
  Connecting = lazy(() => import('./src/component/Loading Screen/Connect'));
  FromUrl = lazy(() => import('./src/component/Loading Screen/FromUrl'));
  SeeMore = lazy(() => import('./src/component/Home/SeeMore'));
}

SplashScreen.preventAutoHideAsync();

const Stack = createNativeStackNavigator<RootStackNavigator>();

const linking: LinkingOptions<RootStackNavigator> = {
  prefixes: ['aniflix://'],
  config: {
    initialRouteName: 'connectToServer',
    screens: {
      CbzReader: 'cbzReader',
    },
  },

  async getInitialURL() {
    const url = await Linking.getInitialURL();
    if (
      url &&
      (url.startsWith('file://') || url.startsWith('content://')) &&
      (await ReactNativeBlobUtil.fs.stat(url)).filename.endsWith('.cbz')
    ) {
      const encodedUrl = encodeURIComponent(url);
      return `aniflix://cbzReader?fileUrl=${encodedUrl}`;
    }
    return null;
  },

  subscribe(listener) {
    const onReceiveURL = async ({ url }: { url: string }) => {
      if (
        url &&
        (url.startsWith('file://') || url.startsWith('content://')) &&
        (await ReactNativeBlobUtil.fs.stat(url)).filename.endsWith('.cbz')
      ) {
        const encodedUrl = encodeURIComponent(url);
        listener(`aniflix://cbzReader?fileUrl=${encodedUrl}`);
      }
    };

    const subscription = Linking.addEventListener('url', onReceiveURL);
    return () => subscription.remove();
  },
};

// Handle JavaScript Error globally
if (!__DEV__) {
  ErrorUtils.setGlobalHandler((error, isFatal) => {
    if (error instanceof Error && isFatal) {
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
  { name: 'CbzReader', component: withSuspenseAndSafeArea(CbzReader, true, true) },
  { name: 'Home', component: withSuspenseAndSafeArea(Home, false), options: undefined },
  { name: 'AnimeDetail', component: withSuspenseAndSafeArea(AniDetail, false), options: undefined },
  {
    name: 'MovieDetail',
    component: withSuspenseAndSafeArea(MovieDetail, false),
    options: undefined,
  },
  {
    name: 'FilmDetail',
    component: withSuspenseAndSafeArea(FilmDetail, false),
    options: undefined,
  },
  {
    name: 'ComicsDetail',
    component: withSuspenseAndSafeArea(ComicsDetail, false),
    options: undefined,
  },
  {
    name: 'ComicsReading',
    component: withSuspenseAndSafeArea(ComicsReading, true, true),
    options: undefined,
  },
  { name: 'FromUrl', component: withSuspenseAndSafeArea(FromUrl), options: { headerShown: true } },
  { name: 'Video', component: withSuspenseAndSafeArea(Video, false), options: undefined },
  { name: 'Video_Film', component: withSuspenseAndSafeArea(Video_Film, false), options: undefined },
  { name: 'connectToServer', component: withSuspenseAndSafeArea(Connecting), options: undefined },
  { name: 'NeedUpdate', component: withSuspenseAndSafeArea(NeedUpdate), options: undefined },
  {
    name: 'FailedToConnect',
    component: withSuspenseAndSafeArea(FailedToConnect),
    options: undefined,
  },
  {
    name: 'SeeMore',
    component: withSuspenseAndSafeArea(SeeMore, false),
    options: { headerShown: true },
  },
  {
    name: 'ErrorScreen',
    component: ErrorScreen,
  },
];

function App() {
  const [isOpen, setIsOpen] = useState(false);
  const [cfUrl, setCfUrl] = useState('');

  const [isComics1FetchSessionOpen, setIsComics1FetchSessionOpen] = useState(false);
  const [isComics1FetchChapterSessionOpen, setIsComics1FetchChapterSessionOpen] = useState(false);
  const comics1SessionPromisesCollector = useRef<PromiseResRej[]>([]);
  const comics1ChapterSessionPromisesCollector = useRef<PromiseResRej[]>([]);
  const comics1ChapterSessionUrl = useRef('');

  const [paramsState, setParamsState] = useState<EpisodeBaruHome>({
    jadwalAnime: {},
    newAnime: [],
  });
  const [movieParamsState, setMovieParamsState] = useState<Movies[]>([]);
  const [filmParamsState, setFilmParamsState] = useState<FilmHomePage>([]);
  const [seriesParamsState, setSeriesParamsState] = useState<FilmHomePage>([]);
  const [comicsData, setComicsData] = useState<LatestComicsRelease[]>([]);

  const colorScheme = useColorScheme();
  const globalStyles = useGlobalStyles();

  useEffect(() => {
    comics1FetchSession.getSessionPath = (
      res: PromiseResRej['resolve'],
      rej: PromiseResRej['reject'],
    ) => {
      comics1SessionPromisesCollector.current.push({ resolve: res, reject: rej });
      setIsComics1FetchSessionOpen(true);
    };
    comics1FetchSession.abortCleanup = () => {
      setIsComics1FetchSessionOpen(false);
      while (comics1SessionPromisesCollector.current.length > 0) {
        const val = comics1SessionPromisesCollector.current.shift();
        val?.reject();
      }
    };

    comics1FetchChapterSession.getChapterSessionPath = (
      chapterUrl: string,
      res: PromiseResRej['resolve'],
      rej: PromiseResRej['reject'],
    ) => {
      comics1ChapterSessionUrl.current = chapterUrl;
      comics1ChapterSessionPromisesCollector.current.push({ resolve: res, reject: rej });
      setIsComics1FetchChapterSessionOpen(true);
    };
    comics1FetchChapterSession.abortCleanup = () => {
      setIsComics1FetchChapterSessionOpen(false);
      while (comics1ChapterSessionPromisesCollector.current.length > 0) {
        const val = comics1ChapterSessionPromisesCollector.current.shift();
        val?.reject();
      }
    };

    setWebViewOpen.openWebViewCF = (isOpenCF: boolean, url: string) => {
      setIsOpen(isOpenCF);
      setCfUrl(url);
    };
  }, []);

  useEffect(() => {
    const colorSchemeValue = DatabaseManager.getSync('colorScheme');
    if (
      colorSchemeValue !== 'auto' &&
      (colorSchemeValue === 'light' || colorSchemeValue === 'dark')
    ) {
      Appearance.setColorScheme(colorSchemeValue);
    }
    SystemBars.setHidden(false);
    SystemNavigationBar.fullScreen(false);
    SystemNavigationBar.navigationShow();
    SplashScreen.hideAsync();
  }, []);

  useEffect(() => {
    SystemBars.setStyle(colorScheme === 'dark' ? 'light' : 'dark');
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
      <KeyboardProvider>
        <ErrorBoundary FallbackComponent={FallbackComponent}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <EpisodeBaruHomeContext
              value={useMemo(() => ({ paramsState, setParamsState }), [paramsState])}>
              <FilmListHomeContext
                value={useMemo(
                  () => ({
                    paramsState: filmParamsState,
                    setParamsState: setFilmParamsState,
                  }),
                  [filmParamsState],
                )}>
                <SeriesListHomeContext
                  value={useMemo(
                    () => ({
                      paramsState: seriesParamsState,
                      setParamsState: setSeriesParamsState,
                    }),
                    [seriesParamsState],
                  )}>
                  <MovieListHomeContext
                    value={useMemo(
                      () => ({
                        paramsState: movieParamsState,
                        setParamsState: setMovieParamsState,
                      }),
                      [movieParamsState],
                    )}>
                    <ComicsListContext
                      value={useMemo(
                        () => ({
                          paramsState: comicsData,
                          setParamsState: setComicsData,
                        }),
                        [comicsData],
                      )}>
                      <PaperProvider theme={colorScheme === 'dark' ? MDDark : MDLight}>
                        <NavigationContainer
                          linking={linking}
                          ref={navigationRef}
                          theme={colorScheme === 'dark' ? CombinedDarkTheme : CombinedDefaultTheme}>
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
                          <CFBypassIsOpenContext
                            value={useMemo(
                              () => ({ isOpen, url: cfUrl, setIsOpen }),
                              [isOpen, cfUrl],
                            )}>
                            {isOpen && (
                              <Suspense>
                                <CFBypassWebView />
                              </Suspense>
                            )}
                          </CFBypassIsOpenContext>
                          <Comics1SessionFetcherContext
                            value={useMemo(
                              () => ({
                                isOpen: isComics1FetchSessionOpen,
                                setIsOpen: setIsComics1FetchSessionOpen,
                                promisesCollector: comics1SessionPromisesCollector,
                              }),
                              [isComics1FetchSessionOpen],
                            )}>
                            {isComics1FetchSessionOpen && <Comics1SessionWebView />}
                          </Comics1SessionFetcherContext>
                          <Comics1ChapterSessionFetcherContext
                            value={useMemo(
                              () => ({
                                isOpen: isComics1FetchChapterSessionOpen,
                                chapterUrl: comics1ChapterSessionUrl,
                                setIsOpen: setIsComics1FetchChapterSessionOpen,
                                promisesCollector: comics1ChapterSessionPromisesCollector,
                              }),
                              [isComics1FetchChapterSessionOpen],
                            )}>
                            {isComics1FetchChapterSessionOpen && <Comics1ChapterSessionWebView />}
                          </Comics1ChapterSessionFetcherContext>
                          {__DEV__ && (
                            <View style={styles.Dev} pointerEvents="none">
                              <Text style={[globalStyles.text, styles.DevText]}>Dev</Text>
                            </View>
                          )}
                        </NavigationContainer>
                      </PaperProvider>
                    </ComicsListContext>
                  </MovieListHomeContext>
                </SeriesListHomeContext>
              </FilmListHomeContext>
            </EpisodeBaruHomeContext>
          </GestureHandlerRootView>
        </ErrorBoundary>
      </KeyboardProvider>
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
