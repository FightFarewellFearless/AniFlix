import Icon from '@react-native-vector-icons/fontawesome';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import tr from 'googletrans';
import { memo, useCallback, useMemo, useState } from 'react';
import {
  ColorSchemeName,
  StyleSheet,
  Text,
  ToastAndroid,
  TouchableOpacity,
  View,
  useColorScheme,
  useWindowDimensions,
} from 'react-native';
import { ActivityIndicator, Button, Surface, useTheme } from 'react-native-paper';
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

import { Dropdown } from '@pirles/react-native-element-dropdown';
import { FlashList, FlashListRef } from '@shopify/flash-list';
import { RecyclerViewProps } from '@shopify/flash-list/dist/recyclerview/RecyclerViewProps';
import { LinearGradient } from 'expo-linear-gradient';
import moment from 'moment';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HistoryItemKey } from '../../types/databaseTarget';
import { HistoryJSON } from '../../types/historyJSON';
import { DatabaseManager, useModifiedKeyValueIfFocused } from '../../utils/DatabaseManager';
import DialogManager from '../../utils/dialogManager';
import {
  FilmDetail_Stream,
  FilmDetails_Detail,
  FilmEpisode,
  getFilmSeasonDetails,
} from '../../utils/scrapers/film';
import { setFilmStreamHistory } from '../../utils/setFilmStreamHistory';
import ImageLoading from '../misc/ImageLoading';

type RecyclerViewType = (
  props: RecyclerViewProps<FilmEpisode> & {
    ref?: React.Ref<FlashListRef<FilmEpisode>>;
  },
) => React.JSX.Element;
const ReanimatedFlashList = Reanimated.createAnimatedComponent<RecyclerViewType>(FlashList);

type Props = NativeStackScreenProps<RootStackNavigator, 'FilmDetail'>;

const IMG_HEADER_HEIGHT = 250;

function useCompatibleData(rawData: FilmDetails_Detail | FilmDetail_Stream) {
  return useMemo(() => {
    return 'info' in rawData
      ? rawData
      : {
          info: {
            ...rawData,
            additionalInfo: {
              Rating: rawData.rating,
              ['Resolusi']: rawData.variants?.map(a => a.name).join(', '),
            },
          },
          ...rawData,
        };
  }, [rawData]);
}

function isEpisode(data: FilmDetails_Detail | FilmDetail_Stream): data is FilmDetails_Detail {
  return 'defaultSeason' in data;
}

function FilmDetail(props: Props) {
  const styles = useStyles();
  const globalStyles = useGlobalStyles();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const theme = useTheme();

  const data = useCompatibleData(props.route.params.data);

  const watchLaterListsJson = useModifiedKeyValueIfFocused(
    'watchLater',
    state => JSON.parse(state) as watchLaterJSON[],
  );
  const isInList = watchLaterListsJson.some(
    item => item.title === data.info.title.split(': Season')[0] && item.isMovie,
  );

  const historyListsJson = useModifiedKeyValueIfFocused(
    'historyKeyCollectionsOrder',
    state => JSON.parse(state) as HistoryItemKey[],
  );
  const historyTitle = data.info.title.split(': Season')[0].trim();
  const lastWatched = useMemo(() => {
    const isLastWatched = historyListsJson.find(
      z => z === `historyItem:${historyTitle}:false:true`,
    );
    if (isLastWatched) {
      return JSON.parse(DatabaseManager.getSync(isLastWatched)!) as HistoryJSON;
    } else return undefined;
  }, [historyListsJson, historyTitle]);

  const lastWatchedEpisodeData = useMemo(() => {
    if (!lastWatched) return undefined;
    if (!isEpisode(data)) {
      return {
        episodeNumber: lastWatched.episode,
        episodeTitle: '',
        episodeUrl: lastWatched.link,
      };
    }
    if (!lastWatched.episode) return undefined;

    return {
      episodeNumber: lastWatched.episode,
      episodeTitle: '',
      episodeUrl: lastWatched.link,
    };
  }, [lastWatched, data]);

  const scrollRef = useAnimatedRef<FlashListRef<FilmEpisode>>();
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

  const [translatedSynopsis, setTranslatedSynopsis] = useState<null | string>(null);
  const [isSynopsisTranslationPending, setIsSynopsisTranslationPending] = useState(false);
  const translateSynopsisToIndonesia = useCallback(async () => {
    setIsSynopsisTranslationPending(true);
    try {
      const translationResult = (await tr(data.info.synopsis, 'id')).text;
      setTranslatedSynopsis(translationResult);
    } catch {
      setTranslatedSynopsis(null);
      ToastAndroid.show('Translate gagal', ToastAndroid.SHORT);
    } finally {
      setIsSynopsisTranslationPending(false);
    }
  }, [data.info.synopsis]);

  const [selectedSeason, setSelectedSeason] = useState(
    isEpisode(data) ? data.defaultSeason.seasonNumber : 1,
  );
  const mappedSeasons = useMemo(() => {
    if (isEpisode(data)) {
      return data.seasons.map(s => ({
        label: `Season ${s}`,
        value: s,
      }));
    }
    return [];
  }, [data]);

  const [currentEpisodeList, setCurrentEpisodeList] = useState(
    isEpisode(data) ? data.defaultSeason.episodes : [],
  );

  const ListHeaderComponent = useMemo(() => {
    return (
      <View style={styles.mainContainer}>
        <ImageLoading
          style={[{ width: '100%', height: IMG_HEADER_HEIGHT }, headerImageStyle]}
          source={{ uri: data.info.backgroundImage }}
          resizeMode="cover"
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
            <ImageLoading
              source={{
                uri: 'coverImage' in data.info ? data.info.coverImage : data.info.thumbnailUrl,
              }}
              style={styles.thumbnail}
              resizeMode="contain"
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
              <Text style={[globalStyles.text, styles.type]}>
                {data.type === 'stream' ? 'Film' : 'Film/TV/Season'}
              </Text>
            </Surface>
          </View>

          <View style={styles.infoContainer}>
            <Text style={[globalStyles.text, styles.title]}>{data.info.title.trim()}</Text>
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
                  <Surface elevation={2} key={key} style={styles.additionalInfoTextSurface}>
                    <Text style={[globalStyles.text, styles.additionalInfoText]}>
                      <Icon color={styles.additionalInfoText.color} name="info-circle" /> {key}:{' '}
                      {value}
                    </Text>
                  </Surface>
                );
              })}
              <Surface elevation={2} style={styles.additionalInfoTextSurface}>
                <Text style={[globalStyles.text, styles.additionalInfoText]}>
                  <Icon color={styles.additionalInfoText.color} name="calendar" />{' '}
                  {data.info.releaseDate}
                </Text>
              </Surface>
              {!isEpisode(data) && data.subtitleLink === undefined && (
                <Surface
                  elevation={2}
                  style={[
                    styles.additionalInfoTextSurface,
                    { backgroundColor: theme.colors.errorContainer },
                  ]}>
                  <Text style={[globalStyles.text, styles.additionalInfoText]}>
                    <Icon color={styles.additionalInfoText.color} name="info-circle" /> Subtitle
                    tidak tersedia untuk film ini!
                  </Text>
                </Surface>
              )}
            </View>

            <View style={[styles.synopsisContainer]}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                }}>
                <Text style={[globalStyles.text, styles.synopsisTitle]}>Sinopsis</Text>
                {!(isSynopsisTranslationPending || translatedSynopsis !== null) && (
                  <Button
                    icon="google-translate"
                    mode="outlined"
                    onPress={translateSynopsisToIndonesia}>
                    Terjemahkan ke Bahasa Indonesia
                  </Button>
                )}
                {isSynopsisTranslationPending && <ActivityIndicator />}
              </View>
              <View style={styles.synopsisView}>
                <Text style={[globalStyles.text, styles.synopsisText]}>
                  {data.info.synopsis === ''
                    ? 'Tidak ada sinopsis yang tersedia.'
                    : (translatedSynopsis ?? data.info.synopsis)}
                </Text>
              </View>
            </View>

            {lastWatchedEpisodeData && lastWatched && (
              <Button
                icon="play-circle"
                mode="contained"
                buttonColor={theme.colors.primary}
                textColor={theme.colors.onPrimary}
                onPress={() => {
                  if (!isEpisode(data)) {
                    setFilmStreamHistory(props.route.params.link, data, {
                      lastDuration: lastWatched.lastDuration ?? 0,
                      resolution: lastWatched.resolution ?? '',
                    });
                    props.navigation.navigate('Video_Film', {
                      data,
                      link: lastWatched.link,
                      historyData: {
                        lastDuration: lastWatched.lastDuration ?? 0,
                        resolution: lastWatched.resolution ?? '',
                      },
                    });
                    return;
                  }
                  props.navigation.navigate('FromUrl', {
                    title: data.info.title,
                    link: lastWatchedEpisodeData.episodeUrl,
                    historyData: {
                      lastDuration: lastWatched.lastDuration ?? 0,
                      resolution: lastWatched.resolution ?? '',
                    },
                    type: 'film',
                  });
                }}
                style={{ borderColor: theme.colors.primary }}>
                Lanjutkan:{' '}
                {isEpisode(data)
                  ? lastWatchedEpisodeData.episodeNumber
                  : moment.utc((lastWatched.lastDuration ?? 0) * 1000).format('HH:mm:ss')}
              </Button>
            )}

            <Button
              icon="playlist-plus"
              buttonColor={styles.additionalInfoTextSurface.backgroundColor}
              textColor={styles.additionalInfoText.color}
              mode="outlined"
              onPress={() => {
                const watchLaterJson: watchLaterJSON = {
                  title: data.info.title.trim(),
                  link: props.route.params.link,
                  rating: 'Film',
                  releaseYear: data.info.releaseDate,
                  thumbnailUrl:
                    'coverImage' in data.info ? data.info.coverImage : data.info.thumbnailUrl,
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
          </View>
          {isEpisode(data) && (
            <View style={styles.seasonContainer}>
              <View style={styles.seasonHeader}>
                <View style={styles.seasonIndicator} />
                <Dropdown
                  data={mappedSeasons}
                  value={selectedSeason}
                  placeholder="Pilih Season"
                  valueField="value"
                  labelField="label"
                  onChange={item => {
                    setSelectedSeason(item.value);
                    getFilmSeasonDetails(props.route.params.link + '/season/' + item.value).then(
                      a => setCurrentEpisodeList(a.episodes),
                    );
                  }}
                  style={styles.dropdownStyle}
                  containerStyle={styles.dropdownContainerStyle}
                  itemTextStyle={styles.dropdownItemTextStyle}
                  itemContainerStyle={styles.dropdownItemContainerStyle}
                  activeColor={theme.colors.secondaryContainer}
                  selectedTextStyle={styles.dropdownSelectedTextStyle}
                  placeholderStyle={styles.dropdownPlaceholderStyle}
                  iconStyle={styles.dropdownIconStyle}
                  autoScroll
                  dropdownPosition={currentEpisodeList.length < 5 ? 'top' : 'auto'}
                />
              </View>
            </View>
          )}
        </View>
      </View>
    );
  }, [
    styles,
    data,
    headerImageStyle,
    theme,
    colorScheme,
    globalStyles.text,
    isSynopsisTranslationPending,
    translatedSynopsis,
    translateSynopsisToIndonesia,
    lastWatchedEpisodeData,
    lastWatched,
    isInList,
    mappedSeasons,
    selectedSeason,
    currentEpisodeList.length,
    props.navigation,
    props.route.params.link,
  ]);

  const episodeList = useMemo(() => {
    if (!isEpisode(data))
      return [
        {
          type: 'episode',
          episodeNumber: '',
          episodeTitle: '',
          episodeId: '',
          episodeUrl: props.route.params.link,
          episodeImage: 'coverImage' in data.info ? data.info.coverImage : data.info.thumbnailUrl,
          releaseDate: data.info.releaseDate,
        } as FilmEpisode,
      ];
    return currentEpisodeList;
  }, [data, props.route.params.link, currentEpisodeList]);

  const handlePlayNow = useCallback(() => {
    if (isEpisode(data)) return;
    let historyData: { lastDuration: number; resolution: string } | undefined;
    const startFilm = () => {
      setFilmStreamHistory(props.route.params.link, data, historyData);
      props.navigation.navigate('Video_Film', {
        data,
        link: props.route.params.link,
        historyData,
      });
    };
    if (lastWatched) {
      DialogManager.alert(
        'Lanjutkan durasi?',
        'Kamu sudah menonton film ini sebelumnya. Apakah kamu ingin melanjutkan dari durasi terakhir yang kamu tonton?',
        [
          {
            text: 'Mulai dari awal',
            onPress: () => {
              historyData = undefined;
              startFilm();
            },
          },
          {
            text: 'Lanjutkan',
            onPress: () => {
              historyData = {
                lastDuration: lastWatched?.lastDuration ?? 0,
                resolution: lastWatched?.resolution ?? '',
              };
              startFilm();
            },
          },
        ],
      );
      return;
    }
    startFilm();
  }, [data, lastWatched, props.navigation, props.route.params.link]);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="height">
      <ReanimatedFlashList
        ref={scrollRef}
        data={episodeList}
        renderItem={({ item: s }) => {
          return (
            <View style={styles.episodeListContainer}>
              {!isEpisode(data) ? (
                <Button
                  icon="movie-open-play"
                  buttonColor={styles.additionalInfoTextSurface.backgroundColor}
                  textColor={styles.additionalInfoText.color}
                  mode="elevated"
                  style={{ flex: 1 }}
                  onPress={handlePlayNow}>
                  Tonton Sekarang
                </Button>
              ) : (
                <RenderEpisodeList
                  globalStyles={globalStyles}
                  colorScheme={colorScheme}
                  props={props}
                  item={s}
                  styles={styles}
                  lastWatched={lastWatched}
                />
              )}
            </View>
          );
        }}
        contentContainerStyle={{
          backgroundColor: styles.mainContainer.backgroundColor,
          paddingLeft: insets.left,
          paddingRight: insets.right,
          paddingBottom: insets.bottom + 20,
        }}
        ListHeaderComponentStyle={[styles.mainContainer, { marginBottom: 12 }]}
        ListHeaderComponent={ListHeaderComponent}
        extraData={colorScheme}
        showsVerticalScrollIndicator={false}
      />
    </KeyboardAvoidingView>
  );
}

function RenderEpisodeList({
  props,
  item,
  styles,
  lastWatched,
  globalStyles,
  colorScheme,
}: {
  props: Props;
  item: FilmEpisode;
  styles: ReturnType<typeof useStyles>;
  lastWatched: HistoryJSON | undefined;
  globalStyles: ReturnType<typeof useGlobalStyles>;
  colorScheme: ColorSchemeName;
}) {
  const rawData = props.route.params.data;
  const data = useCompatibleData(rawData);
  const episodeLastWatchedModified =
    lastWatched &&
    lastWatched.episode &&
    lastWatched.episode.replace('Season ', '').trim().replace('Episode', '-').trim();
  const isEpisodeLastWatched =
    (lastWatched &&
      episodeLastWatchedModified &&
      item.episodeNumber === episodeLastWatchedModified) ||
    (!isEpisode(data) && lastWatched);
  return (
    <TouchableOpacity
      style={[styles.episodeButton, isEpisodeLastWatched && styles.lastWatchedButton]}
      onPress={() => {
        if (!isEpisode(data)) {
          setFilmStreamHistory(props.route.params.link, data, {
            lastDuration: lastWatched?.lastDuration ?? 0,
            resolution: lastWatched?.resolution ?? '',
          });
          props.navigation.navigate('Video_Film', {
            data,
            link: item.episodeUrl,
            historyData: {
              lastDuration: lastWatched?.lastDuration ?? 0,
              resolution: lastWatched?.resolution ?? '',
            },
          });
          return;
        }
        props.navigation.navigate('FromUrl', {
          title: data.info.title,
          link: item.episodeUrl,
          historyData: isEpisodeLastWatched
            ? {
                lastDuration: lastWatched.lastDuration ?? 0,
                resolution: lastWatched.resolution ?? '',
              }
            : !isEpisode(data)
              ? {
                  lastDuration: lastWatched?.lastDuration ?? 0,
                  resolution: lastWatched?.resolution ?? '',
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
              isEpisodeLastWatched ? styles.lastWatchedTextColor : undefined,
            ]}>
            {item.episodeTitle}
          </Text>
          {isEpisodeLastWatched && <Text style={styles.watchingNowTag}>Terakhir Ditonton</Text>}
        </View>
        <Icon
          name={isEpisodeLastWatched ? 'history' : 'play-circle'}
          size={20}
          color={
            isEpisodeLastWatched
              ? styles.lastWatchedTextColor.color
              : colorScheme === 'dark'
                ? '#5ddfff'
                : '#00608d'
          }
        />
      </View>
    </TouchableOpacity>
  );
}

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
          width: dimensions.width * 0.3,
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
          gap: 8,
          justifyContent: 'flex-start',
          alignItems: 'center',
          paddingVertical: 8,
        },
        additionalInfoTextSurface: {
          borderRadius: 12,
          paddingHorizontal: 12,
          paddingVertical: 6,
          backgroundColor: theme.colors.secondaryContainer,
        },
        additionalInfoText: {
          color: theme.colors.onSecondaryContainer,
          fontWeight: '600',
          fontSize: 12,
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
        // --- DROPDOWN STYLES ---
        dropdownStyle: {
          backgroundColor: theme.colors.elevation.level2,
          paddingHorizontal: 16,
          paddingVertical: 10,
          minWidth: dimensions.width * 0.4,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: theme.colors.outlineVariant || (colorScheme === 'dark' ? '#444' : '#E0E0E0'),
        },
        dropdownContainerStyle: {
          borderRadius: 12,
          backgroundColor: theme.colors.elevation.level3,
          borderWidth: 1,
          borderColor: theme.colors.outlineVariant || (colorScheme === 'dark' ? '#444' : '#E0E0E0'),
          overflow: 'hidden',
          elevation: 6,
        },
        dropdownItemTextStyle: {
          color: theme.colors.onSurface,
          fontSize: 15,
          fontWeight: '500',
        },
        dropdownItemContainerStyle: {
          // paddingVertical: 10,
          paddingHorizontal: 12,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor:
            theme.colors.outlineVariant || (colorScheme === 'dark' ? '#333' : '#E0E0E0'),
        },
        dropdownSelectedTextStyle: {
          color: theme.colors.primary,
          fontSize: 15,
          fontWeight: 'bold',
        },
        dropdownPlaceholderStyle: {
          color: globalStyles.text.color,
          fontSize: 15,
          opacity: 0.7,
        },
        dropdownIconStyle: {
          tintColor: theme.colors.onSurface,
          width: 24,
          height: 24,
        },
        seasonContainer: {
          width: '100%',
        },
        seasonHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 12,
        },
        seasonIndicator: {
          width: 4,
          height: 20,
          backgroundColor: colorScheme === 'dark' ? '#5ddfff' : '#00608d',
          borderRadius: 2,
          marginRight: 10,
        },
        episodeListContainer: {
          margin: 5,
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
          backgroundColor: theme.colors.secondaryContainer,
          borderWidth: 1,
          borderColor: theme.colors.secondary,
        },
        episodeMainContent: {
          flexDirection: 'row',
          alignItems: 'center',
        },
        episodeNumberBox: {
          height: 35,
          minWidth: 40,
          paddingHorizontal: 8,
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
      }),
    [colorScheme, dimensions.width, globalStyles.text.color, theme.colors],
  );
}

export default memo(FilmDetail);
