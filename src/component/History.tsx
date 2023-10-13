import {
  Text,
  View,
  TouchableOpacity,
  Image,
  Alert,
  Animated as RNAnimated,
  StyleSheet,
} from 'react-native';
import { StackActions, useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useRef } from 'react';
import { useDispatch } from 'react-redux';
import globalStyles from '../assets/style';
import Icon from 'react-native-vector-icons/FontAwesome';
import moment from 'moment';
import { setDatabase } from '../misc/reduxSlice';
import { AppDispatch } from '../misc/reduxStore';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { HomeNavigator } from '../types/navigation';
import { HistoryJSON } from '../types/historyJSON';
import colorScheme from '../utils/colorScheme';
import Animated, {
  FadeInRight,
  FadeOutLeft,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { FlashList, ListRenderItem } from '@shopify/flash-list';
import useSelectorOnFocus from '../hooks/useSelectorOnFocus';

const AnimatedFlashList = Animated.createAnimatedComponent(
  FlashList as typeof FlashList<HistoryJSON>,
);
const TouchableOpacityAnimated =
  Animated.createAnimatedComponent(TouchableOpacity);

type Props = BottomTabScreenProps<HomeNavigator, 'History'>;

function History(props: Props) {
  const data = useSelectorOnFocus(
    state => state.settings.history,
    true,
    state => JSON.parse(state) as HistoryJSON[],
  );

  const isFocus = useRef(true);

  const flatListRef = useAnimatedRef<FlashList<HistoryJSON>>();

  const dispatchSettings = useDispatch<AppDispatch>();

  const scaleAnim = useRef(new RNAnimated.Value(1)).current;

  const scrollLastValue = useSharedValue(0);
  const scrollToTopButtonState = useSharedValue<'hide' | 'show'>('hide');
  const scrollToTopButtonY = useSharedValue(150);

  const buttonTransformStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: scrollToTopButtonY.value,
        },
      ],
    };
  });

  const scrollHandler = useAnimatedScrollHandler(event => {
    const value = event.contentOffset.y;
    const velocity = event.velocity?.y;
    if (value <= 100) {
      if (scrollToTopButtonState.value === 'show') {
        scrollToTopButtonY.value = withSpring(150, {
          damping: 12,
          velocity,
        });
      }
      scrollToTopButtonState.value = 'hide';
    } else if (
      value < scrollLastValue.value &&
      scrollToTopButtonState.value === 'hide'
    ) {
      scrollToTopButtonY.value = withSpring(0, {
        damping: 12,
        velocity,
      });
      scrollToTopButtonState.value = 'show';
    } else if (
      value > scrollLastValue.value &&
      scrollToTopButtonState.value === 'show'
    ) {
      scrollToTopButtonY.value = withSpring(150, {
        damping: 12,
        velocity,
      });
      scrollToTopButtonState.value = 'hide';
    }
    scrollLastValue.value = event.contentOffset.y;
  });

  useFocusEffect(
    useCallback(() => {
      isFocus.current = true;
      RNAnimated.timing(scaleAnim, {
        toValue: 1,
        // speed: 18,
        duration: 150,
        useNativeDriver: true,
      }).start();
      return () => {
        isFocus.current = false;
        RNAnimated.timing(scaleAnim, {
          toValue: 0.8,
          // speed: 18,
          duration: 250,
          useNativeDriver: true,
        }).start();
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const deleteHistory = useCallback(
    async (index: number) => {
      // const time = Date.now();
      const historyData = [...data]; // clone the array
      historyData.splice(index, 1);
      const newValue = JSON.stringify(historyData);
      // console.log(Date.now() - time);
      dispatchSettings(
        setDatabase({
          target: 'history',
          value: newValue,
        }),
      );
    },
    [dispatchSettings, data],
  );

  const keyExtractor = useCallback((item: HistoryJSON) => item.title, []);

  const renderFlatList = useCallback<ListRenderItem<HistoryJSON>>(
    ({ item }) => {
      return (
        <TouchableOpacityAnimated
          entering={FadeInRight}
          exiting={FadeOutLeft}
          style={styles.listContainerButton}
          onPress={() => {
            props.navigation.dispatch(
              StackActions.push('FromUrl', {
                link: item.link,
                historyData: item,
              }),
            );
          }}>
          <Image
            resizeMode="stretch"
            source={{ uri: item.thumbnailUrl }}
            style={styles.listImage}
          />

          <View style={styles.listInfoContainer}>
            <View style={styles.listTitle}>
              <Text style={[{ flexShrink: 1 }, globalStyles.text]}>
                {item.title}
              </Text>
            </View>

            <View style={styles.listEpisodeAndPart}>
              <Text style={styles.listEpisode}>
                {item.episode}
                {item.part !== undefined && (
                  <Text style={styles.listPart}>
                    {' Part ' + (item.part + 1)}
                  </Text>
                )}
              </Text>
            </View>

            {item.lastDuration !== undefined && (
              <View style={styles.lastDuration}>
                <Text style={globalStyles.text}>
                  {formatTimeFromSeconds(item.lastDuration)}
                </Text>
              </View>
            )}

            <View style={styles.listWatchTime}>
              <Text style={globalStyles.text}>
                {moment
                  .duration(
                    moment(Date.now()).diff(item.date, 'seconds'),
                    'seconds',
                  )
                  .humanize() + ' '}
                yang lalu pukul {moment(item.date).format('HH:mm')}
              </Text>
            </View>

            <View style={styles.deleteContainer}>
              <TouchableOpacity
                style={styles.deleteButton}
                hitSlop={10}
                onPress={() => {
                  Alert.alert(
                    'Yakin?',
                    'Yakin kamu ingin menghapus "' +
                      item.title.trim() +
                      '" dari histori?',
                    [
                      {
                        text: 'Tidak',
                        onPress: () => null,
                        style: 'cancel',
                      },
                      {
                        text: 'Ya',
                        onPress: () =>
                          deleteHistory(
                            data.findIndex(val => val.title === item.title),
                          ),
                      },
                    ],
                  );
                }}>
                <Icon name="trash" size={22} style={{ color: '#cc2525' }} />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacityAnimated>
      );
    },
    [data, deleteHistory, props.navigation],
  );

  const scrollToTop = useCallback(() => {
    flatListRef.current?.scrollToOffset({
      animated: true,
      offset: 0,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <RNAnimated.View style={{ flex: 1, transform: [{ scale: scaleAnim }] }}>
      {data.length === 0 ? (
        <View style={styles.noHistory}>
          <Text style={[globalStyles.text]}>Tidak ada histori tontonan</Text>
        </View>
      ) : (
        <View style={styles.historyContainer}>
          <AnimatedFlashList
            data={data}
            estimatedItemSize={210}
            ref={flatListRef}
            keyExtractor={keyExtractor}
            onScroll={scrollHandler}
            renderItem={renderFlatList}
          />
          <Animated.View style={[buttonTransformStyle, styles.scrollToTopView]}>
            <TouchableOpacity style={styles.scrollToTop} onPress={scrollToTop}>
              <View style={styles.scrollToTopIcon}>
                <Icon
                  name="arrow-up"
                  color={globalStyles.text.color}
                  size={15}
                />
              </View>
            </TouchableOpacity>
          </Animated.View>
        </View>
      )}
    </RNAnimated.View>
  );
}

function formatTimeFromSeconds(seconds: number) {
  const duration = moment.duration(seconds, 'seconds');
  const hours = duration.hours();
  const minutes = duration.minutes();
  const secondsResult = duration.seconds();

  const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}:${secondsResult.toString().padStart(2, '0')}`;
  return formattedTime;
}

const styles = StyleSheet.create({
  historyContainer: {
    overflow: 'hidden',
    flex: 1,
  },
  scrollToTopView: {
    position: 'absolute',
    bottom: 40,
    right: 10,
    zIndex: 1,
  },
  scrollToTop: {
    height: 50,
    width: 50,
    borderRadius: 100,
    backgroundColor: '#0060af',
    elevation: 3,
    shadowColor: 'white',
  },
  scrollToTopIcon: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainerButton: {
    flexDirection: 'row',
    marginVertical: 5,
    backgroundColor: colorScheme === 'dark' ? '#3b3939' : '#bebebe',
    borderRadius: 16,
    elevation: 5,
  },
  listImage: {
    width: 120,
    height: 200,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    marginRight: 7,
  },
  listInfoContainer: {
    flexDirection: 'column',
    flex: 1,
  },
  listTitle: {
    flexShrink: 1,
    justifyContent: 'center',
    flex: 1,
  },
  listEpisodeAndPart: {
    justifyContent: 'flex-end',
  },
  listEpisode: {
    color: '#1eb1a9',
    fontSize: 12,
  },
  listPart: {
    fontSize: 12,
    color: 'red',
  },
  lastDuration: { position: 'absolute', bottom: 1, right: 1 },
  listWatchTime: {
    position: 'absolute',
    left: 0,
    zIndex: 0,
  },
  deleteContainer: {
    position: 'absolute',
    right: 2,
    top: 5,
  },
  deleteButton: {
    backgroundColor: 'orange',
    padding: 2,
    borderRadius: 3,
  },
  noHistory: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default History;
