import React, { useCallback, useContext, useRef, useState } from 'react';
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
} from 'react-native';
import { StackActions, useFocusEffect } from '@react-navigation/native';
import globalStyles from '../assets/style';
import Icon from 'react-native-vector-icons/FontAwesome';
import { HomeContext } from '../misc/context';
import runningText from '../assets/runningText.json';
import deviceUserAgent from '../utils/deviceUserAgent';

function Home(props) {
  const { paramsState: data, setParamsState: setData } =
    useContext(HomeContext);
  const [refresh, setRefresh] = useState(false);
  const [textLayoutWidth, setTextLayoutWidth] = useState(undefined);
  const [animationText, setAnimationText] = useState(runningText[0]);

  const windowSize = useWindowDimensions();

  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const boxTextAnim = useRef(new Animated.Value(0)).current;
  const boxTextLayout = useRef(0);

  const localTime = useLocalTime();

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

    fetch('https://animeapi.aceracia.repl.co/v2/home', {
      headers: {
        'User-Agent': deviceUserAgent,
      },
    })
      .then(async fetchData => {
        const jsondata = await fetchData.json();
        setData(jsondata);
        setRefresh(false);
      })
      .catch(e => {
        ToastAndroid.show('Gagal terhubung ke server.', ToastAndroid.SHORT);
        setRefresh(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderNewAnime = useCallback(
    ({ item }) => (
      <AnimeList
        newAnimeData={item}
        key={'btn' + item.title + item.episode}
        navigationProp={props.navigation}
      />
    ),
    [props.navigation],
  );
  const renderMovie = useCallback(
    ({ item }) => (
      <MovieList
        movieData={item}
        key={'btn' + item.title + item.episode}
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
          data={data.newAnime}
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
          data={data.movie}
          renderItem={renderMovie}
          showsHorizontalScrollIndicator={false}
        />
      </View>
    </Animated.ScrollView>
  );
}

function AnimeList(props) {
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

function MovieList(props) {
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
        key={z.title + z.episode}
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

const styles = StyleSheet.create({
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
