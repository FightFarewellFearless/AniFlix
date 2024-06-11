import { useCallback } from 'react';
import { Alert, PermissionsAndroid, Platform } from 'react-native';
import RNFetchBlob from 'react-native-blob-util';
import deviceUserAgent from './deviceUserAgent';

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
        Alert.alert(
          'Lanjutkan?',
          'kamu sudah mengunduh bagian ini. Masih ingin melanjutkan?',
          [
            {
              text: 'Batalkan',
              style: 'cancel',
              onPress: () => null,
            },
            {
              text: 'Lanjutkan',
              onPress: () => {
                downloadAnime(
                  source,
                  downloadSource,
                  Title,
                  resolution,
                  true,
                  callback,
                );
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

      const isGranted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE);
      if(isGranted || Number(Platform.Version) >= 33) {
        download();
      } else {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          download();
        } else {
          Alert.alert('Akses ditolak', 'Gagal mendownload karena akses ke penyimpanan di tolak');
        }
      }

      async function download() {
        RNFetchBlob.config({
          addAndroidDownloads: {
            useDownloadManager: true,
            notification: true,
            mime: 'video/mp4',
            title: Title + ' ' + resolution + '.mp4',
            path: RNFetchBlob.fs.dirs.LegacySDCardDir + '/Download/' + `${Title} ${resolution}.mp4`
          },
        })
          .fetch('GET', source, {
            'User-Agent': deviceUserAgent,
          })
          // .then(resp => {
          //   // the path of downloaded file
          //   console.log(resp.path());
          // })
          .catch(() => { });
        callback?.();
      }
    },
    [],
  );
  return downloadAnime;
}

export default useDownloadAnime;
