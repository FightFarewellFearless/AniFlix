/*
This code is from react-native-redash
*/
import { useLayoutEffect, useState } from 'react';
import type { TextProps as RNTextProps } from 'react-native';
import { StyleSheet, TextInput } from 'react-native';
import Animated, { useAnimatedProps } from 'react-native-reanimated';

const styles = StyleSheet.create({
  baseStyle: {
    color: 'black',
  },
});
Animated.addWhitelistedNativeProps({ text: true });

interface TextProps {
  text: Animated.SharedValue<string>;
  style?: Animated.AnimateProps<RNTextProps>['style'];
}

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

const ReText = (props: TextProps) => {
  const { text, style } = { style: {}, ...props };
  const [defaultValue, setDefaultValue] = useState('');
  useLayoutEffect(() => {
    setDefaultValue(text.get());
  }, [text]);
  const animatedProps = useAnimatedProps(() => {
    return {
      text: text.get(),
      // Here we use any because the text prop is not available in the type
    } as any;
  });
  return (
    <AnimatedTextInput
      underlineColorAndroid="transparent"
      editable={false}
      value={defaultValue}
      style={[styles.baseStyle, style]}
      {...{ animatedProps }}
    />
  );
};

export default ReText;
