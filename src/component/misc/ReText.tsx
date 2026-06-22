/*
This code is originally from react-native-redash with small modification
*/
import type { TextProps as RNTextProps } from 'react-native';
import { StyleSheet } from 'react-native';
import AnimateableText from 'react-native-animateable-text';
import { SharedValue, useAnimatedProps } from 'react-native-reanimated';

const styles = StyleSheet.create({
  baseStyle: {
    color: 'black',
  },
});

interface TextProps {
  text: SharedValue<string>;
  style?: RNTextProps['style'];
}

const ReText = (props: TextProps) => {
  const { text, style } = { style: {}, ...props };
  const animatedProps = useAnimatedProps(() => {
    return {
      text: text.value,
    };
  });
  return <AnimateableText animatedProps={animatedProps} style={[styles.baseStyle, style]} />;
};

export default ReText;
