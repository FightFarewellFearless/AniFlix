import Icon from '@react-native-vector-icons/fontawesome';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FlashList, FlashListRef } from '@shopify/flash-list';
import { RecyclerViewProps } from '@shopify/flash-list/dist/recyclerview/RecyclerViewProps';
import { LinearGradient } from 'expo-linear-gradient';
import React, { memo, useCallback, useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  ToastAndroid,
  TouchableOpacity,
  useColorScheme,
  useWindowDimensions,
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

import { HistoryItemKey } from '@/types/databaseTarget';
import { HistoryJSON } from '@/types/historyJSON';
import { RootStackNavigator } from '@/types/navigation';
import watchLaterJSON from '@/types/watchLaterJSON';
import useGlobalStyles from '@assets/style';
import ImageLoading from '@component/misc/ImageLoading';
import { DatabaseManager, useModifiedKeyValueIfFocused } from '@utils/DatabaseManager';
import { NovelDetail as NovelDetailType } from '@utils/scrapers/novel';
import controlWatchLater from '@utils/watchLaterControl';

type RecyclerViewType = (
  props: RecyclerViewProps<NovelDetailType['chapters'][0]> & {
    ref?: React.Ref<FlashListRef<NovelDetailType['chapters'][0]>>;
  },
) => React.JSX.Element;
const ReanimatedFlashList = Reanimated.createAnimatedComponent<RecyclerViewType>(FlashList);

type Props = NativeStackScreenProps<RootStackNavigator, 'NovelDetail'>;
const IMG_HEIGHT = 200;

export default function NovelDetail(props: Props) {
  const globalStyles = useGlobalStyles();
  const insets = useSafeAreaInsets();
  const styles = useStyles();
  const scrollRef = useAnimatedRef<FlashListRef<NovelDetailType['chapters'][0]>>();
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
    () => watchLaterListsJson.some(item => item.title === data.title && item.isNovel),
    [data.title, watchLaterListsJson],
  );

  const historyListsJson = useModifiedKeyValueIfFocused(
    'historyKeyCollectionsOrder',
    state => JSON.parse(state) as HistoryItemKey[],
  );
  const lastReaded = useMemo(() => {
    const isLastReaded = historyListsJson.find(
      z => z === `historyItem:${data.title.trim()}:false:false:true`,
    );
    if (isLastReaded) {
      return JSON.parse(DatabaseManager.getSync(isLastReaded)!) as HistoryJSON;
    } else return undefined;
  }, [historyListsJson, data.title]);

  const readNovel = useCallback(
    (url: string, fromHistory?: HistoryJSON) => {
      props.navigation.navigate('FromUrl', {
        title: props.route.params.data.title,
        link: url,
        type: 'novel',
        historyData: fromHistory
          ? {
              lastDuration: fromHistory.lastDuration ?? 0,
              resolution: fromHistory.resolution ?? '',
            }
          : undefined,
      });
    },
    [props.navigation, props.route.params.data.title],
  );

  const listHeaderComponent = (
    <NovelDetailHeader
      data={data}
      imageStyle={imageStyle}
      isInList={isInList}
      lastReaded={lastReaded}
      readNovel={readNovel}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      link={props.route.params.link}
    />
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
        renderItem={({ item }) => (
          <RenderChapterItem item={item} lastReaded={lastReaded} readNovel={readNovel} />
        )}
        ItemSeparatorComponent={() => <Divider />}
        keyExtractor={(item, index) => item.chapter + index}
        contentContainerStyle={{
          backgroundColor: styles.mainContainer.backgroundColor,
          paddingLeft: insets.left,
          paddingRight: insets.right,
          paddingBottom: insets.bottom,
        }}
        ListHeaderComponentStyle={[styles.mainContainer, { marginBottom: 12 }]}
        ListHeaderComponent={listHeaderComponent}
        showsVerticalScrollIndicator={false}
      />
    </KeyboardAvoidingView>
  );
}

interface NovelDetailHeaderProps {
  data: Props['route']['params']['data'];
  imageStyle: any;
  isInList: boolean;
  lastReaded: HistoryJSON | undefined;
  readNovel: (url: string, fromHistory?: HistoryJSON) => void;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  link: string;
}

const NovelDetailHeader = memo(
  ({
    data,
    imageStyle,
    isInList,
    lastReaded,
    readNovel,
    searchQuery,
    setSearchQuery,
    link,
  }: NovelDetailHeaderProps) => {
    const styles = useStyles();
    const globalStyles = useGlobalStyles();
    const theme = useTheme();
    const colorScheme = useColorScheme();

    return (
      <>
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
            <ImageLoading source={{ uri: data.thumbnailUrl }} style={styles.thumbnail} />
            <View style={{ transform: styles.thumbnail.transform, flexDirection: 'row', gap: 5 }}>
              <Surface
                elevation={3}
                style={{
                  backgroundColor: colorScheme === 'dark' ? '#00608d' : '#5ddfff',
                  borderRadius: 10,
                }}>
                <Text style={[globalStyles.text, styles.type]}>{data.type || 'Novel'}</Text>
              </Surface>
              <Surface
                elevation={3}
                style={{
                  borderWidth: 1,
                  borderRadius: 10,
                  borderColor: colorScheme === 'dark' ? 'white' : 'black',
                }}>
                <Text style={[globalStyles.text, styles.status]}>Ongoing</Text>
              </Surface>
            </View>
          </View>
          <View style={styles.infoContainer}>
            <Text style={[globalStyles.text, styles.title]}>{data.title}</Text>
            <Text style={[globalStyles.text, styles.author]}>By {data.author || '-'}</Text>
            <View style={styles.genreContainer}>
              {data.genres.map(z => {
                return (
                  <Surface
                    key={z}
                    elevation={3}
                    style={{
                      borderRadius: 8,
                      backgroundColor: theme.colors.elevation.level3,
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
                  link: link,
                  rating: 'Novel',
                  releaseYear: lastData.releaseDate || 'Data tidak tersedia',
                  thumbnailUrl: data.thumbnailUrl,
                  genre: data.genres,
                  date: Date.now(),
                  isNovel: true,
                };
                controlWatchLater('add', watchLaterJson);
                ToastAndroid.show('Ditambahkan ke daftar baca nanti', ToastAndroid.SHORT);
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
                    readNovel(lastReaded.link, lastReaded);
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
                  readNovel(chapterData.chapterUrl);
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
                  readNovel(chapterData?.chapterUrl);
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
    );
  },
);

interface RenderChapterItemProps {
  item: NovelDetailType['chapters'][0];
  lastReaded: HistoryJSON | undefined;
  readNovel: (url: string, fromHistory?: HistoryJSON) => void;
}

const RenderChapterItem = memo(({ item, lastReaded, readNovel }: RenderChapterItemProps) => {
  const styles = useStyles();
  const globalStyles = useGlobalStyles();

  if (!item) return null;
  let isLastReaded =
    lastReaded &&
    lastReaded.episode &&
    item.chapter.toLowerCase().replace('chapter ', '').trim() ===
      lastReaded.episode.toLowerCase().replace('chapter ', '').trim();
  if (!isLastReaded) {
    lastReaded?.link === item.chapterUrl && (isLastReaded = true);
  }
  return (
    <TouchableOpacity
      style={styles.chapterItem}
      onPress={() => readNovel(item.chapterUrl, isLastReaded ? lastReaded : undefined)}>
      <View style={styles.chapterTitleContainer}>
        <Text style={[globalStyles.text, styles.chapterText]}>
          {item.chapter.includes('Chapter') ? item.chapter : `Chapter ${item.chapter}`}
        </Text>
      </View>
      <View style={styles.chapterDetailsContainer}>
        {item.releaseDate && (
          <Text style={[globalStyles.text, styles.chapterDetailText]}>
            <Icon color={styles.chapterDetailText.color} name="calendar" size={12} />{' '}
            {item.releaseDate}
          </Text>
        )}
        {isLastReaded && (
          <Text style={[globalStyles.text, styles.chapterDetailText, styles.lastReadedText]}>
            <Icon color={styles.lastReadedText.color} name="book" size={12} /> Terakhir dibaca
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
});

function useStyles() {
  const theme = useTheme();
  const globalStyles = useGlobalStyles();
  const colorScheme = useColorScheme();
  const dimensions = useWindowDimensions();
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
          width: dimensions.width * 0.3,
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
        author: {
          color: colorScheme === 'dark' ? '#5ddfff' : '#00608d',
          fontWeight: 'bold',
        },
        genreContainer: {
          flexWrap: 'wrap',
          flexDirection: 'row',
          gap: 5,
        },
        genre: {
          fontWeight: 'bold',
          padding: 6,
          color: globalStyles.text.color,
        },
        secondaryInfoContainer: {
          backgroundColor: theme.colors.elevation.level1,
          padding: 10,
          borderRadius: 12,
        },
        additionalInfo: {
          flexDirection: 'row',
          gap: 4,
          flexWrap: 'wrap',
          marginBottom: 10,
        },
        additionalInfoTextSurface: {
          borderRadius: 8,
          backgroundColor: theme.colors.elevation.level3,
        },
        additionalInfoText: {
          paddingHorizontal: 8,
          paddingVertical: 5,
          fontWeight: 'bold',
          color: theme.colors.primary,
        },
        listChapterText: {
          fontWeight: 'bold',
          fontSize: 22,
          marginVertical: 10,
          textAlign: 'center',
        },
        chapterItem: {
          padding: 15,
          backgroundColor: theme.colors.surface,
          flexDirection: 'column',
          gap: 5,
        },
        chapterTitleContainer: {
          flex: 1,
        },
        chapterText: {
          fontWeight: 'bold',
          fontSize: 16,
        },
        chapterDetailsContainer: {
          flexDirection: 'row',
          gap: 10,
        },
        chapterDetailText: {
          fontSize: 12,
          color: theme.colors.outline,
          fontWeight: '500',
        },
        lastReadedText: {
          color: '#4CAF50',
          fontWeight: 'bold',
        },
      }),
    [theme, globalStyles, colorScheme, dimensions],
  );
}
