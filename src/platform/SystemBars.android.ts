import { SystemBars as NativeSystemBars } from 'react-native-edge-to-edge';

export const androidSystemBars = {
  setHidden: (hidden: boolean) => NativeSystemBars.setHidden(hidden),
  setStyle: (style: 'light' | 'dark') => NativeSystemBars.setStyle(systemBarsStyleToString(style)),
};

function systemBarsStyleToString(style: 'light' | 'dark') {
  return style;
}

export const SystemBars = androidSystemBars;
export default androidSystemBars;
