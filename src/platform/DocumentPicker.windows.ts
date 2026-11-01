export const windowsDocumentPicker = {
  getDocumentAsync: async (options: any) => {
    const result = await (globalThis as any).electronAPI.openFile({
      properties: ['openFile'],
      filters: options.type
        ? [{ name: 'Documents', extensions: [options.type.replace('text/', '')] }]
        : [],
    });
    if (!result.canceled && result.filePaths.length > 0) {
      return {
        assets: [{ uri: result.filePaths[0], name: result.filePaths[0].split('/').pop() }],
        type: options.type,
      };
    }
    return { assets: [], type: options.type };
  },
};

export const DocumentPicker = windowsDocumentPicker;
export default windowsDocumentPicker;
