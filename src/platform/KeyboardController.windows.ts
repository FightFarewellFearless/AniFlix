// Windows doesn't have a software input mode
export const windowsKeyboardController = {
  setInputMode: () => {},
  setDefaultMode: () => {},
};

export const KeyboardController = windowsKeyboardController;
export default windowsKeyboardController;
