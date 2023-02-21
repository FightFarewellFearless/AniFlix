import {
  ActivityIndicator,
  FlatList,
  Text,
  View,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StackActions } from '@react-navigation/native';
import React, { Component } from 'react';
import styles from './assets/style';
import Icon from 'react-native-vector-icons/FontAwesome';

class History extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      data: [],
    };
  }

  updateHistory = async () => {
    let history = await AsyncStorage.getItem('history');
    if (history === null) {
      await AsyncStorage.setItem('history', '[]');
      this.setState({
        loading: false,
      });
    } else {
      history = JSON.parse(history);
      this.setState({
        loading: false,
        data: history,
      });
    }
  };

  componentDidMount() {
    this.unsubscribe = this.props.navigation.addListener(
      'focus',
      this.updateHistory,
    );
    this.updateHistory();
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  async deleteHistori(index) {
    const data = JSON.parse(await AsyncStorage.getItem('history'));
    data.splice(index, 1);
    await AsyncStorage.setItem('history', JSON.stringify(data));
    this.updateHistory();
  }

  render() {
    return (
      <View style={{ flex: 1 }}>
        {this.state.loading ? (
          <ActivityIndicator />
        ) : this.state.data.length === 0 ? (
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <Text style={[styles.text]}>Tidak ada histori tontonan</Text>
          </View>
        ) : (
          <FlatList
            data={this.state.data}
            keyExtractor={item => item.title}
            renderItem={({ item, index }) => {
              return (
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    marginVertical: 5,
                    backgroundColor: '#444242',
                    borderRadius: 16,
                  }}
                  key={'btn' + item.title}
                  onPress={() => {
                    this.props.navigation.dispatch(
                      StackActions.push('FromUrl', {
                        link: item.link,
                      }),
                    );
                  }}>
                  <Image
                    resizeMode="stretch"
                    source={{ uri: item.thumbnailUrl }}
                    style={{
                      width: 120,
                      height: 210,
                      borderTopLeftRadius: 16,
                      borderBottomLeftRadius: 16,
                      marginRight: 7,
                    }}
                  />

                  <View
                    style={{
                      flexDirection: 'column',
                      flex: 1,
                    }}>
                    <View
                      style={{
                        flexShrink: 1,
                        justifyContent: 'center',
                        flex: 1,
                      }}>
                      <Text style={[{ flexShrink: 1 }, styles.text]}>
                        {item.title}
                      </Text>
                    </View>

                    <View
                      style={{
                        justifyContent: 'flex-end',
                      }}>
                      <Text
                        style={{
                          color: '#1eb1a9',
                          fontSize: 12,
                        }}>
                        {item.episode}
                      </Text>
                    </View>

                    <View
                      style={{
                        position: 'absolute',
                        left: 0,
                      }}>
                      <Text style={styles.text}>
                        {new Date(item.date).toLocaleString()}
                      </Text>
                    </View>

                    <View
                      style={{
                        position: 'absolute',
                        right: 5,
                        top: 5,
                      }}>
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
                                onPress: () => this.deleteHistori(index),
                              },
                            ],
                          );
                        }}>
                        <Icon
                          name="trash"
                          size={22}
                          style={{ color: '#cc2525' }}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>
    );
  }
}

export default History;
