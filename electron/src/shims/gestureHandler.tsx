import React from 'react';
import {
  RefreshControl,
  ScrollView,
  TouchableNativeFeedback,
  TouchableOpacity,
  View,
} from 'react-native';

export { RefreshControl, ScrollView, TouchableNativeFeedback, TouchableOpacity };
export const Touchable = TouchableOpacity;
export const GestureHandlerRootView = React.forwardRef<any, any>((props, ref) => {
  return <View {...props} style={[{ flex: 1, width: '100%', height: '100%' }, props.style]} ref={ref} />;
});

export function GestureDetector({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function usePanGesture() {
  return {};
}
