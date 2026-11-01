import NativeSystemNavigationBar from 'react-native-system-navigation-bar';

export const androidSystemNavigationBar = {
  setImmersive: (mode: string, sticky: boolean) =>
    NativeSystemNavigationBar.setImmersive(mode as any, sticky),
  hide: (options: string | string[]) => NativeSystemNavigationBar.hide(options as any),
  show: (options: string | string[]) => NativeSystemNavigationBar.show(options as any),
};

export const SystemNavigationBar = androidSystemNavigationBar;
export default androidSystemNavigationBar;
