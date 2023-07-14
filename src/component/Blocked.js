import React, { Component } from 'react';
import {
  Text,
  TouchableOpacity,
  View,
  Animated,
  Vibration,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/Entypo';
import globalStyles from '../assets/style';

const AnimatedIcon = Animated.createAnimatedComponent(Icon);

class Blocked extends Component {
  constructor() {
    super();
    this.state = {
      animatedScale: new Animated.Value(1),
    };

    this.animated = Animated.loop(
      Animated.sequence([
        Animated.timing(this.state.animatedScale, {
          toValue: 1.3,
          duration: 150,
          delay: 500,
          useNativeDriver: true,
        }),
        Animated.timing(this.state.animatedScale, {
          toValue: 1,
          duration: 200,
          delay: 20,
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

  componentDidMount() {
    Vibration.vibrate([500, 150, 90, 200]);
  }

  render() {
    return (
      <View style={{ justifyContent: 'center', alignItems: 'center', flex: 1 }}>
        <View>
          <AnimatedIcon
            name="warning"
            size={45}
            style={[
              styles.animatedIcon,
              { transform: [{ scale: this.state.animatedScale }] },
            ]}
          />
        </View>
        <Text
          style={[
            { fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
            globalStyles.text,
          ]}>
          Anime yang kamu tuju tidak di izinkan atau di blacklist!
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

const styles = StyleSheet.create({
  animatedIcon: {
    color: '#ff0000',
    alignSelf: 'center',
    justifyContent: 'center',
  },
});

export default Blocked;
