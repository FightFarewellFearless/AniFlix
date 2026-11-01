// Windows doesn't have system bars (status bar) in the same way as Android
export const windowsSystemBars = {
  setHidden: () => {},
  setStyle: () => {},
};

export const SystemBars = windowsSystemBars;
export default windowsSystemBars;
