import React, { useContext, useEffect, useState } from 'react';
import {
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useWindowDimensions } from 'react-native';
import { HomeContext } from '../../misc/context';
import { HomeStackNavigator } from '../../types/navigation';
import { AnimeList, MovieList } from './AnimeList';
import AnimeAPI from '../../utils/AnimeAPI';
import { MovieList as MovieListType, NewAnimeList } from '../../types/anime';
import globalStyles from '../../assets/style';

type Props = NativeStackScreenProps<HomeStackNavigator, 'SeeMore'>;

function SeeMore(props: Props) {
  const type = props.route.params.type;
  const { paramsState: data, setParamsState: setData } =
    useContext(HomeContext);
  const [isLoading, setIsLoading] = useState(false);
  const objectInDataBaseOnType = type === 'AnimeList' ? 'newAnime' : 'movie';
  const page = (data?.[objectInDataBaseOnType].length ?? 0) / 12;
  const windowWidth = useWindowDimensions().width;
  const columnWidth = 120;
  const numColumns = Math.floor(windowWidth / columnWidth);

  useEffect(() => {
    props.navigation.setOptions({
      headerTitle:
        props.route.params.type === 'AnimeList'
          ? 'Anime terbaru'
          : 'Movie terbaru',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {isLoading && <ActivityIndicator />}
      <FlashList
        data={
          data?.[objectInDataBaseOnType] as NewAnimeList[] | MovieListType[]
        }
        keyExtractor={item => item.title}
        renderItem={({ item }) =>
          objectInDataBaseOnType === 'newAnime' ? (
            <AnimeList
              newAnimeData={item as NewAnimeList}
              navigationProp={props.navigation}
            />
          ) : (
            <MovieList
              movieData={item as MovieListType}
              navigationProp={props.navigation}
            />
          )
        }
        numColumns={numColumns}
        estimatedItemSize={205}
        ListFooterComponent={() => (
          <TouchableOpacity
            style={styles.LihatLebih}
            onPress={async () => {
              if (isLoading) {
                return;
              }
              setIsLoading(true);
              try {
                const newdata = await AnimeAPI[objectInDataBaseOnType](
                  page + 1,
                );
                setData?.(prev => ({
                  ...prev,
                  [objectInDataBaseOnType]: [
                    ...prev[objectInDataBaseOnType],
                    ...newdata,
                  ],
                }));
              } finally {
                setIsLoading(false);
              }
            }}>
            <Text style={globalStyles.text}>Lihat lebih banyak</Text>
          </TouchableOpacity>
        )}
        ListFooterComponentStyle={{
          alignItems: 'center',
        }}
      />
    </>
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
