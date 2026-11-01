// Windows doesn't have orientation locking - desktop is always landscape
export const windowsOrientation = {
  lockToPortrait: () => Promise.resolve(),
  lockToLandscape: () => Promise.resolve(),
  lockToLandscapeLeft: () => Promise.resolve(),
  lockToLandscapeRight: () => Promise.resolve(),
  unlockAllOrientations: () => Promise.resolve(),
  addDeviceOrientationListener: () => ({ remove: () => {} }),
  removeDeviceOrientationListener: () => {},
  getAutoRotateState: (callback: (state: boolean) => void) => callback(false),
  getOrientation: (callback: (orientation: string) => void) => callback('LANDSCAPE'),
};

export const Orientation = windowsOrientation;
export default windowsOrientation;
