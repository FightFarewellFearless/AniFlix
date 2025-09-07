import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import { memo, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  ToastAndroid,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import { Button, Divider, Surface, useTheme } from 'react-native-paper';
import Reanimated, {
  interpolate,
  useAnimatedRef,
  useAnimatedStyle,
  useScrollOffset,
} from 'react-native-reanimated';
import Icon from '@react-native-vector-icons/fontawesome';
import useGlobalStyles from '../assets/style';
import { RootStackNavigator } from '../types/navigation';
import watchLaterJSON from '../types/watchLaterJSON';
import controlWatchLater from '../utils/watchLaterControl';

import { FlashList, FlashListProps, FlashListRef } from '@shopify/flash-list';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HistoryItemKey } from '../types/databaseTarget';
import { HistoryJSON } from '../types/historyJSON';
import { DatabaseManager, useModifiedKeyValueIfFocused } from '../utils/DatabaseManager';

interface MovieEpisode {
  title: string;
  url: string;
}
const ReanimatedImage = Reanimated.createAnimatedComponent(Image);
const ReanimatedFlashList =
  Reanimated.createAnimatedComponent<FlashListProps<MovieEpisode>>(FlashList);

type Props = NativeStackScreenProps<RootStackNavigator, 'MovieDetail'>;

const IMG_HEADER_HEIGHT = 250;

function MovieDetail(props: Props) {
  const styles = useStyles();
  const globalStyles = useGlobalStyles();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();

  const data = props.route.params.data;

  const watchLaterListsJson = useModifiedKeyValueIfFocused(
    'watchLater',
    state => JSON.parse(state) as watchLaterJSON[],
  );
  const isInList = watchLaterListsJson.some(
    item => item.title === data.title.replace('Subtitle Indonesia', '') && item.isMovie,
  );

  const historyListsJson = useModifiedKeyValueIfFocused(
    'historyKeyCollectionsOrder',
    state => JSON.parse(state) as HistoryItemKey[],
  );
  const historyTitle = data.title.replace('Subtitle Indonesia', '').trim();
  const lastWatched = useMemo(() => {
    const isLastWatched = historyListsJson.find(
      z => z === `historyItem:${historyTitle}:false:false`,
    );
    if (isLastWatched) {
      return JSON.parse(DatabaseManager.getSync(isLastWatched)!) as HistoryJSON;
    } else return undefined;
  }, [historyListsJson, historyTitle]);

  // @ts-expect-error : FlashListRef type seems to not compatible with useAnimatedRef
  const scrollRef = useAnimatedRef<FlashListRef<MovieEpisode>>();
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

  const ListHeaderComponent = useMemo(() => {
    const hasMultipleEpisodes = data.episodeList.length > 1;

    return (
      <View style={styles.mainContainer}>
        <ReanimatedImage
          style={[{ width: '100%', height: IMG_HEADER_HEIGHT }, headerImageStyle]}
          source={{ uri: data.thumbnailUrl }}
          contentFit="cover"
        />

        <LinearGradient
          colors={['transparent', 'black']}
          style={{
            width: '100%',
            height: 80,
            position: 'absolute',
            transform: [
              {
                translateY: 165,
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
            <Surface
              style={{
                backgroundColor: colorScheme === 'dark' ? '#00608d' : '#5ddfff',
                transform: styles.thumbnail.transform,
                flexDirection: 'row',
                gap: 5,
                marginTop: 5,
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 10,
              }}>
              <Text style={[globalStyles.text, styles.type]}>Movie</Text>
            </Surface>
          </View>

          <View style={styles.infoContainer}>
            <Text style={[globalStyles.text, styles.title]}>
              {data.title.replace('Subtitle Indonesia', '').trim()}
            </Text>
            <Text style={[globalStyles.text, styles.author]}>
              <Icon color={styles.author.color} name="building" /> {data.studio}
            </Text>
            <View style={styles.genreContainer}>
              {data.genres.map(genre => (
                <Surface
                  key={genre}
                  elevation={3}
                  style={{ borderRadius: styles.genre.borderRadius }}>
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
                  {data.releaseDate}
                </Text>
              </Surface>
              <Surface elevation={3} style={styles.additionalInfoTextSurface}>
                <Text style={[globalStyles.text, styles.additionalInfoText]}>
                  <Icon color={styles.additionalInfoText.color} name="refresh" /> {data.updateDate}
                </Text>
              </Surface>
              {hasMultipleEpisodes && (
                <Surface elevation={3} style={styles.additionalInfoTextSurface}>
                  <Text style={[globalStyles.text, styles.additionalInfoText]}>
                    <Icon color={styles.additionalInfoText.color} name="list" />{' '}
                    {data.episodeList.length} Episode
                  </Text>
                </Surface>
              )}
            </View>

            <View style={[styles.synopsisContainer]}>
              <Text style={[globalStyles.text, styles.synopsisTitle]}>Sinopsis</Text>
              <View style={styles.synopsisView}>
                <Text style={[globalStyles.text, styles.synopsisText]}>
                  {data.synopsis === '' ? 'Tidak ada sinopsis yang tersedia.' : data.synopsis}
                </Text>
              </View>
            </View>

            <Button
              icon="playlist-plus"
              buttonColor={styles.additionalInfoTextSurface.backgroundColor}
              textColor={styles.additionalInfoText.color}
              mode="outlined"
              onPress={() => {
                const watchLaterJson: watchLaterJSON = {
                  title: data.title.replace('Subtitle Indonesia', ''),
                  link: props.route.params.link,
                  rating: data.rating,
                  releaseYear: data.releaseDate,
                  thumbnailUrl: data.thumbnailUrl,
                  genre: data.genres,
                  date: Date.now(),
                  isMovie: true,
                };
                controlWatchLater('add', watchLaterJson);
                ToastAndroid.show('Ditambahkan ke tonton nanti', ToastAndroid.SHORT);
              }}
              disabled={isInList}>
              {isInList ? 'Sudah Ditambahkan' : 'Tonton Nanti'}
            </Button>

            {hasMultipleEpisodes && (
              <View style={styles.listChapterTextContainer}>
                <Text style={[globalStyles.text, styles.listChapterText]}>Daftar Episode</Text>
              </View>
            )}

            <View style={styles.chapterButtonsContainer}>
              {hasMultipleEpisodes ? (
                <>
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
                      {lastWatched.episode.replace('Subtitle Indonesia', '').trim()})
                    </Button>
                  )}
                  <Button
                    buttonColor={styles.additionalInfoTextSurface.backgroundColor}
                    textColor={styles.additionalInfoText.color}
                    mode="elevated"
                    onPress={() => {
                      props.navigation.navigate('FromUrl', {
                        title: props.route.params.data.title,
                        link: data.episodeList[data.episodeList.length - 1].url,
                        type: 'movie',
                      });
                    }}>
                    Tonton Episode Pertama
                  </Button>
                  <Button
                    buttonColor={styles.additionalInfoTextSurface.backgroundColor}
                    textColor={styles.additionalInfoText.color}
                    mode="elevated"
                    onPress={() => {
                      props.navigation.navigate('FromUrl', {
                        title: props.route.params.data.title,
                        link: data.episodeList[0].url,
                        type: 'movie',
                      });
                    }}>
                    Tonton Episode Terakhir
                  </Button>
                </>
              ) : (
                <Button
                  icon="movie-open-play"
                  buttonColor={styles.additionalInfoTextSurface.backgroundColor}
                  textColor={styles.additionalInfoText.color}
                  mode="elevated"
                  style={{ flex: 1 }}
                  onPress={() => {
                    props.navigation.navigate('FromUrl', {
                      title: props.route.params.data.title,
                      link: data.streamingUrl,
                      type: 'movie',
                      historyData: lastWatched
                        ? {
                            lastDuration: lastWatched.lastDuration ?? 0,
                            resolution: lastWatched.resolution ?? '',
                          }
                        : undefined,
                    });
                  }}>
                  Tonton Sekarang
                </Button>
              )}
            </View>
          </View>
        </View>
      </View>
    );
  }, [
    data.episodeList,
    data.thumbnailUrl,
    data.title,
    data.studio,
    data.genres,
    data.rating,
    data.releaseDate,
    data.updateDate,
    data.synopsis,
    data.streamingUrl,
    styles.mainContainer,
    styles.mainContent,
    styles.thumbnail,
    styles.type,
    styles.infoContainer,
    styles.title,
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
    colorScheme,
    globalStyles.text,
    isInList,
    lastWatched,
    props.route.params.link,
    props.route.params.data.title,
    props.navigation,
  ]);

  return (
    <ReanimatedFlashList
      // @ts-expect-error : FlashListRef type seems to not compatible with useAnimatedRef
      ref={scrollRef}
      data={data.episodeList.length > 1 ? data.episodeList : []}
      renderItem={({ item }) => {
        const isLastWatched =
          lastWatched && lastWatched.episode && item.title.includes(lastWatched?.episode);
        return (
          <TouchableOpacity
            style={styles.episodeButton}
            onPress={() => {
              props.navigation.navigate('FromUrl', {
                title: props.route.params.data.title,
                link: item.url,
                historyData: isLastWatched
                  ? {
                      lastDuration: lastWatched.lastDuration ?? 0,
                      resolution: lastWatched.resolution ?? '',
                    }
                  : undefined,
                type: 'movie',
              });
            }}>
            <View style={styles.episodeTitleContainer}>
              <Text style={[globalStyles.text, styles.episodeText]}>{item.title}</Text>
              {isLastWatched && (
                <View style={styles.lastWatchedContainer}>
                  <Text style={[globalStyles.text, styles.lastWatchedText]}>Terakhir ditonton</Text>
                  <Icon name="film" size={16} color={styles.lastWatchedIcon.color} />
                </View>
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
      extraData={colorScheme}
      estimatedItemSize={60}
      showsVerticalScrollIndicator={false}
    />
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
        },
        title: {
          flexShrink: 1,
          fontSize: 22,
          fontWeight: 'bold',
          color: globalStyles.text.color,
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
          borderRadius: 8,
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
          paddingHorizontal: 8,
          paddingVertical: 4,
          backgroundColor: theme.colors.secondaryContainer,
        },
        additionalInfoText: {
          color: theme.colors.onSecondaryContainer,
          fontWeight: 'bold',
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
          marginBottom: 15,
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
        },
        episodeText: {
          fontSize: 16,
          fontWeight: '600',
          color: colorScheme === 'dark' ? '#ffffff' : '#333333',
        },
        lastWatchedContainer: {
          flex: 0.5,
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
        },
        lastWatchedText: {
          fontSize: 16,
          fontWeight: '600',
          textAlign: 'center',
          color: theme.colors.onPrimaryContainer,
        },
        lastWatchedIcon: {
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

export default memo(MovieDetail);
