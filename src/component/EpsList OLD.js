import React, { Component } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { StackActions } from '@react-navigation/native';
import styles from '../assets/style';
import Icon from 'react-native-vector-icons/FontAwesome';

class EpsList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      result: this.props.route.params.data.episodeList,
      titleLines: undefined,
    };
  }

  checkReadMoreFunc = e => {
    this.setState({
      titleLines: e.nativeEvent.lines.length,
    });
  };

  readMoreFunc = () => {
    if (this.state.titleLines > 2) {
      Alert.alert('Judul lengkap', this.props.route.params.data.title);
    }
  };

  render() {
    return (
      <View style={{ flexShrink: 1 }}>
        <View style={{ flexShrink: 0.2 }}>
          <Text
            numberOfLines={2}
            onTextLayout={this.checkReadMoreFunc}
            onPress={this.readMoreFunc}
            style={[{ fontSize: 25 }, styles.text]}>
            {this.props.route.params.data.title}{' '}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', flexShrink: 0.2 }}>
          <Text
            style={[
              styles.text,
              {
                backgroundColor: '#159cc5',
                fontSize: 15,
                padding: 4,
                borderRadius: 4,
                marginRight: 5,
              },
            ]}>
            {this.props.route.params.data.releaseYear}
          </Text>
          <Text
            style={[
              styles.text,
              {
                fontSize: 15,
                padding: 4,
                borderRadius: 4,
                marginRight: 5,
                backgroundColor:
                  this.props.route.params.data.status === 'Ongoing'
                    ? '#ac0000'
                    : '#22b422',
              },
            ]}>
            {this.props.route.params.data.status}
          </Text>
          <Text
            style={[
              {
                fontSize: 15,
                color: '#1f1f1f',
                padding: 4,
                borderRadius: 4,
                backgroundColor: '#ffd000',
              },
            ]}>
            <Icon name="star" /> {this.props.route.params.data.rating}
          </Text>
        </View>

        <Text style={[{ fontSize: 20 }, styles.text]}>Sinopsis: </Text>
        <ScrollView
          nestedScrollEnabled
          style={{
            maxHeight: 250,
            borderRadius: 5,
            backgroundColor: '#494949',
            flexShrink: 1,
            marginHorizontal: 10,
          }}>
          <Text style={styles.text}>
            {this.props.route.params.data.synopsys}
          </Text>
        </ScrollView>

        <Text style={[{ fontSize: 20, marginTop: 16 }, styles.text]}>
          Pilih Episode:{' '}
        </Text>
        <TextInput
          placeholder="Cari episode di sini"
          keyboardType="numeric"
          placeholderTextColor={'#616161'}
          style={[
            styles.text,
            {
              flexShrink: 0.4,
              height: 35,
              borderWidth: 1,
              borderColor: '#2e2ebb',
              marginHorizontal: 10,
              paddingVertical: 1,
            },
          ]}
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
        <View
          style={{
            maxHeight: 200,
            marginTop: 10,
            backgroundColor: '#494949',
            marginHorizontal: 10,
            borderRadius: 7,
            flexShrink: 1,
          }}>
          {this.state.result[0] !== undefined ? (
            <FlatList
              nestedScrollEnabled
              data={this.state.result}
              keyExtractor={item => item.episode}
              initialNumToRender={10}
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
        <Text style={[{ fontSize: 20, marginTop: 10 }, styles.text]}>
          Genre:{' '}
        </Text>
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            flexShrink: 0.1,
          }}>
          {this.props.route.params.data.genre.map(data => {
            return (
              <Text
                key={data}
                style={[
                  {
                    fontSize: 15,
                    marginTop: 10,
                    backgroundColor: '#004680',
                    marginHorizontal: 3,
                    padding: 2,
                    borderRadius: 3,
                  },
                  styles.text,
                ]}>
                {data}
              </Text>
            );
          })}
        </View>
      </View>
    );
  }
}

export default EpsList;
