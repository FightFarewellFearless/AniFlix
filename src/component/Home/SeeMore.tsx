import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FlashList } from '@shopify/flash-list';
import React, { memo, useContext, useEffect, useState, useCallback } from 'react';
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
import { getLatestMovie, Movies } from '../../utils/scrapers/animeMovie';
import { getLatestKomikuReleases, LatestKomikuRelease } from '../../utils/scrapers/komiku';
import { ListAnimeComponent } from '../misc/ListAnimeComponent';
import { MIN_IMAGE_WIDTH, RenderScrollComponent } from './AnimeList';

type Props = NativeStackScreenProps<RootStackNavigator, 'SeeMore'>;
type ItemType = NewAnimeList | Movies | LatestKomikuRelease;

interface SeeMoreUIProps {
  data: ItemType[];
  type: 'AnimeList' | 'MovieList' | 'ComicsList';
  onLoadMore: () => Promise<void>;
  navigation: Props['navigation'];
}

const SeeMoreUI = memo(({ data, type, onLoadMore, navigation }: SeeMoreUIProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const dimensions = useWindowDimensions();
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();

  let columnWidth = (dimensions.width * 120) / 200 / 1.9;
  columnWidth = Math.max(columnWidth, MIN_IMAGE_WIDTH);
  const numColumns = type === 'ComicsList' ? 1 : Math.floor(dimensions.width / columnWidth);

  useEffect(() => {
    navigation.setOptions({
      headerTitle:
        type === 'MovieList'
          ? 'Movie terbaru'
          : type === 'ComicsList'
            ? 'Komik terbaru'
            : 'Anime terbaru',
    });
  }, [navigation, type]);

  const handlePressLoadMore = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      await onLoadMore();
    } catch (e) {
      ToastAndroid.show('Error loading more items', ToastAndroid.SHORT);
    } finally {
      setIsLoading(false);
    }
  };

  const renderItem = useCallback(
    ({ item }: { item: ItemType }) => {
      if (type === 'MovieList') {
        return (
          <ListAnimeComponent
            gap
            type="movie"
            newAnimeData={item as Movies}
            navigationProp={navigation}
          />
        );
      }
      if (type === 'ComicsList') {
        return (
          <ListAnimeComponent
            gap
            fromSeeMore
            type="comics"
            newAnimeData={item as LatestKomikuRelease}
            navigationProp={navigation}
          />
        );
      }
      return (
        <ListAnimeComponent
          gap
          type="anime"
          newAnimeData={item as NewAnimeList}
          navigationProp={navigation}
        />
      );
    },
    [type, navigation],
  );

  return (
    <View style={{ flex: 1 }}>
      <FlashList
        renderScrollComponent={RenderScrollComponent}
        contentContainerStyle={{
          paddingLeft: insets.left,
          paddingRight: insets.right,
          paddingBottom: insets.bottom,
        }}
        data={data}
        extraData={colorScheme}
        keyExtractor={item => item.title}
        renderItem={renderItem}
        numColumns={numColumns}
        ListFooterComponent={
          <>
            {isLoading && <ActivityIndicator style={{ marginTop: 10 }} />}
            <Button
              mode="contained-tonal"
              style={{ marginTop: 6 }}
              onPress={handlePressLoadMore}
              disabled={isLoading}>
              Lihat lebih banyak
            </Button>
          </>
        }
      />
    </View>
  );
});

const AnimeContainer = ({ navigation }: { navigation: Props['navigation'] }) => {
  const { paramsState, setParamsState } = useContext(EpisodeBaruHomeContext);
  const data = paramsState?.newAnime || [];

  const handleLoadMore = async () => {
    const page = (data.length ?? 0) / 25;
    const newData = await AnimeAPI.newAnime(page + 1);

    if (setParamsState) {
      setParamsState(prev => {
        const combined = [...prev.newAnime, ...newData];
        // Filter unique
        const unique = combined.filter(
          (item, index, self) => index === self.findIndex(a => a.title === item.title),
        );
        return { ...prev, newAnime: unique };
      });
    }
  };

  return (
    <SeeMoreUI data={data} type="AnimeList" onLoadMore={handleLoadMore} navigation={navigation} />
  );
};

const MovieContainer = ({ navigation }: { navigation: Props['navigation'] }) => {
  const { paramsState, setParamsState } = useContext(MovieListHomeContext);
  const data = paramsState || [];

  const handleLoadMore = async () => {
    const page = (data.length ?? 0) / 20;
    const newData = await getLatestMovie(undefined, page + 1);

    if ('isError' in newData) {
      throw new Error('API Error');
    }

    if (setParamsState) {
      setParamsState(prev => {
        const combined = [...prev, ...newData];
        return combined.filter(
          (item, index, self) => index === self.findIndex(a => a.title === item.title),
        );
      });
    }
  };

  return (
    <SeeMoreUI data={data} type="MovieList" onLoadMore={handleLoadMore} navigation={navigation} />
  );
};

const ComicsContainer = ({ navigation }: { navigation: Props['navigation'] }) => {
  const { paramsState, setParamsState } = useContext(ComicsListContext);
  const data = paramsState || [];

  const handleLoadMore = async () => {
    const page = (data.length ?? 0) / 10;
    const newData = await getLatestKomikuReleases(page + 1);

    if ('isError' in newData) {
      throw new Error('API Error');
    }

    if (setParamsState) {
      setParamsState(prev => {
        const combined = [...prev, ...newData];
        return combined.filter(
          (item, index, self) => index === self.findIndex(a => a.title === item.title),
        );
      });
    }
  };

  return (
    <SeeMoreUI data={data} type="ComicsList" onLoadMore={handleLoadMore} navigation={navigation} />
  );
};

function SeeMore(props: Props) {
  const { type } = props.route.params;
  switch (type) {
    case 'MovieList':
      return <MovieContainer navigation={props.navigation} />;
    case 'ComicsList':
      return <ComicsContainer navigation={props.navigation} />;
    case 'AnimeList':
    default:
      return <AnimeContainer navigation={props.navigation} />;
  }
}

export default memo(SeeMore);
