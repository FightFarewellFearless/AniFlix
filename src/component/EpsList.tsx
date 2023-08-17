import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ImageBackground,
  useWindowDimensions,
  Alert,
  ListRenderItemInfo,
} from 'react-native';
import { StackActions } from '@react-navigation/native';
import globalStyles from '../assets/style';
import Icon from 'react-native-vector-icons/FontAwesome';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackNavigator } from '../types/navigation';
import { EpsList as EpisodeListType, EpsListEpisodeList } from '../types/anime';
import colorScheme from '../utils/colorScheme';
const TouchableOpacityMemo = memo(TouchableOpacity);
const FlatListMemo = memo<typeof FlatList<EpsListEpisodeList>>(
  FlatList,
  (prev, next) => {
    return prev.data === next.data;
  },
);

type Props = NativeStackScreenProps<RootStackNavigator, 'EpisodeList'>;

function EpsList(props: Props) {
  const data = props.route.params.data;
  const [result, setResult] = useState<EpisodeListType['episodeList']>(
    data.episodeList,
  );
  const { height, width } = useWindowDimensions();

  const synopsys = useRef<ScrollView>(null);
  const epsList = useRef<FlatList>(null);

  useEffect(() => {
    if (synopsys.current === null || epsList.current === null) {
      Alert.alert(
        'Error',
        'Kemungkinan kamu ingin membaca manga, Jika iya, aplikasi tidak mendukung manga saat ini.',
      );
      return;
    }
    synopsys.current.flashScrollIndicators();
    epsList.current.flashScrollIndicators();
  }, []);

  useEffect(() => {
    epsList.current?.scrollToOffset({ animated: true, offset: 0 });
  }, [result]);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<EpsListEpisodeList>) => {
      return (
        <TouchableOpacityMemo
          style={{ paddingVertical: 12, alignItems: 'center' }}
          onPress={() => {
            props.navigation.dispatch(
              StackActions.push('FromUrl', {
                link: item.link,
              }),
            );
          }}>
          <Text
            style={{ color: colorScheme === 'dark' ? '#2c9ec4' : '#005977' }}>
            {item.episode
              .replace(
                data.title
                  .replace('Nonton Anime ', '')
                  .replace(' Sub Indo', ''),
                '',
              )
              .replace('episode', 'Episode')}
          </Text>
        </TouchableOpacityMemo>
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const keyExtractor = useCallback((item: EpsListEpisodeList) => item.link, []);

  const searchEpisode = useCallback((text: string) => {
    if (text === '') {
      setResult(props.route.params.data.episodeList);
    } else {
      setResult(
        (
          JSON.parse(
            JSON.stringify(props.route.params.data.episodeList),
          ) as EpisodeListType['episodeList']
        )
          .reverse()
          .filter(x => {
            const index = x.episode.indexOf('episode');
            const slice = index > 0 ? x.episode.slice(index) : x.episode;
            return slice.includes(text);
          }),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View
      style={[
        styles.container,
        !(height >= width) && { flexDirection: 'row' },
      ]}>
      {/* header */}
      <View style={styles.header}>
        <ImageBackground
          source={{ uri: data.thumbnailUrl }}
          style={styles.imageHeader}
          blurRadius={5}
          resizeMethod="resize">
          <View style={styles.shadow} />
          {/* judul */}
          <View style={styles.judul}>
            <Text
              style={[globalStyles.text, styles.textJudul]}
              numberOfLines={2}>
              {data.title}
            </Text>
          </View>
          {/* sinopsis */}
          <View style={styles.synopsys}>
            <ScrollView
              contentContainerStyle={styles.synopsysScrollView}
              ref={synopsys}>
              <Text style={[globalStyles.text, styles.synopsysText]}>
                {data.synopsys}
              </Text>
            </ScrollView>
          </View>

          {/* genre */}
          <View style={styles.genre}>
            {data.genre.map(genre => (
              <Text key={genre} style={[globalStyles.text, styles.genreText]}>
                {genre}
              </Text>
            ))}
          </View>
          {/* info */}
          <View style={styles.info}>
            <Text style={[globalStyles.text, styles.textInfo]}>
              <Icon name="calendar" size={15} /> {data.releaseYear}
            </Text>

            <Text style={[globalStyles.text, styles.textInfo]}>
              <Icon
                name="tags"
                style={{
                  color: data.status === 'Ongoing' ? '#cf0000' : '#22b422',
                }}
                size={15}
              />{' '}
              {data.status}
            </Text>

            <Text style={[globalStyles.text, styles.textInfo]}>
              <Icon name="star" style={{ color: 'gold' }} size={15} />{' '}
              {data.rating}
            </Text>

            <Text style={[globalStyles.text, styles.textInfo]}>
              <Icon name="tv" size={15} /> {data.episodeList.length}
            </Text>
          </View>
        </ImageBackground>
      </View>

      <View style={styles.epsList}>
        <TextInput
          placeholder="Cari episode di sini"
          keyboardType="numeric"
          placeholderTextColor={colorScheme === 'dark' ? '#616161' : 'white'}
          style={[globalStyles.text, styles.cariEpisode]}
          onChangeText={searchEpisode}
        />
        <FlatListMemo
          key="episodelist"
          data={result}
          ListEmptyComponent={
            <Text style={globalStyles.text}>Tidak ada episode</Text>
          }
          keyExtractor={keyExtractor}
          initialNumToRender={15}
          maxToRenderPerBatch={5}
          ref={epsList}
          renderItem={renderItem}
          ItemSeparatorComponent={() => (
            <View
              style={{
                width: '100%',
                borderBottomWidth: 0.5,
                borderColor: colorScheme === 'dark' ? 'white' : 'black',
              }}
            />
          )}
          windowSize={16}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flex: 1.2,
    marginBottom: 5,
  },
  textJudul: {
    fontWeight: 'bold',
    color: '#ffffff',
  },
  judul: {
    flex: 0.2,
  },
  synopsys: {
    maxHeight: '35%',
    backgroundColor: colorScheme === 'dark' ? '#0000008a' : '#d8d8d89d',
  },
  synopsysScrollView: {},
  synopsysText: {
    flex: 1,
    textAlign: 'center',
    opacity: 0.7,
  },
  epsList: {
    flex: 1,
  },
  imageHeader: {
    flex: 1,
    borderBottomStartRadius: 60,
    borderBottomEndRadius: 60,
    overflow: 'hidden',
  },
  shadow: {
    position: 'absolute',
    backgroundColor: 'black',
    width: '100%',
    height: '100%',
    opacity: 0.5,
    zIndex: 0,
  },
  info: {
    flex: 0.2,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  textInfo: {
    borderColor: '#ffffff',
    borderWidth: 1,
    padding: 3,
    backgroundColor: '#0000009f',
    color: colorScheme === 'dark' ? globalStyles.text.color : 'white',
  },
  genre: {
    flex: 0.4,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  genreText: {
    backgroundColor: '#e97508b4',
    borderColor: 'black',
    borderWidth: 1.2,
    padding: 2,
    textAlign: 'center',
    color: colorScheme === 'dark' ? globalStyles.text.color : 'white',
  },
  cariEpisode: {
    backgroundColor: colorScheme === 'dark' ? '#2e2e2e' : 'gray',
    height: 35,
    paddingVertical: 1,
  },
});

export default EpsList;
