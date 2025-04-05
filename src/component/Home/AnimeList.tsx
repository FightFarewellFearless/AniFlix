import {
  NavigationProp,
  StackActions,
  useFocusEffect,
  useNavigation,
} from '@react-navigation/native';
import React, { memo, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  ListRenderItemInfo,
  StyleSheet,
  Text,
  ToastAndroid,
  TouchableOpacity,
  useColorScheme,
  useWindowDimensions,
  View,
} from 'react-native';
import { RefreshControl, ScrollView } from 'react-native-gesture-handler'; //rngh
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
import Icon from 'react-native-vector-icons/FontAwesome';
import runningText from '../../assets/runningText.json';
import useGlobalStyles from '../../assets/style';
import { EpisodeBaruHomeContext, MovieListHomeContext } from '../../misc/context';
import { NewAnimeList } from '../../types/anime';
import { HomeNavigator, RootStackNavigator } from '../../types/navigation';
import AnimeAPI from '../../utils/AnimeAPI';

import * as MeasureText from '@domir/react-native-measure-text';

import { NativeBottomTabScreenProps } from '@bottom-tabs/react-navigation';
import { useBatteryLevel } from 'react-native-device-info';
import { OTAJSVersion, version } from '../../../package.json';
import { EpisodeBaruHome as EpisodeBaruType } from '../../types/anime';
import { getLatestMovie, Movies } from '../../utils/animeMovie';
import { ListAnimeComponent } from '../misc/ListAnimeComponent';
import ReText from '../misc/ReText';
import Skeleton from '../misc/Skeleton';

type HomeProps = NativeBottomTabScreenProps<HomeNavigator, 'AnimeList'>;

const Home = memo(HomeList);
export default Home;

function HomeList(props: HomeProps) {
  const globalStyles = useGlobalStyles();
  const colorScheme = useColorScheme();
  const styles = useStyles();
  const { paramsState: data, setParamsState: setData } = useContext(EpisodeBaruHomeContext);
  const [refresh, setRefresh] = useState(false);

  const [animeMovieRefreshingKey, setAnimeMovieRefreshingKey] = useState(0);

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

  // useEffect(() => {
  //   if (data?.announcment.enable === true) {
  //     setAnnouncmentVisible(true);
  //   }
  // eslint-disable-next-line react-compiler/react-compiler
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, []);

  useFocusEffect(
    useCallback(() => {
      const setLayoutWidth = (quote: string) => {
        textLayoutWidth.set(
          MeasureText.measureWidth(quote, {
            fontWeight: 'bold',
            fontSize: 17,
          }),
        );
      };
      function callback(finished?: boolean) {
        if (finished) {
          textLayoutWidth.set(0);
          const randomQuote = runningText[Math.floor(Math.random() * runningText.length)];
          const quote = `"${randomQuote.quote}" - ${randomQuote.by}`;
          runOnJS(setAnimationText)(quote);
          runOnJS(setLayoutWidth)(quote);
        }
        boxTextAnim.set(0);
        if (!finished) return;
        boxTextAnim.set(
          withDelay(2000, withTiming(1, { duration: 20_000, easing: Easing.linear }, callback)),
        );
      }

      // const interval = setInterval(() => {
      //   textLayoutWidth.value = 0;
      //   setAnimationText(
      //     runningText[Math.floor(Math.random() * runningText.length)],
      //   );
      // }, 15500);

      boxTextAnim.set(
        withDelay(1000, withTiming(1, { duration: 20_000, easing: Easing.linear }, callback)),
      );

      return () => {
        cancelAnimation(boxTextAnim);
        // boxTextAnim.value = 0;
        // clearInterval(interval);
      };
      // eslint-disable-next-line react-compiler/react-compiler
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const refreshing = useCallback(() => {
    setRefresh(true);
    setData?.(val => {
      return {
        ...val,
        newAnime: [],
      };
    }); // so the skeleton loading show

    setAnimeMovieRefreshingKey(val => val + 1);

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

    // eslint-disable-next-line react-compiler/react-compiler
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const jadwalAnimeComponent = useMemo(() => {
    return Object.keys(data?.jadwalAnime ?? {}).map(key => {
      return (
        <View key={key} style={[styles.listContainer, { marginTop: 15, marginHorizontal: 12 }]}>
          <Text
            style={[globalStyles.text, { fontWeight: 'bold', fontSize: 18, alignSelf: 'center' }]}>
            {key}
          </Text>
          {data?.jadwalAnime[key]!.map((item, index) => (
            <TouchableOpacity
              style={{
                backgroundColor:
                  index % 2 === 0
                    ? colorScheme === 'dark'
                      ? '#292929'
                      : '#fff'
                    : colorScheme === 'dark'
                      ? '#212121'
                      : '#f5f5f5',
              }}
              key={item.title}
              onPress={() => {
                props.navigation.dispatch(
                  StackActions.push('FromUrl', {
                    link: item.link,
                  }),
                );
              }}>
              <Text style={[globalStyles.text, { textAlign: 'center' }]}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      );
    });
  }, [colorScheme, data?.jadwalAnime, globalStyles.text, props.navigation, styles.listContainer]);

  return (
    <ScrollView
      style={{ flex: 1 }}
      refreshControl={
        <RefreshControl
          refreshing={refresh}
          onRefresh={refreshing}
          progressBackgroundColor="#292929"
          colors={['#00a2ff', 'red']}
        />
      }>
      <View style={styles.box}>
        <View style={styles.boxItem}>
          <View style={styles.boxHeader}>
            <ReText style={[globalStyles.text, styles.boxTime]} text={localTime} />
            <Text style={[globalStyles.text, styles.boxBattery]}>
              {Math.round((battery ?? 0) * 100)}%
            </Text>
          </View>
          <Text style={[globalStyles.text, styles.boxAppName]}>
            AniFlix{' '}
            <Text style={styles.boxAppVer}>
              {version}-JS_{OTAJSVersion}
            </Text>
          </Text>
          {/* running text animation */}
          <Reanimated.Text
            onLayout={nativeEvent => boxTextLayout.set(nativeEvent.nativeEvent.layout.width)}
            style={[styles.boxText, AnimationTextStyle]}>
            {animationText}
          </Reanimated.Text>
        </View>
      </View>

      <TouchableOpacity style={styles.boxRefreshData} onPress={refreshing} disabled={refresh}>
        <Text style={[{ color: '#ffffff', fontWeight: 'bold' }]}>
          <Icon name="refresh" /> Refresh data
        </Text>
      </TouchableOpacity>
      <EpisodeBaru styles={styles} globalStyles={globalStyles} data={data} props={props} />
      <MovieList props={props} key={'anime_movie' + animeMovieRefreshingKey} />

      {jadwalAnimeComponent}
    </ScrollView>
  );
}

const EpisodeBaru = memo(EpisodeBaruUNMEMO, (prev, next) => {
  return (
    prev.data?.newAnime[0]?.title === next.data?.newAnime[0]?.title &&
    prev.styles === next.styles &&
    prev.globalStyles.text === next.globalStyles.text
  );
});

function EpisodeBaruUNMEMO({
  styles,
  globalStyles,
  data,
  props,
}: {
  data: EpisodeBaruType | undefined;
  props: HomeProps;
  styles: ReturnType<typeof useStyles>;
  globalStyles: ReturnType<typeof useGlobalStyles>;
}) {
  const renderNewAnime = useCallback(
    ({ item }: ListRenderItemInfo<NewAnimeList>) => (
      <ListAnimeComponent
        newAnimeData={item}
        key={'btn' + item.title + item.episode}
        navigationProp={props.navigation}
      />
    ),
    [props.navigation],
  );

  return (
    <View style={styles.listContainer}>
      <View style={styles.titleContainer}>
        <Text style={[styles.titleText, globalStyles.text]}>Episode terbaru: </Text>
        <TouchableOpacity
          // containerStyle={{ flex: 1 }} // rngh
          style={styles.seeMoreContainer}
          onPress={() => {
            props.navigation.dispatch(
              StackActions.push('SeeMore', {
                type: 'AnimeList',
              }),
            );
            // TEMP|TODO|WORKAROUND: Temporary fix for bottom-tabs extra padding
            setTimeout(() => {
              props.navigation.dispatch(StackActions.push('Blank'));
              setTimeout(() => {
                props.navigation.goBack();
              }, 0);
            }, 500);
          }}>
          <Text style={[globalStyles.text, styles.seeMoreText]}>Lihat semua </Text>
          <Icon name="long-arrow-right" color={globalStyles.text.color} size={20} />
        </TouchableOpacity>
      </View>
      {(data?.newAnime.length || 0) > 0 ? (
        <FlatList
          horizontal
          data={data?.newAnime.slice(0, 25)}
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
  const globalStyles = useGlobalStyles();

  const renderMovie = useCallback(
    ({ item }: ListRenderItemInfo<Movies>) => (
      <ListAnimeComponent
        newAnimeData={item}
        isMovie={true}
        key={'btn' + item.title}
        navigationProp={props.navigation}
      />
    ),
    [props.navigation],
  );

  const { paramsState: data, setParamsState: setData } = useContext(MovieListHomeContext);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    setData?.([]); // so the skeleton loading show
    getLatestMovie()
      .then(movieData => {
        if ('isError' in movieData) {
          setIsError(true);
        } else {
          setData?.(movieData);
        }
      })
      .catch(() => {
        setIsError(true);
      });
  }, [setData]);

  const navigation = useNavigation<NavigationProp<RootStackNavigator>>();

  return (
    <View style={[styles.listContainer, { marginTop: 15 }]}>
      <View style={styles.titleContainer}>
        <Text style={[styles.titleText, globalStyles.text]}>Movie terbaru: </Text>
        <TouchableOpacity
          // containerStyle={{ flex: 1 }} // rngh
          style={styles.seeMoreContainer}
          disabled={data?.length === 0}
          onPress={() => {
            props.navigation.dispatch(
              StackActions.push('SeeMore', {
                type: 'MovieList',
              }),
            );
            // TEMP|TODO|WORKAROUND: Temporary fix for bottom-tabs extra padding
            setTimeout(() => {
              props.navigation.dispatch(StackActions.push('Blank'));
              setTimeout(() => {
                props.navigation.goBack();
              }, 0);
            }, 500);
          }}>
          <Text style={[globalStyles.text, styles.seeMoreText]}>Lihat semua </Text>
          <Icon name="long-arrow-right" color={globalStyles.text.color} size={20} />
        </TouchableOpacity>
      </View>
      {isError && (
        <Text
          onPress={() => {
            navigation.reset({
              index: 0,
              routes: [{ name: 'connectToServer' }],
            });
          }}
          style={[globalStyles.text, { textAlign: 'center', color: '#d80000' }]}>
          Error mendapatkan data awal yang dibutuhkan, ketuk disini untuk mencoba ulang dari loading
          screen
        </Text>
      )}
      {data?.length !== 0 ? (
        <FlatList
          horizontal
          data={data?.slice(0, 25)}
          renderItem={renderMovie}
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
  const LIST_BACKGROUND_HEIGHT = (dimensions.height * 120) / 200 / 2.2;
  const LIST_BACKGROUND_WIDTH = (dimensions.width * 120) / 200 / 1.9;
  return (
    <View style={{ flexDirection: 'row', gap: 5 }}>
      <Skeleton width={LIST_BACKGROUND_WIDTH} height={LIST_BACKGROUND_HEIGHT} />
      <Skeleton width={LIST_BACKGROUND_WIDTH} height={LIST_BACKGROUND_HEIGHT} />
      <Skeleton width={LIST_BACKGROUND_WIDTH} height={LIST_BACKGROUND_HEIGHT} />
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
      return () => {
        clearInterval(interval);
      };
    }, [time]),
  );
  return time;
}

function useStyles() {
  const colorScheme = useColorScheme();
  const dimensions = useWindowDimensions();
  const LIST_BACKGROUND_HEIGHT = (dimensions.height * 120) / 200 / 2.2;
  const LIST_BACKGROUND_WIDTH = (dimensions.width * 120) / 200 / 1.9;
  return useMemo(
    () =>
      StyleSheet.create({
        modalContainer: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#000000d0',
        },
        modalContent: {
          flex: 0.15,
          backgroundColor: colorScheme === 'dark' ? '#181818' : '#d1d1d1',
          borderRadius: 9,
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 100,
          minWidth: 250,
          elevation: 16,
          shadowColor: '#202020',
        },
        modalPengumuman: {
          flex: 1,
          justifyContent: 'flex-start',
        },
        pengumuman: {
          fontSize: 19,
          color: '#ff0000b6',
          fontWeight: 'bold',
        },
        announcmentText: {
          flex: 1,
          flexGrow: 3,
          minWidth: 120,
          backgroundColor: colorScheme === 'dark' ? '#353535' : 'white',
          paddingTop: 1,
          borderTopWidth: 1,
          borderTopColor: colorScheme === 'dark' ? 'white' : 'black',
        },
        announcmentMessage: {
          textAlign: 'center',
          fontWeight: 'bold',
          fontSize: 14,
        },
        announcmentOK: {
          flex: 1,
          alignSelf: 'flex-end',
          justifyContent: 'flex-end',
        },
        announcmentOKButton: {
          backgroundColor: '#264914',
          width: 50,
          padding: 5,
          borderRadius: 3,
        },
        announcmentOKText: {
          color: '#44a4ff',
          textShadowColor: 'black',
          textShadowOffset: { width: 1, height: 1 },
          textShadowRadius: 2,
          fontWeight: 'bold',
          textAlign: 'center',
        },
        box: {
          flex: 1,
          height: 100,
          margin: 10,
        },
        boxItem: {
          flex: 1,
          backgroundColor: colorScheme === 'dark' ? '#363636' : '#eeeeee',
          borderColor: '#ff9100ff',
          borderWidth: 2,
          padding: 4,
          justifyContent: 'center',
          overflow: 'hidden',
        },
        boxAppName: {
          flexDirection: 'row',
          alignSelf: 'center',
          fontSize: 20,
          fontWeight: 'bold',
        },
        boxAppVer: {
          fontSize: 13,
        },
        boxHeader: {
          position: 'absolute',
          top: 0,
          width: '100%',
          flexDirection: 'row',
          justifyContent: 'center',
          padding: 5,
        },
        boxTime: {
          fontWeight: 'bold',
          position: 'absolute',
          top: -10,
          left: 0,
        },
        boxRefreshData: {
          marginBottom: 4,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#0aafcc',
          paddingHorizontal: 5,
          paddingVertical: 2,
          borderRadius: 5,
        },
        boxBattery: {
          fontWeight: 'bold',
          position: 'absolute',
          top: 0,
          right: 0,
        },
        boxText: {
          position: 'absolute',
          bottom: 0,
          color: '#2093ff',
          fontWeight: 'bold',
          // fontSize: 14,
          textShadowColor: colorScheme === 'dark' ? 'black' : '#cfcfcf',
          textShadowOffset: { width: 1, height: 1 },
          textShadowRadius: 2,
        },
        listContainer: {
          position: 'relative',
          backgroundColor: colorScheme === 'dark' ? '#272727' : '#ebebeb',
          paddingVertical: 10,
          borderRadius: 10,
          elevation: 5,
        },
        titleContainer: {
          flex: 1,
          flexDirection: 'row',
          marginBottom: 10,
        },
        titleText: {
          fontSize: 20,
          fontWeight: 'bold',
          alignSelf: 'center',
        },
        seeMoreContainer: {
          flex: 1,
          flexDirection: 'row',
          justifyContent: 'flex-end',
          alignContent: 'flex-end',
        },
        seeMoreText: {
          fontSize: 14,
          fontWeight: 'bold',
          color: '#007db8',
        },
        listBackground: {
          overflow: 'hidden',
          width: LIST_BACKGROUND_WIDTH,
          height: LIST_BACKGROUND_HEIGHT,
          borderWidth: 1,
          marginRight: 5,
          marginVertical: 5,
          flex: 2,
          borderRadius: 7,
        },
        animeTitleContainer: {
          justifyContent: 'flex-start',
          alignItems: 'center',
        },
        animeTitle: {
          fontSize: 11,
          color: 'black',
          backgroundColor: 'orange',
          opacity: 0.8,
          textAlign: 'center',
          fontWeight: 'bold',
        },
        animeEpisodeContainer: {
          position: 'absolute',
          left: 0,
          bottom: 0,
          flexDirection: 'row',
        },
        animeEpisode: {
          fontSize: 10,
          color: '#000000',
          backgroundColor: '#0099ff',
          opacity: 0.8,
          borderRadius: 2,
          padding: 1,
        },
        animeRatingContainer: {
          position: 'absolute',
          bottom: 0,
          right: 0,
        },
        animeRating: {
          fontSize: 10,
          color: 'black',
          backgroundColor: 'orange',
          opacity: 0.8,
          padding: 2,
          borderRadius: 3,
        },
      }),
    [LIST_BACKGROUND_HEIGHT, LIST_BACKGROUND_WIDTH, colorScheme],
  );
}
