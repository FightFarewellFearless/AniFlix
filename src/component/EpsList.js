import React, { Component, createRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  TextInput,
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

  renderItem = ({ item }) => {
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
            {/* sinopsis */}
            <View style={styles.synopsys}>
              <ScrollView
                contentContainerStyle={styles.synopsysScrollView}
                ref={this.synopsys}>
                <Text style={[globalStyles.text, styles.synopsysText]}>
                  {this.data.synopsys}
                </Text>
              </ScrollView>
            </View>

            {/* genre */}
            <View style={styles.genre}>
              {this.data.genre.map(genre => (
                <Text key={genre} style={[globalStyles.text, styles.genreText]}>
                  {genre}
                </Text>
              ))}
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
              renderItem={this.renderItem}
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
    backgroundColor: '#000000b6',
  },
  synopsysScrollView: {},
  synopsysText: {
    flex: 1,
    textAlign: 'center',
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
    backgroundColor: '#1a9c1ab4',
    borderColor: 'black',
    borderWidth: 1.2,
    padding: 2,
    textAlign: 'center',
  },
  cariEpisode: {
    backgroundColor: '#2e2e2e',
    height: 35,
    paddingVertical: 1,
  },
});

export default EpsList;
