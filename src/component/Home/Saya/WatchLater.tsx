import { SayaDrawerNavigator } from '../../../types/navigation';
import useSelectorIfFocused from '../../../hooks/useSelectorIfFocused';
import { useCallback } from 'react';
import React, {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme
} from 'react-native';
import Reanimated, { FadeInRight, FadeOutLeft } from 'react-native-reanimated';
import { FlashList, ListRenderItem } from '@shopify/flash-list';
import watchLaterJSON from '../../../types/watchLaterJSON';
import useGlobalStyles from '../../../assets/style';
import moment from 'moment';
import Icon from 'react-native-vector-icons/FontAwesome';
import controlWatchLater from '../../../utils/watchLaterControl';
import ImageLoading from '../../ImageLoading';
import { DrawerScreenProps } from '@react-navigation/drawer';

type Props = DrawerScreenProps<SayaDrawerNavigator, 'WatchLater'>;
const TouchableOpacityAnimated =
  Reanimated.createAnimatedComponent(TouchableOpacity);

function WatchLater(props: Props) {
  const styles = useStyles();
  const globalStyles = useGlobalStyles();

  const watchLaterLists = useSelectorIfFocused<watchLaterJSON[]>(
    state => state.settings.watchLater,
    true,
    result => JSON.parse(result) as watchLaterJSON[],
  );

  const renderItem = useCallback<ListRenderItem<watchLaterJSON>>(
    ({ item, index }) => {
      return (
        <TouchableOpacityAnimated
          entering={FadeInRight}
          exiting={FadeOutLeft}
          style={styles.listContainer}
          onPress={() => {
            props.navigation.dispatch(
              StackActions.push('FromUrl', {
                link: item.link,
              }),
            );
          }}>
          <ImageLoading
            source={{ uri: item.thumbnailUrl }}
            style={styles.thumbnail}
          />
          <View style={styles.ratingContainer}>
            <Text style={[globalStyles.text, styles.listRatingText]}>
              <Icon name="star" /> {item.rating}
            </Text>
          </View>
          <View style={styles.listInfoContainer}>
            <Text style={[globalStyles.text]}>
              {moment(item.date).format('dddd DD-MM-YYYY [Pukul] HH:mm:ss')}
            </Text>

            <View style={styles.titleContainer}>
              <Text style={[globalStyles.text]}>{item.title}</Text>
            </View>

            <View style={styles.listBottom}>
              <View style={styles.listGenreContainer}>
                <Text style={styles.listGenreText} numberOfLines={1}>
                  {item.genre.toString()}
                </Text>
              </View>
              <TouchableOpacity
                hitSlop={4}
                onPress={() => {
                  controlWatchLater('delete', index);
                }}
                style={styles.listDeleteContainer}>
                <Icon name="trash" size={20} color="red" />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacityAnimated>
      );
    },
    [props.navigation, styles],
  );

  return (
    <View style={{ flex: 1 }}>
      {watchLaterLists.length === 0 ? (
        <View style={styles.emptyList}>
          <Text style={[globalStyles.text]}>Belum ada daftar tonton nanti</Text>
        </View>
      ) : (
        <FlashList
          data={watchLaterLists}
          extraData={styles}
          estimatedItemSize={210}
          renderItem={renderItem}
          keyExtractor={extractKey}
        />
      )}
    </View>
  );
}

const extractKey = (item: watchLaterJSON) => item.date.toString();

function useStyles() {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    listContainer: {
      flexDirection: 'row',
      marginVertical: 5,
      backgroundColor: colorScheme === 'dark' ? '#3b3939' : '#ffffff',
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
    ratingContainer: {
      position: 'absolute',
      left: 3,
      top: 0,
    },
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
    listGenreText: {
      color: colorScheme === 'dark' ? 'lightgreen' : 'darkgreen',
      fontWeight: 'bold',
    },
    emptyList: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    listBottom: {
      flexDirection: 'row',
    },
    listGenreContainer: {
      justifyContent: 'flex-start',
      flex: 1,
    },
    listDeleteContainer: {
      justifyContent: 'flex-end',
      backgroundColor: 'orange',
      borderRadius: 5,
      padding: 3,
      marginHorizontal: 2,
    },
  });
}

export default WatchLater;
