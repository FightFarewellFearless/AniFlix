import {
  ActivityIndicator,
  FlatList,
  Text,
  View,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
  Animated,
  StyleSheet,
  ListRenderItemInfo,
} from 'react-native';
import { StackActions, useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import globalStyles from '../assets/style';
import Icon from 'react-native-vector-icons/FontAwesome';
import moment from 'moment';
import { setDatabase } from '../misc/reduxSlice';
import store, { AppDispatch } from '../misc/reduxStore';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { HomeNavigator } from '../types/navigation';
import { HistoryJSON } from '../types/historyJSON';
require('moment/locale/id');

type Props = BottomTabScreenProps<HomeNavigator, 'History'>;

function History(props: Props) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<HistoryJSON[]>([]);
  const [historyRefreshing, setHistoryRefreshing] = useState(false);
  const isFocus = useRef(true);

  const dispatchSettings = useDispatch<AppDispatch>();

  const scaleAnim = useRef(new Animated.Value(1)).current;

  useFocusEffect(
    useCallback(() => {
      // manually handle dispatch action
      const unsubscribe = store.subscribe(() => {
        setData(JSON.parse(store.getState().settings.history));
      });
      return () => {
        unsubscribe();
      };
    }, []),
  );

  const updateHistory = useCallback(() => {
    const historyStore = store.getState().settings.history;
    setLoading(false);
    if (JSON.stringify(data) !== historyStore) {
      setData(JSON.parse(historyStore));
    }
  }, [data]);

  useFocusEffect(
    useCallback(() => {
      isFocus.current = true;
      Animated.timing(scaleAnim, {
        toValue: 1,
        // speed: 18,
        duration: 150,
        useNativeDriver: true,
      }).start();
      return () => {
        isFocus.current = false;
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

  useFocusEffect(
    useCallback(() => {
      // setTimeout(() => {
      setHistoryRefreshing(true);
      updateHistory();
      setHistoryRefreshing(false);
      // }, 0);
    }, [updateHistory]),
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

  const onRefreshControl = useCallback(() => {
    setHistoryRefreshing(true);
    setData(JSON.parse(store.getState().settings.history));
    setHistoryRefreshing(false);
  }, []);

  const renderFlatList = useCallback(
    ({ item }: ListRenderItemInfo<HistoryJSON>) => {
      return (
        <TouchableOpacity
          style={styles.listContainerButton}
          key={'btn' + item.title}
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
        </TouchableOpacity>
      );
    },
    [data, deleteHistory, props.navigation],
  );

  return (
    <Animated.View style={{ flex: 1, transform: [{ scale: scaleAnim }] }}>
      {loading ? (
        <ActivityIndicator />
      ) : data.length === 0 ? (
        <View style={styles.noHistory}>
          <Text style={[globalStyles.text]}>Tidak ada histori tontonan</Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={keyExtractor}
          refreshControl={
            <RefreshControl
              refreshing={historyRefreshing}
              onRefresh={onRefreshControl}
              progressBackgroundColor="#292929"
              colors={['#00a2ff', 'red']}
            />
          }
          renderItem={renderFlatList}
          removeClippedSubviews={true}
          windowSize={13}
        />
      )}
    </Animated.View>
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
  listContainerButton: {
    flexDirection: 'row',
    marginVertical: 5,
    backgroundColor: '#3b3939',
    borderRadius: 16,
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
    right: 5,
    top: 5,
  },
  noHistory: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default History;