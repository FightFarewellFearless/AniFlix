import watchLaterJSON from '@/types/watchLaterJSON';
import { ToastAndroid } from 'react-native';
import { DatabaseManager } from './DatabaseManager';
import setHistory from './historyControl';
import { FilmDetail_Stream } from './scrapers/film';
import controlWatchLater from './watchLaterControl';

export async function setFilmStreamHistory(
  link: string,
  data: FilmDetail_Stream,
  historyData?: { resolution: string | undefined; lastDuration: number },
) {
  const title = data.title.trim();
  const watchLater: watchLaterJSON[] = JSON.parse((await DatabaseManager.get('watchLater'))!);
  const watchLaterIndex = watchLater.findIndex(
    z => z.title.trim() === title.trim() && z.isMovie === true,
  );
  if (watchLaterIndex >= 0) {
    controlWatchLater('delete', watchLaterIndex);
    ToastAndroid.show(`${title} dihapus dari daftar tonton nanti`, ToastAndroid.SHORT);
  }
  setHistory(data, link, false, historyData, true);
}
