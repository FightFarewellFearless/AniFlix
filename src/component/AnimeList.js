import React, { useCallback, useContext, useRef, useState } from 'react';
import {
  Animated,
  View,
  RefreshControl,
  Text,
  ScrollView,
  ImageBackground,
  TouchableOpacity,
  TextInput,
  ToastAndroid,
  TouchableHighlight,
} from 'react-native';
import { StackActions, useFocusEffect } from '@react-navigation/native';
import globalStyles from '../assets/style';
import Icon from 'react-native-vector-icons/FontAwesome';
import { HomeContext } from '../misc/context';

function Home(props) {
  const [searchText, setSearchText] = useState('');
  const { paramsState: data, setParamsState: setData } =
    useContext(HomeContext);
  const [refresh, setRefresh] = useState(false);

  const scaleAnim = useRef(new Animated.Value(0.8)).current;

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

  const submit = useCallback(() => {
    if (searchText === '') {
      return ToastAndroid.show(
        'Masukkan anime yang kamu cari ke dalam kolom pencarian',
        ToastAndroid.SHORT,
      );
    }
    props.navigation.dispatch(
      StackActions.push('FromUrl', {
        query: searchText,
        type: 'search',
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText]);

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
      style={{ transform: [{ scale: scaleAnim }] }}
      refreshControl={
        <RefreshControl refreshing={refresh} onRefresh={() => refreshing()} />
      }>
      <View style={{ flexDirection: 'row' }}>
        <TextInput
          onSubmitEditing={submit}
          onChangeText={text => {
            setSearchText(text);
          }}
          placeholder="Cari anime disini"
          placeholderTextColor="#707070"
          style={{
            width: searchText !== '' ? '87%' : '98%',
            height: 35,
            borderWidth: 0.8,
            borderColor: '#c5c5c5',
            marginLeft: 2,
            color: globalStyles.text.color,
          }}
        />
        {searchText !== '' && (
          <TouchableHighlight
            onPress={submit}
            style={{
              justifyContent: 'center',
              alignItems: 'center',
              width: '12%',
              backgroundColor: '#ffa43cff',
            }}>
            <Text style={{ color: '#ffffff' }}>
              <Icon name="search" style={{ color: '#413939' }} size={17} />
              Cari
            </Text>
          </TouchableHighlight>
        )}
      </View>
      <View>
        <View>
          <Text style={[{ fontSize: 20 }, globalStyles.text]}>
            Anime terbaru:{' '}
          </Text>
        </View>
        <ScrollView horizontal style={{ overflow: 'hidden', height: 215 }}>
          {data.newAnime.map(z => (
            <AnimeList
              newAnimeData={z}
              key={'btn' + z.title + z.episode}
              navigationProp={props.navigation}
            />
          ))}
        </ScrollView>
      </View>

      <View style={{ paddingTop: 13 }}>
        <View>
          <Text style={[{ fontSize: 20 }, globalStyles.text]}>
            Movie terbaru:{' '}
          </Text>
        </View>

        <ScrollView horizontal style={{ overflow: 'hidden', height: 215 }}>
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
        style={{
          overflow: 'hidden',
          width: 120,
          height: 210,
          borderWidth: 2,
          borderColor: z.status === 'Ongoing' ? 'red' : '#00d100',
          marginRight: 5,
          flex: 2,
        }}>
        <View
          style={{
            justifyContent: 'flex-start',
            alignItems: 'flex-start',
          }}>
          <Text
            numberOfLines={2}
            style={{
              fontSize: 10,
              color: 'black',
              backgroundColor: 'orange',
              opacity: 0.8,
            }}>
            {z.title}
          </Text>
        </View>

        <View
          style={{
            position: 'absolute',
            left: 0,
            bottom: 0,
            flexDirection: 'row',
          }}>
          <Text
            style={{
              fontSize: 10,
              color: '#000000',
              backgroundColor: '#0099ff',
              opacity: 0.8,
              borderRadius: 2,
              padding: 1,
            }}>
            {z.episode === '' ? 'MOVIE' : z.episode}
          </Text>
        </View>
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
          }}>
          <Text
            style={{
              fontSize: 10,
              color: 'black',
              backgroundColor: 'orange',
              opacity: 0.8,
              padding: 2,
              borderRadius: 3,
            }}>
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
        style={{
          overflow: 'hidden',
          width: 120,
          height: 210,
          borderWidth: 2,
          borderColor: 'red',
          marginRight: 5,
          flex: 2,
        }}>
        <View
          style={{
            justifyContent: 'flex-start',
            alignItems: 'flex-start',
          }}>
          <Text
            numberOfLines={2}
            style={{
              fontSize: 10,
              color: 'black',
              backgroundColor: 'orange',
              opacity: 0.8,
            }}>
            {z.title}
          </Text>
        </View>

        <View
          style={{
            position: 'absolute',
            left: 0,
            bottom: 0,
          }}>
          <Text
            style={{
              fontSize: 12,
              color: '#000000',
              backgroundColor: '#0099ff',
              opacity: 0.8,
              borderRadius: 2,
              padding: 1,
            }}>
            {z.releaseYear}
          </Text>
        </View>

        <View
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
          }}>
          <Text
            style={{
              fontSize: 10,
              color: 'black',
              backgroundColor: 'orange',
              opacity: 0.8,
              padding: 2,
              borderRadius: 3,
            }}>
            <Icon name="star" /> {z.rating}
          </Text>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );
}

export default Home;
