import * as ExpoUpdates from 'expo-updates';

export const androidUpdates = {
  checkForUpdateAsync: () => ExpoUpdates.checkForUpdateAsync(),
  fetchUpdateAsync: () => ExpoUpdates.fetchUpdateAsync(),
  reloadAsync: () => ExpoUpdates.reloadAsync(),
  useUpdates: () => ExpoUpdates.useUpdates(),
};

export const Updates = androidUpdates;
export default androidUpdates;
