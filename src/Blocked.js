import React, { Component } from 'react';
import { Text, TouchableOpacity, View, Animated } from 'react-native';
import Icon from 'react-native-vector-icons/Entypo';
import styles from './assets/style';

const AnimatedIcon = Animated.createAnimatedComponent(Icon);

class Loading extends Component {
  constructor() {
    super();
    this.state = {
      animatedOpacity: new Animated.Value(1),
    };

    this.animated = Animated.loop(
      Animated.sequence([
        Animated.timing(this.state.animatedOpacity, {
          toValue: 0.1,
          duration: 150,
          delay: 300,
          useNativeDriver: true,
        }),
        Animated.timing(this.state.animatedOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
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
        <View>
          <AnimatedIcon
            name="warning"
            size={45}
            style={{
              color: '#ff0000',
              opacity: this.state.animatedOpacity,
              alignSelf: 'center',
              justifyContent: 'center',
            }}
          />
        </View>
        <Text style={[{ fontSize: 20 }, styles.text]}>
          Anime yang kamu tuju tidak di izinkan!
        </Text>
        <TouchableOpacity
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: 6,
            padding: 3,
            borderWidth: 3,
            backgroundColor: 'lightblue',
          }}
          onPress={() => this.props.navigation.goBack()}>
          <Icon name="back" size={15} style={{ color: 'black' }} />
          <Text style={{ color: 'black', fontSize: 15 }}> Kembali</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

export default Loading;
