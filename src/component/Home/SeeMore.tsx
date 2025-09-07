import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FlashList } from '@shopify/flash-list';
import React, { memo, useContext, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ToastAndroid,
  useColorScheme,
  useWindowDimensions,
  View,
} from 'react-native';
import { Button } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ComicsListContext,
  EpisodeBaruHomeContext,
  MovieListHomeContext,
} from '../../misc/context';
import { NewAnimeList } from '../../types/anime';
import { RootStackNavigator } from '../../types/navigation';
import AnimeAPI from '../../utils/AnimeAPI';
import { getLatestMovie, Movies } from '../../utils/animeMovie';
import { getLatestKomikuReleases, LatestKomikuRelease } from '../../utils/komiku';
import { ListAnimeComponent } from '../misc/ListAnimeComponent';
import { MIN_IMAGE_WIDTH, RenderScrollComponent } from './AnimeList';

type Props = NativeStackScreenProps<RootStackNavigator, 'SeeMore'>;

function SeeMore(props: Props) {
  // TODO: Optimize these context
  const { paramsState: animeData, setParamsState: setAnimeData } =
    useContext(EpisodeBaruHomeContext);
  const { paramsState: movieData, setParamsState: setMovieData } = useContext(MovieListHomeContext);
  const { paramsState: comicsData, setParamsState: setComicsData } = useContext(ComicsListContext);
  const [isLoading, setIsLoading] = useState(false);
  const page =
    props.route.params.type === 'AnimeList'
      ? (animeData?.newAnime.length ?? 0) / 25
      : props.route.params.type === 'ComicsList'
        ? (comicsData?.length ?? 0) / 10
        : (movieData?.length ?? 0) / 20;
  const dimensions = useWindowDimensions();
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();

  let columnWidth = (dimensions.width * 120) / 200 / 1.9;
  columnWidth = Math.max(columnWidth, MIN_IMAGE_WIDTH);
  const numColumns =
    props.route.params.type === 'ComicsList' ? 1 : Math.floor(dimensions.width / columnWidth);

  useEffect(() => {
    props.navigation.setOptions({
      headerTitle:
        props.route.params.type === 'MovieList'
          ? 'Movie terbaru'
          : props.route.params.type === 'ComicsList'
            ? 'Komik terbaru'
            : 'Anime terbaru',
    });
  }, [props.navigation, props.route.params.type]);

  return (
    <View style={{ flex: 1 }}>
      <FlashList
        renderScrollComponent={RenderScrollComponent}
        // estimatedItemSize={270}
        // maintainVisibleContentPosition={false}
        // recycleItems
        contentContainerStyle={{
          paddingLeft: insets.left,
          paddingRight: insets.right,
          paddingBottom: insets.bottom,
        }}
        data={
          (props.route.params.type === 'MovieList'
            ? movieData
            : props.route.params.type === 'ComicsList'
              ? comicsData
              : animeData?.newAnime) as (NewAnimeList | Movies | LatestKomikuRelease)[]
        }
        extraData={colorScheme}
        keyExtractor={item => item.title}
        renderItem={({ item }) =>
          props.route.params.type === 'MovieList' ? (
            <ListAnimeComponent
              gap
              type="movie"
              newAnimeData={item as Movies}
              navigationProp={props.navigation}
            />
          ) : props.route.params.type === 'ComicsList' ? (
            <ListAnimeComponent
              gap
              fromSeeMore
              type="comics"
              newAnimeData={item as LatestKomikuRelease}
              navigationProp={props.navigation}
            />
          ) : (
            <ListAnimeComponent
              gap
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

            <Button
              mode="contained-tonal"
              style={{ marginTop: 6 }}
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
                    setMovieData?.(prev =>
                      prev.filter(
                        (item, index, self) =>
                          index === self.findIndex(a => a.title === item.title),
                      ),
                    );
                    return;
                  }
                  if (props.route.params.type === 'ComicsList') {
                    const newdata = await getLatestKomikuReleases(page + 1);
                    if ('isError' in newdata) {
                      ToastAndroid.show('Error', ToastAndroid.SHORT);
                      return;
                    }
                    setComicsData?.(prev => [...prev, ...newdata]);
                    setComicsData?.(prev =>
                      prev.filter(
                        (item, index, self) =>
                          index === self.findIndex(a => a.title === item.title),
                      ),
                    );
                    return;
                  }
                  const newdata = await AnimeAPI.newAnime(page + 1);
                  setAnimeData?.(prev => ({
                    ...prev,
                    newAnime: [...prev.newAnime, ...newdata],
                  }));
                  setAnimeData?.(prev => ({
                    ...prev,
                    newAnime: prev.newAnime.filter(
                      (item, index, self) => index === self.findIndex(a => a.title === item.title),
                    ),
                  }));
                } finally {
                  setIsLoading(false);
                }
              }}
              disabled={isLoading}>
              Lihat lebih banyak
            </Button>
          </>
        }
      />
    </View>
  );
}

export default memo(SeeMore);
