import React, { Component } from 'react';
import {
  View,
  ActivityIndicator,
  Text,
  Alert,
  BackHandler,
} from 'react-native';
import { StackActions } from '@react-navigation/native';
import globalStyles from '../assets/style';
import AsyncStorage from '@react-native-async-storage/async-storage';
import randomTipsArray from '../assets/loadingTips.json';

class FromUrl extends Component {
  constructor() {
    super();
    this.state = {
      unmount: false,
      dots: '',
    };
    this.randomTips =
      // eslint-disable-next-line no-bitwise
      randomTipsArray[~~(Math.random() * randomTipsArray.length)];
  }

  async componentDidMount() {
    this.dotsInterval = setInterval(() => {
      if (this.state.dots === '...') {
        this.setState({
          dots: '',
        });
        return;
      }
      this.setState({
        dots: this.state.dots + '.',
      });
    }, 250);
    const abort = new AbortController();
    this.backhandler = BackHandler.addEventListener('hardwareBackPress', () => {
      this.setState({
        unmount: true,
      });
      abort.abort();
      return false;
    });
    // await new Promise(res => setTimeout(res, 1500));
    if (this.props.route.params.type === 'search') {
      const results = await fetch(
        'https://animeapi.aceracia.repl.co/v2/search?q=' +
          this.props.route.params.query,
        {
          signal: abort.signal,
        },
      ).catch(err => {
        if (err.message === 'Aborted') {
          return;
        }
        Alert.alert('Error', err.message);
        this.props.navigation.goBack();
      });
      if (results && this.state.unmount === false) {
        const result = await results.json();
        this.props.navigation.dispatch(
          StackActions.replace('Search', {
            data: result,
            query: this.props.route.params.query,
          }),
        );
      }
    } else {
      const results = await fetch(
        'https://animeapi.aceracia.repl.co/v2/fromUrl?link=' +
          this.props.route.params.link,
        {
          signal: abort.signal,
        },
      ).catch(err => {
        if (err.message === 'Aborted') {
          return;
        }
        Alert.alert('Error', err.message);
        this.props.navigation.goBack();
      });
      if (results === undefined) {
        return;
      }
      const resulted = await results.text();
      try {
        const result = JSON.parse(resulted);
        if (results && this.state.unmount === false) {
          if (result.blocked) {
            this.props.navigation.dispatch(StackActions.replace('Blocked'));
          } else if (result.type === 'epsList') {
            this.props.navigation.dispatch(
              StackActions.replace('EpisodeList', {
                data: result,
              }),
            );
          } else if (result.type === 'singleEps') {
            this.props.navigation.dispatch(
              StackActions.replace('Video', {
                data: result,
                link: this.props.route.params.link,
              }),
            );

            // History

            (async () => {
              let data = await AsyncStorage.getItem('history');
              if (data === null) {
                data = '[]';
              }
              data = JSON.parse(data);
              const episodeI = result.title.toLowerCase().indexOf('episode');
              const title =
                episodeI >= 0 ? result.title.slice(0, episodeI) : result.title;
              const episode =
                episodeI < 0 ? null : result.title.slice(episodeI);
              const dataINDEX = data.findIndex(val => val.title === title);
              if (dataINDEX >= 0) {
                data.splice(dataINDEX, 1);
              }
              data.splice(0, 0, {
                title,
                episode,
                link: this.props.route.params.link,
                thumbnailUrl: result.thumbnailUrl,
                date: Date.now(),
              });
              AsyncStorage.setItem('history', JSON.stringify(data));
            })();
          }
        }
      } catch (e) {
        if (resulted === 'Unsupported') {
          Alert.alert(
            'Tidak didukung!',
            'Anime yang kamu tuju tidak memiliki data yang didukung!',
          );
        } else {
          Alert.alert('Error', e.stack);
        }
        this.props.navigation.goBack();
      }
    }
  }

  componentWillUnmount() {
    this.backhandler.remove();
    clearInterval(this.dotsInterval);
  }

  render() {
    return (
      <View style={{ flex: 1 }}>
        <View
          style={{
            justifyContent: 'center',
            alignItems: 'center',
            flex: 1,
          }}>
          <ActivityIndicator size="large" />
          <Text style={globalStyles.text}>Loading{this.state.dots}</Text>
        </View>
        {/* tips */}
        <View style={{ alignItems: 'center' }}>
          <View style={{ position: 'absolute', bottom: 10 }}>
            <Text style={[{ textAlign: 'center' }, globalStyles.text]}>
              {this.randomTips}
            </Text>
          </View>
        </View>
      </View>
    );
  }
}

export default FromUrl;
