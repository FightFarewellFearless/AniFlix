export const windowsSafStorage = {
  openDocumentTree: async (_persist?: boolean) => {
    // On Windows, use dialog to select folder
    const result = await (globalThis as any).electronAPI.openFile({
      properties: ['openDirectory'],
    });
    if (!result.canceled && result.filePaths.length > 0) {
      return { uri: result.filePaths[0] };
    }
    return null;
  },
  createDocument: async (data: string, options: { initialName: string; mimeType: string }) => {
    const result = await (globalThis as any).electronAPI.saveFile({
      defaultPath: options.initialName,
      filters: [{ name: 'Documents', extensions: ['txt', 'aniflix.txt', 'all'] }],
    });
    if (!result.canceled && result.filePath) {
      const fs = await import('fs');
      fs.writeFileSync(result.filePath, data, 'utf8');
      return { uri: result.filePath };
    }
    return null;
  },
  readFile: async (uri: string, encoding: string = 'utf8') => {
    const fs = await import('fs');
    return fs.readFileSync(uri, encoding as BufferEncoding);
  },
  writeFile: async (uri: string, data: string, _options?: any) => {
    const fs = await import('fs');
    fs.writeFileSync(uri, data, 'utf8');
  },
  mkdir: async (uri: string) => {
    const fs = await import('fs');
    fs.mkdirSync(uri, { recursive: true });
  },
  unlink: async (uri: string) => {
    const fs = await import('fs');
    fs.unlinkSync(uri);
  },
  exists: async (uri: string) => {
    const fs = await import('fs');
    return fs.existsSync(uri);
  },
};

export const SafStorage = windowsSafStorage;
export default windowsSafStorage;
