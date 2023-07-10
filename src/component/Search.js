import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Image,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Animated,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect, StackActions } from '@react-navigation/native';
import globalStyles from '../assets/style';
import Icon from 'react-native-vector-icons/FontAwesome';
import deviceUserAgent from '../utils/deviceUserAgent';

function Search(props) {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

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

  const [searchText, setSearchText] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const query = useRef();

  const onChangeText = useCallback(text => {
    setSearchText(text);
  }, []);

  const submit = useCallback(() => {
    if (searchText === '') {
      return;
    }
    setLoading(true);
    fetch('https://animeapi.aceracia.repl.co/v2/search?q=' + searchText, {
      headers: {
        'User-Agent': deviceUserAgent,
      },
    })
      .then(async results => {
        if (results) {
          const result = await results.json();
          query.current = searchText;
          setData(result);
          setLoading(false);
        }
      })
      .catch(err => {
        if (err.message === 'Aborted') {
          return;
        }
        Alert.alert('Error', err.message);
        setLoading(false);
      });
  }, [searchText]);

  return (
    <Animated.View style={[{ flex: 1 }, { transform: [{ scale: scaleAnim }] }]}>
      <View style={{ flexDirection: 'row' }}>
        <TextInput
          onSubmitEditing={submit}
          onChangeText={onChangeText}
          placeholder="Cari anime disini"
          placeholderTextColor="#707070"
          style={[
            styles.searchInput,
            { width: searchText !== '' ? '87%' : '98%' },
          ]}
        />
        {searchText !== '' && (
          <TouchableOpacity onPress={submit} style={styles.searchButton}>
            <Text style={{ color: '#272727' }}>
              <Icon name="search" style={{ color: '#413939' }} size={17} />
              Cari
            </Text>
          </TouchableOpacity>
        )}
      </View>
      {loading && <ActivityIndicator />}
      {data === null ? (
        ''
      ) : (
        <>
          <Text style={globalStyles.text}>
            Hasil pencarian untuk: {query.current}
          </Text>
          {data.length > 0 ? (
            <ScrollView>
              {data.map(z => {
                return (
                  <TouchableOpacity
                    style={styles.listContainer}
                    key={'btn' + z.title}
                    onPress={() => {
                      props.navigation.dispatch(
                        StackActions.push('FromUrl', {
                          link: z.animeUrl,
                        }),
                      );
                    }}>
                    <Image
                      resizeMode="stretch"
                      key={z.title + z.episode}
                      source={{ uri: z.thumbnailUrl }}
                      style={styles.listImage}
                    />
                    <View style={{ flex: 1 }}>
                      <View style={styles.listTitle}>
                        <Text style={[{ flexShrink: 1 }, globalStyles.text]}>
                          {z.title}
                        </Text>
                      </View>

                      <View style={styles.episodeInfo}>
                        <Text style={globalStyles.text}>
                          {z.episode === '' ? 'Movie' : z.episode}
                        </Text>
                      </View>

                      <View style={styles.ratingInfo}>
                        <Text style={globalStyles.text}>
                          <Icon name="star" style={{ color: 'gold' }} />{' '}
                          {z.rating}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.statusInfo,
                          {
                            borderColor:
                              z.status === 'Ongoing' ? '#cf0000' : '#22b422',
                          },
                        ]}>
                        <Text style={globalStyles.text}>{z.status}</Text>
                      </View>

                      <View style={styles.releaseInfo}>
                        <Text style={globalStyles.text}>
                          <Icon name="calendar" /> {z.releaseYear}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          ) : (
            <Text style={globalStyles.text}>Tidak ada hasil!</Text>
          )}
        </>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  searchInput: {
    height: 35,
    borderWidth: 0.8,
    borderColor: '#c5c5c5',
    marginLeft: 2,
    color: globalStyles.text.color,
  },
  searchButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '12%',
    backgroundColor: '#ffa43cff',
  },
  listContainer: {
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
  listTitle: {
    flexShrink: 1,
    justifyContent: 'center',
    flex: 1,
  },
  episodeInfo: {
    position: 'absolute',
    right: 5,
  },
  ratingInfo: {
    position: 'absolute',
    left: 0,
  },
  statusInfo: {
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  releaseInfo: {
    position: 'absolute',
    bottom: 0,
    right: 5,
  },
});

export default Search;
