import { useCallback } from 'react';
import { Platform } from 'react-native';
import { FileSystem } from '@/platform/FileSystem';
import { Toast } from '@/platform/Toast';
import { DocumentPicker } from '@/platform/DocumentPicker';
import deviceUserAgent from './deviceUserAgent';
import DialogManager from './dialogManager';

function useDownloadAnime() {
  const downloadAnime = useCallback(
    async (
      source: string,
      downloadSource: string[],
      _Title: string,
      resolution: string,
      force: boolean | undefined = false,
      callback: () => any,
    ) => {
      let Title = _Title.replace(/[/\\:*?"<>|]/g, '_'); //safe title
      if (downloadSource.includes(source) && force === false) {
        DialogManager.alert(
          'Lanjutkan?',
          'kamu sudah mengunduh bagian ini. Masih ingin melanjutkan?',
          [
            {
              text: 'Batalkan',
              onPress: () => null,
            },
            {
              text: 'Lanjutkan',
              onPress: () => {
                downloadAnime(source, downloadSource, Title, resolution, true, callback);
              },
            },
          ],
        );
        return;
      }
      const sourceLength = downloadSource.filter(z => z === source).length;
      if (force === true && sourceLength > 0) {
        Title += ' (' + sourceLength + ')';
      }

      if (Platform.OS === 'windows') {
        // Windows: use save file dialog
        const result = await DocumentPicker.getDocumentAsync({
          type: 'video/mp4',
          copyToCacheDirectory: true,
        });
        if (result.assets && result.assets.length > 0) {
          const savePath = result.assets[0].uri;
          try {
            // Download via fetch and save to file
            const response = await fetch(source, {
              headers: {
                'User-Agent': deviceUserAgent,
                ...(source.includes('mp4upload') ? { Referer: 'https://www.mp4upload.com/' } : {}),
              },
            });
            if (response.ok) {
              const arrayBuffer = await response.arrayBuffer();
              const fs = await import('fs');
              const filePath = savePath + '.' + resolution + '.mp4';
              fs.writeFileSync(filePath, Buffer.from(arrayBuffer));
              callback?.();
              Toast.show('Sedang mendownload...');
            } else {
              DialogManager.alert('Error', 'Gagal mendownload video');
            }
          } catch (err) {
            DialogManager.alert('Error', 'Gagal mendownload: ' + (err as Error).message);
          }
        }
        return;
      }

      // Android: use react-native-blob-util via platform abstraction
      const androidDirs = await FileSystem.getDirs();
      const isGranted = await FileSystem.exists(androidDirs.DownloadDir);
      if (isGranted || Number(Platform.Version) >= 33) {
        download();
      } else {
        DialogManager.alert(
          'Akses ditolak',
          'Gagal mendownload karena akses ke penyimpanan di tolak',
        );
      }

      async function download() {
        if (source.includes('mp4upload')) {
          DialogManager.alert('Perhatian', 'Download movie dari mp4upload mungkin akan gagal!');
        }
        const dirs = await FileSystem.getDirs();
        const savePath = dirs.LegacySDCardDir + '/Download/' + `${Title} ${resolution}.mp4`;
        try {
          const response = await fetch(source, {
            headers: {
              'User-Agent': deviceUserAgent,
              ...(source.includes('mp4upload') ? { Referer: 'https://www.mp4upload.com/' } : {}),
            },
          });
          if (response.ok) {
            const arrayBuffer = await response.arrayBuffer();
            await FileSystem.writeFile(savePath, Buffer.from(arrayBuffer));
            callback?.();
            Toast.show('Sedang mendownload...');
          } else {
            DialogManager.alert('Error', 'Gagal mendownload video');
          }
        } catch (err) {
          DialogManager.alert('Error', 'Gagal mendownload: ' + (err as Error).message);
        }
      }
    },
    [],
  );
  return downloadAnime;
}

export default useDownloadAnime;
