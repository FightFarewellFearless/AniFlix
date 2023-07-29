import React, {
  memo,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  View,
  RefreshControl,
  Text,
  ImageBackground,
  TouchableOpacity,
  ToastAndroid,
  StyleSheet,
  FlatList,
  useWindowDimensions,
  Modal,
  ScrollView,
  ListRenderItemInfo,
  TouchableHighlight,
  Linking,
} from 'react-native';
import { StackActions, useFocusEffect } from '@react-navigation/native';
import globalStyles from '../assets/style';
import Icon from 'react-native-vector-icons/FontAwesome';
import { HomeContext } from '../misc/context';
import runningText from '../assets/runningText.json';
import deviceUserAgent from '../utils/deviceUserAgent';
import { MovieList as MovieListType, NewAnimeList } from '../types/anime';
import { HomeNavigator } from '../types/navigation';
import {
  BottomTabNavigationProp,
  BottomTabScreenProps,
} from '@react-navigation/bottom-tabs';

type Props = BottomTabScreenProps<HomeNavigator, 'AnimeList'>;

interface CustomArraySplice<T> extends Array<T> {
  splice(start: number, deleteCount?: number, ...items: T[]): T[];
}

function Home(props: Props) {
  const { paramsState: data, setParamsState: setData } =
    useContext(HomeContext);
  const [refresh, setRefresh] = useState(false);
  const [textLayoutWidth, setTextLayoutWidth] = useState<undefined | number>(
    undefined,
  );
  const [animationText, setAnimationText] = useState(runningText[0]);
  const [announcmentVisible, setAnnouncmentVisible] = useState(false);

  const windowSize = useWindowDimensions();

  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const boxTextAnim = useRef(new Animated.Value(0)).current;
  const boxTextLayout = useRef(0);

  const localTime = useLocalTime();

  useEffect(() => {
    if (data?.announcment.enable === true) {
      setAnnouncmentVisible(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFocusEffect(
    useCallback(() => {
      const textAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(boxTextAnim, {
            toValue: 1,
            duration: 15000,
            useNativeDriver: true,
            delay: 1000,
          }),
          Animated.timing(boxTextAnim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      );
      textAnimation.start();
      const interval = setInterval(() => {
        setTextLayoutWidth(undefined);
        setAnimationText(
          runningText[Math.floor(Math.random() * runningText.length)],
        );
      }, 16500);
      Animated.timing(scaleAnim, {
        toValue: 1,
        // speed: 18,
        duration: 150,
        useNativeDriver: true,
      }).start();
      return () => {
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          // speed: 18,
          duration: 250,
          useNativeDriver: true,
        }).start();
        textAnimation.reset();
        clearInterval(interval);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const refreshing = useCallback(() => {
    setRefresh(true);

    fetch('https://animeapi.aceracia.repl.co/v3/home', {
      headers: {
        'User-Agent': deviceUserAgent,
      },
    })
      .then(async fetchData => {
        const jsondata = await fetchData.json();
        if (jsondata.maintenance) {
          ToastAndroid.show('Server sedang maintenance!', ToastAndroid.SHORT);
          setRefresh(false);
          return;
        }
        setData?.(jsondata);
        setRefresh(false);
      })
      .catch(() => {
        ToastAndroid.show('Gagal terhubung ke server.', ToastAndroid.SHORT);
        setRefresh(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderNewAnime = useCallback(
    ({ item }: ListRenderItemInfo<NewAnimeList>) => (
      <AnimeList
        newAnimeData={item}
        key={'btn' + item.title + item.episode}
        navigationProp={props.navigation}
      />
    ),
    [props.navigation],
  );
  const renderMovie = useCallback(
    ({ item }: ListRenderItemInfo<MovieListType>) => (
      <MovieList
        movieData={item}
        key={'btn' + item.title}
        navigationProp={props.navigation}
      />
    ),
    [props.navigation],
  );

  return (
    <Animated.ScrollView
      style={{ transform: [{ scale: scaleAnim }], flex: 1 }}
      refreshControl={
        <RefreshControl
          refreshing={refresh}
          onRefresh={refreshing}
          progressBackgroundColor="#292929"
          colors={['#00a2ff', 'red']}
        />
      }>
      <AnnouncmentModalMemo
        visible={announcmentVisible}
        announcmentMessage={
          data?.announcment.enable === true
            ? data?.announcment.message
            : undefined
        }
        setVisible={setAnnouncmentVisible}
      />
      <View style={styles.box}>
        <View style={styles.boxItem}>
          <Text style={[globalStyles.text, styles.boxTime]}>{localTime}</Text>
          {/* running text animation */}
          <Animated.Text
            onLayout={nativeEvent =>
              (boxTextLayout.current = nativeEvent.nativeEvent.layout.width)
            }
            onTextLayout={layout => {
              const width = Math.round(
                layout.nativeEvent.lines.reduce((a, b) => {
                  return a + b.width;
                }, 0),
              );
              setTextLayoutWidth(width + 10);
            }}
            style={[
              styles.boxText,
              { width: textLayoutWidth || 'auto' },
              {
                transform: [
                  {
                    translateX: boxTextAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [windowSize.width, -boxTextLayout.current],
                    }),
                  },
                ],
              },
            ]}>
            {animationText}
          </Animated.Text>
        </View>
      </View>
      <View style={styles.listContainer}>
        <View style={styles.titleContainer}>
          <Text
            style={[{ fontSize: 20, fontWeight: 'bold' }, globalStyles.text]}>
            Episode terbaru:{' '}
          </Text>
        </View>
        <FlatList
          horizontal
          data={data?.newAnime}
          renderItem={renderNewAnime}
          showsHorizontalScrollIndicator={false}
        />
      </View>

      <View style={[{ marginTop: 13 }, styles.listContainer]}>
        <View style={styles.titleContainer}>
          <Text
            style={[{ fontSize: 20, fontWeight: 'bold' }, globalStyles.text]}>
            Movie terbaru:{' '}
          </Text>
        </View>

        <FlatList
          horizontal
          data={data?.movie}
          renderItem={renderMovie}
          showsHorizontalScrollIndicator={false}
        />
      </View>
    </Animated.ScrollView>
  );
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
  const linksInAnnouncment = findAllLinks(announcmentMessage as string);
  let announcment: string | (string | JSX.Element)[] | undefined;
  if (linksInAnnouncment === null) {
    announcment = announcmentMessage;
  } else {
    const split: CustomArraySplice<string | JSX.Element> = (
      announcmentMessage as string
    ).split('');
    linksInAnnouncment.forEach((link, index) => {
      const indexStart = announcmentMessage?.indexOf(link) as number;
      const indexEnd = indexStart + link.length;
      split.splice(
        indexStart,
        indexEnd,
        <TouchableHighlight
          key={link + index}
          onPress={() => {
            Linking.openURL(link);
          }}
          underlayColor={'#0077ff'}>
          <Text style={{ color: '#0066ff' }}>{link}</Text>
        </TouchableHighlight>,
      );
    });
    announcment = split;
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
                OK
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function AnimeList(props: {
  newAnimeData: NewAnimeList;
  navigationProp: BottomTabNavigationProp<
    HomeNavigator,
    'AnimeList',
    undefined
  >;
}) {
  const z = props.newAnimeData;
  const navigation = props.navigationProp;
  return (
    <TouchableOpacity
      onPress={() => {
        navigation.dispatch(
          StackActions.push('FromUrl', {
            link: z.streamingLink,
          }),
        );
      }}>
      <ImageBackground
        resizeMode="stretch"
        key={z.title + z.episode}
        source={{ uri: z.thumbnailUrl }}
        style={[
          styles.listBackground,
          { borderColor: z.status === 'Ongoing' ? 'red' : '#00d100' },
        ]}>
        <View style={styles.animeTitleContainer}>
          <Text numberOfLines={2} style={styles.animeTitle}>
            {z.title}
          </Text>
        </View>

        <View style={styles.animeEpisodeContainer}>
          <Text style={styles.animeEpisode}>
            {z.episode === '' ? 'MOVIE' : z.episode}
          </Text>
        </View>
        <View style={styles.animeRatingContainer}>
          <Text style={styles.animeRating}>
            <Icon name="star" /> {z.rating}
          </Text>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );
}

function MovieList(props: {
  movieData: MovieListType;
  navigationProp: BottomTabNavigationProp<
    HomeNavigator,
    'AnimeList',
    undefined
  >;
}) {
  const z = props.movieData;
  const navigation = props.navigationProp;
  return (
    <TouchableOpacity
      onPress={() => {
        navigation.dispatch(
          StackActions.push('FromUrl', {
            link: z.streamingLink,
          }),
        );
      }}>
      <ImageBackground
        resizeMode="stretch"
        key={z.title}
        source={{ uri: z.thumbnailUrl }}
        style={[styles.listBackground, { borderColor: 'orange' }]}>
        <View style={styles.animeTitleContainer}>
          <Text numberOfLines={2} style={styles.animeTitle}>
            {z.title}
          </Text>
        </View>

        <View style={styles.animeEpisodeContainer}>
          <Text style={[styles.animeEpisode, { fontSize: 12 }]}>
            {z.releaseYear}
          </Text>
        </View>

        <View style={styles.animeRatingContainer}>
          <Text style={styles.animeRating}>
            <Icon name="star" /> {z.rating}
          </Text>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );
}

function useLocalTime() {
  const [time, setTime] = useState(new Date().toLocaleTimeString());
  useFocusEffect(
    useCallback(() => {
      setTime(new Date().toLocaleTimeString());
      const interval = setInterval(() => {
        setTime(new Date().toLocaleTimeString());
      }, 1000);
      return () => {
        clearInterval(interval);
      };
    }, []),
  );
  return time;
}

function findAllLinks(texts: string): RegExpMatchArray | null {
  return texts.match(
    /https?:\/\/[-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_+.~#?&//=]*)/gi,
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0000008a',
  },
  modalContent: {
    flex: 0.15,
    backgroundColor: '#202020',
    borderWidth: 1,
    borderColor: '#525252',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 100,
    minWidth: 250,
    elevation: 16,
    shadowColor: '#02bb7d',
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
    borderColor: '#01463cff',
    backgroundColor: '#414141',
    borderWidth: 1,
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
    backgroundColor: 'white',
    width: 50,
    padding: 5,
    borderRadius: 3,
  },
  announcmentOKText: {
    color: '#006bcf',
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
    backgroundColor: '#363636',
    borderColor: 'gold',
    borderWidth: 1.2,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  boxTime: {
    alignSelf: 'center',
    fontSize: 17,
    fontWeight: 'bold',
  },
  boxText: {
    position: 'absolute',
    bottom: 0,
    color: '#ff2020',
    fontWeight: 'bold',
    textShadowColor: 'black',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  listContainer: {
    position: 'relative',
    backgroundColor: '#272727',
    paddingVertical: 10,
    borderRadius: 10,
  },
  titleContainer: {
    marginBottom: 10,
    alignSelf: 'center',
  },
  listBackground: {
    overflow: 'hidden',
    width: 120,
    height: 200,
    borderWidth: 1,
    marginRight: 5,
    flex: 2,
    borderRadius: 7,
  },
  animeTitleContainer: {
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  animeTitle: {
    fontSize: 10,
    color: 'black',
    backgroundColor: 'orange',
    opacity: 0.8,
    textAlign: 'center',
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

export default Home;
