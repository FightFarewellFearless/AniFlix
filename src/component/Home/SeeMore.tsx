import { LegendList } from '@legendapp/list';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { memo, useContext, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  ToastAndroid,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { EpisodeBaruHomeContext, MovieListHomeContext } from '../../misc/context';
import { NewAnimeList } from '../../types/anime';
import { RootStackNavigator } from '../../types/navigation';
import AnimeAPI from '../../utils/AnimeAPI';
import { getLatestMovie, Movies } from '../../utils/animeMovie';
import { ListAnimeComponent } from '../misc/ListAnimeComponent';
import { MIN_IMAGE_WIDTH } from './AnimeList';

type Props = NativeStackScreenProps<RootStackNavigator, 'SeeMore'>;

function SeeMore(props: Props) {
  const { paramsState: animeData, setParamsState: setAnimeData } =
    useContext(EpisodeBaruHomeContext);
  const { paramsState: movieData, setParamsState: setMovieData } = useContext(MovieListHomeContext);
  const [isLoading, setIsLoading] = useState(false);
  const page =
    props.route.params.type === 'AnimeList'
      ? (animeData?.newAnime.length ?? 0) / 25
      : (movieData?.length ?? 0) / 20;
  const dimensions = useWindowDimensions();
  let columnWidth = (dimensions.width * 120) / 200 / 1.9;
  columnWidth = Math.max(columnWidth, MIN_IMAGE_WIDTH);
  const numColumns = Math.floor(dimensions.width / columnWidth);

  useEffect(() => {
    props.navigation.setOptions({
      headerTitle: props.route.params.type === 'MovieList' ? 'Movie terbaru' : 'Anime terbaru',
    });
  }, [props.navigation, props.route.params.type]);

  return (
    <View style={{ flex: 1 }}>
      <LegendList
        recycleItems
        drawDistance={250}
        data={
          (props.route.params.type === 'MovieList' ? movieData : animeData?.newAnime) as (
            | NewAnimeList
            | Movies
          )[]
        }
        extraData={styles}
        keyExtractor={item => item.title}
        renderItem={({ item }) =>
          props.route.params.type === 'MovieList' ? (
            <ListAnimeComponent
              type="movie"
              newAnimeData={item as Movies}
              navigationProp={props.navigation}
            />
          ) : (
            <ListAnimeComponent
              type="anime"
              newAnimeData={item as NewAnimeList}
              navigationProp={props.navigation}
            />
          )
        }
        numColumns={numColumns}
        ListFooterComponent={
          <>
            {isLoading && <ActivityIndicator />}

            <TouchableOpacity
              style={styles.seeMoreButton}
              onPress={async () => {
                if (isLoading) {
                  return;
                }
                setIsLoading(true);
                try {
                  if (props.route.params.type === 'MovieList') {
                    const newdata = await getLatestMovie(undefined, page + 1);
                    if ('isError' in newdata) {
                      ToastAndroid.show('Error', ToastAndroid.SHORT);
                      return;
                    }
                    setMovieData?.(prev => [...prev, ...newdata]);
                    return;
                  }
                  const newdata = await AnimeAPI.newAnime(page + 1);
                  setAnimeData?.(prev => ({
                    ...prev,
                    newAnime: [...prev.newAnime, ...newdata],
                  }));
                } finally {
                  setIsLoading(false);
                }
              }}
              disabled={isLoading}>
              <Text style={{ color: '#fafafa' }}>Lihat lebih banyak</Text>
            </TouchableOpacity>
          </>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  seeMoreButton: {
    backgroundColor: '#007bff', // Bootstrap primary button color
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    elevation: 2, // for Android - adds a drop shadow
    shadowColor: '#000', // for iOS - adds a drop shadow
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    shadowOpacity: 0.1,
    alignItems: 'center', // Center the text inside the button
    justifyContent: 'center', // Center the text vertically
  },
});

export default memo(SeeMore);
