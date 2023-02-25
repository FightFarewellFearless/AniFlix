import React, { Component } from 'react';
import { Text, TouchableOpacity, View, Animated } from 'react-native';
import Icon from 'react-native-vector-icons/Entypo';
import styles from './assets/style';

const AnimatedIcon = Animated.createAnimatedComponent(Icon);

class Loading extends Component {
  constructor() {
    super();
    this.state = {
      animatedSize: new Animated.Value(35),
    };

    this.animated = Animated.loop(
      Animated.sequence([
        Animated.timing(this.state.animatedSize, {
          toValue: 45,
          duration: 150,
          useNativeDriver: false,
        }),
        Animated.timing(this.state.animatedSize, {
          toValue: 35,
          duration: 500,
          useNativeDriver: false,
        }),
      ]),
      {
        iterations: -1,
      },
    );
    this.animated.start();
  }

  componentWillUnmount() {
    this.animated.stop();
  }

  render() {
    return (
      <View style={{ justifyContent: 'center', alignItems: 'center', flex: 1 }}>
        <View style={{ paddingBottom: 45 }}>
          <AnimatedIcon
            name="warning"
            style={{
              color: '#ff0000',
              fontSize: this.state.animatedSize,
              position: 'absolute',
              alignSelf: 'center',
              justifyContent: 'center',
              top: 0,
            }}
          />
        </View>
        <Text style={[{ fontSize: 20 }, styles.text]}>
          Anime yang kamu tuju tidak di izinkan!
        </Text>
        <TouchableOpacity
          style={{
            borderRadius: 6,
            padding: 3,
            borderWidth: 3,
            backgroundColor: 'lightblue',
          }}
          onPress={() => this.props.navigation.goBack()}>
          <Text style={{ color: 'black' }}>
            <Icon name="back" size={14} style={{ color: 'black' }} /> Kembali
          </Text>
        </TouchableOpacity>
      </View>
    );
  }
}

export default Loading;
