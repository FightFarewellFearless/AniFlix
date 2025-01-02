import React, { useContext, useEffect, useState } from 'react';
import {
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  ToastAndroid,
} from 'react-native';
import { TouchableOpacity } from 'react-native'; //rngh
import { FlashList } from '@shopify/flash-list';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useWindowDimensions } from 'react-native';
import { EpisodeBaruHomeContext, MovieListHomeContext } from '../../misc/context';
import { HomeStackNavigator } from '../../types/navigation';
import { ListAnimeComponent } from '../misc/ListAnimeComponent';
import AnimeAPI from '../../utils/AnimeAPI';
import { NewAnimeList } from '../../types/anime';
import { getLatestMovie, Movies } from '../../utils/animeMovie';

type Props = NativeStackScreenProps<HomeStackNavigator, 'SeeMore'>;

function SeeMore(props: Props) {
  const { paramsState: animeData, setParamsState: setAnimeData } =
    useContext(EpisodeBaruHomeContext);
  const { paramsState: movieData, setParamsState: setMovieData } =
    useContext(MovieListHomeContext);
  const [isLoading, setIsLoading] = useState(false);
  const page = props.route.params.type === 'AnimeList' ? (animeData?.newAnime.length ?? 0) / 25 : (movieData?.length ?? 0) / 20;
  const dimensions = useWindowDimensions();
  const columnWidth = dimensions.width * 120/200 / 1.9;
  const numColumns = Math.floor(dimensions.width / columnWidth);

  const LIST_HEIGHT = dimensions.height * 120/200 / 2.2;

  useEffect(() => {
    props.navigation.setOptions({
      headerTitle: props.route.params.type === 'MovieList' ? 'Movie terbaru' : 'Anime terbaru',
    });

    // props.navigation.getParent()?.setOptions({
    //   tabBarStyle: { display: 'none' },
    // });

    // return () => {
    //   props.navigation.getParent()?.setOptions({
    //     tabBarStyle: undefined,
    //   });
    // }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <FlashList
        data={
          (props.route.params.type === 'MovieList' ? movieData : animeData?.newAnime) as (NewAnimeList | Movies)[]
        }
        // TEMP: temporary fix for Fabric react-native-screens
        // contentContainerStyle={{ paddingBottom: (global as any).nativeFabricUIManager !== undefined ? 49 : undefined }}
        extraData={styles}
        keyExtractor={item => item.title}
        renderItem={({ item }) =>
          props.route.params.type === 'MovieList' ? (
            <ListAnimeComponent
              isMovie={true}
              newAnimeData={item as Movies}
              navigationProp={props.navigation}
            />
          ) : (
            <ListAnimeComponent
              isMovie={false}
              newAnimeData={item as NewAnimeList}
              navigationProp={props.navigation}
            />
          )
        }
        numColumns={numColumns}
        estimatedItemSize={LIST_HEIGHT}
        ListFooterComponent={
          <>
            {isLoading && <ActivityIndicator />}

            <TouchableOpacity
              style={styles.LihatLebih}
              onPress={async () => {
                if (isLoading) {
                  return;
                }
                setIsLoading(true);
                try {
                  if(props.route.params.type === 'MovieList') {
                    const newdata = await getLatestMovie(undefined, page + 1);
                    if("isError" in newdata) {
                      ToastAndroid.show("Error", ToastAndroid.SHORT);
                      return;
                    }
                    setMovieData?.(prev => ([ ...prev, ...newdata ]));
                    return;
                  }
                  const newdata = await AnimeAPI.newAnime(
                    page + 1,
                  );
                  setAnimeData?.(prev => ({
                    ...prev,
                    newAnime: [
                      ...prev.newAnime,
                      ...newdata,
                    ],
                  }));
                } finally {
                  setIsLoading(false);
                }
              }} disabled={isLoading}>
              <Text style={{ color: "#fafafa" }}>Lihat lebih banyak</Text>
            </TouchableOpacity>
          </>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  LihatLebih: {
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

export default SeeMore;
