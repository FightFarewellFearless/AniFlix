let blockerId: number | null = null;

export const windowsKeepAwake = {
  useKeepAwake: () => {
    // On Windows, we use powerSaveBlocker via IPC
    return blockerId;
  },
  activate: async () => {
    if (blockerId === null) {
      const result = await (globalThis as any).electronAPI.power.startBlocker();
      blockerId = result.id;
    }
  },
  deactivate: async () => {
    if (blockerId !== null) {
      await (globalThis as any).electronAPI.power.stopBlocker(blockerId);
      blockerId = null;
    }
  },
};

export const KeepAwake = windowsKeepAwake;
export default windowsKeepAwake;
