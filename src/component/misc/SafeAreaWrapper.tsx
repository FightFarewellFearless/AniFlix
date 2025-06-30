import React from 'react';
import { View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  children: React.ReactNode;
  style?: ViewStyle;
  ignoreTop?: boolean;
  ignoreBottom?: boolean;
};

const SafeAreaWrapper = ({ children, style, ignoreTop, ignoreBottom }: Props) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        {
          paddingTop: !ignoreTop ? insets.top : undefined,
          paddingBottom: !ignoreBottom ? insets.bottom : undefined,
          paddingLeft: insets.left,
          paddingRight: insets.right,
          flex: 1,
        },
        style,
      ]}>
      {children}
    </View>
  );
};

export default SafeAreaWrapper;
