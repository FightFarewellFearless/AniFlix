/*
This code is originally from react-native-redash with small modification
*/
import { useCallback, useLayoutEffect, useState } from 'react';
import type { TextProps as RNTextProps } from 'react-native';
import { StyleSheet, TextInput } from 'react-native';
import { SharedValue, useAnimatedRef, useDerivedValue } from 'react-native-reanimated';
import { runOnJS } from 'react-native-worklets';

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
  const [defaultValue, setDefaultValue] = useState('');
  useLayoutEffect(() => {
    setDefaultValue(text.get());
  }, [text]);
  const textRef = useAnimatedRef<typeof TextInput>();
  const setNativeText = useCallback(
    (str: string) => {
      textRef.current?.setNativeProps({
        text: str,
      });
    },
    [textRef],
  );
  useDerivedValue(() => {
    'worklet';
    runOnJS(setNativeText)(text.get());
  });
  return (
    <TextInput
      ref={textRef}
      underlineColorAndroid="transparent"
      editable={false}
      value={defaultValue}
      style={[styles.baseStyle, style]}
      multiline
    />
  );
};

export default ReText;
