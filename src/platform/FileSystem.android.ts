import RNFetchBlob from 'react-native-blob-util';

export interface FileSystemAPI {
  dirs: {
    DocumentDir: string;
    DownloadDir: string;
    CacheDir: string;
    TempDir: string;
    LegacySDCardDir: string;
    PictureDir: string;
    MusicDir: string;
    DCIMDir: string;
  };
  getDirs: () => Promise<FileSystemAPI['dirs']>;
  exists: (path: string) => Promise<boolean>;
  mkdir: (path: string) => Promise<void>;
  unlink: (path: string) => Promise<void>;
  cp: (source: string, destination: string) => Promise<void>;
  mv: (source: string, destination: string) => Promise<void>;
  ls: (path: string) => Promise<string[]>;
  readFile: (path: string, encoding?: string) => Promise<any>;
  writeFile: (path: string, data: any, encoding?: string) => Promise<void>;
  writeFileSync: (path: string, data: any, encoding?: string) => void;
  readFileSync: (path: string, encoding?: string) => any;
  createReadStream: (path: string) => any;
  createWriteStream: (path: string) => any;
  stat: (path: string) => Promise<any>;
  lstat: (path: string) => Promise<any>;
  hash: (path: string, algorithm: string) => Promise<string>;
  readStream: (path: string) => any;
  writeStream: (path: string) => any;
}

const androidFileSystem: FileSystemAPI = {
  dirs: {
    DocumentDir: RNFetchBlob.fs.dirs.DocumentDir,
    DownloadDir: RNFetchBlob.fs.dirs.DownloadDir,
    CacheDir: RNFetchBlob.fs.dirs.CacheDir,
    TempDir: RNFetchBlob.fs.dirs.CacheDir,
    LegacySDCardDir: RNFetchBlob.fs.dirs.LegacySDCardDir,
    PictureDir: RNFetchBlob.fs.dirs.PictureDir,
    MusicDir: RNFetchBlob.fs.dirs.MusicDir,
    DCIMDir: RNFetchBlob.fs.dirs.DCIMDir,
  },
  getDirs: async () => ({
    DocumentDir: RNFetchBlob.fs.dirs.DocumentDir,
    DownloadDir: RNFetchBlob.fs.dirs.DownloadDir,
    CacheDir: RNFetchBlob.fs.dirs.CacheDir,
    TempDir: RNFetchBlob.fs.dirs.CacheDir,
    LegacySDCardDir: RNFetchBlob.fs.dirs.LegacySDCardDir,
    PictureDir: RNFetchBlob.fs.dirs.PictureDir,
    MusicDir: RNFetchBlob.fs.dirs.MusicDir,
    DCIMDir: RNFetchBlob.fs.dirs.DCIMDir,
  }),
  exists: (path: string) => RNFetchBlob.fs.exists(path),
  mkdir: (path: string) => RNFetchBlob.fs.mkdir(path),
  unlink: (path: string) => RNFetchBlob.fs.unlink(path),
  cp: async (source: string, destination: string) => {
    await RNFetchBlob.fs.cp(source, destination);
  },
  mv: async (source: string, destination: string) => {
    await RNFetchBlob.fs.mv(source, destination);
  },
  ls: (path: string) => RNFetchBlob.fs.ls(path),
  readFile: (path: string, encoding?: string) => RNFetchBlob.fs.readFile(path, encoding as any),
  writeFile: (path: string, data: any, encoding?: string) =>
    RNFetchBlob.fs.writeFile(path, data, encoding as any),
  writeFileSync: (path: string, data: any, encoding?: string) => {
    (RNFetchBlob.fs as any).writeFileSync?.(path, data, encoding);
  },
  readFileSync: (path: string, encoding?: string) =>
    (RNFetchBlob.fs as any).readFileSync?.(path, encoding),
  createReadStream: (path: string) => (RNFetchBlob.fs as any).createReadStream(path),
  createWriteStream: (path: string) => (RNFetchBlob.fs as any).createWriteStream(path),
  stat: (path: string) => RNFetchBlob.fs.stat(path),
  lstat: (path: string) => (RNFetchBlob.fs as any).lstat(path),
  hash: (path: string, algorithm: string) => (RNFetchBlob.fs as any).hash(path, algorithm),
  readStream: (path: string) => (RNFetchBlob.fs as any).readStream(path),
  writeStream: (path: string) => (RNFetchBlob.fs as any).writeStream(path),
};

export default androidFileSystem;

export const FileSystem = androidFileSystem;
