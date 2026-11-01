import * as ExpoDocumentPicker from 'expo-document-picker';

export const androidDocumentPicker = {
  getDocumentAsync: (options: any) => ExpoDocumentPicker.getDocumentAsync(options),
};

export const DocumentPicker = androidDocumentPicker;
export default androidDocumentPicker;
