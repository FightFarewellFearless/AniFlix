import { Ref } from 'react';
import { Platform, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Touchable } from 'react-native-gesture-handler';
import { TouchableRipple, useTheme } from 'react-native-paper';

const TCHOP = Platform.isTV ? TouchableRipple : Touchable;

type Props = {
  hitSlop: number;
  ref: Ref<View>;
  children: React.ReactNode;
  style: StyleProp<ViewStyle>;
  onPress: () => void;
  disabled: boolean;
};

export function TouchableOpacity(props: Partial<Props>): ReturnType<typeof Touchable> {
  const theme = useTheme();
  return (
    <TCHOP
      rippleColor={theme.colors.primaryContainer}
      background={{ color: theme.colors.primaryContainer, foreground: true }}
      isTVSelectable={true}
      accessible={true}
      focusable={true}
      onPress={props.onPress}
      activeOpacity={0.2}
      animationDuration={{ in: 150, out: 250 }}
      ref={props.ref}
      style={[StyleSheet.flatten(props.style)]}>
      <>{props.children}</>
    </TCHOP>
  );
}
