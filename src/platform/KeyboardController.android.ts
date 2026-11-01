import {
  AndroidSoftInputModes,
  KeyboardController as NativeKeyboardController,
} from 'react-native-keyboard-controller';

export const androidKeyboardController = {
  setInputMode: (mode: AndroidSoftInputModes) => NativeKeyboardController.setInputMode(mode),
  setDefaultMode: () => NativeKeyboardController.setDefaultMode(),
};

export const KeyboardController = androidKeyboardController;
export default androidKeyboardController;
