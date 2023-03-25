import React, { Component } from 'react';
import { View, ActivityIndicator, Text, Image } from 'react-native';
import { StackActions } from '@react-navigation/native';
import styles from '../assets/style';

class Loading extends Component {
  constructor() {
    super();
  }

  componentDidMount() {
    fetch('https://animeapi.aceracia.repl.co/v2/home')
      .then(async data => {
        const jsondata = await data.json();
        this.props.navigation.dispatch(
          StackActions.replace('Home', {
            data: jsondata,
          }),
        );
      })
      .catch(e => {
        this.props.navigation.dispatch(StackActions.replace('FailedToConnect'));
      });
  }

  render() {
    return (
      <View
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          flex: 1,
        }}>
        <ActivityIndicator size="large" />
        <Text style={styles.text}>Mengubungkan ke server mohon tunggu.</Text>
        <View
          style={{
            position: 'absolute',
            bottom: 40,
            alignItems: 'center',
          }}>
          <Image
            source={require('../assets/RNlogo.png')}
            style={{ height: 40, width: 40 }}
          />
          <Text style={[styles.text, { fontSize: 12 }]}>
            Created using react-native
          </Text>
        </View>
        <Text
          style={[styles.text, { position: 'absolute', bottom: 0, left: 0 }]}>
          {require('../../package.json').version}
        </Text>
      </View>
    );
  }
}

export default Loading;
