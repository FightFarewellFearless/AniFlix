import {
  openDocumentTree,
  createDocument,
  readFile,
  writeFile,
  mkdir,
  unlink,
  exists,
} from 'react-native-saf-x';

export const androidSafStorage = {
  openDocumentTree: (persist: boolean = true) => openDocumentTree(persist),
  createDocument: (data: string, options: { initialName: string; mimeType: string }) =>
    createDocument(data, options),
  readFile: (uri: string, encoding?: string) => readFile(uri, encoding as any),
  writeFile: (uri: string, data: string, options?: any) => writeFile(uri, data, options),
  mkdir: (uri: string) => mkdir(uri),
  unlink: (uri: string) => unlink(uri),
  exists: (uri: string) => exists(uri),
};

export const SafStorage = androidSafStorage;
export default androidSafStorage;
