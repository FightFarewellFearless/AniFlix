import { useState } from 'react';
import type { TextProps as RNTextProps } from 'react-native';
import { StyleSheet } from 'react-native';
import Animated, { AnimatedProps, SharedValue, useAnimatedReaction } from 'react-native-reanimated';
import { runOnJS } from 'react-native-worklets';

const styles = StyleSheet.create({
  baseStyle: {
    color: 'black',
  },
});

interface TextProps {
  text: SharedValue<string>;
  style?: AnimatedProps<RNTextProps>['style'];
}

const ReText = (props: TextProps) => {
  const { text, style } = { style: {}, ...props };
  const [value, setValue] = useState('');
  useAnimatedReaction(
    () => text.value,
    current => {
      runOnJS(setValue)(current);
    },
    [text],
  );
  return <Animated.Text style={[styles.baseStyle, style]}>{value}</Animated.Text>;
};

export default ReText;
