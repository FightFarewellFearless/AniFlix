import React from 'react';
import { View } from 'react-native';

export const initialWindowMetrics = {
  insets: { top: 0, right: 0, bottom: 0, left: 0 },
  frame: { x: 0, y: 0, width: 0, height: 0 },
};
export const SafeAreaInsetsContext = React.createContext(initialWindowMetrics.insets);
export const SafeAreaView = View;
export const SafeAreaProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;
export const SafeAreaConsumer = ({
  children,
}: {
  children: (insets: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  }) => React.ReactNode;
}) => <>{children({ top: 0, right: 0, bottom: 0, left: 0 })}</>;
export const useSafeAreaInsets = () => ({ top: 0, right: 0, bottom: 0, left: 0 });
