import { NativeBottomTabScreenProps } from '@bottom-tabs/react-navigation';
import * as MeasureText from '@domir/react-native-measure-text';
import { LegendList, LegendListRenderItemProps } from '@legendapp/list';
import {
  NavigationProp,
  StackActions,
  useFocusEffect,
  useNavigation,
} from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import React, { memo, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  ToastAndroid,
  TouchableOpacity,
  useColorScheme,
  useWindowDimensions,
  View,
} from 'react-native';
import { useBatteryLevel } from 'react-native-device-info';
import { RefreshControl } from 'react-native-gesture-handler';
import { useTheme } from 'react-native-paper';
import Reanimated, {
  cancelAnimation,
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { OTAJSVersion, version } from '../../../package.json';
import runningText from '../../assets/runningText.json';
import useGlobalStyles from '../../assets/style';
import { EpisodeBaruHomeContext, MovieListHomeContext } from '../../misc/context';
import { EpisodeBaruHome as EpisodeBaruType, JadwalAnime, NewAnimeList } from '../../types/anime';
import { HomeNavigator, RootStackNavigator } from '../../types/navigation';
import AnimeAPI from '../../utils/AnimeAPI';
import { getLatestMovie, Movies } from '../../utils/animeMovie';
import { getLatestKomikuReleases, LatestKomikuRelease } from '../../utils/komiku';
import { ListAnimeComponent } from '../misc/ListAnimeComponent';
import ReText from '../misc/ReText';
import Skeleton from '../misc/Skeleton';

export const MIN_IMAGE_HEIGHT = 200;
export const MIN_IMAGE_WIDTH = 100;

type HomeProps = NativeBottomTabScreenProps<HomeNavigator, 'AnimeList'>;

const Home = memo(HomeList);
export default Home;

function HomeList(props: HomeProps) {
  const globalStyles = useGlobalStyles();
  const colorScheme = useColorScheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const { paramsState: data, setParamsState: setData } = useContext(EpisodeBaruHomeContext);
  const [refresh, setRefresh] = useState(false);
  const [refreshingKey, setRefreshingKey] = useState(0);
  const windowSize = useWindowDimensions();

  const boxTextAnim = useSharedValue(0);
  const boxTextLayout = useSharedValue(0);
  const textLayoutWidth = useSharedValue(0);
  const localTime = useLocalTime();
  const battery = useBatteryLevel();

  const [animationText, setAnimationText] = useState(() => {
    const randomQuote = runningText[Math.floor(Math.random() * runningText.length)];
    const quote = `"${randomQuote.quote}" - ${randomQuote.by}`;
    textLayoutWidth.set(
      MeasureText.measureWidth(quote, {
        fontWeight: 'bold',
        fontSize: 17,
      }),
    );
    return quote;
  });

  useFocusEffect(
    useCallback(() => {
      const setLayoutWidth = (quote: string) => {
        const newWidth = MeasureText.measureWidth(quote, {
          fontWeight: 'bold',
          fontSize: 17,
        });
        textLayoutWidth.set(newWidth);
        setAnimationText(quote);
      };
      function callback(finished?: boolean) {
        if (finished) {
          textLayoutWidth.set(0);
          const randomQuote = runningText[Math.floor(Math.random() * runningText.length)];
          const quote = `"${randomQuote.quote}" - ${randomQuote.by}`;
          runOnJS(setLayoutWidth)(quote);
        }
        boxTextAnim.set(0);
        if (!finished) return;
        boxTextAnim.set(
          withDelay(2000, withTiming(1, { duration: 15_000, easing: Easing.linear }, callback)),
        );
      }

      boxTextAnim.set(
        withDelay(1000, withTiming(1, { duration: 15_000, easing: Easing.linear }, callback)),
      );

      return () => {
        cancelAnimation(boxTextAnim);
      };
    }, [boxTextAnim, textLayoutWidth]),
  );

  const refreshing = useCallback(() => {
    setRefresh(true);
    setData?.(val => ({ ...val, newAnime: [] }));
    setRefreshingKey(val => val + 1);

    setTimeout(() => {
      AnimeAPI.home()
        .then(async jsondata => {
          setData?.(jsondata);
          setRefresh(false);
        })
        .catch(() => {
          ToastAndroid.show('Gagal terhubung ke server.', ToastAndroid.SHORT);
          setRefresh(false);
        });
    }, 0);
  }, [setData]);

  const AnimationTextStyle = useAnimatedStyle(() => {
    return {
      width: textLayoutWidth.get() === 0 ? 'auto' : textLayoutWidth.get(),
      transform: [
        {
          translateX: interpolate(
            boxTextAnim.get(),
            [0, 1],
            [windowSize.width, -boxTextLayout.get()],
          ),
        },
      ],
    };
  });

  const renderJadwalAnime = useCallback(
    ({ item }: { item: keyof JadwalAnime }) => {
      return (
        <View key={item} style={[styles.scheduleContainer, styles.scheduleSection]}>
          <Text style={styles.scheduleDay}>{item}</Text>
          {data?.jadwalAnime[item]!.map((x, index) => (
            <TouchableOpacity
              style={[
                styles.scheduleItem,
                index % 2 === 0 ? styles.scheduleItemEven : styles.scheduleItemOdd,
              ]}
              key={x.title}
              onPress={() => {
                props.navigation.dispatch(StackActions.push('FromUrl', { link: x.link }));
              }}>
              <Text style={styles.scheduleTitle}>{x.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      );
    },
    [data?.jadwalAnime, props.navigation, styles],
  );

  return (
    <FlashList
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refresh}
          onRefresh={refreshing}
          progressBackgroundColor={colorScheme === 'dark' ? '#121212' : '#f5f5f7'}
          colors={['#00a2ff', '#BB86FC']}
        />
      }
      contentContainerStyle={{
        paddingTop: insets.top,
        paddingLeft: insets.left,
        paddingRight: insets.right,
        paddingBottom: insets.bottom,
      }}
      ListHeaderComponent={
        <>
          <View style={styles.headerCard}>
            <View style={styles.headerInfo}>
              <ReText style={styles.timeText} text={localTime} />
              <Text style={styles.batteryText}>{Math.round((battery ?? 0) * 100)}%</Text>
            </View>

            <View style={styles.appInfo}>
              <Text style={styles.appName}>AniFlix</Text>
              <Text style={styles.appVersion}>
                {version}-JS_{OTAJSVersion}
              </Text>
            </View>

            <View
              style={{ overflow: 'hidden', position: 'absolute', bottom: 2, left: 0, right: 0 }}>
              <Reanimated.Text
                onLayout={nativeEvent => boxTextLayout.set(nativeEvent.nativeEvent.layout.width)}
                style={[styles.runningText, AnimationTextStyle]}>
                {animationText}
              </Reanimated.Text>
            </View>
          </View>
          <TouchableOpacity style={styles.refreshButton} onPress={refreshing} disabled={refresh}>
            <MaterialIcon name="refresh" size={20} color="#FFFFFF" style={styles.refreshIcon} />
            <Text style={styles.refreshText}>Refresh Data</Text>
          </TouchableOpacity>
          <EpisodeBaru styles={styles} globalStyles={globalStyles} data={data} props={props} />
          <MovieList props={props} key={'anime_movie' + refreshingKey} />
          <ComicList key={'comick' + refreshingKey} />
          <View style={styles.scheduleSection}>
            <Text style={styles.sectionTitle}>Jadwal Anime</Text>
          </View>
        </>
      }
      data={Object.keys(data?.jadwalAnime ?? {})}
      renderItem={renderJadwalAnime}
    />
  );
}

const EpisodeBaru = memo(
  EpisodeBaruUNMEMO,
  (prev, next) =>
    prev.data?.newAnime[0]?.title === next.data?.newAnime[0]?.title &&
    prev.styles === next.styles &&
    prev.globalStyles.text === next.globalStyles.text,
);

function EpisodeBaruUNMEMO({
  styles,
  data,
  props,
}: {
  data: EpisodeBaruType | undefined;
  props: HomeProps;
  styles: ReturnType<typeof useStyles>;
  globalStyles: ReturnType<typeof useGlobalStyles>;
}) {
  const renderNewAnime = useCallback(
    ({ item }: LegendListRenderItemProps<NewAnimeList>) => (
      <ListAnimeComponent
        newAnimeData={item}
        key={'btn' + item.title + item.episode}
        navigationProp={props.navigation}
      />
    ),
    [props.navigation],
  );

  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Episode Terbaru</Text>
        <TouchableOpacity
          style={styles.seeMoreButton}
          onPress={() => {
            props.navigation.dispatch(StackActions.push('SeeMore', { type: 'AnimeList' }));
          }}>
          <Text style={styles.seeMoreText}>Lihat Semua</Text>
          <MaterialIcon name="chevron-right" style={styles.seeMoreText} />
        </TouchableOpacity>
      </View>
      {(data?.newAnime.length || 0) > 0 ? (
        <LegendList
          contentContainerStyle={{ gap: 6 }}
          recycleItems
          horizontal
          data={(data?.newAnime ?? []).slice(0, 25)}
          keyExtractor={z => z.title}
          renderItem={renderNewAnime}
          extraData={styles}
          showsHorizontalScrollIndicator={false}
        />
      ) : (
        <ShowSkeletonLoading />
      )}
    </View>
  );
}

const MovieList = memo(MovieListUNMEMO);
function MovieListUNMEMO({ props }: { props: HomeProps }) {
  const styles = useStyles();
  const { paramsState: data, setParamsState: setData } = useContext(MovieListHomeContext);
  const [isError, setIsError] = useState(false);
  const navigation = useNavigation<NavigationProp<RootStackNavigator>>();

  const renderMovie = useCallback(
    ({ item }: LegendListRenderItemProps<Movies>) => (
      <ListAnimeComponent
        newAnimeData={item}
        type="movie"
        key={'btn' + item.title}
        navigationProp={props.navigation}
      />
    ),
    [props.navigation],
  );

  useEffect(() => {
    setData?.([]); // so the skeleton loading show
    queueMicrotask(() => {
      getLatestMovie()
        .then(movieData => {
          if ('isError' in movieData) {
            setIsError(true);
          } else {
            setData?.(movieData);
          }
        })
        .catch(() => setIsError(true));
    });
  }, [setData]);

  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Movie Terbaru</Text>
        <TouchableOpacity
          style={styles.seeMoreButton}
          disabled={data?.length === 0}
          onPress={() => {
            props.navigation.dispatch(StackActions.push('SeeMore', { type: 'MovieList' }));
          }}>
          <Text style={styles.seeMoreText}>Lihat Semua</Text>
          <MaterialIcon name="chevron-right" style={styles.seeMoreText} />
        </TouchableOpacity>
      </View>

      {isError && (
        <TouchableOpacity
          onPress={() => {
            navigation.reset({
              index: 0,
              routes: [{ name: 'connectToServer' }],
            });
          }}
          style={styles.errorContainer}>
          <MaterialIcon name="error-outline" size={24} color="#d80000" />
          <Text style={styles.errorText}>Error mendapatkan data. Ketuk untuk mencoba ulang.</Text>
        </TouchableOpacity>
      )}

      {data?.length !== 0 ? (
        <LegendList
          contentContainerStyle={{ gap: 6 }}
          recycleItems
          horizontal
          data={data?.slice(0, 25) ?? []}
          renderItem={renderMovie}
          keyExtractor={z => z.title}
          extraData={styles}
          showsHorizontalScrollIndicator={false}
        />
      ) : (
        !isError && <ShowSkeletonLoading />
      )}
    </View>
  );
}

const ComicList = memo(ComicListUNMEMO);
function ComicListUNMEMO() {
  const styles = useStyles();
  const [isError, setIsError] = useState(false);
  const navigation = useNavigation<NavigationProp<RootStackNavigator, 'AnimeDetail'>>();

  const [data, setData] = useState<LatestKomikuRelease[]>([]);

  useEffect(() => {
    queueMicrotask(() => {
      getLatestKomikuReleases()
        .then(z => {
          setData(z);
        })
        .catch(() => setIsError(true));
    });
  }, []);

  const renderComics = useCallback(
    ({ item }: LegendListRenderItemProps<LatestKomikuRelease>) => (
      <ListAnimeComponent
        newAnimeData={item}
        type="comics"
        key={'btn' + item.title}
        // @ts-expect-error
        navigationProp={navigation}
      />
    ),
    [navigation],
  );

  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Komik Terbaru</Text>
        {/* <TouchableOpacity
          style={styles.seeMoreButton}
          disabled={data?.length === 0}
          onPress={() => {
            navigation.dispatch(StackActions.push('SeeMore', { type: 'MovieList' }));
          }}>
          <Text style={styles.seeMoreText}>Lihat Semua</Text>
          <MaterialIcon name="chevron-right" style={styles.seeMoreText} />
        </TouchableOpacity> */}
      </View>

      {isError && (
        <View>
          <MaterialIcon name="error-outline" size={24} color="#d80000" />
          <Text style={styles.errorText}>
            Error mendapatkan data. Silahkan refresh data untuk mencoba lagi
          </Text>
        </View>
      )}

      {data?.length !== 0 ? (
        <LegendList
          contentContainerStyle={{ gap: 6 }}
          recycleItems
          horizontal
          data={data.slice(0, 25)}
          renderItem={renderComics}
          keyExtractor={z => z.title}
          extraData={styles}
          showsHorizontalScrollIndicator={false}
        />
      ) : (
        !isError && <ShowSkeletonLoading />
      )}
    </View>
  );
}

function ShowSkeletonLoading() {
  const dimensions = useWindowDimensions();
  let LIST_BACKGROUND_HEIGHT = (dimensions.height * 120) / 200 / 2.5;
  let LIST_BACKGROUND_WIDTH = (dimensions.width * 120) / 200 / 2;
  LIST_BACKGROUND_HEIGHT = Math.max(LIST_BACKGROUND_HEIGHT, MIN_IMAGE_HEIGHT);
  LIST_BACKGROUND_WIDTH = Math.max(LIST_BACKGROUND_WIDTH, MIN_IMAGE_WIDTH);
  return (
    <View style={{ flexDirection: 'row', gap: 12 }}>
      {[1, 2, 3].map((_, index) => (
        <View key={index} style={{ gap: 6 }}>
          <Skeleton
            key={index + 'image'}
            width={LIST_BACKGROUND_WIDTH}
            height={LIST_BACKGROUND_HEIGHT}
            style={{ borderRadius: 8 }}
          />
          <Skeleton key={index + 'title'} width={LIST_BACKGROUND_WIDTH} height={20} />
          <View key={index + 'info'} style={{ flexDirection: 'row', gap: 2 }}>
            <Skeleton key={index + 'info1'} width={LIST_BACKGROUND_WIDTH / 2} height={20} />
            <Skeleton key={index + 'info2'} width={LIST_BACKGROUND_WIDTH / 2} height={20} />
          </View>
        </View>
      ))}
    </View>
  );
}

function useLocalTime() {
  const time = useSharedValue(new Date().toLocaleTimeString());
  const currTime = useRef<string>(null);
  useFocusEffect(
    useCallback(() => {
      time.set(new Date().toLocaleTimeString());
      const interval = setInterval(() => {
        const string = new Date().toLocaleTimeString();
        if (currTime.current !== string) {
          time.set(string);
          currTime.current = string;
        }
      }, 500);
      return () => clearInterval(interval);
    }, [time]),
  );
  return time;
}

function useStyles() {
  const colorScheme = useColorScheme();
  const theme = useTheme();
  const isDark = colorScheme === 'dark';

  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: isDark ? '#121212' : '#f5f5f7',
        },
        headerCard: {
          backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
          borderRadius: 16,
          padding: 5,
          paddingBottom: 16,
          margin: 16,
          marginBottom: 12,
          elevation: 4,
        },
        headerInfo: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: 8,
        },
        timeText: {
          fontSize: 14,
          color: theme.colors.primary,
          fontWeight: 'bold',
        },
        batteryText: {
          fontSize: 14,
          color: theme.colors.primary,
          fontWeight: 'bold',
        },
        appInfo: {
          flexDirection: 'row',
          alignItems: 'baseline',
          justifyContent: 'center',
          marginBottom: 16,
        },
        appName: {
          fontSize: 24,
          fontWeight: 'bold',
          color: isDark ? '#E0E0E0' : '#333',
          marginRight: 8,
        },
        appVersion: {
          fontSize: 12,
          color: isDark ? '#AAA' : '#777',
        },
        runningText: {
          color: theme.colors.primary,
          fontWeight: 'bold',
          fontSize: 14,
        },
        refreshButton: {
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: theme.colors.secondaryContainer,
          paddingVertical: 4,
          borderRadius: 8,
          marginHorizontal: 16,
          marginBottom: 16,
        },
        refreshIcon: {
          color: theme.colors.onSecondaryContainer,
          marginRight: 8,
        },
        refreshText: {
          color: theme.colors.onSecondaryContainer,
          fontWeight: 'bold',
          fontSize: 16,
        },
        sectionContainer: {
          backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
          borderRadius: 16,
          paddingVertical: 8,
          marginHorizontal: 3,
          marginBottom: 16,
          elevation: 2,
        },
        sectionHeader: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 16,
          marginBottom: 12,
        },
        sectionTitle: {
          fontSize: 18,
          fontWeight: 'bold',
          color: isDark ? '#E0E0E0' : '#333',
        },
        seeMoreButton: {
          flexDirection: 'row',
          alignItems: 'center',
        },
        seeMoreText: {
          fontSize: 14,
          fontWeight: 'bold',
          color: theme.colors.primary,
          marginRight: 4,
        },
        scheduleSection: {
          backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
          borderRadius: 16,
          padding: 16,
          marginHorizontal: 16,
          marginBottom: 16,
          elevation: 2,
        },
        scheduleContainer: {
          marginBottom: 16,
        },
        scheduleDay: {
          fontSize: 16,
          fontWeight: 'bold',
          color: theme.colors.primary,
          marginBottom: 8,
          textAlign: 'center',
        },
        scheduleItem: {
          paddingVertical: 12,
          paddingHorizontal: 16,
        },
        scheduleItemEven: {
          backgroundColor: isDark ? '#252525' : '#F5F5F5',
        },
        scheduleItemOdd: {
          backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
        },
        scheduleTitle: {
          fontSize: 14,
          color: isDark ? '#E0E0E0' : '#333',
          textAlign: 'center',
        },
        errorContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
          backgroundColor: isDark ? '#2A1E1E' : '#FFEBEE',
          borderRadius: 8,
          marginHorizontal: 16,
        },
        errorText: {
          fontSize: 14,
          color: '#d80000',
          marginLeft: 8,
          textAlign: 'center',
        },
      }),
    [
      isDark,
      theme.colors.onSecondaryContainer,
      theme.colors.primary,
      theme.colors.secondaryContainer,
    ],
  );
}
