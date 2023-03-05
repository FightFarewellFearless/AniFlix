import React, { Component } from 'react';
import {
  View,
  RefreshControl,
  Text,
  ScrollView,
  ImageBackground,
  TouchableOpacity,
  TextInput,
  ToastAndroid,
  TouchableHighlight,
} from 'react-native';
import { StackActions } from '@react-navigation/native';
import styles from './assets/style';
import Icon from 'react-native-vector-icons/FontAwesome';
import History from './History';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

class Home extends Component {
  constructor() {
    super();
    this.state = {
      searchText: '',
      data: [],
      refresh: false,
    };
  }

  componentDidMount() {
    this.setState({
      data: this.props.route.params.data,
    });
  }

  submit = () => {
    if (this.state.searchText === '') {
      return ToastAndroid.show(
        'Masukkan anime yang kamu cari ke dalam kolom pencarian',
        ToastAndroid.SHORT,
      );
    }
    this.props.navigation.dispatch(
      StackActions.push('FromUrl', {
        query: this.state.searchText,
        type: 'search',
      }),
    );
  };

  refreshing() {
    this.setState({
      refresh: true,
    });

    fetch('https://animeapi.aceracia.repl.co/newAnime')
      .then(async data => {
        const jsondata = await data.json();
        this.setState({
          data: jsondata,
          refresh: false,
        });
      })
      .catch(e => {
        ToastAndroid.show('Gagal terhubung ke server.', ToastAndroid.SHORT);
        this.setState({
          refresh: false,
        });
      });
  }

  render() {
    return (
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={this.state.refresh}
            onRefresh={() => this.refreshing()}
          />
        }>
        <View style={{ flexDirection: 'row' }}>
          <TextInput
            onSubmitEditing={this.submit}
            onChangeText={text => {
              this.setState({ searchText: text });
            }}
            placeholder="Cari anime disini"
            placeholderTextColor={styles.text.color}
            style={{
              width: this.state.searchText !== '' ? '87%' : '98%',
              height: 35,
              borderWidth: 0.8,
              borderColor: '#c5c5c5',
              marginLeft: 2,
              color: styles.text.color,
            }}
          />
          {this.state.searchText !== '' && (
            <TouchableHighlight
              onPress={this.submit}
              style={{
                justifyContent: 'center',
                alignItems: 'center',
                width: '12%',
                backgroundColor: '#ffa43cff',
              }}>
              <Text style={{ color: '#ffffff' }}>
                <Icon name="search" size={17} />
                Cari
              </Text>
            </TouchableHighlight>
          )}
        </View>
        <View>
          <Text style={[{ fontSize: 20 }, styles.text]}>Anime terbaru: </Text>
        </View>
        <ScrollView horizontal style={{ overflow: 'hidden', height: 215 }}>
          {this.state.data.map(z => {
            return (
              <TouchableOpacity
                key={'btn' + z.title + z.episode}
                onPress={() => {
                  this.props.navigation.dispatch(
                    StackActions.push('FromUrl', {
                      link: z.streamingLink,
                    }),
                  );
                }}>
                <ImageBackground
                  resizeMode="stretch"
                  key={z.title + z.episode}
                  source={{ uri: z.thumbnailUrl }}
                  style={{
                    overflow: 'hidden',
                    width: 120,
                    height: 210,
                    borderWidth: 2,
                    borderColor: 'red',
                    marginRight: 5,
                    flex: 2,
                  }}>
                  <View
                    style={{
                      justifyContent: 'flex-start',
                      alignItems: 'flex-start',
                    }}>
                    <Text
                      numberOfLines={2}
                      style={{
                        fontSize: 10,
                        color: 'black',
                        backgroundColor: 'orange',
                        opacity: 0.8,
                      }}>
                      {z.title}
                    </Text>
                  </View>

                  <View
                    style={{
                      position: 'absolute',
                      left: 0,
                      bottom: 0,
                    }}>
                    <Text
                      style={{
                        fontSize: 10,
                        color: '#000000',
                        backgroundColor: '#0099ff',
                        opacity: 0.8,
                        borderRadius: 2,
                        padding: 1,
                      }}>
                      {z.episode}
                    </Text>
                  </View>

                  <View
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                    }}>
                    <Text
                      style={{
                        fontSize: 10,
                        color: 'black',
                        backgroundColor: 'orange',
                        opacity: 0.8,
                        padding: 2,
                        borderRadius: 3,
                      }}>
                      <Icon name="star" /> {z.rating}
                    </Text>
                  </View>
                </ImageBackground>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </ScrollView>
    );
  }
}

class BottomTabs extends Component {
  constructor(props) {
    super(props);
    this.Tab = createBottomTabNavigator();
  }

  render() {
    const Tab = this.Tab;
    return (
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: { height: 40 },
        }}>
        <Tab.Screen
          name="Home1"
          component={Home}
          initialParams={this.props.route.params}
          options={{
            tabBarIcon: ({ color }) => (
              <Icon name="home" color={color} size={20} />
            ),
            tabBarLabel: 'Home',
          }}
        />
        <Tab.Screen
          name="History"
          options={{
            unmountOnBlur: true,
            tabBarIcon: ({ color }) => (
              <Icon name="history" color={color} size={20} />
            ),
          }}
          component={History}
        />
      </Tab.Navigator>
    );
  }
}

export default BottomTabs;
