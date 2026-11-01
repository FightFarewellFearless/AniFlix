import React from 'react';
import { ScrollView, View } from 'react-native';

export const KeyboardProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;
export const KeyboardAwareScrollView = ScrollView;
export const KeyboardAvoidingView = View;
export const KeyboardToolbar = () => null;
export enum AndroidSoftInputModes {
  SOFT_INPUT_ADJUST_PAN = 32,
}
