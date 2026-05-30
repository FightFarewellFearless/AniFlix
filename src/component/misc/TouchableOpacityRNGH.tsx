import { Ref } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Touchable } from 'react-native-gesture-handler';

type Props = {
  hitSlop: number;
  ref: Ref<View>;
  children: React.ReactNode;
  style: StyleProp<ViewStyle>;
  onPress: () => void;
  disabled: boolean;
};

export function TouchableOpacity(props: Partial<Props>): ReturnType<typeof Touchable> {
  return (
    <Touchable
      isTVSelectable={true}
      accessible={true}
      focusable={true}
      onPress={props.onPress}
      activeOpacity={0.2}
      animationDuration={{ in: 0, out: 150 }}
      ref={props.ref}
      style={[StyleSheet.flatten(props.style)]}>
      {props.children}
    </Touchable>
  );
}
