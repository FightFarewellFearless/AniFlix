import {
  Text,
  View,
  Alert, StyleSheet,
  useColorScheme,
  NativeSyntheticEvent,
  NativeScrollEvent,
  TextInput,
} from 'react-native';
import { TouchableOpacity } from 'react-native'; //rngh
import { StackActions } from '@react-navigation/native';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import useGlobalStyles, { darkText } from '../../../assets/style';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import moment from 'moment';
import { setDatabase } from '../../../misc/reduxSlice';
import { AppDispatch } from '../../../misc/reduxStore';
import { SayaDrawerNavigator } from '../../../types/navigation';
import { HistoryJSON } from '../../../types/historyJSON';
import Animated, {
  FadeInRight,
  FadeOutLeft,
  LinearTransition,
  runOnUI,
  useAnimatedRef,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { FlashList, ListRenderItem } from '@shopify/flash-list';
import useSelectorIfFocused from '../../../hooks/useSelectorIfFocused';
import ImageLoading from '../../ImageLoading';
import { DrawerScreenProps } from '@react-navigation/drawer';

const AnimatedFlashList = Animated.createAnimatedComponent(
  FlashList as typeof FlashList<HistoryJSON>,
);
const TouchableOpacityAnimated =
  Animated.createAnimatedComponent(TouchableOpacity);

type Props = DrawerScreenProps<SayaDrawerNavigator, 'History'>;

function History(props: Props) {
  const styles = useStyles();
  const globalStyles = useGlobalStyles();
  const data = useSelectorIfFocused(
    state => state.settings.history,
    true,
    state => JSON.parse(state) as HistoryJSON[],
  );

  const [searchKeyword, setSearchKeyword] = useState('');

  const filteredData = useMemo(() => data.filter(item => 
    item.title.toLowerCase().includes(searchKeyword.toLowerCase())
  ), [searchKeyword, data]);

  const flatListRef = useAnimatedRef<FlashList<HistoryJSON>>();

  const dispatchSettings = useDispatch<AppDispatch>();

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

  const scrollHandler = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    runOnUI((NE: NativeScrollEvent) => {
      'worklet';
      const value = NE.contentOffset.y;
      if (value <= 100) {
        if (scrollToTopButtonState.value === 'show') {
          scrollToTopButtonY.value = withSpring(150, {
            damping: 12,
          });
        }
        scrollToTopButtonState.value = 'hide';
      } else if (
        value < scrollLastValue.value &&
        scrollToTopButtonState.value === 'hide'
      ) {
        scrollToTopButtonY.value = withSpring(0, {
          damping: 12,
        });
        scrollToTopButtonState.value = 'show';
      } else if (
        value > scrollLastValue.value &&
        scrollToTopButtonState.value === 'show'
      ) {
        scrollToTopButtonY.value = withSpring(150, {
          damping: 12,
        });
        scrollToTopButtonState.value = 'hide';
      }
      scrollLastValue.value = value;
    })(event.nativeEvent);
  }

  const deleteHistory = useCallback(
    async (index: number) => {
      // const time = Date.now();
      const historyData = [...data]; // clone the array
      historyData.splice(index, 1);
      const newValue = JSON.stringify(historyData);
      // console.log(Date.now() - time);
      flatListRef.current?.prepareForLayoutAnimationRender();
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
          layout={LinearTransition}
          style={styles.listContainerButton}
          onPress={() => {
            props.navigation.dispatch(
              StackActions.push('FromUrl', {
                link: item.link,
                historyData: item,
                isMovie: item.isMovie,
              }),
            );
          }}>
          <ImageLoading
            resizeMode="stretch"
            source={{ uri: item.thumbnailUrl }}
            style={styles.listImage}
          />

          <View style={styles.listInfoContainer}>
            <View style={{ flexDirection: 'row' }}>
              <View style={styles.listWatchTime}>
                <Text style={[globalStyles.text, styles.listDateText]}>
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
                  <Icon name="delete-forever" size={28} style={{ color: 'red' }} />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.listTitle}>
              <Text style={[{ flexShrink: 1 }, globalStyles.text]}>
                {item.title}
              </Text>
            </View>

            <View style={{ flexDirection: 'row' }}>
              <View style={styles.listEpisodeAndPart}>
                <Text style={[styles.listEpisode, item.isMovie ? { color: '#ff7300', fontWeight: 'bold', fontSize: 16 } : undefined]}>
                  {item.isMovie ? 'Movie' : item.episode}
                  {/* {item.part !== undefined && (
                  <Text style={styles.listPart}>
                    {' Part ' + (item.part + 1)}
                  </Text>
                )} */}
                </Text>
              </View>

              {item.lastDuration !== undefined && (
                <View style={styles.lastDuration}>
                  <Text style={[globalStyles.text, styles.lastDurationText]}>
                    {formatTimeFromSeconds(item.lastDuration)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacityAnimated>
      );
    },
    [data, deleteHistory, props.navigation, styles],
  );

  const scrollToTop = useCallback(() => {
    flatListRef.current?.scrollToOffset({
      animated: true,
      offset: 0,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <TextInput
        style={styles.searchInput}
        placeholder="Cari judul anime..."
        placeholderTextColor={globalStyles.text.color}
        value={searchKeyword}
        onChangeText={setSearchKeyword}
      />
      {filteredData.length === 0 ? (
        <View style={styles.noHistory}>
          <Text style={[globalStyles.text]}>Tidak ada histori tontonan</Text>
        </View>
      ) : (
        <View style={styles.historyContainer}>
          <AnimatedFlashList
            data={filteredData}
            estimatedItemSize={160}
            ref={flatListRef}
            keyExtractor={keyExtractor}
            onScroll={scrollHandler}
            extraData={styles}
            renderItem={renderFlatList}
            ListHeaderComponent={() => (
              <View>
                <Text style={[globalStyles.text, { margin: 10 }]}>
                  Jumlah histori tontonan kamu: <Text style={{ fontWeight: 'bold' }}>{data.length}</Text>{'\n'}
                  <Text style={[globalStyles.text, { margin: 10, fontWeight: 'bold', fontSize: 14 }]}>
                    Sejak {moment(data.at(-1)!.date).format('DD MMMM YYYY')}
                  </Text>
                </Text>
              </View>
            )}
          />
          <Animated.View style={[styles.scrollToTopView, buttonTransformStyle]}>
            <TouchableOpacity style={styles.scrollToTop} onPress={scrollToTop}>
              <View style={styles.scrollToTopIcon}>
                <Icon
                  name="arrow-up"
                  color={darkText}
                  size={25}
                />
              </View>
            </TouchableOpacity>
          </Animated.View>
        </View>
      )}
    </View>
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

function useStyles() {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
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
      backgroundColor: colorScheme === 'dark' ? '#1f1e1e' : '#ffffff',
      borderRadius: 16,
      elevation: 5,
    },
    listImage: {
      width: 90,
      height: 150,
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
      justifyContent: 'flex-start',
      flex: 1,
    },
    listEpisode: {
      color: '#1eb1a9',
      fontSize: 12,
    },
    listPart: {
      fontSize: 12,
      color: 'red',
    },
    lastDuration: {
      justifyContent: 'flex-end'
    },
    lastDurationText: {
      fontSize: 13,
      fontStyle: 'italic',
    },
    listWatchTime: {

    },
    listDateText: {
      color: 'gray',
      fontSize: 12,
      fontWeight: '500',
    },
    deleteContainer: {
      flex: 1,
      alignItems: 'flex-end'
    },
    deleteButton: {
    },
    noHistory: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    searchInput: {
      height: 40,
      borderColor: 'gray',
      borderWidth: 1,
      borderRadius: 8,
      margin: 10,
      paddingHorizontal: 10,
    },
  });
}

export default History;
