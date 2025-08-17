import { DrawerScreenProps } from '@react-navigation/drawer';
import { StackActions } from '@react-navigation/native';
import { FlashList, FlashListRef, ListRenderItemInfo } from '@shopify/flash-list';
import moment from 'moment';
import React, { useCallback, useDeferredValue, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from 'react-native-paper';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import FontAwesomeIcon from 'react-native-vector-icons/FontAwesome';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import useGlobalStyles, { darkText } from '../../../assets/style';
import { HistoryJSON } from '../../../types/historyJSON';
import { SayaDrawerNavigator } from '../../../types/navigation';
import { DatabaseManager, useModifiedKeyValueIfFocused } from '../../../utils/DatabaseManager';
import DialogManager from '../../../utils/dialogManager';
import ImageLoading from '../../ImageLoading';

// const AnimatedFlashList = Animated.createAnimatedComponent(
//   FlashList as typeof FlashList<HistoryJSON>,
// );

type Props = DrawerScreenProps<SayaDrawerNavigator, 'History'>;

function History(props: Props) {
  const styles = useStyles();
  const globalStyles = useGlobalStyles();
  const data = useModifiedKeyValueIfFocused('history', state => JSON.parse(state) as HistoryJSON[]);

  const [searchKeyword, setSearchKeyword] = useState('');
  const searchKeywordDeferred = useDeferredValue(searchKeyword);

  const filteredData = useMemo(
    () =>
      data.filter(item => item.title.toLowerCase().includes(searchKeywordDeferred.toLowerCase())),
    [searchKeywordDeferred, data],
  );

  const flatListRef = useRef<FlashListRef<HistoryJSON>>(null);

  const scrollLastValue = useSharedValue(0);
  const scrollToTopButtonState = useSharedValue<'hide' | 'show'>('hide');
  const scrollToTopButtonScale = useSharedValue(0);

const scrollToTopButtonProps = useAnimatedProps(() => ({
    pointerEvents: scrollToTopButtonScale.get() <= 0.3 ? ('none' as const) : ('auto' as const),
  }));
  const buttonTransformStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: scrollToTopButtonScale.get(),
        },
      ],
    };
  });

  const showScrollToTopButton = useCallback(() => {
    scrollToTopButtonScale.set(withSpring(1));
  }, [scrollToTopButtonScale]);
  const hideScrollToTopButton = useCallback(() => {
    scrollToTopButtonScale.set(withSpring(0));
  }, [scrollToTopButtonScale]);

  const scrollHandler = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const value = event.nativeEvent.contentOffset.y;
      if (value <= 100) {
        if (scrollToTopButtonState.get() === 'show') {
          hideScrollToTopButton();
        }
        scrollToTopButtonState.set('hide');
      } else if (value < scrollLastValue.get() && scrollToTopButtonState.get() === 'hide') {
        showScrollToTopButton();
        scrollToTopButtonState.set('show');
      } else if (value > scrollLastValue.get() && scrollToTopButtonState.get() === 'show') {
        hideScrollToTopButton();
        scrollToTopButtonState.set('hide');
      }
      scrollLastValue.set(value);
    },
    [hideScrollToTopButton, scrollLastValue, scrollToTopButtonState, showScrollToTopButton],
  );

  const deleteHistory = useCallback(
    async (index: number) => {
      // const time = Date.now();
      const historyData = [...data]; // clone the array
      historyData.splice(index, 1);
      const newValue = JSON.stringify(historyData);
      DatabaseManager.set('history', newValue);
    },
    [data],
  );

  const keyExtractor = useCallback(
    (item: HistoryJSON) => item.title + item.episode + item.lastDuration,
    [],
  );

  const renderFlatList = useCallback(
    ({ item }: ListRenderItemInfo<HistoryJSON>) => {
      return (
        <TouchableOpacity
          // entering={FadeInRight}
          // exiting={FadeOutLeft}
          // layout={LinearTransition}
          style={styles.listContainerButton}
          onPress={() => {
            props.navigation.dispatch(
              StackActions.push('FromUrl', {
                title: item.title,
                link: item.link,
                historyData: item,
                type: item.isMovie ? 'movie' : item.isComics ? 'comics' : 'anime',
              }),
            );
          }}>
          <ImageLoading
            contentFit="fill"
            source={{ uri: item.thumbnailUrl }}
            recyclingKey={item.thumbnailUrl}
            style={styles.listImage}
          />

          <View style={styles.listInfoContainer}>
            <View style={{ flexDirection: 'row' }}>
              <View style={styles.listWatchTime}>
                <Text style={[globalStyles.text, styles.listDateText]}>
                  {moment
                    .duration(moment(Date.now()).diff(item.date, 'seconds'), 'seconds')
                    .humanize() + ' '}
                  yang lalu pukul {moment(item.date).format('HH:mm')}
                </Text>
              </View>

              <View style={styles.deleteContainer}>
                <TouchableOpacity
                  style={styles.deleteButton}
                  hitSlop={5}
                  onPress={() => {
                    DialogManager.alert(
                      'Yakin?',
                      'Yakin kamu ingin menghapus "' + item.title.trim() + '" dari histori?',
                      [
                        {
                          text: 'Tidak',
                          onPress: () => null,
                        },
                        {
                          text: 'Ya',
                          onPress: () =>
                            deleteHistory(data.findIndex(val => val.title === item.title)),
                        },
                      ],
                    );
                  }}>
                  <Icon name="delete-forever" size={21} style={styles.deleteIcon} />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.listTitle}>
              <Text style={[{ flexShrink: 1 }, globalStyles.text]}>{item.title}</Text>
            </View>

            <View style={{ flexDirection: 'row' }}>
              <View style={styles.listEpisodeAndPart}>
                <Text style={styles.listEpisode}>
                  {item.isComics && (
                    <View
                      style={{
                        backgroundColor: '#00586e',
                        borderRadius: 4,
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                      }}>
                      <Text
                        style={[
                          styles.listEpisode,
                          { color: '#ffffff', fontWeight: 'bold', fontSize: 12 },
                        ]}>
                        Komik
                      </Text>
                    </View>
                  )}{' '}
                  {item.isMovie && (
                    <View
                      style={{
                        backgroundColor: '#ff7300',
                        borderRadius: 4,
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                      }}>
                      <Text
                        style={[
                          styles.listEpisode,
                          { color: '#ffffff', fontWeight: 'bold', fontSize: 12 },
                        ]}>
                        Movie
                      </Text>
                    </View>
                  )}{' '}
                  {item.episode}
                </Text>
                {/* this commented code is keep for historical reason (nostalgic lmao) */}
                {/* {item.part !== undefined && (
                  <Text style={styles.listPart}>
                    {' Part ' + (item.part + 1)}
                  </Text>
                )} */}
              </View>

              {item.lastDuration !== undefined && (
                <View style={styles.lastDuration}>
                  <Text style={[globalStyles.text, styles.lastDurationText]}>
                    <FontAwesomeIcon
                      name={item.isComics ? 'book' : 'clock-o'}
                      size={16}
                      color={globalStyles.text.color}
                    />{' '}
                    {item.isComics
                      ? 'Halaman ' + (item.lastDuration + 1)
                      : formatTimeFromSeconds(item.lastDuration)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    [data, deleteHistory, globalStyles.text, props.navigation, styles],
  );

  const scrollToTop = useCallback(() => {
    flatListRef.current?.scrollToOffset({
      animated: true,
      offset: 0,
    });
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.searchInputView}>
        <TextInput
          style={styles.searchInput}
          placeholder="Cari judul anime..."
          placeholderTextColor={globalStyles.text.color}
          value={searchKeyword}
          onChangeText={setSearchKeyword}
        />
        {searchKeyword !== searchKeywordDeferred && (
          <ActivityIndicator color={globalStyles.text.color} />
        )}
        <TouchableOpacity
          style={{ alignSelf: 'center' }}
          onPress={() => {
            setSearchKeyword('');
          }}>
          <FontAwesomeIcon name="times" size={20} color={globalStyles.text.color} />
        </TouchableOpacity>
      </View>
      <View style={styles.historyContainer}>
        <FlashList
          data={filteredData}
          // fix: weird flashlist crash (undefined) (might be related to concurrent render)
          key={searchKeywordDeferred}
          ref={flatListRef}
          keyExtractor={keyExtractor}
          onScroll={scrollHandler}
          removeClippedSubviews={true}
          extraData={styles}
          renderItem={renderFlatList}
          ListHeaderComponent={() =>
            data.length > 0 && (
              <View>
                {searchKeywordDeferred !== '' && (
                  <Text style={[globalStyles.text, styles.searchKeywordText]}>
                    Menampilkan hasil untuk : {searchKeywordDeferred} ({filteredData.length})
                  </Text>
                )}
                <Text style={[globalStyles.text, { margin: 10 }]}>
                  Jumlah histori tontonan kamu:{' '}
                  <Text style={{ fontWeight: 'bold' }}>{data.length}</Text>
                  {'\n'}
                  <Text
                    style={[
                      globalStyles.text,
                      { margin: 10, fontWeight: 'bold', fontSize: 12, color: 'gray' },
                    ]}>
                    Sejak {moment(data.at(-1)!.date).format('DD MMMM YYYY')}
                  </Text>
                </Text>
              </View>
            )
          }
          ListEmptyComponent={() => (
            <View style={styles.noHistory}>
              <Text style={[globalStyles.text]}>Tidak ada histori tontonan</Text>
            </View>
          )}
        />
        <Animated.View
style={[styles.scrollToTopView, buttonTransformStyle]}
          animatedProps={scrollToTopButtonProps}>
          <TouchableOpacity style={styles.scrollToTop} onPress={scrollToTop}>
            <View style={styles.scrollToTopIcon}>
              <Icon name="arrow-up" color={darkText} size={25} />
            </View>
          </TouchableOpacity>
        </Animated.View>
      </View>
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
  const theme = useTheme();
  const globalStyles = useGlobalStyles();
  return useMemo(
    () =>
      StyleSheet.create({
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
          backgroundColor: 'rgb(0, 47, 109)',
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
          backgroundColor: theme.colors.surface,
          borderWidth: 0.2,
          borderColor: theme.colors.onSurfaceVariant,
          borderRadius: 16,
          elevation: 5,
        },
        listImage: {
          width: 80,
          height: 140,
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
          flexDirection: 'row',
          gap: 5,
          flex: 1,
          flexShrink: 1,
        },
        listEpisode: {
          color: theme.colors.secondary,
          fontSize: 13,
          fontWeight: 'bold',
        },
        listPart: {
          fontSize: 12,
          color: 'red',
        },
        lastDuration: {
          justifyContent: 'flex-end',
          marginRight: 4,
        },
        lastDurationText: {
          fontSize: 13,
          fontStyle: 'italic',
        },
        listWatchTime: {
          flex: 1,
        },
        listDateText: {
          color: '#a0a0a0',
          fontSize: 12,
          fontWeight: 'bold',
        },
        deleteContainer: {},
        deleteButton: {
          backgroundColor: theme.colors.errorContainer,
          borderRadius: 5,
          padding: 2,
        },
        deleteIcon: {
          color: theme.colors.onErrorContainer,
        },
        noHistory: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        },
        searchInputView: {
          height: 40,
          borderColor: 'gray',
          borderWidth: 1,
          borderRadius: 8,
          margin: 10,
          paddingHorizontal: 10,
          flexDirection: 'row',
          alignItems: 'center',
        },
        searchInput: {
          color: globalStyles.text.color,
          flex: 1,
        },
        searchKeywordText: {
          opacity: 0.8,
          fontStyle: 'italic',
          textDecorationLine: 'underline',
          textDecorationColor: globalStyles.text.color,
        },
      }),
    [globalStyles.text.color, theme],
  );
}

export default React.memo(History);
