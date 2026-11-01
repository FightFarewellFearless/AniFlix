export const windowsUpdates = {
  checkForUpdateAsync: async () => {
    // Windows uses electron-updater via IPC
    return { isAvailable: false, isDownloading: false, downloadProgress: 0 };
  },
  fetchUpdateAsync: async () => {
    // Trigger update download via IPC
    return {};
  },
  reloadAsync: async () => {
    // Reload the app
    window.location.reload();
  },
  useUpdates: () => ({
    isDownloading: false,
    downloadProgress: 0,
    isAvailable: false,
  }),
};

export const Updates = windowsUpdates;
export default windowsUpdates;
