import React from 'react';
import { Text } from 'react-native';

const AnimateableText = ({ animatedProps, text, children, ...props }: any) => {
  const content = children ?? animatedProps?.text ?? text ?? '';
  return <Text {...props}>{content}</Text>;
};

export default AnimateableText;
