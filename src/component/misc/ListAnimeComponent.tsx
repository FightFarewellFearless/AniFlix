import { NativeBottomTabNavigationProp } from '@bottom-tabs/react-navigation';
import { StackActions } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { NewAnimeList } from '../../types/anime';
import { HomeNavigator, RootStackNavigator } from '../../types/navigation';
import { Movies } from '../../utils/animeMovie';
import ImageLoading from '../ImageLoading';
import { MIN_IMAGE_HEIGHT, MIN_IMAGE_WIDTH } from '../Home/AnimeList';

export function ListAnimeComponent(
  props: (
    | {
        newAnimeData: NewAnimeList;
        isMovie?: false;
      }
    | { newAnimeData: Movies; isMovie: true }
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
  return (
    <TouchableOpacity
      onPress={() => {
        navigation.dispatch(
          StackActions.push('FromUrl', {
            link: props.isMovie ? props.newAnimeData.url : props.newAnimeData.streamingLink,
            isMovie: props.isMovie,
          }),
        );
      }}>
      <ImageLoading
        contentFit="fill"
        key={z.thumbnailUrl}
        source={{ uri: z.thumbnailUrl }}
        recyclingKey={z.thumbnailUrl}
        style={[styles.listBackground, { borderColor: 'orange' }]}>
        <View style={styles.animeTitleContainer}>
          <Text numberOfLines={2} style={styles.animeTitle}>
            {z.title}
          </Text>
        </View>

        <View style={styles.animeEpisodeContainer}>
          <Text style={styles.animeEpisode}>
            {props.isMovie ? 'Movie' : props.newAnimeData.episode}
          </Text>
        </View>
        <View style={styles.animeRatingContainer}>
          <Text style={styles.animeRating}>
            <Icon name={props.isMovie ? 'check' : 'calendar'} />{' '}
            {props.isMovie ? 'Sub Indo' : props.newAnimeData.releaseDay}
          </Text>
        </View>
      </ImageLoading>
    </TouchableOpacity>
  );
}

function useStyles() {
  const dimensions = useWindowDimensions();
  let LIST_BACKGROUND_HEIGHT = (dimensions.height * 120) / 200 / 2.2;
  let LIST_BACKGROUND_WIDTH = (dimensions.width * 120) / 200 / 1.95;
  LIST_BACKGROUND_HEIGHT = Math.max(LIST_BACKGROUND_HEIGHT, MIN_IMAGE_HEIGHT);
  LIST_BACKGROUND_WIDTH = Math.max(LIST_BACKGROUND_WIDTH, MIN_IMAGE_WIDTH);
  return useMemo(
    () =>
      StyleSheet.create({
        listBackground: {
          overflow: 'hidden',
          width: LIST_BACKGROUND_WIDTH,
          height: LIST_BACKGROUND_HEIGHT,
          borderWidth: 1,
          marginRight: 5,
          marginVertical: 5,
          flex: 2,
          borderRadius: 7,
        },
        animeTitleContainer: {
          justifyContent: 'flex-start',
          alignItems: 'center',
        },
        animeTitle: {
          fontSize: 11,
          color: 'black',
          backgroundColor: 'orange',
          opacity: 0.8,
          textAlign: 'center',
          fontWeight: 'bold',
        },
        animeEpisodeContainer: {
          position: 'absolute',
          left: 0,
          bottom: 0,
          flexDirection: 'row',
        },
        animeEpisode: {
          fontSize: 10,
          color: '#000000',
          backgroundColor: '#0099ff',
          opacity: 0.8,
          borderRadius: 2,
          padding: 1,
        },
        animeRatingContainer: {
          position: 'absolute',
          bottom: 0,
          right: 0,
        },
        animeRating: {
          fontSize: 10,
          color: 'black',
          backgroundColor: 'orange',
          opacity: 0.8,
          padding: 2,
          borderRadius: 3,
        },
      }),
    [LIST_BACKGROUND_HEIGHT, LIST_BACKGROUND_WIDTH],
  );
}
