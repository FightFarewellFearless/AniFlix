import React, {
  memo,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  View,
  Text,
  ToastAndroid,
  StyleSheet,
  FlatList,
  useWindowDimensions,
  Modal,
  ListRenderItemInfo,
  Linking,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { TouchableOpacity, ScrollView, RefreshControl } from 'react-native-gesture-handler'; //rngh
import Reanimated, { cancelAnimation, Easing, interpolate, runOnJS, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { NavigationProp, StackActions, useFocusEffect, useNavigation } from '@react-navigation/native';
import useGlobalStyles from '../../assets/style';
import Icon from 'react-native-vector-icons/FontAwesome';
import { EpisodeBaruHomeContext, MovieListHomeContext } from '../../misc/context';
import runningText from '../../assets/runningText.json';
import { NewAnimeList } from '../../types/anime';
import { HomeNavigator, HomeStackNavigator, RootStackNavigator } from '../../types/navigation';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import AnimeAPI from '../../utils/AnimeAPI';
import SeeMore from './SeeMore';
import {
  NativeStackScreenProps,
  createNativeStackNavigator,
} from '@react-navigation/native-stack';

import * as MeasureText from '@domir/react-native-measure-text';

import ReText from '../misc/ReText';
import { useBatteryLevel } from 'react-native-device-info';
import { version, OTAJSVersion } from '../../../package.json'
import { EpisodeBaruHome as EpisodeBaruType } from '../../types/anime';
import { getLatestMovie, Movies } from '../../utils/animeMovie';
import { ListAnimeComponent } from '../misc/ListAnimeComponent';

type HomeProps = BottomTabScreenProps<HomeNavigator, 'AnimeList'>;
type HomeListProps = NativeStackScreenProps<HomeStackNavigator, 'HomeList'>;

interface CustomArraySplice<T> extends Array<T> {
  splice(start: number, deleteCount?: number, ...items: T[]): T[];
}

const SeeMoreStack = createNativeStackNavigator<HomeStackNavigator>();

function Home(_props: HomeProps) {
  return (
    <SeeMoreStack.Navigator
      initialRouteName="HomeList"
      screenOptions={{
        headerShown: false,
      }}>
      <SeeMoreStack.Screen name="HomeList" component={HomeList} />
      <SeeMoreStack.Screen
        name="SeeMore"
        component={SeeMore}
        options={{ headerShown: true }}
      />
    </SeeMoreStack.Navigator>
  );
}

function HomeList(props: HomeListProps) {
  const globalStyles = useGlobalStyles();
  const colorScheme = useColorScheme();
  const styles = useStyles();
  const { paramsState: data, setParamsState: setData } =
    useContext(EpisodeBaruHomeContext);
  const [refresh, setRefresh] = useState(false);

  const [animeMovieRefreshingKey, setAnimeMovieRefreshingKey] = useState(0)

  // const [announcmentVisible, setAnnouncmentVisible] = useState(false);

  const windowSize = useWindowDimensions();

  const boxTextAnim = useSharedValue(0);
  const boxTextLayout = useSharedValue(0);
  const textLayoutWidth = useSharedValue(0);
  const localTime = useLocalTime();
  const battery = useBatteryLevel();

  const [animationText, setAnimationText] = useState(() => {
    const randomQuote = runningText[Math.floor(Math.random() * runningText.length)];
    const quote = `"${randomQuote.quote}" - ${randomQuote.by}`;
    textLayoutWidth.set(MeasureText.measureWidth(quote, {
      fontWeight: 'bold',
      fontSize: 17,
    }));
    return quote;
  });


  // useEffect(() => {
  //   if (data?.announcment.enable === true) {
  //     setAnnouncmentVisible(true);
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, []);

  useFocusEffect(
    useCallback(() => {
      const setLayoutWidth = (quote: string) => {
        textLayoutWidth.set(MeasureText.measureWidth(quote, {
          fontWeight: 'bold',
          fontSize: 17,
        }));
      }
      function callback(finished?: boolean) {
        if (finished) {
          textLayoutWidth.set(0);
          const randomQuote = runningText[Math.floor(Math.random() * runningText.length)];
          const quote = `"${randomQuote.quote}" - ${randomQuote.by}`
          runOnJS(setAnimationText)(
            quote,
          );
          runOnJS(setLayoutWidth)(quote);
        }
        boxTextAnim.set(0);
        if (finished === false) return;
        boxTextAnim.set(withDelay(2000, withTiming(1, { duration: 20000, easing: Easing.linear }, callback)));
      }

      // const interval = setInterval(() => {
      //   textLayoutWidth.value = 0;
      //   setAnimationText(
      //     runningText[Math.floor(Math.random() * runningText.length)],
      //   );
      // }, 15500);

      boxTextAnim.set(withDelay(1000, withTiming(1, { duration: 20000, easing: Easing.linear }, callback)));

      return () => {
        cancelAnimation(boxTextAnim);
        // boxTextAnim.value = 0;
        // clearInterval(interval);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const refreshing = useCallback(() => {
    setRefresh(true);

    setAnimeMovieRefreshingKey(val => val + 1);

    AnimeAPI.home()
      .then(async jsondata => {
        setData?.(jsondata);
        setRefresh(false);
      })
      .catch(() => {
        ToastAndroid.show('Gagal terhubung ke server.', ToastAndroid.SHORT);
        setRefresh(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const AnimationTextStyle = useAnimatedStyle(() => {
    return {
      width: textLayoutWidth.get() === 0 ? 'auto' : textLayoutWidth.get(),
      transform: [{
        translateX: interpolate(boxTextAnim.get(), [0, 1], [windowSize.width, -boxTextLayout.get()])
      }]
    };
  })

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
      {/* <AnnouncmentModalMemo
        visible={announcmentVisible}
        announcmentMessage={
          data?.announcment.enable === true
            ? data?.announcment.message
            : undefined
        }
        setVisible={setAnnouncmentVisible}
      /> */}
      <View style={styles.box}>
        <View style={styles.boxItem}>
          <View style={styles.boxHeader}>
            <ReText style={[globalStyles.text, styles.boxTime]} text={localTime} />
            <Text style={[globalStyles.text, styles.boxBattery]}>{Math.round((battery ?? 0) * 100)}%</Text>
          </View>
          <Text style={[globalStyles.text, styles.boxAppName]}>AniFlix <Text style={styles.boxAppVer}>{version}-JS_{OTAJSVersion}</Text></Text>
          {/* running text animation */}
          <Reanimated.Text
            onLayout={nativeEvent =>
              (boxTextLayout.set(nativeEvent.nativeEvent.layout.width))
            }
            style={[
              styles.boxText,
              AnimationTextStyle,
            ]}>
            {animationText}
          </Reanimated.Text>
        </View>
      </View>

      <TouchableOpacity style={styles.boxRefreshData} onPress={refreshing} disabled={refresh}>
        <Text style={[{color: '#ffffff', fontWeight: 'bold'}]}><Icon name="refresh" /> Refresh data</Text>
      </TouchableOpacity>
      <EpisodeBaru styles={styles} globalStyles={globalStyles} data={data} props={props} />
      <MovieList props={props} key={'anime_movie' + animeMovieRefreshingKey} />

      {Object.keys(data?.jadwalAnime ?? {}).map((key) => {
        return (
          <View key={key} style={[styles.listContainer, { marginTop: 15, marginHorizontal: 12 }]}>
            <Text style={[globalStyles.text, { fontWeight: 'bold', fontSize: 18, alignSelf: 'center' }]}>{key}</Text>
            {data?.jadwalAnime[key]!.map((item, index) => (
              <TouchableOpacity
                style={{
                  backgroundColor: index % 2 === 0 ? colorScheme === 'dark' ? '#292929' : '#fff' : colorScheme === 'dark' ? '#212121' : '#f5f5f5',
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
          </View>)
      })}

    </ScrollView>
  );
}

function EpisodeBaru({ styles, globalStyles, data, props, }:
  {
    data: EpisodeBaruType | undefined, props: HomeListProps,
    styles: ReturnType<typeof useStyles>, globalStyles: ReturnType<typeof useGlobalStyles>
  }
) {

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
        <Text style={[styles.titleText, globalStyles.text]}>
          Episode terbaru:{' '}
        </Text>
        <TouchableOpacity
          containerStyle={{ flex: 1 }}
          style={styles.seeMoreContainer}
          onPress={() => {
            props.navigation.dispatch(
              StackActions.push('SeeMore', {
                type: 'AnimeList',
              }),
            );
          }}>
          <Text style={[globalStyles.text, styles.seeMoreText]}>
            Lihat semua{' '}
          </Text>
          <Icon
            name="long-arrow-right"
            color={globalStyles.text.color}
            size={20}
          />
        </TouchableOpacity>
      </View>
      <FlatList
        horizontal
        data={data?.newAnime.slice(0, 25)}
        renderItem={renderNewAnime}
        extraData={styles}
        showsHorizontalScrollIndicator={false}
      />
    </View>
  )
}

function MovieList({ props }: { props: HomeListProps }) {
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
    getLatestMovie().then(data => {
      if ('isError' in data) {
        setIsError(true);
      } else {
        setData?.(data);
      }
    }).catch(() => {
      setIsError(true);
    })
  }, [])

  const navigation = useNavigation<NavigationProp<RootStackNavigator>>();

  return (
    <View style={[styles.listContainer, { marginTop: 15 }]}>
      <View style={styles.titleContainer}>
        <Text style={[styles.titleText, globalStyles.text]}>
          Movie terbaru:{' '}
        </Text>
        <TouchableOpacity
          containerStyle={{ flex: 1 }}
          style={styles.seeMoreContainer}
          disabled={data?.length === 0}
          onPress={() => {
            props.navigation.dispatch(
              StackActions.push('SeeMore', {
                type: 'MovieList',
              }),
            );
          }}>
          <Text style={[globalStyles.text, styles.seeMoreText]}>
            Lihat semua{' '}
          </Text>
          <Icon
            name="long-arrow-right"
            color={globalStyles.text.color}
            size={20}
          />
        </TouchableOpacity>
      </View>
      {isError && (
        <Text onPress={() => {
          navigation.reset({
            index: 0,
            routes: [{ name: 'connectToServer' }],
          });
        }} style={[globalStyles.text, { textAlign: 'center', color: '#d80000' }]}>Error mendapatkan data awal yang dibutuhkan, ketuk disini untuk mencoba ulang dari loading screen</Text>
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
        <ActivityIndicator size="large" style={{ flex: 1, display: isError ? 'none' : 'flex' }} />
      )}
    </View>
  )
}

const AnnouncmentModalMemo = memo(AnnouncmentModal);

function AnnouncmentModal({
  visible,
  setVisible,
  announcmentMessage,
}: {
  visible: boolean;
  setVisible: React.Dispatch<React.SetStateAction<boolean>>;
  announcmentMessage: string | undefined;
}): React.JSX.Element {
  const globalStyles = useGlobalStyles();
  const styles = useStyles();
  if (announcmentMessage === undefined) {
    return <></>;
  }
  const linksInAnnouncment = findAllLinks(announcmentMessage as string);
  let announcment: string | (string | JSX.Element)[] | undefined;
  if (linksInAnnouncment === null) {
    announcment = announcmentMessage;
  } else {
    const splittedLinks: CustomArraySplice<string | JSX.Element> =
      splitAllLinks(announcmentMessage as string);
    let loopLength = 0;
    linksInAnnouncment.forEach((link, index) => {
      splittedLinks.splice(
        index + 1 + loopLength,
        0,
        <Text
          onPress={() => {
            Linking.openURL(link);
          }}
          key={index + 1 + loopLength}
          style={{ color: '#0066ff' }}>
          {link}
        </Text>,
      );
      loopLength += 1;
    });
    announcment = splittedLinks;
  }
  return (
    <Modal transparent visible={visible}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalPengumuman}>
            <Text style={[globalStyles.text, styles.pengumuman]}>
              Pengumuman!
            </Text>
          </View>
          <View style={styles.announcmentText}>
            <ScrollView>
              <Text style={[globalStyles.text, styles.announcmentMessage]}>
                {announcment}
              </Text>
            </ScrollView>
          </View>
          <View style={styles.announcmentOK}>
            <TouchableOpacity
              hitSlop={7}
              onPress={() => setVisible(false)}
              style={styles.announcmentOKButton}>
              <Text style={[globalStyles.text, styles.announcmentOKText]}>
                Tutup
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function useLocalTime() {
  const time = useSharedValue(new Date().toLocaleTimeString());
  const currTime = useRef<string>();
  useFocusEffect(
    useCallback(() => {
      time.set(new Date().toLocaleTimeString());
      const interval = setInterval(() => {
        const string = new Date().toLocaleTimeString();
        if (currTime.current !== string) {
          time.set(string);
          currTime.current = string;
        }
      }, 100);
      return () => {
        clearInterval(interval);
      };
    }, []),
  );
  return time;
}

function findAllLinks(texts: string): RegExpMatchArray | null {
  return texts.match(/(?:(?:https?|ftp):\/\/|www\.)[^\s/$.?#].[^\s]*/gi);
}

function splitAllLinks(texts: string): string[] {
  return texts.split(/(?:(?:https?|ftp):\/\/|www\.)[^\s/$.?#].[^\s]*/gi);
}

function useStyles() {
  const colorScheme = useColorScheme();
  const dimensions = useWindowDimensions();
  const LIST_BACKGROUND_HEIGHT = dimensions.height * 120 / 200 / 2.2;
  const LIST_BACKGROUND_WIDTH = dimensions.width * 120 / 200 / 1.9;
  return StyleSheet.create({
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
  });
}

export default memo(Home);
