import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { HomeNavigator } from '../types/navigation';
import useSelectorOnFocus from '../hooks/useSelectorOnFocus';
import { StackActions, useFocusEffect } from '@react-navigation/native';
import { useCallback, useRef } from 'react';
import React, {
  Animated,
  FlatList,
  ImageBackground,
  ListRenderItemInfo,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import watchLaterJSON from '../types/watchLaterJSON';
import colorScheme from '../utils/colorScheme';
import globalStyles from '../assets/style';
import moment from 'moment';

type Props = BottomTabScreenProps<HomeNavigator, 'WatchLater'>;

function WatchLater(props: Props) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  useFocusEffect(
    useCallback(() => {
      Animated.timing(scaleAnim, {
        toValue: 1,
        // speed: 18,
        duration: 150,
        useNativeDriver: true,
      }).start();
      return () => {
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          // speed: 18,
          duration: 250,
          useNativeDriver: true,
        }).start();
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const watchLaterLists = useSelectorOnFocus<watchLaterJSON[]>(
    state => state.settings.watchLater,
    true,
    result => JSON.parse(result) as watchLaterJSON[],
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<watchLaterJSON>) => {
      return (
        <TouchableOpacity
          style={styles.listContainer}
          onPress={() => {
            props.navigation.dispatch(
              StackActions.push('FromUrl', {
                link: item.link,
              }),
            );
          }}>
          <ImageBackground
            source={{ uri: item.thumbnailUrl }}
            style={styles.thumbnail}>
            <View style={styles.ratingContainer}>
              <Text style={[globalStyles.text, styles.listRatingText]}>
                {item.rating}
              </Text>
            </View>
          </ImageBackground>
          <View style={styles.listInfoContainer}>
            <View>
              <Text style={[globalStyles.text]}>
                {moment(item.date).format(
                  '[Hari] dddd DD-MM-YYYY [Pukul] HH:mm:ss',
                )}
              </Text>
            </View>
            <View style={styles.titleContainer}>
              <Text style={[globalStyles.text]}>{item.title}</Text>
            </View>
            <View style={styles.listGenreContainer}>
              <Text style={styles.listGenreText} numberOfLines={1}>
                {item.genre.toString()}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    [props.navigation],
  );

  return (
    <Animated.View style={{ flex: 1, transform: [{ scale: scaleAnim }] }}>
      <FlatList
        data={watchLaterLists}
        renderItem={renderItem}
        keyExtractor={extractKey}
      />
    </Animated.View>
  );
}

const extractKey = (item: watchLaterJSON) => item.date.toString();

const styles = StyleSheet.create({
  listContainer: {
    flexDirection: 'row',
    marginVertical: 5,
    backgroundColor: colorScheme === 'dark' ? '#3b3939' : '#bebebe',
    borderRadius: 16,
    elevation: 5,
    height: 200,
    overflow: 'hidden',
  },
  listInfoContainer: {
    flex: 1,
    flexDirection: 'column',
  },
  thumbnail: {
    height: 200,
    width: 120,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    marginRight: 7,
  },
  ratingContainer: { flexDirection: 'row' },
  listRatingText: {
    backgroundColor: 'orange',
    color: 'black',
    padding: 3,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    borderTopRightRadius: 16,
    fontWeight: '600',
  },
  titleContainer: {
    justifyContent: 'center',
    flex: 1,
  },
  listGenreContainer: {
    // justifyContent: 'flex-end',
  },
  listGenreText: {
    color: colorScheme === 'dark' ? 'lightgreen' : 'darkgreen',
    fontWeight: 'bold',
  },
});

export default WatchLater;
