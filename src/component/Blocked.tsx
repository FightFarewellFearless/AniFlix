import React, { useEffect, useRef } from 'react';
import {
  Text,
  View,
  Animated,
  Vibration,
  StyleSheet,
} from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/Entypo';
import useGlobalStyles from '../assets/style';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackNavigator } from '../types/navigation';

const AnimatedIcon = Animated.createAnimatedComponent(Icon);

type Props = NativeStackScreenProps<RootStackNavigator, 'Blocked'>;

function Blocked(props: Props) {
  const globalStyles = useGlobalStyles();
  const animatedScale = useRef(new Animated.Value(1)).current;

  const animated = useRef(
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedScale, {
          toValue: 1.3,
          duration: 150,
          delay: 500,
          useNativeDriver: true,
        }),
        Animated.timing(animatedScale, {
          toValue: 1,
          duration: 200,
          delay: 20,
          useNativeDriver: true,
        }),
      ]),
      {
        iterations: -1,
      },
    ),
  ).current;
  useEffect(() => {
    animated.start();
    Vibration.vibrate([500, 150, 90, 200]);
    return () => {
      animated.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <View style={{ justifyContent: 'center', alignItems: 'center', flex: 1 }}>
      <View>
        <AnimatedIcon
          name="warning"
          size={45}
          style={[
            styles.animatedIcon,
            { transform: [{ scale: animatedScale }] },
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
        onPress={() => props.navigation.goBack()}>
        <Icon name="back" size={15} style={{ color: 'black' }} />
        <Text style={{ color: 'black', fontSize: 15 }}> Kembali</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  animatedIcon: {
    color: '#ff0000',
    alignSelf: 'center',
    justifyContent: 'center',
  },
});

export default Blocked;
