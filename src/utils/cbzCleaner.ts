import { FileSystem } from '@/platform/FileSystem';

let _cbzDir = '';
export async function getCbzDir() {
  if (!_cbzDir) {
    const dirs = await FileSystem.getDirs();
    _cbzDir = dirs.DocumentDir + '/cbzReader/';
  }
  return _cbzDir;
}

export const cbzDir = _cbzDir;

export async function cleanCbzDir() {
  const dir = await getCbzDir();
  if (await FileSystem.exists(dir)) {
    await FileSystem.unlink(dir);
    await FileSystem.mkdir(dir);
  } else {
    await FileSystem.mkdir(dir);
  }
}
