import NativeOrientation from 'react-native-orientation-locker';

export const androidOrientation = {
  lockToPortrait: () => NativeOrientation.lockToPortrait(),
  lockToLandscape: () => NativeOrientation.lockToLandscape(),
  lockToLandscapeLeft: () => NativeOrientation.lockToLandscapeLeft(),
  lockToLandscapeRight: () => NativeOrientation.lockToLandscapeRight(),
  unlockAllOrientations: () => NativeOrientation.unlockAllOrientations(),
  addDeviceOrientationListener: (callback: (orientation: string) => void) =>
    NativeOrientation.addDeviceOrientationListener(callback),
  removeDeviceOrientationListener: (callback: (orientation: string) => void) =>
    NativeOrientation.removeDeviceOrientationListener(callback),
  getAutoRotateState: (callback: (state: boolean) => void) =>
    NativeOrientation.getAutoRotateState(callback),
  getOrientation: (callback: (orientation: string) => void) =>
    NativeOrientation.getOrientation(callback),
};

export const Orientation = androidOrientation;
export default androidOrientation;
