import { CompositeScreenProps, StackActions, useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ImageBackground } from 'expo-image';
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
  Keyboard,
  KeyboardAvoidingView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import { TextInput } from 'react-native-paper';
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
import { TextInput as TextInputType } from 'react-native';
import { FlatList, TouchableOpacity as TouchableOpacityRNGH } from 'react-native-gesture-handler';
import { storage } from '../../utils/DatabaseManager';
import DialogManager from '../../utils/dialogManager';

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

  const textInputRef = useRef<TextInputType>(null);

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

  const [searchText, setSearchText] = useState<string>('');
  const [listAnime, setListAnime] = useState<listAnimeTypeList[] | null>([]);
  const [listAnimeLoading, setListAnimeLoading] = useState(false);
  const [data, setData] = useState<null | SearchAnime>(null);
  const [movieData, setMovieData] = useState<null | Movies[]>(null);
  const [loading, setLoading] = useState(false);
  const [currentSearchQuery, setCurrentSearchQuery] = useState<string>('');

  const [showSearchHistory, setShowSearchHistory] = useState(false);

  const searchHistory = useSelectorIfFocused(
    state => state.settings.searchHistory,
    true,
    result => JSON.parse(result) as string[],
  );

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

  const onChangeText = useCallback((text: string) => {
    setSearchText(text);
  }, []);

  const submit = useCallback(() => {
    if (searchText === '') {
      return;
    }
    setLoading(true);
    textInputRef.current?.blur();
    Promise.all([AnimeAPI.search(searchText), searchMovie(searchText)])
      .then(([animeResult, movieResult]) => {
        setCurrentSearchQuery(searchText);
        if (!('isError' in movieResult)) {
          setMovieData(movieResult);
        }
        setData(animeResult);
        setLoading(false);
        if (searchHistory.includes(searchText)) {
          searchHistory.splice(searchHistory.indexOf(searchText), 1);
        }
        searchHistory.unshift(searchText);
        storage.set('searchHistory', JSON.stringify(searchHistory));
      })
      .catch(err => {
        const errMessage =
          err.message === 'Network Error'
            ? 'Permintaan gagal.\nPastikan kamu terhubung dengan internet'
            : 'Error tidak diketahui: ' + err.message;
        DialogManager.alert('Error', errMessage);
        setLoading(false);
      });
  }, [searchHistory, searchText]);

  function renderSearchHistory({ item, index }: LegendListRenderItemProps<string>) {
    const onChangeTextFunction = (text: string) => {
      onChangeText(text);
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
        <>
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
        </>
      );
    },
    [globalStyles.text, props.navigation, styles],
  );

  const onTextInputFocus = useCallback(() => {
    setShowSearchHistory(true);
  }, []);
  const onTextInputBlur = useCallback(() => {
    setShowSearchHistory(false);
  }, []);

  return (
    <View style={[{ flex: 1 }]}>
      {/* {data !== null && (
          <TouchableOpacity>
            <Icon name="close" />
          </TouchableOpacity>
        )} */}
      {/* Replace animated components: */}
      <TextInput
        mode="outlined"
        onSubmitEditing={submit}
        onChangeText={onChangeText}
        onBlur={onTextInputBlur}
        onFocus={onTextInputFocus}
        label="Cari anime/movie disini"
        value={searchText}
        autoCorrect={false}
        ref={textInputRef}
        right={<TextInput.Icon icon="magnify" onPress={submit} size={20} />}
        style={[styles.searchInput]}
      />

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
              waitForInitialLayout
              drawDistance={500}
              data={listAnime}
              key={listAnimeLoading.toString()}
              renderItem={listAnimeRenderer}
              ItemSeparatorComponent={() => <View style={{ height: 4 }} />}
              keyExtractor={item => item.title}
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
              contentContainerStyle={{ gap: 6 }}
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
      {showSearchHistory && (
        <Reanimated_KeyboardAvoidingView
          behavior="height"
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
              keyExtractor={searchHistoryKeyExtractor}
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
        <View
          style={{ justifyContent: 'center', alignItems: 'center', flex: 1, flexDirection: 'row' }}>
          <Icon name="history" size={20} style={{ color: '#00c7a6' }} />
          <Text style={[globalStyles.text, { fontWeight: 'bold', flex: 1, textAlign: 'center' }]}>
            {item}
          </Text>
        </View>
        <TouchableOpacity
          hitSlop={14}
          onPress={() => {
            storage.set(
              'searchHistory',
              JSON.stringify(searchHistory.filter((_, i) => i !== index)),
            );
          }}>
          <Icon name="times" size={25} style={{ color: '#ff0f0f' }} />
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
        contentFit="fill"
        source={{ uri: z.thumbnailUrl }}
        style={styles.listImage}
        recyclingKey={z.thumbnailUrl}
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
                  backgroundColor:
                    !isMovie(z) && z.status === 'Ongoing'
                      ? '#920000'
                      : isMovie(z)
                        ? '#a06800'
                        : '#006600',
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
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: 'rgba(0, 0, 0, 0.445)',
                paddingHorizontal: 6,
                paddingVertical: 3,
                borderRadius: 5,
                alignSelf: 'flex-start',
              }}>
              <Text
                style={[
                  globalStyles.text,
                  styles.animeSearchListDetailText,
                  {
                    fontSize: 14,
                  },
                ]}
                numberOfLines={1}>
                <Icon name="tags" /> {z.genres.join(', ')}
              </Text>
            </View>
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

function searchHistoryKeyExtractor(name: string, index: number) {
  return name + index.toString();
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
          position: 'absolute',
          bottom: 10,
          left: 0,
          right: 0,
          justifyContent: 'center',
          alignItems: 'center',
        },
        loadingText: {
          fontWeight: 'bold',
          color: colorScheme === 'dark' ? '#53c412' : 'black',
          backgroundColor: colorScheme === 'dark' ? '#1d1d1d' : '#f0f0f0',
          padding: 12,
          zIndex: 2,
          borderRadius: 12,
          borderColor: colorScheme === 'dark' ? '#53c412' : 'black',
          borderWidth: 1.3,
        },
        searchInput: {
          height: 42,
        },
        searchButton: {
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#00c7a6',
          borderRadius: 8,
          marginRight: 12,
          paddingHorizontal: 12,
          paddingVertical: 10,
          elevation: 3,
        },
        animeList: {
          justifyContent: 'center',
          paddingVertical: 10,
          flexDirection: 'row',
          backgroundColor: colorScheme === 'dark' ? '#1d1d1d' : '#f5f5f5',
          marginHorizontal: 16,
          borderRadius: 12,
          elevation: 2,
        },
        animeListIndex: {
          marginLeft: 4,
          fontWeight: 'bold',
          fontSize: 12,
          color: colorScheme === 'light' ? '#000769' : '#007e00',
        },
        animeSearchListDetailText: {
          fontWeight: 'bold',
          color: 'white',
        },
        listContainer: {
          flexDirection: 'row',
          backgroundColor: colorScheme === 'dark' ? '#333' : '#fff',
          borderRadius: 16,
          elevation: 4,
        },
        listImage: {
          width: 80,
          height: 150,
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
          padding: 4,
          borderRadius: 6,
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
          top: 42 + 12,
          left: 12,
          right: 12,
          height: '80%',
          zIndex: 10,
          backgroundColor: colorScheme === 'dark' ? '#222' : '#fff',
          borderRadius: 12,
          padding: 10,
          elevation: 3,
        },
        searchHistoryScrollBox: {
          backgroundColor: colorScheme === 'dark' ? '#1e1e1e' : '#f8f8f8',
          padding: 4,
        },
        searchHistoryItemContainer: {
          backgroundColor: colorScheme === 'light' ? '#e3e5e6' : '#252525',
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
