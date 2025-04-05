import { CompositeScreenProps, StackActions, useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  ImageBackground,
  Keyboard,
  KeyboardAvoidingView,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
  useWindowDimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import useGlobalStyles from '../../assets/style';
import { SearchAnime, listAnimeTypeList } from '../../types/anime';
import { HomeNavigator, RootStackNavigator } from '../../types/navigation';
import AnimeAPI from '../../utils/AnimeAPI';

import { LegendList, LegendListRenderItemProps } from '@legendapp/list';
import { LinearGradient } from 'expo-linear-gradient';
import ImageColors from 'react-native-image-colors';
import Reanimated, {
  FadeInRight,
  FadeInUp,
  FadeOutDown,
  SlideInDown,
  SlideOutDown,
  ZoomIn,
  ZoomOut,
} from 'react-native-reanimated';
import useSelectorIfFocused from '../../hooks/useSelectorIfFocused';
import { Movies, searchMovie } from '../../utils/animeMovie';
import ImageLoading from '../ImageLoading';
import DarkOverlay from '../misc/DarkOverlay';

import { NativeBottomTabScreenProps } from '@bottom-tabs/react-navigation';
import { FlatList, TouchableOpacity as TouchableOpacityRNGH } from 'react-native-gesture-handler';
import { storage } from '../../utils/DatabaseManager';

// Remove reanimated animated component creation for TextInput and Pressable
// Replace:
// const TextInputAnimation = Reanimated.createAnimatedComponent(TextInput);
// const PressableAnimation = Reanimated.createAnimatedComponent(Pressable);
const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const TouchableOpacityAnimated = Reanimated.createAnimatedComponent(TouchableOpacityRNGH);

const Reanimated_KeyboardAvoidingView = Reanimated.createAnimatedComponent(KeyboardAvoidingView);

type Props = CompositeScreenProps<
  NativeBottomTabScreenProps<HomeNavigator, 'Search'>,
  NativeStackScreenProps<RootStackNavigator>
>;

function Search(props: Props) {
  const [isPending, startTransition] = useTransition();

  const globalStyles = useGlobalStyles();
  const colorScheme = useColorScheme();
  const styles = useStyles();
  const dimensions = useWindowDimensions();

  useFocusEffect(
    useCallback(() => {
      const keyboardEvent = Keyboard.addListener('keyboardDidHide', () => {
        if (textInputRef.current) {
          textInputRef.current.blur();
        }
      });
      return () => {
        keyboardEvent.remove();
      };
    }, []),
  );

  const searchText = useRef<string>('');
  const [listAnime, setListAnime] = useState<listAnimeTypeList[] | null>([]);
  const [listAnimeLoading, setListAnimeLoading] = useState(false);
  const [data, setData] = useState<null | SearchAnime>(null);
  const [movieData, setMovieData] = useState<null | Movies[]>(null);
  const [loading, setLoading] = useState(false);
  const [searchHistoryDisplay, setSearchHistoryDisplay] = useState<boolean>(false);
  const [currentSearchQuery, setCurrentSearchQuery] = useState<string>('');
  // Remove useSharedValue; instead initialize Animated.Values
  const [searchButtonAnimation] = useState(() => new Animated.Value(100));
  const [searchButtonOpacity] = useState(() => new Animated.Value(1));
  const [searchTextAnimationColor] = useState(() => new Animated.Value(0));
  // Replace shared value for button width with state.
  const [searchButtonWidth, setSearchButtonWidth] = useState(75);
  const searchButtonMounted = useRef(false);

  const searchHistory = useSelectorIfFocused(
    state => state.settings.searchHistory,
    true,
    result => JSON.parse(result) as string[],
  );

  const textInputRef = useRef<TextInput>(null);

  useEffect(() => {
    setListAnimeLoading(true);
    AnimeAPI.listAnime(undefined, animeData => {
      startTransition(() => {
        setListAnime(animeData);
      });
    })
      .then(animeData => {
        setListAnime(animeData);
        setListAnimeLoading(false);
      })
      .catch(() => {
        setListAnime(null);
        setListAnimeLoading(false);
      });
  }, []);

  const onChangeText = useCallback(
    (text: string) => {
      searchText.current = text;
      if (searchText.current !== '' && searchButtonMounted.current === false) {
        Animated.timing(searchButtonAnimation, {
          toValue: 0,
          duration: 250,
          useNativeDriver: false,
        }).start();
      } else if (searchButtonMounted.current === true && searchText.current === '') {
        Animated.timing(searchButtonAnimation, {
          toValue: 100,
          duration: 250,
          useNativeDriver: false,
        }).start();
      }
      searchButtonMounted.current = searchText.current !== '';
    },
    [searchButtonAnimation],
  );

  const submit = useCallback(() => {
    if (searchText.current === '') {
      return;
    }
    setLoading(true);
    textInputRef.current?.blur();
    Promise.all([AnimeAPI.search(searchText.current), searchMovie(searchText.current)])
      .then(([animeResult, movieResult]) => {
        setCurrentSearchQuery(searchText.current);
        setMovieData(movieResult);
        setData(animeResult);
        setLoading(false);
        if (searchHistory.includes(searchText.current)) {
          searchHistory.splice(searchHistory.indexOf(searchText.current), 1);
        }
        searchHistory.unshift(searchText.current);
        storage.set('searchHistory', JSON.stringify(searchHistory));
      })
      .catch(err => {
        const errMessage =
          err.message === 'Network Error'
            ? 'Permintaan gagal.\nPastikan kamu terhubung dengan internet'
            : 'Error tidak diketahui: ' + err.message;
        Alert.alert('Error', errMessage);
        setLoading(false);
      });
  }, [searchHistory]);

  const onPressIn = useCallback(() => {
    Animated.timing(searchButtonOpacity, {
      toValue: 0.4,
      duration: 100,
      useNativeDriver: false,
    }).start();
  }, [searchButtonOpacity]);

  const onPressOut = useCallback(() => {
    Animated.timing(searchButtonOpacity, {
      toValue: 1,
      duration: 100,
      useNativeDriver: false,
    }).start();
  }, [searchButtonOpacity]);

  const onSearchTextFocus = useCallback(() => {
    Animated.timing(searchTextAnimationColor, {
      toValue: 1,
      duration: 400,
      useNativeDriver: false,
    }).start();
    setSearchHistoryDisplay(true);
  }, [searchTextAnimationColor]);

  const onSearchTextBlur = useCallback(() => {
    Animated.timing(searchTextAnimationColor, {
      toValue: 0,
      duration: 400,
      useNativeDriver: false,
    }).start();
    setSearchHistoryDisplay(false);
  }, [searchTextAnimationColor]);

  // Compute animated styles using default Animated.interpolate
  const animatedInputWidth = searchButtonAnimation.interpolate({
    inputRange: [0, 100],
    outputRange: [dimensions.width - searchButtonWidth, dimensions.width - 10],
  });
  const borderColor = searchTextAnimationColor.interpolate({
    inputRange: [0, 1],
    outputRange: [colorScheme === 'dark' ? 'rgb(197,197,197)' : 'rgb(0,0,0)', 'rgb(0,124,128)'],
  });
  const textInputAnimationStyle = {
    width: animatedInputWidth,
    borderTopColor: borderColor,
    borderBottomColor: borderColor,
  };
  const pressableAnimationStyle = {
    opacity: searchButtonOpacity,
    transform: [
      {
        translateX: searchButtonAnimation,
      },
    ],
  };

  const onPressableLayoutChange = useCallback((layout: LayoutChangeEvent) => {
    setSearchButtonWidth(layout.nativeEvent.layout.width);
  }, []);

  function renderSearchHistory({ item, index }: LegendListRenderItemProps<string>) {
    const onChangeTextFunction = (text: string) => {
      onChangeText(text);
      textInputRef.current?.setNativeProps({ text: '' });
      textInputRef.current?.setNativeProps({ text });
    };
    return (
      <HistoryList
        index={index}
        item={item}
        data={searchHistory}
        onChangeTextFunction={onChangeTextFunction}
      />
    );
  }
  const listAnimeRenderer = useCallback(
    ({ index, item }: LegendListRenderItemProps<listAnimeTypeList>) => {
      return (
        <TouchableOpacity
          onPress={() => {
            props.navigation.dispatch(
              StackActions.push('FromUrl', {
                link: item.streamingLink,
              }),
            );
          }}
          style={styles.animeList}>
          <Text style={[globalStyles.text, styles.animeListIndex]}>{index + 1}.</Text>
          <Text
            numberOfLines={1}
            style={[globalStyles.text, { textAlign: 'center', flex: 1, fontWeight: 'bold' }]}>
            {item?.title}
          </Text>
        </TouchableOpacity>
      );
    },
    [globalStyles.text, props.navigation, styles],
  );

  return (
    <View style={[{ flex: 1 }]}>
      <View style={{ flexDirection: 'row' }}>
        {/* {data !== null && (
          <TouchableOpacity>
            <Icon name="close" />
          </TouchableOpacity>
        )} */}
        {/* Replace animated components: */}
        <AnimatedTextInput
          onSubmitEditing={submit}
          onChangeText={onChangeText}
          placeholder="Cari anime/movie disini"
          placeholderTextColor={colorScheme === 'dark' ? '#707070' : 'black'}
          onFocus={onSearchTextFocus}
          onBlur={onSearchTextBlur}
          autoCorrect={false}
          ref={textInputRef}
          style={[styles.searchInput, textInputAnimationStyle]}
        />
        <AnimatedPressable
          onLayout={onPressableLayoutChange}
          onPress={submit}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          style={[styles.searchButton, pressableAnimationStyle]}>
          <Text allowFontScaling={false} style={{ color: '#272727', paddingHorizontal: 12 }}>
            <Icon name="search" style={{ color: '#413939' }} size={17} />
            Cari
          </Text>
        </AnimatedPressable>
      </View>

      {listAnime?.length === 0 ||
        (listAnimeLoading && (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator color={colorScheme === 'dark' ? 'white' : 'black'} />
            <Text style={[globalStyles.text]}>Sedang mengambil data... Mohon tunggu</Text>
          </View>
        ))}

      {data === null && movieData === null && listAnime !== null ? (
        <View style={{ flex: listAnime?.length === 0 || listAnimeLoading ? 0 : 1 }}>
          <Text
            style={[globalStyles.text, { textAlign: 'center', marginTop: 10, fontWeight: 'bold' }]}>
            Total anime: {listAnime.length} (belum termasuk movie)
          </Text>
          {(isPending || listAnimeLoading) && (
            <ActivityIndicator
              style={{ position: 'absolute' }}
              color={colorScheme === 'dark' ? 'white' : 'black'}
            />
          )}
          {listAnime.length > 0 && !listAnimeLoading && (
            <LegendList
              recycleItems
              maintainVisibleContentPosition
              estimatedItemSize={50}
              drawDistance={700}
              data={listAnime}
              key={listAnimeLoading.toString()}
              renderItem={listAnimeRenderer}
              keyExtractor={(_, index) => index.toString()}
              extraData={styles}
            />
          )}
        </View>
      ) : data === null ? (
        <TouchableOpacity
          onPress={() => {
            setListAnime([]);
            setListAnimeLoading(true);
            AnimeAPI.listAnime(undefined, animeData => {
              startTransition(() => {
                setListAnime(animeData);
              });
            })
              .then(animeData => {
                setListAnime(animeData);
                setListAnimeLoading(false);
              })
              .catch(() => {
                setListAnime(null);
                setListAnimeLoading(false);
              });
          }}
          style={{ justifyContent: 'center', alignItems: 'center', flex: 1 }}>
          <Text style={[globalStyles.text, { fontWeight: 'bold', fontSize: 16 }]}>
            Gagal memuat list, tekan disini untuk mencoba lagi
          </Text>
          <Icon name="exclamation-circle" size={30} color={'red'} />
        </TouchableOpacity>
      ) : (
        <>
          <Text
            style={[
              globalStyles.text,
              { fontWeight: 'bold', fontSize: 13, marginVertical: 2, textAlign: 'center' },
            ]}>
            Hasil pencarian untuk: {currentSearchQuery}
            {movieData &&
              movieData.length > 0 &&
              data.result.length > 0 &&
              '\n(Movie di tempatkan di urutan atas)'}
          </Text>
          {data.result.length > 0 || (movieData && movieData.length > 0) ? (
            <FlatList
              // estimatedItemSize={209}
              data={[...(movieData ?? []), ...data.result]}
              keyExtractor={(_, index) => index?.toString()}
              renderItem={({ item: z }) => <SearchList item={z} parentProps={props} />}
            />
          ) : (
            <Text style={globalStyles.text}>
              Tidak ada hasil untuk pencarian anime maupun movie!
            </Text>
          )}
        </>
      )}
      {loading && (
        <Reanimated.View entering={SlideInDown} exiting={SlideOutDown} style={styles.loadingView}>
          <Text style={[globalStyles.text, styles.loadingText]}>Memuat info...</Text>
        </Reanimated.View>
      )}
      {/* SEARCH HISTORY VIEW */}
      {searchHistoryDisplay && (
        <Reanimated_KeyboardAvoidingView
          entering={FadeInUp.duration(700)}
          exiting={FadeOutDown}
          style={[styles.searchHistoryContainer, { height: '90%' }]}>
          <View style={{ height: '100%' }}>
            <LegendList
              recycleItems
              drawDistance={250}
              keyboardShouldPersistTaps="always"
              contentContainerStyle={styles.searchHistoryScrollBox}
              data={searchHistory}
              extraData={styles}
              renderItem={renderSearchHistory}
              estimatedItemSize={47}
              ItemSeparatorComponent={() => (
                <View
                  pointerEvents="none"
                  style={{
                    borderBottomWidth: 0.5,
                    borderColor: colorScheme === 'dark' ? 'gray' : 'black',
                    width: '100%',
                  }}
                />
              )}
              ListHeaderComponent={() => (
                <Text style={[globalStyles.text, styles.searchHistoryHeader]}>
                  Riwayat Pencarian: {searchHistory.length}
                </Text>
              )}
            />
          </View>
        </Reanimated_KeyboardAvoidingView>
      )}
      {data !== null && (
        <TouchableOpacityAnimated
          containerStyle={styles.closeSearchResult} //rngh - containerStyle
          onPress={() => {
            setData(null);
            setMovieData(null);
          }}
          entering={ZoomIn}
          exiting={ZoomOut}>
          <Icon name="times" size={30} style={{ alignSelf: 'center' }} color="#dadada" />
        </TouchableOpacityAnimated>
      )}
    </View>
  );
}

function HistoryList({
  index,
  item,
  onChangeTextFunction,
  data: searchHistory,
}: {
  index: number;
  item: string;
  onChangeTextFunction: (text: string) => void;
  data: string[];
}) {
  const globalStyles = useGlobalStyles();
  const styles = useStyles();
  return (
    <View
      style={styles.searchHistoryItemContainer}
      pointerEvents="box-none"
      onStartShouldSetResponder={() => true}>
      {/* I wrap the component with "View" because somehow "keyboardShouldPersistTaps" ignores the RNGH's Touchables */}
      <TouchableOpacity
        style={[
          {
            padding: 6,
            flexDirection: 'row',
            justifyContent: 'space-between',
            height: 40,
          },
        ]}
        onPress={() => {
          onChangeTextFunction(item);
        }}>
        <View style={{ justifyContent: 'center', alignItems: 'center', flex: 1 }}>
          <Text style={[globalStyles.text, { fontWeight: 'bold' }]}>{item}</Text>
        </View>
        <TouchableOpacity
          hitSlop={14}
          onPress={() => {
            storage.set(
              'searchHistory',
              JSON.stringify(searchHistory.filter((_, i) => i !== index)),
            );
          }}>
          <Icon name="close" size={25} style={{ color: '#ff0f0f' }} />
        </TouchableOpacity>
      </TouchableOpacity>
    </View>
  );
}

type SearchAnimeResult = SearchAnime['result'][number];

function SearchList({
  item: z,
  parentProps: props,
}: {
  item: Movies | SearchAnimeResult;
  parentProps: Props;
}) {
  const isMovie = (data: Movies | SearchAnimeResult): data is Movies => {
    return !('animeUrl' in data);
  };
  const globalStyles = useGlobalStyles();
  const styles = useStyles();
  return (
    <TouchableOpacityAnimated
      entering={FadeInRight}
      style={styles.listContainer}
      onPress={() => {
        props.navigation.dispatch(
          StackActions.push('FromUrl', {
            link: isMovie(z) ? z.url : z.animeUrl,
            isMovie: isMovie(z),
          }),
        );
      }}>
      <ImageLoading
        resizeMode="stretch"
        source={{ uri: z.thumbnailUrl }}
        style={styles.listImage}
      />
      <ImageColorShadow url={z.thumbnailUrl} />

      <ImageBackground source={{ uri: z.thumbnailUrl }} blurRadius={10} style={{ flex: 1 }}>
        <DarkOverlay transparent={0.7} />
        <View style={{ flexDirection: 'row', flex: 1 }}>
          <View style={styles.ratingInfo}>
            {!isMovie(z) && (
              <Text style={[globalStyles.text, styles.animeSearchListDetailText]}>
                <Icon name="star" style={{ color: 'gold' }} /> {z.rating}
              </Text>
            )}
          </View>
          <View style={{ flexDirection: 'column', marginRight: 5, marginTop: 5 }}>
            <View
              style={[
                styles.statusInfo,
                {
                  borderColor:
                    !isMovie(z) && z.status === 'Ongoing'
                      ? '#cf0000'
                      : isMovie(z)
                        ? 'orange'
                        : '#22b422',
                },
              ]}>
              <Text style={[globalStyles.text, styles.animeSearchListDetailText]}>
                {isMovie(z) ? 'Movie' : z.status}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.listTitle}>
          <Text style={[{ flexShrink: 1 }, [globalStyles.text, styles.animeSearchListDetailText]]}>
            {z?.title}
          </Text>
        </View>

        <View style={styles.releaseInfo}>
          {!isMovie(z) && (
            <Text style={[globalStyles.text, styles.animeSearchListDetailText]} numberOfLines={1}>
              <Icon name="tags" /> {z.genres.join(', ')}
            </Text>
          )}
        </View>
      </ImageBackground>
    </TouchableOpacityAnimated>
  );
}

function ImageColorShadow({ url }: { url: string }) {
  const [color, setColor] = useState({ r: 0, g: 0, b: 0 });
  useEffect(() => {
    ImageColors.getColors(url, { pixelSpacing: 10, cache: true, key: url }).then(colors => {
      if (colors.platform === 'android') {
        const hex = colors.dominant;
        const r = parseInt(hex.substring(1, 3), 16);
        const g = parseInt(hex.substring(3, 5), 16);
        const b = parseInt(hex.substring(5, 7), 16);
        setColor({ r, g, b });
      }
    });
  }, [url]);
  return (
    <LinearGradient
      colors={[
        `rgba(${color.r}, ${color.g}, ${color.b}, 0.7)`,
        `rgba(${color.r}, ${color.g}, ${color.b}, 0.1)`,
      ]}
      locations={[0, 0.9]}
      start={[0, 0]}
      end={[1, 0]}
      style={{ width: 13, marginRight: 4 }}
    />
  );
}

function useStyles() {
  const globalStyles = useGlobalStyles();
  const colorScheme = useColorScheme();
  return useMemo(
    () =>
      StyleSheet.create({
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
        loadingView: {
          backgroundColor: colorScheme === 'dark' ? '#1d1d1d' : '#f0f0f0',
          position: 'absolute',
          bottom: 0,
          width: '100%',
          height: 40,
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 2,
          borderRadius: 3,
          borderColor: colorScheme === 'dark' ? '#53c412' : 'black',
          borderWidth: 1.3,
        },
        loadingText: {},
        searchInput: {
          height: 42,
          borderWidth: 1,
          borderColor: colorScheme === 'dark' ? '#444' : '#ddd',
          borderRadius: 8,
          backgroundColor: colorScheme === 'dark' ? '#1e1e1e' : '#fff',
          marginHorizontal: 5,
          paddingHorizontal: 14,
          textAlign: 'left',
          color: globalStyles.text.color,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
          elevation: 2,
        },
        searchButton: {
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#ff8c00',
          borderRadius: 8,
          marginRight: 12,
          paddingHorizontal: 12,
          paddingVertical: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.15,
          shadowRadius: 4,
          elevation: 3,
        },
        animeList: {
          justifyContent: 'center',
          paddingVertical: 12,
          flexDirection: 'row',
          backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#f5f5f5',
          marginHorizontal: 16,
          marginVertical: 3,
          borderRadius: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.15,
          shadowRadius: 4,
          elevation: 2,
        },
        animeListIndex: {
          textAlign: 'left',
          fontWeight: 'bold',
          fontSize: 12,
          color: colorScheme === 'light' ? '#000769' : '#00bb00',
        },
        animeSearchListDetailText: {
          fontWeight: 'bold',
          color: 'white',
        },
        listContainer: {
          flexDirection: 'row',
          marginVertical: 8,
          backgroundColor: colorScheme === 'dark' ? '#333' : '#fff',
          borderRadius: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.2,
          shadowRadius: 6,
          elevation: 4,
        },
        listImage: {
          width: 110,
          height: 180,
          borderTopLeftRadius: 16,
          borderBottomLeftRadius: 16,
        },
        listTitle: {
          flexShrink: 1,
          justifyContent: 'center',
          flex: 1,
          marginLeft: 5,
        },
        ratingInfo: {
          flex: 1,
        },
        statusInfo: {
          borderWidth: 1,
        },
        releaseInfo: {
          justifyContent: 'flex-end',
          flex: 1,
        },
        searchHistoryHeader: {
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 6,
          backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#f0f0f0',
          borderRadius: 7,
          fontWeight: 'bold',
        },
        searchHistoryContainer: {
          position: 'absolute',
          top: '10%',
          left: 12,
          right: 12,
          height: '80%',
          zIndex: 10,
          backgroundColor: colorScheme === 'dark' ? '#222' : '#fff',
          borderRadius: 12,
          padding: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 4,
          elevation: 3,
        },
        searchHistoryScrollBox: {
          backgroundColor: colorScheme === 'dark' ? '#1e1e1e' : '#f8f8f8',
          padding: 4,
        },
        searchHistoryItemContainer: {
          backgroundColor: colorScheme === 'light' ? '#00c0c7' : '#007c7c',
          borderRadius: 9,
          marginVertical: 3,
        },
        closeSearchResult: {
          position: 'absolute',
          backgroundColor: 'red',
          borderRadius: 20,
          padding: 10,
          paddingHorizontal: 12,
          bottom: 32,
          right: 17,
          zIndex: 1,
        },
      }),
    [globalStyles, colorScheme],
  );
}

export default memo(Search);
