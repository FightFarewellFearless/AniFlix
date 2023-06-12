import { useCallback, useContext } from 'react';
import { Alert, Linking, ToastAndroid } from 'react-native';
import RNFetchBlob from 'rn-fetch-blob';
import { SettingsContext } from '../misc/context';

function useDownloadAnime() {
  const { settingsContext } = useContext(SettingsContext);

  const downloadAnime = useCallback(
    async (
      source,
      downloadSource,
      Title,
      resolution,
      force = false,
      callback,
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
      const downloadFrom = settingsContext.downloadFrom;

      if (downloadFrom === 'native' || downloadFrom === null) {
        RNFetchBlob.config({
          addAndroidDownloads: {
            useDownloadManager: true,
            path:
              '/storage/emulated/0/Download' +
              '/' +
              Title +
              ' ' +
              resolution +
              '.mp4',
            notification: true,
            mime: 'video/mp4',
            title: Title + ' ' + resolution + '.mp4',
          },
        })
          .fetch('GET', source)
          .then(resp => {
            // the path of downloaded file
            // resp.path();
          })
          .catch(() => {});
      } else {
        if (await Linking.canOpenURL(source)) {
          Linking.openURL(source);
        } else {
          ToastAndroid.show('https tidak didukung', ToastAndroid.SHORT);
        }
      }
      callback?.();
    },
    [settingsContext.downloadFrom],
  );
  return downloadAnime;
}

export default useDownloadAnime;
