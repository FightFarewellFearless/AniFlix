import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Image,
  Text,
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
import globalStyles, { lightText } from '../assets/style';
import Icon from 'react-native-vector-icons/FontAwesome';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { HomeNavigator, RootStackNavigator } from '../types/navigation';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SearchAnime } from '../types/anime';
import colorScheme from '../utils/colorScheme';
import AnimeAPI from '../utils/AnimeAPI';

import Reanimated, {
  FadeInRight,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { FlashList } from '@shopify/flash-list';

const TextInputAnimation = Reanimated.createAnimatedComponent(TextInput);
const TouchableOpacityAnimated =
  Reanimated.createAnimatedComponent(TouchableOpacity);

type Props = CompositeScreenProps<
  BottomTabScreenProps<HomeNavigator, 'Search'>,
  NativeStackScreenProps<RootStackNavigator>
>;

const PressableAnimation = Reanimated.createAnimatedComponent(Pressable);

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
  const [data, setData] = useState<null | SearchAnime>(null);
  const [loading, setLoading] = useState(false);
  const query = useRef<undefined | string>();
  const searchButtonAnimation = useSharedValue(100);
  const searchButtonOpacity = useSharedValue(1);
  const searchButtonMounted = useRef(false);

  const loadMoreLoading = useRef<boolean>(false);

  const searchTextAnimationColor = useSharedValue(0);

  useEffect(() => {
    if (searchText !== '' && searchButtonMounted.current === false) {
      searchButtonAnimation.value = withSpring(0, {
        damping: 12,
      });
    } else if (searchButtonMounted.current === true && searchText === '') {
      searchButtonAnimation.value = withSpring(100);
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
    AnimeAPI.search(searchText)
      .then(async result => {
        if ('maintenance' in result && result.maintenance === true) {
          props.navigation.navigate('Maintenance', {
            message: result.message,
          });
          setLoading(false);
          return;
        }
        query.current = searchText;
        setData(result);
        setLoading(false);
      })
      .catch(err => {
        // if (err.message === 'Aborted') {
        //   return;
        // }
        const errMessage =
          err.message === 'Network request failed'
            ? 'Permintaan gagal.\nPastikan kamu terhubung dengan internet'
            : 'Error tidak diketahui: ' + err.message;
        Alert.alert('Error', errMessage);
        setLoading(false);
      });
  }, [props.navigation, searchText]);

  const loadMore = useCallback(async (page: number) => {
    if (loadMoreLoading.current) {
      return;
    }
    loadMoreLoading.current = true;
    setLoading(true);
    try {
      const searchResult = await AnimeAPI.search(query.current as string, page);
      setData(old => {
        if (old === null) {
          return searchResult;
        }
        return {
          ...searchResult,
          result: old?.result.concat(searchResult.result),
        };
      });
    } catch (err: any) {
      const errMessage =
        err.message === 'Network request failed'
          ? 'Permintaan gagal.\nPastikan kamu terhubung dengan internet'
          : 'Error tidak diketahui: ' + err.message;
      Alert.alert('Error', errMessage);
    } finally {
      loadMoreLoading.current = false;
      setLoading(false);
    }
  }, []);

  const onPressIn = useCallback(() => {
    searchButtonOpacity.value = withTiming(0.4, { duration: 100 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onPressOut = useCallback(() => {
    searchButtonOpacity.value = withTiming(1, { duration: 100 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSearchTextFocus = useCallback(() => {
    searchTextAnimationColor.value = withTiming(1, { duration: 400 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSearchTextBlur = useCallback(() => {
    searchTextAnimationColor.value = withTiming(0, { duration: 400 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // @ts-ignore
  const textInputAnimation = useAnimatedStyle(() => {
    const borderColor = interpolateColor(
      searchTextAnimationColor.value,
      [0, 1],
      [
        colorScheme === 'dark' ? 'rgb(197, 197, 197)' : 'rgb(0, 0, 0)',
        'rgb(0, 128, 0)',
      ],
    );
    return {
      width: interpolate(searchButtonAnimation.value, [0, 100], [87, 98]) + '%',
      borderTopColor: borderColor,
      borderBottomColor: borderColor,
    };
  });

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
          autoCorrect={false}
          style={[styles.searchInput, textInputAnimation]}
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
      {data === null ? (
        <View style={styles.center}>
          <Text style={styles.nullDataText}>Silahkan cari terlebih dahulu</Text>
        </View>
      ) : (
        <>
          <Text style={globalStyles.text}>
            Hasil pencarian untuk: {query.current}
          </Text>
          {data.result.length > 0 ? (
            <FlashList
              estimatedItemSize={209}
              data={data.result}
              keyExtractor={(_, index) => index.toString()}
              renderItem={({ item: z }) => (
                <TouchableOpacityAnimated
                  entering={FadeInRight}
                  style={styles.listContainer}
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
                </TouchableOpacityAnimated>
              )}
              ListFooterComponent={() =>
                data.nextPageAvailable && (
                  <View style={styles.nextPageView}>
                    <TouchableOpacity
                      style={styles.nextPageButton}
                      onPress={() => {
                        loadMore(data.nextPage);
                      }}>
                      <Text style={{ color: lightText }}>
                        <Icon name="chevron-down" /> Muat lebih banyak
                      </Text>
                    </TouchableOpacity>
                  </View>
                )
              }
            />
          ) : (
            <Text style={globalStyles.text}>Tidak ada hasil!</Text>
          )}
        </>
      )}
      {loading && (
        <ActivityIndicator style={styles.centerLoading} size="large" />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  center: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  nullDataText: {
    color: globalStyles.text.color,
    fontWeight: 'bold',
    fontSize: 17,
  },
  centerLoading: { position: 'absolute', right: '50%', top: '50%', zIndex: 2 },
  searchInput: {
    height: 35,
    borderWidth: 0.8,
    borderRadius: 5,
    backgroundColor: colorScheme === 'dark' ? '#202020' : '#c9c9c9',
    marginLeft: 2,
    color: globalStyles.text.color,
    textAlign: 'center',
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
  nextPageView: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextPageButton: {
    backgroundColor: 'orange',
    padding: 10,
  },
});

export default Search;
