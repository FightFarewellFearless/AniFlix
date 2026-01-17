import Icon from '@react-native-vector-icons/fontawesome';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps, StackActions, useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FlashList, ListRenderItemInfo } from '@shopify/flash-list';
import { ImageBackground } from 'expo-image';
import React, { memo, useCallback, useMemo, useRef, useState, useTransition } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  StyleSheet,
  Text,
  TextInput as TextInputType,
  ToastAndroid,
  TouchableOpacity as TouchableOpacityReactNative,
  View,
  useColorScheme,
} from 'react-native';
import { Searchbar, SegmentedButtons, useTheme } from 'react-native-paper';
import Reanimated, {
  FadeInDown,
  FadeInRight,
  FadeInUp,
  FadeOutDown,
  FadeOutUp,
  ZoomIn,
  ZoomOut,
} from 'react-native-reanimated';
import useGlobalStyles from '../../assets/style';
import { SearchAnime, listAnimeTypeList } from '../../types/anime';
import { HomeNavigator, RootStackNavigator } from '../../types/navigation';
import AnimeAPI from '../../utils/AnimeAPI';
import { DatabaseManager, useModifiedKeyValueIfFocused } from '../../utils/DatabaseManager';
import DialogManager from '../../utils/dialogManager';
import { Movies, searchMovie } from '../../utils/scrapers/animeMovie';
import { KomikuSearch, komikuSearch } from '../../utils/scrapers/komiku';
import DarkOverlay from '../misc/DarkOverlay';
import ImageLoading from '../misc/ImageLoading';
import { TouchableOpacity } from '../misc/TouchableOpacityRNGH';
import { RenderScrollComponent } from './AnimeList';
import { searchFilm, SearchResult } from '../../utils/scrapers/film';

const TouchableOpacityAnimated = Reanimated.createAnimatedComponent(TouchableOpacity);
const Reanimated_KeyboardAvoidingView = Reanimated.createAnimatedComponent(KeyboardAvoidingView);

type Props = CompositeScreenProps<
  BottomTabScreenProps<HomeNavigator, 'Search'>,
  NativeStackScreenProps<RootStackNavigator>
>;

function Search(props: Props) {
  const [isPending, startTransition] = useTransition();
  const globalStyles = useGlobalStyles();
  const colorScheme = useColorScheme();
  const styles = useStyles();
  const theme = useTheme();

  const [searchType, setSearchType] = useState<'anime' | 'comics' | 'film'>('anime');
  const textInputRef = useRef<TextInputType>(null);

  const isFocus = useRef(true);

  useFocusEffect(
    useCallback(() => {
      const timeout = setTimeout(() => {
        isFocus.current = true;
      }, 200);
      const keyboardEvent = Keyboard.addListener('keyboardDidHide', () => {
        if (textInputRef.current) {
          textInputRef.current.blur();
        }
      });
      return () => {
        isFocus.current = false;
        keyboardEvent.remove();
        clearTimeout(timeout);
      };
    }, []),
  );

  const [searchText, setSearchText] = useState<string>('');
  const [listAnime, setListAnime] = useState<listAnimeTypeList[] | null>(null);
  const [listAnimeLoading, setListAnimeLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [data, setData] = useState<null | SearchAnime>(null);
  const [movieData, setMovieData] = useState<null | Movies[]>(null);
  const [filmData, setFilmData] = useState<null | SearchResult>(null);
  const [comicsData, setComicsData] = useState<null | KomikuSearch[]>(null);
  const [loading, setLoading] = useState(false);
  const [currentSearchQuery, setCurrentSearchQuery] = useState<string>('');
  const [showSearchHistory, setShowSearchHistory] = useState(false);

  const searchHistory = useModifiedKeyValueIfFocused(
    'searchHistory',
    result => JSON.parse(result) as string[],
  );

  const loadAnimeList = useCallback(() => {
    setListAnimeLoading(true);
    setIsError(false);
    setListAnime([]);

    AnimeAPI.listAnime(undefined, animeData => {
      startTransition(() => {
        setListAnime(animeData);
      });
    })
      .then(animeData => {
        setListAnime(animeData);
      })
      .catch(() => {
        setListAnime(null);
        setIsError(true);
        ToastAndroid.show('Gagal memuat daftar anime', ToastAndroid.SHORT);
      })
      .finally(() => {
        setListAnimeLoading(false);
      });
  }, []);

  const onChangeText = useCallback((text: string) => {
    setSearchText(text);
  }, []);

  const submit = useCallback(() => {
    const handleError = (err: Error) => {
      if (err.message === 'Silahkan selesaikan captcha') {
        return ToastAndroid.show('Silahkan selesaikan captcha', ToastAndroid.SHORT);
      }
      const errMessage =
        err.message === 'Network Error'
          ? 'Permintaan gagal.\nPastikan kamu terhubung dengan internet'
          : 'Error tidak diketahui: ' + err.message;
      DialogManager.alert('Error', errMessage);
    };
    if (searchText === '') {
      return;
    }
    setLoading(true);
    textInputRef.current?.blur();
    if (searchType === 'anime') {
      Promise.all([AnimeAPI.search(searchText), searchMovie(searchText)])
        .then(([animeResult, movieResult]) => {
          setCurrentSearchQuery(searchText);
          setComicsData(null);
          if (!('isError' in movieResult)) {
            setMovieData(movieResult);
          }
          setData(animeResult);
        })
        .finally(() => {
          if (searchHistory.includes(searchText)) {
            searchHistory.splice(searchHistory.indexOf(searchText), 1);
          }
          searchHistory.unshift(searchText);
          DatabaseManager.set('searchHistory', JSON.stringify(searchHistory));
          setLoading(false);
        })
        .catch(handleError);
    } else if (searchType === 'film') {
      searchFilm(searchText)
        .then(result => {
          setData(null);
          setMovieData(null);
          setComicsData(null);
          setFilmData(result);
        })
        .catch(handleError)
        .finally(() => {
          if (searchHistory.includes(searchText)) {
            searchHistory.splice(searchHistory.indexOf(searchText), 1);
          }
          searchHistory.unshift(searchText);
          DatabaseManager.set('searchHistory', JSON.stringify(searchHistory));
          setCurrentSearchQuery(searchText);
          setLoading(false);
        });
    } else {
      komikuSearch(searchText)
        .then(result => {
          setData(null);
          setMovieData(null);
          setFilmData(null);
          setComicsData(result);
        })
        .catch(handleError)
        .finally(() => {
          if (searchHistory.includes(searchText)) {
            searchHistory.splice(searchHistory.indexOf(searchText), 1);
          }
          searchHistory.unshift(searchText);
          DatabaseManager.set('searchHistory', JSON.stringify(searchHistory));
          setCurrentSearchQuery(searchText);
          setLoading(false);
        });
    }
  }, [searchHistory, searchText, searchType]);

  function renderSearchHistory({ item, index }: ListRenderItemInfo<string>) {
    const onChangeTextFunction = (text: string) => {
      onChangeText(text);
    };
    return <HistoryList index={index} item={item} onChangeTextFunction={onChangeTextFunction} />;
  }

  const listAnimeRenderer = useCallback(
    ({ index, item }: ListRenderItemInfo<listAnimeTypeList>) => {
      return (
        <TouchableOpacity
          onPress={() => {
            props.navigation.dispatch(
              StackActions.push('FromUrl', {
                title: item.title,
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

  const onTextInputFocus = useCallback(() => {
    if (!isFocus.current) {
      textInputRef.current?.blur();
      isFocus.current = true;
      return;
    }
    setShowSearchHistory(true);
  }, []);
  const onTextInputBlur = useCallback(() => {
    setShowSearchHistory(false);
  }, []);

  const hasSearchResults =
    (data?.result?.length ?? 0) > 0 ||
    (movieData && movieData.length > 0) ||
    (comicsData && comicsData.length > 0) ||
    (filmData && filmData.length > 0);
  const isSearchEmpty =
    !hasSearchResults && (data !== null || comicsData !== null || filmData !== null);
  const isLoading = listAnimeLoading || isPending;
  const showDefaultList =
    !hasSearchResults && !isSearchEmpty && listAnime !== null && listAnime.length > 0;
  const shouldShowManualLoad =
    !hasSearchResults &&
    !isLoading &&
    (listAnime === null || listAnime.length === 0) &&
    data === null &&
    comicsData === null &&
    filmData === null;

  return (
    <View style={[{ flex: 1 }]}>
      <Searchbar
        onSubmitEditing={submit}
        onIconPress={submit}
        onChangeText={onChangeText}
        onBlur={onTextInputBlur}
        onFocus={onTextInputFocus}
        placeholder="Cari disini"
        value={searchText}
        autoCorrect={false}
        ref={textInputRef}
      />

      <SegmentedButtons
        style={{ marginTop: 6 }}
        value={searchType}
        onValueChange={setSearchType}
        buttons={[
          {
            value: 'anime',
            label: 'Cari anime/movie',
            icon: 'movie-search',
          },
          {
            value: 'comics',
            label: 'Cari komik',
            icon: 'book-search',
          },
          {
            value: 'film',
            label: 'Cari film',
            icon: 'movie',
          },
        ]}
      />

      {isLoading && (
        <View
          style={[
            styles.center,
            {
              flex: 0,
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 10,
            },
          ]}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
          <Text style={[globalStyles.text, { opacity: 0.8 }]}>Sedang mengambil data...</Text>
        </View>
      )}

      {shouldShowManualLoad && (
        <Reanimated.View entering={FadeInUp} style={styles.center}>
          <View style={styles.emptyStateContainer}>
            <Icon
              name={isError ? 'warning' : 'list-alt'}
              size={60}
              color={isError ? theme.colors.error : theme.colors.outline}
              style={{ marginBottom: 15 }}
            />
            <Text style={[globalStyles.text, styles.emptyStateTitle]}>
              {isError ? 'Gagal Memuat Data' : 'Jelajahi Anime'}
            </Text>
            <Text style={[globalStyles.text, styles.emptyStateSubtitle]}>
              {isError
                ? 'Terjadi kesalahan koneksi. Silahkan coba lagi.'
                : 'Tekan tombol di bawah untuk melihat daftar anime terbaru.'}
            </Text>

            <TouchableOpacityReactNative
              onPress={loadAnimeList}
              activeOpacity={0.7}
              style={[
                styles.loadButton,
                {
                  backgroundColor: isError
                    ? theme.colors.errorContainer
                    : theme.colors.primaryContainer,
                },
              ]}>
              <Icon
                name={isError ? 'refresh' : 'cloud-download'}
                size={18}
                color={isError ? theme.colors.onErrorContainer : theme.colors.onPrimaryContainer}
              />
              <Text
                style={[
                  globalStyles.text,
                  styles.loadButtonText,
                  {
                    color: isError
                      ? theme.colors.onErrorContainer
                      : theme.colors.onPrimaryContainer,
                  },
                ]}>
                {isError ? 'Coba Lagi' : 'Muat Daftar Anime'}
              </Text>
            </TouchableOpacityReactNative>
          </View>
        </Reanimated.View>
      )}

      {showDefaultList && (
        <View style={{ flex: 1 }}>
          <Text
            style={[globalStyles.text, { textAlign: 'center', marginTop: 10, fontWeight: 'bold' }]}>
            Total anime: {listAnime?.length} (belum termasuk movie)
          </Text>

          <FlashList
            data={listAnime}
            renderItem={listAnimeRenderer}
            ItemSeparatorComponent={() => <View style={{ height: 4 }} />}
            keyExtractor={item => item.title}
            extraData={styles}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        </View>
      )}

      {(hasSearchResults || isSearchEmpty) && (
        <>
          <Text
            style={[
              globalStyles.text,
              { fontWeight: 'bold', fontSize: 13, marginVertical: 2, textAlign: 'center' },
            ]}>
            {isSearchEmpty
              ? 'Tidak ada hasil pencarian yang ditemukan!'
              : `Hasil pencarian untuk: ${currentSearchQuery}`}

            {!isSearchEmpty &&
              movieData &&
              movieData.length > 0 &&
              (data?.result?.length ?? 0) > 0 &&
              '\n(Movie di tempatkan di urutan atas)'}
          </Text>

          {hasSearchResults && (
            <FlashList
              renderScrollComponent={RenderScrollComponent}
              ItemSeparatorComponent={() => <View style={{ height: 6 }} />}
              data={[
                ...(movieData ?? []),
                ...(data?.result ?? []),
                ...(comicsData ?? []),
                ...(filmData ?? []),
              ]}
              keyExtractor={(_, index) => String(index)}
              renderItem={({ item: z }) => <SearchList item={z} parentProps={props} />}
              contentContainerStyle={{ paddingBottom: 20 }}
            />
          )}
        </>
      )}

      {loading && (
        <Reanimated.View entering={FadeInDown} exiting={FadeOutUp} style={styles.loadingView}>
          <Text style={[globalStyles.text, styles.loadingText]}>Memuat info...</Text>
        </Reanimated.View>
      )}

      {showSearchHistory && (
        <Reanimated_KeyboardAvoidingView
          behavior="height"
          entering={FadeInUp.duration(700)}
          exiting={FadeOutDown}
          style={[styles.searchHistoryContainer, { height: '90%' }]}>
          <View style={{ height: '95%' }}>
            <SegmentedButtons
              value={searchType}
              onValueChange={setSearchType}
              buttons={[
                {
                  value: 'anime',
                  label: 'Cari anime/movie',
                  icon: 'movie-search',
                },
                {
                  value: 'comics',
                  label: 'Cari komik',
                  icon: 'book-search',
                },
              ]}
            />
            <FlashList
              drawDistance={250}
              keyboardShouldPersistTaps="always"
              contentContainerStyle={styles.searchHistoryScrollBox}
              data={searchHistory}
              keyExtractor={searchHistoryKeyExtractor}
              extraData={styles}
              renderItem={renderSearchHistory}
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
      {(data !== null || comicsData !== null || filmData !== null) && (
        <TouchableOpacityAnimated
          style={styles.closeSearchResult}
          onPress={() => {
            setData(null);
            setMovieData(null);
            setComicsData(null);
            setFilmData(null);
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
}: {
  index: number;
  item: string;
  onChangeTextFunction: (text: string) => void;
}) {
  const theme = useTheme();
  const globalStyles = useGlobalStyles();
  const styles = useStyles();
  return (
    <View
      style={styles.searchHistoryItemContainer}
      pointerEvents="box-none"
      onStartShouldSetResponder={() => true}>
      <TouchableOpacityReactNative
        style={[
          {
            padding: 6,
            flexDirection: 'row',
            justifyContent: 'space-between',
            minHeight: 40,
          },
        ]}
        onPress={() => {
          onChangeTextFunction(item);
        }}>
        <View
          style={{ justifyContent: 'center', alignItems: 'center', flex: 1, flexDirection: 'row' }}>
          <Icon name="history" size={20} color={theme.colors.tertiary} />
          <Text style={[globalStyles.text, { fontWeight: 'bold', flex: 1, textAlign: 'center' }]}>
            {item}
          </Text>
        </View>
        <TouchableOpacityReactNative
          hitSlop={14}
          onPress={async () => {
            DatabaseManager.set(
              'searchHistory',
              JSON.stringify(
                (
                  JSON.parse((await DatabaseManager.get('searchHistory')) ?? '[]') as string[]
                ).filter((_, i) => i !== index),
              ),
            );
          }}>
          <Icon name="times" size={25} color="#ff0f0f" />
        </TouchableOpacityReactNative>
      </TouchableOpacityReactNative>
    </View>
  );
}

type SearchAnimeResult = SearchAnime['result'][number];

function SearchList({
  item: z,
  parentProps: props,
}: {
  item: Movies | SearchAnimeResult | KomikuSearch | SearchResult[number];
  parentProps: Props;
}) {
  const isMovie = (
    data: Movies | SearchAnimeResult | KomikuSearch | SearchResult[number],
  ): data is Movies => {
    return !('animeUrl' in data) && !('detailUrl' in data) && !('synopsis' in data);
  };
  const isComic = (
    data: Movies | SearchAnimeResult | KomikuSearch | SearchResult[number],
  ): data is KomikuSearch => {
    return 'additionalInfo' in data;
  };
  const isAnime = (
    data: Movies | SearchAnimeResult | KomikuSearch | SearchResult[number],
  ): data is SearchAnimeResult => {
    return 'animeUrl' in data;
  };
  const isFilm = (
    data: Movies | SearchAnimeResult | KomikuSearch | SearchResult[number],
  ): data is SearchResult[number] => {
    return 'synopsis' in data;
  };
  const globalStyles = useGlobalStyles();
  const styles = useStyles();
  return (
    <TouchableOpacityAnimated
      entering={FadeInRight}
      style={[styles.listContainer, { minHeight: 100 }]}
      onPress={() => {
        props.navigation.dispatch(
          StackActions.push('FromUrl', {
            title: z.title,
            link: isFilm(z) ? z.url : isMovie(z) ? z.url : isComic(z) ? z.detailUrl : z.animeUrl,
            type: isFilm(z) ? 'film' : isMovie(z) ? 'movie' : isComic(z) ? 'comics' : 'anime',
          }),
        );
      }}>
      <ImageLoading
        contentFit="fill"
        source={{ uri: z.thumbnailUrl }}
        style={[styles.listImage, isComic(z) ? { width: 150, height: 'auto' } : undefined]}
        recyclingKey={z.thumbnailUrl}>
        {isComic(z) && (
          <View
            style={{
              position: 'absolute',
              top: 5,
              right: 5,
              backgroundColor: '#0000009d',
              padding: 5,
              borderRadius: 8,
            }}>
            <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>
              {z.latestChapter}
            </Text>
          </View>
        )}
      </ImageLoading>

      <ImageBackground source={{ uri: z.thumbnailUrl }} blurRadius={5} style={{ flex: 1 }}>
        <DarkOverlay transparent={0.8} />
        <View style={{ flexDirection: 'row', flex: 1 }}>
          <View style={styles.ratingInfo}>
            {isAnime(z) ||
              (isFilm(z) && (
                <Text style={[globalStyles.text, styles.animeSearchListDetailText]}>
                  <Icon name="star" color="gold" /> {z.rating}
                </Text>
              ))}
          </View>
          <View style={{ flexDirection: 'column', marginRight: 5, marginTop: 5 }}>
            <View
              style={[
                styles.statusInfo,
                {
                  backgroundColor:
                    isAnime(z) && z.status === 'Ongoing'
                      ? '#920000'
                      : isMovie(z)
                        ? '#a06800'
                        : '#006600',
                },
              ]}>
              <Text style={[globalStyles.text, styles.animeSearchListDetailText]}>
                {isMovie(z) ? 'Movie' : isComic(z) || isFilm(z) ? z.type : z.status}
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.listTitle]}>
          <Text
            numberOfLines={4}
            style={[{ flexShrink: 1 }, [globalStyles.text, styles.animeSearchListDetailText]]}>
            {z?.title}
          </Text>
        </View>

        <View style={styles.releaseInfo}>
          {isFilm(z) && (
            <Text style={styles.synopsisFilmText} numberOfLines={2}>
              {z.synopsis}
            </Text>
          )}
          {!isMovie(z) && !isFilm(z) && (
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
                <Icon name="tags" color={styles.animeSearchListDetailText.color} />{' '}
                {isAnime(z) ? z.genres.join(', ') : z.concept}
              </Text>
            </View>
          )}
        </View>
      </ImageBackground>
    </TouchableOpacityAnimated>
  );
}

function searchHistoryKeyExtractor(name: string, index: number) {
  return name + String(index);
}

function useStyles() {
  const globalStyles = useGlobalStyles();
  const theme = useTheme();
  const colorScheme = useColorScheme();
  return useMemo(
    () =>
      StyleSheet.create({
        center: {
          justifyContent: 'center',
          alignItems: 'center',
          flex: 1,
        },
        emptyStateContainer: {
          alignItems: 'center',
          paddingHorizontal: 40,
        },
        emptyStateTitle: {
          fontSize: 20,
          fontWeight: 'bold',
          marginBottom: 8,
          textAlign: 'center',
        },
        emptyStateSubtitle: {
          fontSize: 14,
          textAlign: 'center',
          opacity: 0.6,
          marginBottom: 24,
        },
        loadButton: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 12,
          paddingHorizontal: 24,
          borderRadius: 25,
          elevation: 2,
        },
        loadButtonText: {
          fontWeight: 'bold',
          marginLeft: 10,
          fontSize: 15,
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
          color: theme.colors.onPrimaryContainer,
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
          paddingHorizontal: 5,
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
        synopsisFilmText: {
          color: 'gray',
          fontWeight: 'bold',
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
    [globalStyles.text.color, colorScheme, theme],
  );
}

export default memo(Search);
