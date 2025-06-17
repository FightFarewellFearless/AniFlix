import { NativeBottomTabNavigationProp } from '@bottom-tabs/react-navigation';
import { StackActions } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMemo } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  useWindowDimensions,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { NewAnimeList } from '../../types/anime';
import { HomeNavigator, RootStackNavigator } from '../../types/navigation';
import { Movies } from '../../utils/animeMovie';
import ImageLoading from '../ImageLoading';
import { MIN_IMAGE_HEIGHT, MIN_IMAGE_WIDTH } from '../Home/AnimeList';
import { LatestKomikuRelease } from '../../utils/komiku';
import useGlobalStyles from '../../assets/style';

export function ListAnimeComponent(
  props: (
    | {
        newAnimeData: NewAnimeList;
        type?: 'anime';
      }
    | { newAnimeData: Movies; type: 'movie' }
    | { newAnimeData: LatestKomikuRelease; type: 'comics' }
  ) & {
    navigationProp:
      | NativeStackNavigationProp<HomeNavigator, 'AnimeList', undefined>
      | NativeStackNavigationProp<RootStackNavigator, 'SeeMore', undefined>
      | NativeBottomTabNavigationProp<HomeNavigator, 'AnimeList', undefined>
      | NativeBottomTabNavigationProp<RootStackNavigator, 'SeeMore', undefined>;
  },
) {
  const styles = useStyles();
  const z = props.newAnimeData;
  const navigation = props.navigationProp;

  const episodeOrChapter = useMemo(() => {
    if (props.type === 'movie') {
      return 'Movie';
    } else if (props.type === 'comics') {
      return props.newAnimeData.latestChapter;
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
      return props.newAnimeData.releaseDay;
    }
  }, [props.newAnimeData, props.type]);

  return (
    <TouchableOpacity
      style={[
        {
          minWidth:
            props.type === 'comics' ? styles.listBackground.height : styles.listBackground.width,
          gap: 6,
        },
        styles.listContainer,
      ]}
      onPress={() => {
        navigation.dispatch(
          StackActions.push('FromUrl', {
            link:
              props.type === 'movie'
                ? props.newAnimeData.url
                : props.type === 'comics'
                  ? props.newAnimeData.detailUrl
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
            borderColor: 'orange',
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
            maxWidth:
              props.type === 'comics' ? styles.listBackground.height : styles.listBackground.width,
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
            maxWidth:
              props.type === 'comics' ? styles.listBackground.height : styles.listBackground.width,
          },
        ]}>
        <View style={styles.animeReleaseDayContainer}>
          <Text style={styles.animeReleaseDay}>
            <Icon
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
              maxWidth:
                props.type === 'comics'
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
          backgroundColor: colorScheme === 'dark' ? '#2e2e2e' : '#ececec',
          borderRadius: 12,
        },
        listBackground: {
          overflow: 'hidden',
          width: LIST_BACKGROUND_WIDTH,
          height: LIST_BACKGROUND_HEIGHT,
          borderWidth: 1,
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
          color: globalStyles.text.color,
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
    [LIST_BACKGROUND_HEIGHT, LIST_BACKGROUND_WIDTH, globalStyles.text.color, colorScheme],
  );
}
