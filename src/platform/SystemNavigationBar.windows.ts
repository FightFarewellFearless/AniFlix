// Windows doesn't have a system navigation bar
export const windowsSystemNavigationBar = {
  setImmersive: () => {},
  hide: () => {},
  show: () => {},
};

export const SystemNavigationBar = windowsSystemNavigationBar;
export default windowsSystemNavigationBar;
