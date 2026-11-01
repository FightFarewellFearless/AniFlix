export const windowsDeviceInfo = {
  getBatteryLevel: async () => {
    try {
      const getBattery = (
        navigator as Navigator & {
          getBattery?: () => Promise<{ level: number }>;
        }
      ).getBattery;
      const battery = getBattery ? await getBattery() : null;
      return battery?.level ?? 0;
    } catch {
      return 0;
    }
  },
  getBrand: async () => 'Microsoft',
  getModel: async () => 'Windows PC',
  getBundleId: async () => 'com.aniflix.app',
  getBuildNumber: async () => '2.2.0',
  getVersion: async () => '2.2.0-LTS',
  getUniqueId: async () => {
    return 'unknown';
  },
  isTablet: async () => false,
  getApiLevel: async () => 0, // Windows doesn't have API levels
};

export const DeviceInfo = windowsDeviceInfo;
export default windowsDeviceInfo;
