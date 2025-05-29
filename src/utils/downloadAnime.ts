import { useCallback } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import RNFetchBlob from 'react-native-blob-util';
import deviceUserAgent from './deviceUserAgent';
import DialogManager from './dialogManager';

function useDownloadAnime() {
  const downloadAnime = useCallback(
    async (
      source: string,
      downloadSource: string[],
      Title: string,
      resolution: string,
      force: boolean | undefined = false,
      callback: () => any,
    ) => {
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

      const isGranted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      );
      if (isGranted || Number(Platform.Version) >= 33) {
        download();
      } else {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          download();
        } else {
          DialogManager.alert(
            'Akses ditolak',
            'Gagal mendownload karena akses ke penyimpanan di tolak',
          );
        }
      }

      async function download() {
        if (source.includes('mp4upload')) {
          DialogManager.alert('Perhatian', 'Download movie dari mp4upload mungkin akan gagal!');
        }
        RNFetchBlob.config({
          trusty: true,
          addAndroidDownloads: {
            useDownloadManager: true,
            notification: true,
            mime: 'video/mp4',
            title: Title + ' ' + resolution + '.mp4',
            path: RNFetchBlob.fs.dirs.LegacySDCardDir + '/Download/' + `${Title} ${resolution}.mp4`,
          },
        })
          .fetch('GET', source, {
            'User-Agent': deviceUserAgent,
            ...(source.includes('mp4upload')
              ? {
                  Referer: 'https://www.mp4upload.com/',
                }
              : {}),
          })
          // .then(resp => {
          //   // the path of downloaded file
          //   console.log(resp.path());
          // })
          .catch(() => {});
        callback?.();
      }
    },
    [],
  );
  return downloadAnime;
}

export default useDownloadAnime;
