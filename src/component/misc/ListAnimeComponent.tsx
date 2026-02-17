import Icon from '@react-native-vector-icons/fontawesome';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { StackActions } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMemo } from 'react';
import { StyleSheet, Text, useColorScheme, useWindowDimensions, View } from 'react-native';
import { useTheme } from 'react-native-paper';
import useGlobalStyles from '../../assets/style';
import { NewAnimeList } from '../../types/anime';
import { HomeNavigator, RootStackNavigator } from '../../types/navigation';
import { Movies } from '../../utils/scrapers/animeMovie';
import { FilmHomePage } from '../../utils/scrapers/film';
import { MIN_IMAGE_HEIGHT, MIN_IMAGE_WIDTH } from '../Home/AnimeList';
import ImageLoading from './ImageLoading';
import { TouchableOpacity } from './TouchableOpacityRNGH';

export function ListAnimeComponent(
  props: (
    | {
        newAnimeData: NewAnimeList;
        type?: 'anime';
      }
    | { newAnimeData: Movies; type: 'movie' }
    | { newAnimeData: LatestKomikuRelease; type: 'comics' }
    | { newAnimeData: FilmHomePage[number]; type: 'film' }
  ) & {
    navigationProp:
      | NativeStackNavigationProp<HomeNavigator, 'AnimeList', undefined>
      | NativeStackNavigationProp<RootStackNavigator, 'SeeMore', undefined>
      | BottomTabNavigationProp<HomeNavigator, 'AnimeList', undefined>
      | BottomTabNavigationProp<RootStackNavigator, 'SeeMore', undefined>;
  } & { gap?: boolean; fromSeeMore?: boolean },
) {
  const styles = useStyles();
  const z = props.newAnimeData;
  const navigation = props.navigationProp;

  const episodeOrChapter = useMemo(() => {
    if (props.type === 'movie') {
      return 'Movie';
    } else if (props.type === 'comics') {
      return props.newAnimeData.latestChapter;
    } else if (props.type === 'film') {
      return 'Film';
    } else {
      return props.newAnimeData.episode;
    }
  }, [props.newAnimeData, props.type]);
  const releaseDay = useMemo(() => {
    if (props.type === 'movie') {
      return 'Sub Indo';
    } else if (props.type === 'comics') {
      return (
        props.newAnimeData.additionalInfo +
        ' | ' +
        props.newAnimeData.type +
        ' | ' +
        props.newAnimeData.concept
      );
    } else {
      return props.type === 'film' ? props.newAnimeData.year : props.newAnimeData.releaseDay;
    }
  }, [props.newAnimeData, props.type]);

  return (
    <TouchableOpacity
      style={[
        {
          margin: props.gap ? 3 : 0,
          minWidth:
            props.type === 'comics' ? styles.listBackground.height : styles.listBackground.width,
          gap: 6,
        },
        styles.listContainer,
      ]}
      onPress={() => {
        navigation.dispatch(
          StackActions.push('FromUrl', {
            title: props.newAnimeData.title,
            link:
              props.type === 'movie'
                ? props.newAnimeData.url
                : props.type === 'comics'
                  ? props.newAnimeData.detailUrl
                  : props.type === 'film'
                    ? props.newAnimeData.url
                    : props.newAnimeData.streamingLink,
            type: props.type,
          }),
        );
      }}>
      <ImageLoading
        contentFit="fill"
        key={z.thumbnailUrl}
        source={{ uri: z.thumbnailUrl }}
        recyclingKey={z.thumbnailUrl}
        style={[
          styles.listBackground,
          {
            width:
              props.type === 'comics' ? styles.listBackground.height : styles.listBackground.width,
            height:
              props.type === 'comics' ? styles.listBackground.width : styles.listBackground.height,
          },
        ]}>
        <View style={styles.animeEpisodeContainer}>
          <Text style={styles.animeEpisode}>{episodeOrChapter}</Text>
        </View>
      </ImageLoading>
      <View
        style={[
          styles.animeTitleContainer,
          {
            maxWidth: props.fromSeeMore
              ? undefined
              : props.type === 'comics'
                ? styles.listBackground.height
                : styles.listBackground.width,
          },
        ]}>
        <Text numberOfLines={1} style={styles.animeTitle}>
          {z.title}
        </Text>
      </View>
      <View
        style={[
          styles.infoContainer,
          {
            maxWidth: props.fromSeeMore
              ? undefined
              : props.type === 'comics'
                ? styles.listBackground.height
                : styles.listBackground.width,
          },
        ]}>
        <View style={styles.animeReleaseDayContainer}>
          <Text style={styles.animeReleaseDay}>
            <Icon
              color={styles.animeReleaseDay.color}
              name={
                props.type === 'movie' ? 'check' : props.type === 'comics' ? 'book' : 'calendar'
              }
            />{' '}
            {releaseDay}
          </Text>
        </View>
      </View>
      {props.type === 'comics' && (
        <Text
          style={[
            styles.animeDescription,
            {
              maxWidth: props.fromSeeMore
                ? undefined
                : props.type === 'comics'
                  ? styles.listBackground.height
                  : styles.listBackground.width,
            },
          ]}>
          {props.newAnimeData.shortDescription}
        </Text>
      )}
    </TouchableOpacity>
  );
}

function useStyles() {
  const dimensions = useWindowDimensions();
  const theme = useTheme();
  const globalStyles = useGlobalStyles();
  const colorScheme = useColorScheme();
  let LIST_BACKGROUND_HEIGHT = (dimensions.height * 120) / 200 / 2.5;
  let LIST_BACKGROUND_WIDTH = (dimensions.width * 120) / 200 / 2;
  LIST_BACKGROUND_HEIGHT = Math.max(LIST_BACKGROUND_HEIGHT, MIN_IMAGE_HEIGHT);
  LIST_BACKGROUND_WIDTH = Math.max(LIST_BACKGROUND_WIDTH, MIN_IMAGE_WIDTH);
  return useMemo(
    () =>
      StyleSheet.create({
        listContainer: {
          overflow: 'hidden',
          elevation: 4,
          padding: 8,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: theme.colors.onBackground,
          backgroundColor: colorScheme === 'dark' ? '#2e2e2e' : '#f3f3f3',
          borderRadius: 12,
        },
        listBackground: {
          overflow: 'hidden',
          width: LIST_BACKGROUND_WIDTH,
          height: LIST_BACKGROUND_HEIGHT,
          borderRadius: 7,
          alignSelf: 'center',
        },
        infoContainer: {
          flex: 1,
          flexDirection: 'row',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
        },
        animeTitleContainer: {
          justifyContent: 'flex-start',
          alignItems: 'center',
        },
        animeTitle: {
          fontSize: 13,
          textAlign: 'center',
          color: globalStyles.text.color,
          fontWeight: 'bold',
        },
        animeEpisodeContainer: {
          backgroundColor: '#000000b0',
          alignSelf: 'flex-end',
          padding: 5,
          borderRadius: 5,
        },
        animeEpisode: {
          fontSize: 11,
          color: 'white',
          fontWeight: 'bold',
        },
        animeReleaseDayContainer: {},
        animeReleaseDay: {
          fontSize: 12,
          color: theme.colors.tertiary,
          opacity: 0.8,
          fontWeight: 'bold',
        },
        animeDescription: {
          fontSize: 12,
          color: globalStyles.text.color,
          opacity: 0.8,
          fontWeight: 'bold',
        },
      }),
    [
      theme.colors.onBackground,
      theme.colors.tertiary,
      colorScheme,
      LIST_BACKGROUND_WIDTH,
      LIST_BACKGROUND_HEIGHT,
      globalStyles.text.color,
    ],
  );
}
