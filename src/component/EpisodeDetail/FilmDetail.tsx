import Icon from '@react-native-vector-icons/fontawesome';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import { memo, useMemo } from 'react';
import {
  ColorSchemeName,
  StyleSheet,
  Text,
  ToastAndroid,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import { Button, Surface, useTheme } from 'react-native-paper';
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

import { FlashList, FlashListRef, useMappingHelper } from '@shopify/flash-list';
import { RecyclerViewProps } from '@shopify/flash-list/dist/recyclerview/RecyclerViewProps';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HistoryItemKey } from '../../types/databaseTarget';
import { HistoryJSON } from '../../types/historyJSON';
import { DatabaseManager, useModifiedKeyValueIfFocused } from '../../utils/DatabaseManager';
import { FilmSeason } from '../../utils/scrapers/film';

type RecyclerViewType = (
  props: RecyclerViewProps<FilmSeason> & {
    ref?: React.Ref<FlashListRef<FilmSeason>>;
  },
) => React.JSX.Element;
const ReanimatedImage = Reanimated.createAnimatedComponent(Image);
const ReanimatedFlashList = Reanimated.createAnimatedComponent<RecyclerViewType>(FlashList);

type Props = NativeStackScreenProps<RootStackNavigator, 'FilmDetail'>;

const IMG_HEADER_HEIGHT = 250;

function FilmDetail(props: Props) {
  const styles = useStyles();
  const globalStyles = useGlobalStyles();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();

  const data = props.route.params.data;

  const watchLaterListsJson = useModifiedKeyValueIfFocused(
    'watchLater',
    state => JSON.parse(state) as watchLaterJSON[],
  );
  // TODO: change the replace
  const isInList = watchLaterListsJson.some(
    item => item.title === data.info.title.replace('Subtitle Indonesia', '') && item.isMovie,
  );

  const historyListsJson = useModifiedKeyValueIfFocused(
    'historyKeyCollectionsOrder',
    state => JSON.parse(state) as HistoryItemKey[],
  );
  // TODO change the replace
  const historyTitle = data.info.title.replace('Subtitle Indonesia', '').trim();
  const lastWatched = useMemo(() => {
    const isLastWatched = historyListsJson.find(
      z => z === `historyItem:${historyTitle}:false:true`,
    );
    if (isLastWatched) {
      return JSON.parse(DatabaseManager.getSync(isLastWatched)!) as HistoryJSON;
    } else return undefined;
  }, [historyListsJson, historyTitle]);

  const scrollRef = useAnimatedRef<FlashListRef<FilmSeason>>();
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
    const hasMultipleEpisodes = data.seasonData.length > 1;

    return (
      <View style={styles.mainContainer}>
        <ReanimatedImage
          style={[{ width: '100%', height: IMG_HEADER_HEIGHT }, headerImageStyle]}
          source={{ uri: data.info.backgroundImage }}
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
              source={{ uri: data.info.coverImage }}
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
              <Text style={[globalStyles.text, styles.type]}>Film</Text>
            </Surface>
          </View>

          <View style={styles.infoContainer}>
            <Text style={[globalStyles.text, styles.title]}>
              {data.info.title.replace('Subtitle Indonesia', '').trim()}
            </Text>
            <View style={styles.genreContainer}>
              {data.info.genres.map(genre => (
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
              {Object.entries(data.info.additionalInfo).map(([key, value]) => {
                return (
                  <Surface elevation={3} key={key} style={styles.additionalInfoTextSurface}>
                    <Text style={[globalStyles.text, styles.additionalInfoText]}>
                      <Icon color={styles.additionalInfoText.color} name="info-circle" /> {key}:{' '}
                      {value}
                    </Text>
                  </Surface>
                );
              })}
              <Surface elevation={3} style={styles.additionalInfoTextSurface}>
                <Text style={[globalStyles.text, styles.additionalInfoText]}>
                  <Icon color={styles.additionalInfoText.color} name="calendar" />{' '}
                  {data.info.releaseDate}
                </Text>
              </Surface>
              {hasMultipleEpisodes && (
                <Surface elevation={3} style={styles.additionalInfoTextSurface}>
                  <Text style={[globalStyles.text, styles.additionalInfoText]}>
                    <Icon color={styles.additionalInfoText.color} name="list" />{' '}
                    {data.seasonData.flatMap(a => a.episodes).length} Episode
                  </Text>
                </Surface>
              )}
            </View>

            <View style={[styles.synopsisContainer]}>
              <Text style={[globalStyles.text, styles.synopsisTitle]}>Sinopsis</Text>
              <View style={styles.synopsisView}>
                <Text style={[globalStyles.text, styles.synopsisText]}>
                  {data.info.synopsis === ''
                    ? 'Tidak ada sinopsis yang tersedia.'
                    : data.info.synopsis}
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
                  title: data.info.title.replace('Subtitle Indonesia', ''),
                  link: props.route.params.link,
                  rating: 'Film',
                  releaseYear: data.info.releaseDate,
                  thumbnailUrl: data.info.coverImage,
                  genre: data.info.genres,
                  date: Date.now(),
                  isMovie: true,
                };
                controlWatchLater('add', watchLaterJson);
                ToastAndroid.show('Ditambahkan ke tonton nanti', ToastAndroid.SHORT);
              }}
              disabled={isInList}>
              {isInList ? 'Sudah Ditambahkan' : 'Tonton Nanti'}
            </Button>

            {/* {hasMultipleEpisodes && (
              <View style={styles.listChapterTextContainer}>
                <Text style={[globalStyles.text, styles.listChapterText]}>Daftar Episode</Text>
              </View>
            )} */}

            {/* <View style={styles.chapterButtonsContainer}>
              {hasMultipleEpisodes ? (
                <>
                  {lastWatched && lastWatched.episode && (
                    <Button
                      mode="elevated"
                      icon="play"
                      onPress={() => {
                        if (data.seasonData.length > 0) {
                          props.navigation.navigate('FromUrl', {
                            title: props.route.params.data.info.title,
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
                        title: props.route.params.data.info.title,
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
            </View> */}
          </View>
        </View>
      </View>
    );
  }, [
    data.seasonData,
    data.info.backgroundImage,
    data.info.coverImage,
    data.info.title,
    data.info.genres,
    data.info.additionalInfo,
    data.info.releaseDate,
    data.info.synopsis,
    styles.mainContainer,
    styles.mainContent,
    styles.thumbnail,
    styles.type,
    styles.infoContainer,
    styles.title,
    styles.genreContainer,
    styles.secondaryInfoContainer,
    styles.additionalInfo,
    styles.additionalInfoTextSurface,
    styles.additionalInfoText,
    styles.synopsisContainer,
    styles.synopsisTitle,
    styles.synopsisView,
    styles.synopsisText,
    styles.genre,
    headerImageStyle,
    colorScheme,
    globalStyles.text,
    isInList,
    props.route.params.link,
  ]);

  return (
    <ReanimatedFlashList
      ref={scrollRef}
      data={data.seasonData}
      renderItem={({ item: s }) => {
        return (
          <View style={styles.seasonContainer}>
            <View style={styles.seasonHeader}>
              <View style={styles.seasonIndicator} />
              <Text style={[globalStyles.text, styles.seasonText]}>{s.season}</Text>
            </View>
            <RenderEpisodeList
              globalStyles={globalStyles}
              colorScheme={colorScheme}
              props={props}
              s={s}
              styles={styles}
              lastWatched={lastWatched}
            />
          </View>
        );
      }}
      keyExtractor={item => item.season}
      contentContainerStyle={{
        backgroundColor: styles.mainContainer.backgroundColor,
        paddingLeft: insets.left,
        paddingRight: insets.right,
        paddingBottom: insets.bottom + 20,
      }}
      ListHeaderComponentStyle={[styles.mainContainer, { marginBottom: 12 }]}
      ListHeaderComponent={ListHeaderComponent}
      extraData={colorScheme}
      // estimatedItemSize={60}
      showsVerticalScrollIndicator={false}
    />
  );
}

function RenderEpisodeList({
  props,
  s,
  styles,
  lastWatched,
  globalStyles,
  colorScheme,
}: {
  props: Props;
  s: FilmSeason;
  styles: ReturnType<typeof useStyles>;
  lastWatched: HistoryJSON | undefined;
  globalStyles: ReturnType<typeof useGlobalStyles>;
  colorScheme: ColorSchemeName;
}) {
  const { getMappingKey } = useMappingHelper();
  return (
    <View style={styles.episodeListContainer}>
      {s.episodes.map((item, index) => {
        const isLastWatched =
          lastWatched && lastWatched.episode && item.episodeTitle.includes(lastWatched?.episode);
        return (
          <TouchableOpacity
            key={getMappingKey(item.episodeTitle, index)}
            style={[styles.episodeButton, isLastWatched && styles.lastWatchedButton]}
            onPress={() => {
              props.navigation.navigate('FromUrl', {
                title: props.route.params.data.info.title,
                link: item.episodeUrl,
                historyData: isLastWatched
                  ? {
                      lastDuration: lastWatched.lastDuration ?? 0,
                      resolution: lastWatched.resolution ?? '',
                    }
                  : undefined,
                type: 'film',
              });
            }}>
            <View style={styles.episodeMainContent}>
              <View style={styles.episodeNumberBox}>
                <Text style={styles.episodeNumberText}>{item.episodeNumber}</Text>
              </View>
              <View style={styles.episodeTitleWrapper}>
                <Text
                  numberOfLines={1}
                  style={[
                    globalStyles.text,
                    styles.episodeText,
                    isLastWatched ? styles.lastWatchedTextColor : undefined,
                  ]}>
                  {item.episodeTitle}
                </Text>
                {isLastWatched && <Text style={styles.watchingNowTag}>Terakhir Ditonton</Text>}
              </View>
              <Icon
                name={isLastWatched ? 'history' : 'play-circle'}
                size={20}
                color={
                  isLastWatched
                    ? styles.lastWatchedTextColor.color
                    : colorScheme === 'dark'
                      ? '#5ddfff'
                      : '#00608d'
                }
              />
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
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
          backgroundColor: colorScheme === 'dark' ? '#0c0c0c' : '#f5f5f5',
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
          paddingVertical: 15,
          borderBottomWidth: 1,
          borderBottomColor: colorScheme === 'dark' ? '#222' : '#ddd',
          marginBottom: 10,
        },
        listChapterText: {
          fontWeight: 'bold',
          fontSize: 20,
          color: globalStyles.text.color,
          textAlign: 'left',
          letterSpacing: 0.5,
        },
        chapterButtonsContainer: {
          gap: 10,
          marginBottom: 15,
        },
        seasonContainer: {
          marginBottom: 20,
          paddingHorizontal: 15,
        },
        seasonHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 12,
          paddingLeft: 5,
        },
        seasonIndicator: {
          width: 4,
          height: 20,
          backgroundColor: colorScheme === 'dark' ? '#5ddfff' : '#00608d',
          borderRadius: 2,
          marginRight: 10,
        },
        seasonText: {
          fontSize: 18,
          fontWeight: '800',
          textTransform: 'uppercase',
          letterSpacing: 1,
          color: globalStyles.text.color,
        },
        episodeListContainer: {
          gap: 10,
        },
        episodeButton: {
          backgroundColor: colorScheme === 'dark' ? '#1e1e1e' : '#ffffff',
          borderRadius: 12,
          padding: 12,
          elevation: 2,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
        },
        lastWatchedButton: {
          backgroundColor: theme.colors.primaryContainer,
          borderWidth: 1,
          borderColor: theme.colors.primary,
        },
        episodeMainContent: {
          flexDirection: 'row',
          alignItems: 'center',
        },
        episodeNumberBox: {
          height: 35,
          backgroundColor: colorScheme === 'dark' ? '#333' : '#f0f0f0',
          borderRadius: 8,
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: 12,
        },
        episodeNumberText: {
          fontSize: 14,
          fontWeight: 'bold',
          color: colorScheme === 'dark' ? '#fff' : '#333',
        },
        episodeTitleWrapper: {
          flex: 1,
          justifyContent: 'center',
        },
        episodeText: {
          fontSize: 15,
          fontWeight: '600',
          color: colorScheme === 'dark' ? '#ffffff' : '#333333',
        },
        watchingNowTag: {
          fontSize: 10,
          fontWeight: 'bold',
          color: theme.colors.primary,
          marginTop: 2,
        },
        lastWatchedTextColor: {
          color: theme.colors.onPrimaryContainer,
        },
        chapterDivider: {
          display: 'none',
        },
      }),
    [
      colorScheme,
      globalStyles.text.color,
      theme.colors.onPrimaryContainer,
      theme.colors.onSecondaryContainer,
      theme.colors.secondaryContainer,
      theme.colors.primary,
      theme.colors.primaryContainer,
    ],
  );
}

export default memo(FilmDetail);
