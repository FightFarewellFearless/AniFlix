import React, { useCallback, useContext, useRef, useState } from 'react';
import {
  Animated,
  View,
  RefreshControl,
  Text,
  ScrollView,
  ImageBackground,
  TouchableOpacity,
  ToastAndroid,
  StyleSheet,
} from 'react-native';
import { StackActions, useFocusEffect } from '@react-navigation/native';
import globalStyles from '../assets/style';
import Icon from 'react-native-vector-icons/FontAwesome';
import { HomeContext } from '../misc/context';

function Home(props) {
  const { paramsState: data, setParamsState: setData } =
    useContext(HomeContext);
  const [refresh, setRefresh] = useState(false);

  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  const localTime = useLocalTime();

  useFocusEffect(
    useCallback(() => {
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
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const refreshing = useCallback(() => {
    setRefresh(true);

    fetch('https://animeapi.aceracia.repl.co/v2/home')
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
  return (
    <Animated.ScrollView
      style={{ transform: [{ scale: scaleAnim }], flex: 1 }}
      refreshControl={
        <RefreshControl refreshing={refresh} onRefresh={refreshing} />
      }>
      <View style={styles.box}>
        <View style={styles.boxItem}>
          <Text style={[globalStyles.text, styles.boxTime]}>{localTime}</Text>
        </View>
      </View>
      <View style={styles.listContainer}>
        <View style={styles.titleContainer}>
          <Text
            style={[{ fontSize: 20, fontWeight: 'bold' }, globalStyles.text]}>
            Anime terbaru:{' '}
          </Text>
        </View>
        <ScrollView horizontal style={{ overflow: 'hidden', height: 200 }}>
          {data.newAnime.map(z => (
            <AnimeList
              newAnimeData={z}
              key={'btn' + z.title + z.episode}
              navigationProp={props.navigation}
            />
          ))}
        </ScrollView>
      </View>

      <View style={[{ marginTop: 13 }, styles.listContainer]}>
        <View style={styles.titleContainer}>
          <Text
            style={[{ fontSize: 20, fontWeight: 'bold' }, globalStyles.text]}>
            Movie terbaru:{' '}
          </Text>
        </View>

        <ScrollView horizontal style={{ overflow: 'hidden', height: 200 }}>
          {data.movie.map(z => (
            <MovieList
              movieData={z}
              key={'btn' + z.title + z.episode}
              navigationProp={props.navigation}
            />
          ))}
        </ScrollView>
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
  },
  boxTime: {
    alignSelf: 'center',
    fontSize: 17,
    fontWeight: 'bold',
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
