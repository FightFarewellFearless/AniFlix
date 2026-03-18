import ReactNativeBlobUtil from 'react-native-blob-util';

export const cbzDir = ReactNativeBlobUtil.fs.dirs.DocumentDir + '/cbzReader/';
export async function cleanCbzDir() {
  if (await ReactNativeBlobUtil.fs.exists(cbzDir)) {
    await ReactNativeBlobUtil.fs.unlink(cbzDir);
    await ReactNativeBlobUtil.fs.mkdir(cbzDir);
  } else {
    await ReactNativeBlobUtil.fs.mkdir(cbzDir);
  }
}
