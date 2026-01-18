import URL from 'url';

import { HistoryItemKey } from '../types/databaseTarget';
import { HistoryAdditionalData, HistoryJSON } from '../types/historyJSON';
import { RootStackNavigator } from '../types/navigation';
import { DatabaseManager } from './DatabaseManager';
import { FilmDetail_Stream } from './scrapers/film';
import { KomikuReading } from './scrapers/komiku';

async function setHistory(
  targetData: RootStackNavigator['Video']['data'] | KomikuReading | FilmDetail_Stream,
  link: string,
  skipUpdateDate = false,
  additionalData: Partial<HistoryAdditionalData> | {} = {},
  isMovie?: boolean,
  isComics?: boolean,
) {
  const isFilm = URL.parse(link).host!?.includes('idlix') && link.includes('/episode/');
  const episodeIndex = targetData.title
    .toLowerCase()
    .lastIndexOf(isFilm ? 'x' : isComics ? 'chapter' : 'episode');
  const title = (
    isFilm
      ? targetData.title.split(': ').slice(0, -1).join(': ')
      : episodeIndex >= 0
        ? targetData.title.slice(0, episodeIndex)
        : targetData.title
  ).trim();
  const isFilmEpisode = targetData.title.split(': ').at(-1)?.split('x');
  const episode =
    episodeIndex < 0
      ? null
      : isFilm
        ? `Season ${isFilmEpisode?.[0]} Episode ${isFilmEpisode?.[1]}`
        : targetData.title.slice(episodeIndex).trim();
  const dataKey = `historyItem:${title}:${isComics ?? 'false'}:${isMovie ?? 'false'}` as const;

  const keyOrder: HistoryItemKey[] = JSON.parse(
    (await DatabaseManager.get('historyKeyCollectionsOrder')) ?? '[]',
  );
  const isDataExist = await DatabaseManager.get(dataKey);
  if (!isDataExist) {
    if (!keyOrder.includes(dataKey)) keyOrder.splice(0, 0, dataKey);
  } else if (!skipUpdateDate) {
    const keyIndex = keyOrder.findIndex(z => z === dataKey);
    if (keyIndex !== -1) {
      keyOrder.splice(keyIndex, 1);
    }
    keyOrder.splice(0, 0, dataKey);
  }
  const historyData: HistoryJSON = JSON.parse(isDataExist ?? '{}');

  DatabaseManager.set('historyKeyCollectionsOrder', JSON.stringify(keyOrder));
  DatabaseManager.set(
    dataKey,
    JSON.stringify({
      ...additionalData,
      title,
      episode,
      link,
      thumbnailUrl: targetData.thumbnailUrl,
      date: skipUpdateDate ? historyData?.date : Date.now(),
      isMovie,
      isComics,
    }),
  );
}
export default setHistory;
