import React, { useContext, useEffect, useState } from 'react';
import {
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  View,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useWindowDimensions } from 'react-native';
import { HomeContext } from '../../misc/context';
import { HomeStackNavigator } from '../../types/navigation';
import { AnimeList } from './AnimeList';
import AnimeAPI from '../../utils/AnimeAPI';
import { NewAnimeList } from '../../types/anime';

type Props = NativeStackScreenProps<HomeStackNavigator, 'SeeMore'>;

function SeeMore(props: Props) {
  const { paramsState: data, setParamsState: setData } =
    useContext(HomeContext);
  const [isLoading, setIsLoading] = useState(false);
  const page = (data?.newAnime.length ?? 0) / 25;
  const windowWidth = useWindowDimensions().width;
  const columnWidth = 120;
  const numColumns = Math.floor(windowWidth / columnWidth);

  useEffect(() => {
    props.navigation.setOptions({
      headerTitle: 'Anime terbaru',
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
          data?.newAnime as NewAnimeList[]
        }
        // TEMP: temporary fix for Fabric react-native-screens
        contentContainerStyle={{ paddingBottom: (global as any).nativeFabricUIManager === 'Fabric' ? 45 : undefined }}
        extraData={styles}
        keyExtractor={item => item.title}
        renderItem={({ item }) =>
          <AnimeList
            newAnimeData={item as NewAnimeList}
            navigationProp={props.navigation}
          />
        }
        numColumns={numColumns}
        estimatedItemSize={205}
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
                  const newdata = await AnimeAPI.newAnime(
                    page + 1,
                  );
                  setData?.(prev => ({
                    ...prev,
                    newAnime: [
                      ...prev.newAnime,
                      ...newdata,
                    ],
                  }));
                } finally {
                  setIsLoading(false);
                }
              }}>
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
