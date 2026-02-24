import Icon from '@react-native-vector-icons/fontawesome';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import { memo, useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  ToastAndroid,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { Button, Divider, Searchbar, Surface, useTheme } from 'react-native-paper';
import Reanimated, {
  interpolate,
  useAnimatedRef,
  useAnimatedStyle,
  useScrollOffset,
} from 'react-native-reanimated';
import useGlobalStyles from '../../assets/style';
import { RootStackNavigator } from '../../types/navigation';
import watchLaterJSON from '../../types/watchLaterJSON';
import controlWatchLater from '../../utils/watchLaterControl';

import { FlashList, FlashListRef } from '@shopify/flash-list';
import { RecyclerViewProps } from '@shopify/flash-list/dist/recyclerview/RecyclerViewProps';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AniDetailEpsList } from '../../types/anime';
import { HistoryItemKey } from '../../types/databaseTarget';
import { HistoryJSON } from '../../types/historyJSON';
import { DatabaseManager, useModifiedKeyValueIfFocused } from '../../utils/DatabaseManager';
import { replaceLast } from '../../utils/replaceLast';

type RecyclerViewType = (
  props: RecyclerViewProps<AniDetailEpsList> & { ref?: React.Ref<FlashListRef<AniDetailEpsList>> },
) => React.JSX.Element;
const ReanimatedFlashList = Reanimated.createAnimatedComponent(FlashList as RecyclerViewType);

type Props = NativeStackScreenProps<RootStackNavigator, 'AnimeDetail'>;

const IMG_HEADER_HEIGHT = 200;

function AniDetail(props: Props) {
  const styles = useStyles();
  const globalStyles = useGlobalStyles();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();

  const data = props.route.params.data;

  const watchLaterListsJson = useModifiedKeyValueIfFocused(
    'watchLater',
    state => JSON.parse(state) as watchLaterJSON[],
  );
  const isInList = useMemo(
    () =>
      watchLaterListsJson.some(
        item =>
          item.title === data.title.replace(/Subtitle Indonesia|Sub Indo/, '') &&
          !item.isComics &&
          !item.isMovie,
      ),
    [data.title, watchLaterListsJson],
  );

  const historyListsJson = useModifiedKeyValueIfFocused(
    'historyKeyCollectionsOrder',
    state => JSON.parse(state) as HistoryItemKey[],
  );
  let historyTitle = data.title
    .replace(/Subtitle Indonesia|Sub Indo/, '')
    .split('(Episode')[0]
    .trim();
  if (historyTitle.endsWith('BD') && !data.episodeList.at(-1)?.title.endsWith('BD')) {
    historyTitle = replaceLast(historyTitle, 'BD', '').trim();
  }
  const lastWatched = useMemo(() => {
    const isLastWatched = historyListsJson.find(
      z => z === `historyItem:${historyTitle}:false:false`,
    );
    if (isLastWatched) {
      return JSON.parse(DatabaseManager.getSync(isLastWatched)!) as HistoryJSON;
    } else return undefined;
  }, [historyListsJson, historyTitle]);

  const scrollRef = useAnimatedRef<FlashListRef<AniDetailEpsList>>();
  const scrollOffset = useScrollOffset(scrollRef as any);

  const headerImageStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(
            scrollOffset.value,
            [0, IMG_HEADER_HEIGHT * 2],
            [0, IMG_HEADER_HEIGHT],
            'clamp',
          ),
        },
      ],
      opacity: interpolate(scrollOffset.value, [0, IMG_HEADER_HEIGHT], [1, 0], 'clamp'),
    };
  });

  const [searchQuery, setSearchQuery] = useState('');

  const filteredEpisodes = useMemo(() => {
    if (!searchQuery) return data.episodeList;
    return data.episodeList.toReversed().filter(eps => {
      return eps.title.toLowerCase().includes('episode ' + searchQuery.toLowerCase());
    });
  }, [data.episodeList, searchQuery]);

  const ListHeaderComponent = useMemo(() => {
    return (
      <View style={styles.mainContainer}>
        <Reanimated.View
          style={[
            { width: '100%', height: IMG_HEADER_HEIGHT },
            headerImageStyle,
            {
              backgroundColor: theme.colors.elevation.level2,
              justifyContent: 'center',
              alignItems: 'center',
            },
          ]}>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Icon color={theme.colors.onBackground} name="tv" size={64} />
          </View>
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

        <View
          style={[styles.mainContent, { backgroundColor: styles.mainContainer.backgroundColor }]}>
          <View style={{ flexDirection: 'column', alignItems: 'center' }}>
            <Image
              source={{ uri: data.thumbnailUrl }}
              style={styles.thumbnail}
              contentFit="contain"
            />
            <View
              style={{
                transform: styles.thumbnail.transform,
                flexDirection: 'row',
                gap: 5,
                marginTop: 5,
              }}>
              <Surface
                elevation={3}
                style={{
                  backgroundColor: colorScheme === 'dark' ? '#00608d' : '#5ddfff',
                  borderRadius: 10,
                }}>
                <Text style={[globalStyles.text, styles.type]}>{data.animeType}</Text>
              </Surface>
              <Surface
                elevation={3}
                style={{
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: colorScheme === 'dark' ? 'white' : 'black',
                }}>
                <Text style={[globalStyles.text, styles.status]}>{data.status}</Text>
              </Surface>
            </View>
          </View>

          <View style={styles.infoContainer}>
            <Text style={[globalStyles.text, styles.title]}>{historyTitle}</Text>
            {data.alternativeTitle && (
              <Text style={[globalStyles.text, styles.title, styles.indonesianTitle]}>
                {data.alternativeTitle}
              </Text>
            )}
            <Text style={[globalStyles.text, styles.author]}>
              <Icon color={styles.author.color} name="building" /> {data.studio}
            </Text>
            <View style={styles.genreContainer}>
              {data.genres.map(genre => (
                <Surface
                  key={genre}
                  elevation={3}
                  style={{
                    borderRadius: 8,
                    backgroundColor: colorScheme === 'dark' ? '#222222' : '#cccccc',
                  }}>
                  <Text style={styles.genre}>{genre}</Text>
                </Surface>
              ))}
            </View>
          </View>

          <View style={styles.secondaryInfoContainer}>
            <View style={styles.additionalInfo}>
              <Surface elevation={3} style={styles.additionalInfoTextSurface}>
                <Text style={[globalStyles.text, styles.additionalInfoText]}>
                  <Icon color={styles.additionalInfoText.color} name="star" />{' '}
                  {data.rating === '' ? '-' : data.rating}
                </Text>
              </Surface>
              <Surface elevation={3} style={styles.additionalInfoTextSurface}>
                <Text style={[globalStyles.text, styles.additionalInfoText]}>
                  <Icon color={styles.additionalInfoText.color} name="calendar" />{' '}
                  {data.releaseYear}
                </Text>
              </Surface>
              <Surface elevation={3} style={styles.additionalInfoTextSurface}>
                <Text style={[globalStyles.text, styles.additionalInfoText]}>
                  <Icon color={styles.additionalInfoText.color} name="play-circle" />{' '}
                  {data.minutesPerEp}
                </Text>
              </Surface>
              <Surface elevation={3} style={styles.additionalInfoTextSurface}>
                <Text style={[globalStyles.text, styles.additionalInfoText]}>
                  <Icon color={styles.additionalInfoText.color} name="eye" />{' '}
                  {data.episodeList.length + '/' + data.epsTotal + ' Episode'}
                </Text>
              </Surface>
            </View>

            <View style={styles.synopsisContainer}>
              <Text style={[globalStyles.text, styles.synopsisTitle]}>Sinopsis</Text>
              <View style={styles.synopsisView}>
                <Text style={[globalStyles.text, styles.synopsisText]}>
                  {data.synopsis === '' ? 'Tidak ada sinopsis yang tersedia.' : data.synopsis}
                </Text>
              </View>
            </View>

            <Button
              buttonColor={styles.additionalInfoTextSurface.backgroundColor}
              textColor={styles.additionalInfoText.color}
              mode="outlined"
              icon="playlist-plus"
              disabled={isInList}
              onPress={() => {
                const watchLaterJson: watchLaterJSON = {
                  title: data.title.replace(/Subtitle Indonesia|Sub Indo/, ''),
                  link: props.route.params.link,
                  rating: data.rating,
                  releaseYear: data.releaseYear,
                  thumbnailUrl: data.thumbnailUrl,
                  genre: data.genres,
                  date: Date.now(),
                };
                controlWatchLater('add', watchLaterJson);
                ToastAndroid.show('Ditambahkan ke tonton nanti', ToastAndroid.SHORT);
              }}>
              {isInList ? 'Sudah Ditambahkan' : 'Tonton Nanti'}
            </Button>

            <View style={styles.listChapterTextContainer}>
              <Text style={[globalStyles.text, styles.listChapterText]}>Daftar Episode</Text>
            </View>

            <View style={styles.chapterButtonsContainer}>
              {lastWatched && lastWatched.episode && (
                <Button
                  mode="elevated"
                  icon="play"
                  onPress={() => {
                    if (data.episodeList.length > 0) {
                      props.navigation.navigate('FromUrl', {
                        title: props.route.params.data.title,
                        link: lastWatched.link,
                        historyData: lastWatched
                          ? {
                              lastDuration: lastWatched.lastDuration ?? 0,
                              resolution: lastWatched.resolution ?? '',
                            }
                          : undefined,
                      });
                    } else {
                      ToastAndroid.show('Tidak ada episode untuk ditonton', ToastAndroid.SHORT);
                    }
                  }}>
                  Terakhir Ditonton (
                  {lastWatched.episode.replace(/Subtitle Indonesia|Sub Indo/, '').trim()})
                </Button>
              )}
              <Button
                buttonColor={styles.additionalInfoTextSurface.backgroundColor}
                textColor={styles.additionalInfoText.color}
                mode="elevated"
                onPress={() => {
                  if (data.episodeList.length > 0) {
                    props.navigation.navigate('FromUrl', {
                      title: props.route.params.data.title,
                      link: data.episodeList[data.episodeList.length - 1].link,
                    });
                  } else {
                    ToastAndroid.show('Tidak ada episode untuk ditonton', ToastAndroid.SHORT);
                  }
                }}>
                Tonton Episode Pertama
              </Button>
              <Button
                buttonColor={styles.additionalInfoTextSurface.backgroundColor}
                textColor={styles.additionalInfoText.color}
                mode="elevated"
                onPress={() => {
                  if (data.episodeList.length > 0) {
                    props.navigation.navigate('FromUrl', {
                      title: props.route.params.data.title,
                      link: data.episodeList[0].link,
                    });
                  } else {
                    ToastAndroid.show('Tidak ada episode untuk ditonton', ToastAndroid.SHORT);
                  }
                }}>
                Tonton Episode Terbaru
              </Button>
            </View>
            <Searchbar
              keyboardType="number-pad"
              placeholder="Cari Episode"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>
      </View>
    );
  }, [
    styles.mainContainer,
    styles.mainContent,
    styles.thumbnail,
    styles.type,
    styles.status,
    styles.infoContainer,
    styles.title,
    styles.indonesianTitle,
    styles.author,
    styles.genreContainer,
    styles.secondaryInfoContainer,
    styles.additionalInfo,
    styles.additionalInfoTextSurface,
    styles.additionalInfoText,
    styles.synopsisContainer,
    styles.synopsisTitle,
    styles.synopsisView,
    styles.synopsisText,
    styles.listChapterTextContainer,
    styles.listChapterText,
    styles.chapterButtonsContainer,
    styles.genre,
    headerImageStyle,
    theme.colors.elevation.level2,
    theme.colors.onBackground,
    data.thumbnailUrl,
    data.animeType,
    data.status,
    data.alternativeTitle,
    data.studio,
    data.genres,
    data.rating,
    data.releaseYear,
    data.minutesPerEp,
    data.episodeList,
    data.epsTotal,
    data.synopsis,
    data.title,
    colorScheme,
    globalStyles.text,
    historyTitle,
    isInList,
    lastWatched,
    searchQuery,
    props.route.params.link,
    props.route.params.data.title,
    props.navigation,
  ]);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="height">
      <ReanimatedFlashList
        maintainVisibleContentPosition={{
          disabled: true,
        }}
        ref={scrollRef}
        data={filteredEpisodes}
        renderItem={({ item }) => {
          const isLastWatched =
            lastWatched && lastWatched.episode && item.title.includes(lastWatched?.episode);
          return (
            <TouchableOpacity
              style={styles.episodeButton}
              onPress={() => {
                props.navigation.navigate('FromUrl', {
                  title: props.route.params.data.title,
                  link: item.link,
                  historyData: isLastWatched
                    ? {
                        lastDuration: lastWatched.lastDuration ?? 0,
                        resolution: lastWatched.resolution ?? '',
                      }
                    : undefined,
                });
              }}>
              <View style={styles.episodeTitleContainer}>
                <Text
                  style={[
                    globalStyles.text,
                    styles.episodeText,
                    isLastWatched ? styles.lastWatchedTextColor : undefined,
                  ]}>
                  {item.title.replace(/Subtitle Indonesia|Sub Indo/, '').trim()}
                </Text>
                {isLastWatched && (
                  <Icon name="film" color={styles.lastWatchedTextColor.color} size={16} />
                )}
              </View>
            </TouchableOpacity>
          );
        }}
        ItemSeparatorComponent={() => <Divider style={styles.chapterDivider} />}
        keyExtractor={item => item.title}
        contentContainerStyle={{
          backgroundColor: styles.mainContainer.backgroundColor,
          paddingLeft: insets.left,
          paddingRight: insets.right,
          paddingBottom: insets.bottom,
        }}
        ListHeaderComponentStyle={[styles.mainContainer, { marginBottom: 12 }]}
        ListHeaderComponent={ListHeaderComponent}
        ListEmptyComponent={
          <View style={[styles.mainContainer, { marginVertical: 6 }]}>
            <Text style={globalStyles.text}>Tidak ada episode</Text>
          </View>
        }
        extraData={colorScheme}
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
          gap: 15,
          flex: 1,
          flexWrap: 'wrap',
          flexDirection: 'row',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          paddingHorizontal: 20,
          paddingVertical: 15,
          marginTop: -20,
        },
        infoContainer: {
          gap: 5,
          flex: 1,
          flexDirection: 'column',
        },
        thumbnail: {
          margin: 15,
          width: 110,
          height: 150,
          borderRadius: 10,
          transform: [{ translateY: -40 }],
        },
        type: {
          color: colorScheme === 'dark' ? 'white' : 'black',
          fontWeight: 'bold',
          paddingHorizontal: 8,
          paddingVertical: 4,
        },
        status: {
          paddingHorizontal: 8,
          paddingVertical: 4,
          color: globalStyles.text.color,
        },
        title: {
          flexShrink: 1,
          fontSize: 22,
          fontWeight: 'bold',
          color: globalStyles.text.color,
        },
        indonesianTitle: {
          fontSize: 16,
          fontWeight: 'normal',
          opacity: 0.8,
        },
        author: {
          color: colorScheme === 'dark' ? '#5ddfff' : '#00608d',
          marginTop: 5,
        },
        secondaryInfoContainer: {
          width: '100%',
          gap: 15,
        },
        genreContainer: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 8,
          marginTop: 10,
        },
        genre: {
          color: globalStyles.text.color,
          fontWeight: 'bold',
          paddingHorizontal: 8,
          paddingVertical: 4,
        },
        additionalInfo: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 10,
          justifyContent: 'space-around',
          alignItems: 'center',
          paddingVertical: 5,
        },
        additionalInfoTextSurface: {
          borderRadius: 8,
          backgroundColor: theme.colors.secondaryContainer,
        },
        additionalInfoText: {
          color: theme.colors.onSecondaryContainer,
          fontWeight: 'bold',
          paddingHorizontal: 8,
          paddingVertical: 4,
        },
        synopsisContainer: {},
        synopsisTitle: {
          fontSize: 18,
          fontWeight: 'bold',
          marginBottom: 8,
          color: globalStyles.text.color,
        },
        synopsisView: {
          paddingBottom: 10,
        },
        synopsisText: {
          textAlign: 'justify',
          fontSize: 14,
          lineHeight: 20,
          color: globalStyles.text.color,
          opacity: 0.9,
        },
        listChapterTextContainer: {
          paddingVertical: 10,
        },
        listChapterText: {
          fontWeight: 'bold',
          fontSize: 22,
          color: globalStyles.text.color,
          textAlign: 'center',
        },
        chapterButtonsContainer: {
          gap: 10,
        },
        episodeButton: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingVertical: 15,
          paddingHorizontal: 20,
          backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#ffffff',
        },
        episodeTitleContainer: {
          flex: 1,
          flexWrap: 'wrap',
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
        },
        episodeText: {
          flex: 1,
          fontSize: 16,
          fontWeight: '600',
          color: colorScheme === 'dark' ? '#ffffff' : '#333333',
        },
        lastWatchedTextColor: {
          color: theme.colors.onPrimaryContainer,
        },
        chapterDivider: {
          backgroundColor: colorScheme === 'dark' ? '#2b2b2b' : '#e0e0e0',
          height: 0.8,
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

export default memo(AniDetail);
