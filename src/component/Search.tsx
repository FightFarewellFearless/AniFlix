import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Image,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Animated,
  Alert,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import {
  useFocusEffect,
  StackActions,
  CompositeScreenProps,
} from '@react-navigation/native';
import globalStyles from '../assets/style';
import Icon from 'react-native-vector-icons/FontAwesome';
import deviceUserAgent from '../utils/deviceUserAgent';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { HomeNavigator, RootStackNavigator } from '../types/navigation';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SearchAnimeList } from '../types/anime';
import colorScheme from '../utils/colorScheme';

const TextInputAnimation = Animated.createAnimatedComponent(TextInput);

type Props = CompositeScreenProps<
  BottomTabScreenProps<HomeNavigator, 'Search'>,
  NativeStackScreenProps<RootStackNavigator>
>;

const PressableAnimation = Animated.createAnimatedComponent(Pressable);

function Search(props: Props) {
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

  const [searchText, setSearchText] = useState<string>('');
  const [data, setData] = useState<null | SearchAnimeList[]>(null);
  const [loading, setLoading] = useState(false);
  const query = useRef<undefined | string>();
  const searchButtonAnimation = useRef(new Animated.Value(100)).current;
  const searchButtonOpacity = useRef(new Animated.Value(1)).current;
  const searchButtonMounted = useRef(false);

  const searchTextAnimationColor = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (searchText !== '' && searchButtonMounted.current === false) {
      Animated.spring(searchButtonAnimation, {
        toValue: 0,
        // duration: 700,
        useNativeDriver: false,
      }).start();
    } else if (searchButtonMounted.current === true && searchText === '') {
      Animated.spring(searchButtonAnimation, {
        toValue: 100,
        // duration: 700,
        useNativeDriver: false,
      }).start();
    }
    if (searchText === '') {
      searchButtonMounted.current = false;
    } else {
      searchButtonMounted.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText]);

  const onChangeText = useCallback((text: string) => {
    setSearchText(text);
  }, []);

  const submit = useCallback(() => {
    if (searchText === '') {
      return;
    }
    setLoading(true);
    fetch('https://animeapi.aceracia.repl.co/v3/search?q=' + searchText, {
      headers: {
        'User-Agent': deviceUserAgent,
      },
    })
      .then(async results => {
        if (results) {
          const result = await results.json();
          if (result.maintenance) {
            props.navigation.navigate('Maintenance');
            setLoading(false);
            return;
          }
          query.current = searchText;
          setData(result);
          setLoading(false);
        }
      })
      .catch(err => {
        if (err.message === 'Aborted') {
          return;
        }
        const errMessage =
          err.message === 'Network request failed'
            ? 'Permintaan gagal.\nPastikan kamu terhubung dengan internet'
            : 'Error tidak diketahui: ' + err.message;
        Alert.alert('Error', errMessage);
        setLoading(false);
      });
  }, [props.navigation, searchText]);

  const onPressIn = useCallback(() => {
    Animated.timing(searchButtonOpacity, {
      toValue: 0.4,
      useNativeDriver: false,
      duration: 100,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onPressOut = useCallback(() => {
    Animated.timing(searchButtonOpacity, {
      toValue: 1,
      useNativeDriver: false,
      duration: 100,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSearchTextFocus = useCallback(() => {
    Animated.timing(searchTextAnimationColor, {
      toValue: 1,
      useNativeDriver: false,
      duration: 400,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSearchTextBlur = useCallback(() => {
    Animated.timing(searchTextAnimationColor, {
      toValue: 0,
      useNativeDriver: false,
      duration: 400,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Animated.View style={[{ flex: 1 }, { transform: [{ scale: scaleAnim }] }]}>
      <View style={{ flexDirection: 'row' }}>
        <TextInputAnimation
          onSubmitEditing={submit}
          onChangeText={onChangeText}
          placeholder="Cari anime disini"
          placeholderTextColor={colorScheme === 'dark' ? '#707070' : 'black'}
          onFocus={onSearchTextFocus}
          onBlur={onSearchTextBlur}
          style={[
            styles.searchInput,
            {
              // width: searchText !== '' ? '87%' : '98%',
              width: searchButtonAnimation.interpolate({
                inputRange: [0, 100],
                outputRange: ['87%', '98%'],
              }),
              // borderColor: colorScheme === 'dark' ? '#c5c5c5' : 'black',
              borderColor: searchTextAnimationColor.interpolate({
                inputRange: [0, 1],
                outputRange: [
                  colorScheme === 'dark'
                    ? 'rgb(197, 197, 197)'
                    : 'rgb(0, 0, 0)',
                  'rgb(0, 128, 0)',
                ],
              }),
            },
          ]}
        />
        <PressableAnimation
          onPress={submit}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          style={[
            styles.searchButton,
            {
              opacity: searchButtonOpacity,
              transform: [
                {
                  translateX: searchButtonAnimation,
                },
              ],
            },
          ]}>
          <Text style={{ color: '#272727' }}>
            <Icon name="search" style={{ color: '#413939' }} size={17} />
            Cari
          </Text>
        </PressableAnimation>
      </View>
      {loading && <ActivityIndicator />}
      {data === null ? (
        ''
      ) : (
        <>
          <Text style={globalStyles.text}>
            Hasil pencarian untuk: {query.current}
          </Text>
          {data.length > 0 ? (
            <ScrollView>
              {data.map(z => {
                return (
                  <TouchableOpacity
                    style={styles.listContainer}
                    key={'btn' + z.title}
                    onPress={() => {
                      props.navigation.dispatch(
                        StackActions.push('FromUrl', {
                          link: z.animeUrl,
                        }),
                      );
                    }}>
                    <Image
                      resizeMode="stretch"
                      key={z.title + z.episode}
                      source={{ uri: z.thumbnailUrl }}
                      style={styles.listImage}
                    />
                    <View style={{ flex: 1 }}>
                      <View style={styles.listTitle}>
                        <Text style={[{ flexShrink: 1 }, globalStyles.text]}>
                          {z.title}
                        </Text>
                      </View>

                      <View style={styles.episodeInfo}>
                        <Text style={globalStyles.text}>
                          {z.episode === '' ? 'Movie' : z.episode}
                        </Text>
                      </View>

                      <View style={styles.ratingInfo}>
                        <Text style={globalStyles.text}>
                          <Icon name="star" style={{ color: 'gold' }} />{' '}
                          {z.rating}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.statusInfo,
                          {
                            borderColor:
                              z.status === 'Ongoing' ? '#cf0000' : '#22b422',
                          },
                        ]}>
                        <Text style={globalStyles.text}>{z.status}</Text>
                      </View>

                      <View style={styles.releaseInfo}>
                        <Text style={globalStyles.text}>
                          <Icon name="calendar" /> {z.releaseYear}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          ) : (
            <Text style={globalStyles.text}>Tidak ada hasil!</Text>
          )}
        </>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  searchInput: {
    height: 35,
    borderWidth: 0.8,
    borderRadius: 10,
    backgroundColor: colorScheme === 'dark' ? '#202020' : 'gray',
    marginLeft: 2,
    color: globalStyles.text.color,
  },
  searchButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '12%',
    backgroundColor: '#ffa43cff',
  },
  listContainer: {
    flexDirection: 'row',
    marginVertical: 5,
    backgroundColor: colorScheme === 'dark' ? '#3b3939' : '#bebebe',
    borderRadius: 16,
    elevation: 5,
  },
  listImage: {
    width: 120,
    height: 200,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    marginRight: 7,
  },
  listTitle: {
    flexShrink: 1,
    justifyContent: 'center',
    flex: 1,
  },
  episodeInfo: {
    position: 'absolute',
    right: 5,
  },
  ratingInfo: {
    position: 'absolute',
    left: 0,
  },
  statusInfo: {
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  releaseInfo: {
    position: 'absolute',
    bottom: 0,
    right: 5,
  },
});

export default Search;
