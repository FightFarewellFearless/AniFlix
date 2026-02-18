import Icon from '@react-native-vector-icons/fontawesome';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FlashList, FlashListRef } from '@shopify/flash-list';
import { RecyclerViewProps } from '@shopify/flash-list/dist/recyclerview/RecyclerViewProps';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  ToastAndroid,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { Button, Divider, Searchbar, Surface, useTheme } from 'react-native-paper';
import Reanimated, {
  interpolate,
  useAnimatedRef,
  useAnimatedStyle,
  useScrollOffset,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useGlobalStyles from '../../assets/style';
import { HistoryItemKey } from '../../types/databaseTarget';
import { HistoryJSON } from '../../types/historyJSON';
import { RootStackNavigator } from '../../types/navigation';
import watchLaterJSON from '../../types/watchLaterJSON';
import { DatabaseManager, useModifiedKeyValueIfFocused } from '../../utils/DatabaseManager';
import { __ALIAS as Comics1Alias } from '../../utils/scrapers/comics1';
import { __ALIAS as Comics2Alias } from '../../utils/scrapers/comics2';
import { ComicsDetail as ComicsDetailTypeData } from '../../utils/scrapers/comicsv2';
import { __ALIAS as KomikuAlias, KomikuDetail } from '../../utils/scrapers/komiku';
import controlWatchLater from '../../utils/watchLaterControl';

type RecyclerViewType = (
  props: RecyclerViewProps<KomikuDetail['chapters'][0] | ComicsDetailTypeData['chapters'][0]> & {
    ref?: React.Ref<
      FlashListRef<KomikuDetail['chapters'][0] | ComicsDetailTypeData['chapters'][0]>
    >;
  },
) => React.JSX.Element;
const ReanimatedImage = Reanimated.createAnimatedComponent(Image);
const ReanimatedFlashList = Reanimated.createAnimatedComponent<RecyclerViewType>(FlashList);

type Props = NativeStackScreenProps<RootStackNavigator, 'ComicsDetail'>;
const IMG_HEIGHT = 200;
export default function ComicsDetail(props: Props) {
  const colorScheme = useColorScheme();
  const globalStyles = useGlobalStyles();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const styles = useStyles();
  const scrollRef =
    useAnimatedRef<
      FlashListRef<KomikuDetail['chapters'][0] | ComicsDetailTypeData['chapters'][0]>
    >();
  const scrollOffset = useScrollOffset(scrollRef as any);
  const imageStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(
            scrollOffset.value,
            [0, IMG_HEIGHT * 2],
            [0, IMG_HEIGHT],
            'clamp',
          ),
        },
      ],
      opacity: interpolate(scrollOffset.value, [0, IMG_HEIGHT], [1, 0], 'clamp'),
    };
  });
  const { data } = props.route.params;

  const [searchQuery, setSearchQuery] = useState('');
  const filteredChapters = useMemo(() => {
    if (!searchQuery) return data.chapters;
    return data.chapters.toReversed().filter(chapter => {
      return chapter.chapter.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [data.chapters, searchQuery]);

  const watchLaterListsJson = useModifiedKeyValueIfFocused(
    'watchLater',
    state => JSON.parse(state) as watchLaterJSON[],
  );
  const isInList = useMemo(
    () => watchLaterListsJson.some(item => item.title === data.title && item.isComics),
    [data.title, watchLaterListsJson],
  );

  const historyListsJson = useModifiedKeyValueIfFocused(
    'historyKeyCollectionsOrder',
    state => JSON.parse(state) as HistoryItemKey[],
  );
  const lastReaded = useMemo(() => {
    const isLastReaded = historyListsJson.find(
      z => z === `historyItem:${data.title.trim()}:true:false`,
    );
    if (isLastReaded) {
      return JSON.parse(DatabaseManager.getSync(isLastReaded)!) as HistoryJSON;
    } else return undefined;
  }, [historyListsJson, data.title]);

  const readComic = useCallback(
    (url: string, fromHistory?: HistoryJSON) => {
      let link = url;
      const currentScraper = [Comics1Alias, Comics2Alias, KomikuAlias].find(alias =>
        link.includes(alias),
      );
      const isSameScraper = props.route.params.link.includes(currentScraper ?? '');
      if (!isSameScraper) {
        const lastReadedData =
          lastReaded &&
          lastReaded.episode &&
          data.chapters.find(item => {
            return (
              item.chapter
                .toLowerCase()
                .replace('indonesianTitle' in data ? 'chapter 0' : '', '')
                .replace(item.chapterUrl.includes('softkomik') ? /^0+/ : '', '')
                .replace('chapter ', '')
                .trim() ===
              lastReaded?.episode
                ?.toLowerCase()
                .replace('indonesianTitle' in data ? 'chapter 0' : '', '')
                .replace(lastReaded.link.includes('softkomik') ? 'chapter 00' : '', '')
                .replace('chapter ', '')
                .replace(lastReaded.link.includes('softkomik') ? /^0+/ : '', '')
                .trim()
            );
          });
        if (
          typeof lastReadedData === 'object' &&
          lastReadedData !== null &&
          'chapter' in lastReadedData
        ) {
          link = lastReadedData.chapterUrl;
        }
      }
      props.navigation.navigate('FromUrl', {
        title: props.route.params.data.title,
        link,
        type: 'comics',
        historyData: fromHistory
          ? {
              lastDuration: fromHistory.lastDuration ?? 0,
              resolution: fromHistory.resolution ?? '',
            }
          : undefined,
      });
    },
    [data, lastReaded, props.navigation, props.route.params.data.title, props.route.params.link],
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="height">
      <ReanimatedFlashList
        maintainVisibleContentPosition={{
          disabled: true,
        }}
        ref={scrollRef}
        data={filteredChapters}
        ListEmptyComponent={() => (
          <View style={[styles.mainContainer, { marginVertical: 6 }]}>
            <Text style={globalStyles.text}>Tidak ada chapter</Text>
          </View>
        )}
        renderItem={({ item }) => {
          if (!item) return null;
          let isLastReaded =
            lastReaded &&
            lastReaded.episode &&
            item.chapter
              .toLowerCase()
              .replace('indonesianTitle' in data ? 'chapter 0' : '', '')
              .replace(item.chapterUrl.includes('softkomik') ? /^0+/ : '', '')
              .replace('chapter ', '')
              .trim() ===
              lastReaded.episode
                .toLowerCase()
                .replace('indonesianTitle' in data ? 'chapter 0' : '', '')
                .replace(lastReaded.link.includes('softkomik') ? 'chapter 00' : '', '')
                .replace('chapter ', '')
                .replace(lastReaded.link.includes('softkomik') ? /^0+/ : '', '')
                .trim();
          if (!isLastReaded) {
            lastReaded?.link === item.chapterUrl && (isLastReaded = true);
          }
          return (
            <TouchableOpacity
              style={styles.chapterItem}
              onPress={() => readComic(item.chapterUrl, isLastReaded ? lastReaded : undefined)}>
              <View style={styles.chapterTitleContainer}>
                <Text style={[globalStyles.text, styles.chapterText]}>
                  {item.chapter.includes('Chapter') ? item.chapter : `Chapter ${item.chapter}`}
                </Text>
              </View>
              <View style={styles.chapterDetailsContainer}>
                {'releaseDate' in item && (
                  <>
                    <Text style={[globalStyles.text, styles.chapterDetailText]}>
                      <Icon color={styles.chapterDetailText.color} name="calendar" size={12} />{' '}
                      {item.releaseDate}
                    </Text>
                    <Text style={[globalStyles.text, styles.chapterDetailText]}>
                      <Icon color={styles.chapterDetailText.color} name="eye" size={12} />{' '}
                      {item.views}x dilihat
                    </Text>
                  </>
                )}
                {isLastReaded && (
                  <Text
                    style={[globalStyles.text, styles.chapterDetailText, styles.lastReadedText]}>
                    <Icon color={styles.lastReadedText.color} name="book" size={12} /> Terakhir
                    dibaca
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          );
        }}
        ItemSeparatorComponent={() => <Divider />}
        keyExtractor={(item, index) => item.chapter + index}
        contentContainerStyle={{
          backgroundColor: styles.mainContainer.backgroundColor,
          paddingLeft: insets.left,
          paddingRight: insets.right,
          paddingBottom: insets.bottom,
        }}
        ListHeaderComponentStyle={[styles.mainContainer, { marginBottom: 12 }]}
        ListHeaderComponent={
          <>
            {'headerImageUrl' in data ? (
              <ReanimatedImage
                style={[{ width: '100%', height: IMG_HEIGHT }, imageStyle]}
                source={{ uri: data.headerImageUrl }}
              />
            ) : (
              <Reanimated.View
                style={[
                  { width: '100%', height: IMG_HEIGHT },
                  imageStyle,
                  { backgroundColor: theme.colors.elevation.level2 },
                ]}>
                <Icon
                  color={theme.colors.onBackground}
                  name="book"
                  size={64}
                  style={{ alignSelf: 'center', marginTop: 60 }}
                />
              </Reanimated.View>
            )}
            <LinearGradient
              colors={['transparent', 'black']}
              style={{
                width: '100%',
                height: 60,
                position: 'absolute',
                transform: [
                  {
                    translateY: 155,
                  },
                ],
              }}
            />
            <View style={[styles.mainContainer, styles.mainContent]}>
              <View style={{ flexDirection: 'column', alignItems: 'center' }}>
                <Image source={{ uri: data.thumbnailUrl }} style={styles.thumbnail} />
                <View
                  style={{ transform: styles.thumbnail.transform, flexDirection: 'row', gap: 5 }}>
                  <Surface
                    elevation={3}
                    style={{
                      backgroundColor: colorScheme === 'dark' ? '#00608d' : '#5ddfff',
                      borderRadius: 10,
                    }}>
                    <Text style={[globalStyles.text, styles.type]}>{data.type}</Text>
                  </Surface>
                  <Surface
                    elevation={3}
                    style={{
                      borderWidth: 1,
                      borderRadius: 10,
                      borderColor: colorScheme === 'dark' ? 'white' : 'black',
                    }}>
                    <Text style={[globalStyles.text, styles.status]}>{data.status}</Text>
                  </Surface>
                </View>
              </View>
              <View style={styles.infoContainer}>
                <Text style={[globalStyles.text, styles.title]}>{data.title}</Text>
                <Text
                  style={[globalStyles.text, styles.title, styles.indonesianTitle]}
                  numberOfLines={4}>
                  {'indonesianTitle' in data ? data.indonesianTitle : data.altTitle}
                </Text>
                <Text style={[globalStyles.text, styles.author]}>By {data.author || '-'}</Text>
                <View style={styles.genreContainer}>
                  {data.genres.map(z => {
                    return (
                      <Surface
                        key={z}
                        elevation={3}
                        style={{
                          borderRadius: 8,
                          backgroundColor:
                            z === 'Ecchi' ? 'rgba(255, 0, 0, 0.5)' : theme.colors.elevation.level3,
                        }}>
                        <Text style={styles.genre} key={z}>
                          {z}
                        </Text>
                      </Surface>
                    );
                  })}
                </View>
              </View>
            </View>
            <View style={{ flexDirection: 'column', flex: 1, marginTop: 10 }}>
              <View style={styles.secondaryInfoContainer}>
                <View style={styles.additionalInfo}>
                  {'indonesianTitle' in data ? (
                    <>
                      <Surface style={styles.additionalInfoTextSurface}>
                        <Text style={[globalStyles.text, styles.additionalInfoText]}>
                          <Icon color={styles.additionalInfoText.color} name="check-circle" />{' '}
                          {data.minAge}
                        </Text>
                      </Surface>
                      <Surface style={styles.additionalInfoTextSurface}>
                        <Text style={[globalStyles.text, styles.additionalInfoText]}>
                          <Icon color={styles.additionalInfoText.color} name="map-signs" />{' '}
                          {data.readingDirection}
                        </Text>
                      </Surface>
                      <Surface style={styles.additionalInfoTextSurface}>
                        <Text style={[globalStyles.text, styles.additionalInfoText]}>
                          <Icon color={styles.additionalInfoText.color} name="tag" /> {data.concept}
                        </Text>
                      </Surface>
                    </>
                  ) : undefined}
                  {'releaseYear' in data && (
                    <Surface style={[styles.additionalInfoTextSurface, { marginTop: 10 }]}>
                      <Text style={[globalStyles.text, styles.additionalInfoText]}>
                        <Icon color={styles.additionalInfoText.color} name="calendar" />{' '}
                        {data.releaseYear}
                      </Text>
                    </Surface>
                  )}
                </View>

                <Text style={[globalStyles.text]}>{data.synopsis}</Text>
              </View>
              <View style={{ flexDirection: 'column', flex: 1, marginTop: 10 }}>
                <Button
                  buttonColor={styles.additionalInfoTextSurface.backgroundColor}
                  textColor={styles.additionalInfoText.color}
                  mode="outlined"
                  icon="playlist-plus"
                  disabled={isInList}
                  onPress={() => {
                    if (!data.chapters[data.chapters.length - 1]) {
                      ToastAndroid.show('Data chapter tidak ditemukan', ToastAndroid.SHORT);
                      return;
                    }
                    const lastData = data.chapters[data.chapters.length - 1];
                    const watchLaterJson: watchLaterJSON = {
                      title: data.title,
                      link: props.route.params.link,
                      rating: 'Komik',
                      releaseYear:
                        'releaseDate' in lastData
                          ? lastData.releaseDate
                          : 'releaseYear' in data
                            ? (data.releaseYear ?? 'Data tidak tersedia')
                            : 'Data tidak tersedia',
                      thumbnailUrl: data.thumbnailUrl,
                      genre: data.genres,
                      date: Date.now(),
                      isComics: true,
                    };
                    controlWatchLater('add', watchLaterJson);
                    ToastAndroid.show('Ditambahkan ke tonton nanti', ToastAndroid.SHORT);
                  }}>
                  {isInList ? 'Sudah Ditambahkan' : 'Baca Nanti'}
                </Button>
                <Text style={[globalStyles.text, styles.listChapterText]}>List Chapters</Text>
                <View style={{ gap: 10 }}>
                  {lastReaded && lastReaded.episode && (
                    <Button
                      mode="elevated"
                      icon="book-open"
                      onPress={() => {
                        readComic(lastReaded.link, lastReaded);
                      }}>
                      Terakhir Dibaca ({lastReaded.episode})
                    </Button>
                  )}
                  <Button
                    onPress={() => {
                      const chapterData = data.chapters[data.chapters.length - 1];
                      if (!chapterData?.chapterUrl) {
                        ToastAndroid.show('Chapter tidak ditemukan', ToastAndroid.SHORT);
                        return;
                      }
                      readComic(chapterData.chapterUrl);
                    }}
                    buttonColor={styles.additionalInfoTextSurface.backgroundColor}
                    textColor={styles.additionalInfoText.color}
                    mode="elevated">
                    Baca Chapter Pertama
                  </Button>
                  <Button
                    onPress={() => {
                      const chapterData = data.chapters[0];
                      if (!chapterData?.chapterUrl) {
                        ToastAndroid.show('Chapter tidak ditemukan', ToastAndroid.SHORT);
                        return;
                      }
                      readComic(chapterData?.chapterUrl);
                    }}
                    buttonColor={styles.additionalInfoTextSurface.backgroundColor}
                    textColor={styles.additionalInfoText.color}
                    mode="elevated">
                    Baca Chapter Terbaru
                  </Button>
                </View>
                <Searchbar
                  onChangeText={setSearchQuery}
                  value={searchQuery}
                  style={{ margin: 10 }}
                  placeholder="Cari chapter"
                  keyboardType="number-pad"
                />
              </View>
            </View>
          </>
        }
        showsVerticalScrollIndicator={false}
      />
    </KeyboardAvoidingView>
  );
}

function useStyles() {
  const theme = useTheme();
  const globalStyles = useGlobalStyles();
  const colorScheme = useColorScheme();
  return useMemo(
    () =>
      StyleSheet.create({
        mainContainer: {
          flex: 1,
          backgroundColor: colorScheme === 'dark' ? '#0c0c0c' : '#ebebeb',
        },
        mainContent: {
          gap: 5,
          flex: 1,
          flexWrap: 'wrap',
          flexDirection: 'row',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
        },
        infoContainer: {
          gap: 5,
          flex: 1,
          flexDirection: 'column',
          marginTop: 10,
        },
        thumbnail: {
          margin: 15,
          width: 110,
          height: 150,
          borderRadius: 10,
          transform: [{ translateY: -30 }],
        },
        type: {
          color: colorScheme === 'dark' ? 'white' : 'black',
          fontWeight: 'bold',
          padding: 5,
        },
        status: {
          alignSelf: 'flex-start',
          padding: 5,
        },
        title: {
          flexShrink: 1,
          fontSize: 20,
          fontWeight: 'bold',
        },
        indonesianTitle: {
          fontSize: 14,
        },
        author: {
          color: colorScheme === 'dark' ? '#5ddfff' : '#00608d',
        },
        secondaryInfoContainer: {},
        genreContainer: {
          flex: 1,
          gap: 4,
          flexWrap: 'wrap',
          flexDirection: 'row',
        },
        genre: {
          color: globalStyles.text.color,
          fontWeight: 'bold',
          alignSelf: 'flex-start',
          padding: 4,
        },
        additionalInfo: {
          flexDirection: 'row',
          gap: 4,
          flexWrap: 'wrap',
          marginBottom: 12,
        },
        additionalInfoTextSurface: {
          borderRadius: 8,
          backgroundColor: theme.colors.secondaryContainer,
        },
        additionalInfoText: {
          color: theme.colors.onSecondaryContainer,
          fontWeight: 'bold',
          alignSelf: 'flex-start',
          padding: 4,
        },
        listChapterText: {
          fontWeight: 'bold',
          fontSize: 22,
          marginBottom: 10,
        },
        chapterButtonsContainer: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: 10,
          gap: 10,
        },
        chapterButton: {
          flex: 1,
          borderRadius: 10,
        },
        chapterButtonLabel: {
          fontSize: 12,
        },
        chapterItem: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingVertical: 15,
          paddingHorizontal: 10,
          backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#ffffff',
          borderRadius: 10,
          marginBottom: 8,
          elevation: 3,
        },
        chapterTitleContainer: {
          flex: 2,
        },
        chapterText: {
          fontSize: 16,
          fontWeight: '600',
          color: colorScheme === 'dark' ? '#ffffff' : '#333333',
        },
        chapterDetailsContainer: {
          flex: 1,
          alignItems: 'flex-end',
        },
        chapterDetailText: {
          fontSize: 12,
          color: colorScheme === 'dark' ? '#cccccc' : '#666666',
          marginBottom: 3,
        },
        lastReadedText: {
          color: theme.colors.onPrimaryContainer,
          fontWeight: 'bold',
        },
        chapterDivider: {
          backgroundColor: 'transparent',
          height: 0,
        },
      }),
    [
      colorScheme,
      globalStyles.text.color,
      theme.colors.onPrimaryContainer,
      theme.colors.onSecondaryContainer,
      theme.colors.secondaryContainer,
    ],
  );
}
