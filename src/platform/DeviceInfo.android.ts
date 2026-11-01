import { DeviceInfoModule } from 'react-native-nitro-device-info';

export const androidDeviceInfo = {
  getBatteryLevel: () => DeviceInfoModule.getBatteryLevel(),
  getBrand: () => DeviceInfoModule.brand,
  getModel: () => DeviceInfoModule.model,
  getBundleId: () => DeviceInfoModule.bundleId,
  getBuildNumber: () => DeviceInfoModule.buildNumber,
  getVersion: () => DeviceInfoModule.version,
  getUniqueId: () => DeviceInfoModule.uniqueId,
  isTablet: () => DeviceInfoModule.isTablet,
  getApiLevel: () => 0,
};

export const DeviceInfo = androidDeviceInfo;
export default androidDeviceInfo;
