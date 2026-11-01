import * as fs from 'fs';

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
  exists: (filePath: string) => Promise<boolean>;
  mkdir: (filePath: string, recursive?: boolean) => Promise<void>;
  unlink: (filePath: string) => Promise<void>;
  cp: (source: string, destination: string) => Promise<void>;
  mv: (source: string, destination: string) => Promise<void>;
  ls: (dirPath: string) => Promise<string[]>;
  readFile: (filePath: string, encoding?: string) => Promise<string | Buffer>;
  writeFile: (filePath: string, data: any, encoding?: string) => Promise<void>;
  writeFileSync: (filePath: string, data: any, encoding?: string) => void;
  readFileSync: (filePath: string, encoding?: string) => string | Buffer;
  stat: (filePath: string) => Promise<fs.Stats>;
  lstat: (filePath: string) => Promise<fs.Stats>;
}

const homeDir = 'file:///AniFlix';
const joinPath = (...parts: string[]) => parts.join('/').replace(/([^:]\/)\/+/, '$1');
const windowsDirs = {
  DocumentDir: joinPath(homeDir, 'Documents'),
  DownloadDir: joinPath(homeDir, 'Downloads'),
  CacheDir: joinPath(homeDir, 'Cache'),
  TempDir: joinPath(homeDir, 'Temp'),
  LegacySDCardDir: joinPath(homeDir, 'Downloads'),
  PictureDir: joinPath(homeDir, 'Pictures'),
  MusicDir: joinPath(homeDir, 'Music'),
  DCIMDir: joinPath(homeDir, 'Pictures', 'DCIM'),
};

const windowsFileSystem: FileSystemAPI = {
  dirs: windowsDirs,
  getDirs: async () => windowsDirs,
  exists: (_filePath: string) => Promise.resolve(false),
  mkdir: (_filePath: string, _recursive: boolean = true) => Promise.resolve(undefined),
  unlink: (filePath: string) =>
    new Promise((resolve, reject) => {
      fs.unlink(filePath, err => {
        if (err) reject(err);
        else resolve(undefined);
      });
    }),
  cp: async (source: string, destination: string) => {
    await new Promise((resolve, reject) => {
      const readStream = fs.createReadStream(source);
      const writeStream = fs.createWriteStream(destination);
      readStream.on('error', reject);
      writeStream.on('error', reject);
      writeStream.on('finish', resolve);
      readStream.pipe(writeStream);
    });
  },
  mv: async (source: string, destination: string) => {
    await new Promise((resolve, reject) => {
      fs.rename(source, destination, err => {
        if (err) reject(err);
        else resolve(undefined);
      });
    });
  },
  ls: (dirPath: string) =>
    new Promise((resolve, reject) => {
      fs.readdir(dirPath, (err, files) => {
        if (err) reject(err);
        else resolve(files);
      });
    }),
  readFile: (filePath: string, encoding: string = 'utf8') =>
    new Promise((resolve, reject) => {
      fs.readFile(filePath, encoding as BufferEncoding, (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    }),
  writeFile: (filePath: string, data: any, encoding: string = 'utf8') =>
    new Promise((resolve, reject) => {
      fs.writeFile(filePath, data, encoding as BufferEncoding, err => {
        if (err) reject(err);
        else resolve(undefined);
      });
    }),
  writeFileSync: (filePath: string, data: any, encoding: string = 'utf8') => {
    fs.writeFileSync(filePath, data, encoding as BufferEncoding);
  },
  readFileSync: (filePath: string, encoding: string = 'utf8') => {
    return fs.readFileSync(filePath, encoding as BufferEncoding);
  },
  stat: (filePath: string) =>
    new Promise((resolve, reject) => {
      fs.stat(filePath, (err, stats) => {
        if (err) reject(err);
        else resolve(stats);
      });
    }),
  lstat: (filePath: string) =>
    new Promise((resolve, reject) => {
      fs.lstat(filePath, (err, stats) => {
        if (err) reject(err);
        else resolve(stats);
      });
    }),
};

export const FileSystem = windowsFileSystem;
export default windowsFileSystem;
