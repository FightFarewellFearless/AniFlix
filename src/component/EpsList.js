import React, { Component, createRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  StyleSheet,
  ImageBackground,
} from 'react-native';
import { StackActions } from '@react-navigation/native';
import globalStyles from '../assets/style';
import Icon from 'react-native-vector-icons/FontAwesome';

class EpsList extends Component {
  constructor(props) {
    super(props);
    this.data = this.props.route.params.data;
    this.state = {
      result: this.data.episodeList,
      titleLines: undefined,
    };
    this.synopsys = createRef();
    this.epsList = createRef();
  }

  componentDidMount() {
    this.synopsys.current.flashScrollIndicators();
    this.epsList.current.flashScrollIndicators();
  }

  checkReadMoreFunc = e => {
    this.setState({
      titleLines: e.nativeEvent.lines.length,
    });
  };

  readMoreFunc = () => {
    if (this.state.titleLines > 2) {
      Alert.alert('Judul lengkap', this.data.title);
    }
  };

  render() {
    return (
      <View style={styles.container}>
        {/* header */}
        <View style={styles.header}>
          <ImageBackground
            source={{ uri: this.data.thumbnailUrl }}
            style={styles.imageHeader}
            resizeMethod="resize">
            <View style={styles.shadow} />
            {/* judul */}
            <View style={styles.judul}>
              <Text
                style={[globalStyles.text, styles.textJudul]}
                numberOfLines={2}>
                {this.data.title}
              </Text>
            </View>
            {/* info */}
            <View style={styles.info}>
              <Text style={[globalStyles.text, styles.textInfo]}>
                <Icon name="calendar" size={15} /> {this.data.releaseYear}
              </Text>

              <Text style={[globalStyles.text, styles.textInfo]}>
                <Icon
                  name="tags"
                  style={{
                    color:
                      this.data.status === 'Ongoing' ? '#cf0000' : '#22b422',
                  }}
                  size={15}
                />{' '}
                {this.data.status}
              </Text>

              <Text style={[globalStyles.text, styles.textInfo]}>
                <Icon name="star" style={{ color: 'gold' }} size={15} />{' '}
                {this.data.rating}
              </Text>

              <Text style={[globalStyles.text, styles.textInfo]}>
                <Icon name="tv" size={15} /> {this.data.episodeList.length}
              </Text>
            </View>

            <View style={styles.genre}>
              {this.data.genre.map(genre => (
                <Text key={genre} style={[globalStyles.text, styles.genreText]}>
                  {genre}
                </Text>
              ))}
            </View>

            <ScrollView style={styles.synopsys} ref={this.synopsys}>
              <Text style={[globalStyles.text, { textAlign: 'center' }]}>
                {this.data.synopsys}
              </Text>
            </ScrollView>
          </ImageBackground>
        </View>

        <View style={styles.epsList}>
          <TextInput
            placeholder="Cari episode di sini"
            keyboardType="numeric"
            placeholderTextColor={'#616161'}
            style={[globalStyles.text, styles.cariEpisode]}
            onChangeText={text => {
              if (text === '') {
                this.setState({
                  result: this.props.route.params.data.episodeList,
                });
              } else {
                this.setState({
                  result: [
                    JSON.parse(
                      JSON.stringify(this.props.route.params.data.episodeList),
                    )
                      .reverse()
                      .find(x => {
                        const index = x.episode.indexOf('episode');
                        const slice =
                          index > 0 ? x.episode.slice(index) : x.episode;
                        return slice.includes(text);
                      }),
                  ],
                });
              }
            }}
          />
          {this.state.result[0] !== undefined ? (
            <FlatList
              data={this.state.result}
              keyExtractor={item => item.link}
              initialNumToRender={15}
              ref={this.epsList}
              renderItem={({ item }) => {
                return (
                  <TouchableOpacity
                    style={{ paddingBottom: 12 }}
                    onPress={() => {
                      this.props.navigation.dispatch(
                        StackActions.push('FromUrl', {
                          link: item.link,
                        }),
                      );
                    }}>
                    <Text style={{ color: 'lightblue' }}>{item.episode}</Text>
                  </TouchableOpacity>
                );
              }}
            />
          ) : (
            <Text style={styles.text}>Tidak ada episode</Text>
          )}
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flex: 1,
    marginBottom: 5,
  },
  synopsys: {
    maxHeight: 80,
    marginHorizontal: 30,
    backgroundColor: '#000000cc',
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
  textJudul: {
    fontWeight: 'bold',
    color: '#ffffff',
  },
  judul: {
    flex: 0.15,
  },
  info: {
    flex: 0.25,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  textInfo: {
    borderColor: '#ffffff',
    borderWidth: 1,
    alignSelf: 'flex-start',
    padding: 3,
    backgroundColor: '#0000009f',
  },
  genre: {
    flex: 0.2,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    flexWrap: 'wrap',
  },
  genreText: {
    backgroundColor: '#00d300b4',
    borderColor: 'black',
    borderWidth: 1.2,
    alignSelf: 'flex-start',
    padding: 2,
  },
  cariEpisode: {
    backgroundColor: '#2e2e2e',
    height: 35,
    paddingVertical: 1,
  },
});

export default EpsList;
