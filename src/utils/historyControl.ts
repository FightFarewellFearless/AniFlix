import { HistoryItemKey } from '@/types/databaseTarget';
import { HistoryAdditionalData, HistoryJSON } from '@/types/historyJSON';
import { RootStackNavigator } from '@/types/navigation';
import { DatabaseManager } from './DatabaseManager';
import { ComicsReading } from './scrapers/comicsv2';
import { FilmDetail_Stream } from './scrapers/film';
import { KomikuReading } from './scrapers/komiku';

async function setHistory(
  targetData:
    | RootStackNavigator['Video']['data']
    | ComicsReading
    | KomikuReading
    | FilmDetail_Stream,
  link: string,
  skipUpdateDate = false,
  additionalData: Partial<HistoryAdditionalData> | {} = {},
  isMovie?: boolean,
  isComics?: boolean,
) {
  const isFilm = 'type' in targetData && targetData.type === 'stream';
  let title: string;
  let episode: string | null;

  if (isComics && !('releaseDate' in targetData) && 'chapter' in targetData) {
    episode = (link.includes('softkomik') ? 'Chapter ' : '') + targetData.chapter;
    title = targetData.title;
  } else if (isFilm) {
    title = targetData.title;
    episode = targetData.episode
      ? `Season ${targetData.season} Episode ${targetData.episode}`
      : null;
  } else {
    const episodeIndex = targetData.title
      .toLowerCase()
      .lastIndexOf(isComics ? 'chapter' : 'episode');
    episode = episodeIndex < 0 ? null : targetData.title.slice(episodeIndex).trim();
    title = (episodeIndex >= 0 ? targetData.title.slice(0, episodeIndex) : targetData.title).trim();
  }

  const dataKey =
    `historyItem:${title}:${isComics ?? 'false'}:${isMovie ?? 'false'}` as HistoryItemKey;

  const isDataExist = await DatabaseManager.get(dataKey);
  const historyData: HistoryJSON = JSON.parse(isDataExist ?? '{}');

  if (!isDataExist || !skipUpdateDate) {
    const keyOrder: HistoryItemKey[] = JSON.parse(
      (await DatabaseManager.get('historyKeyCollectionsOrder')) ?? '[]',
    );

    if (!isDataExist) {
      if (!keyOrder.includes(dataKey)) keyOrder.splice(0, 0, dataKey);
    } else if (!skipUpdateDate) {
      const keyIndex = keyOrder.findIndex(z => z === dataKey);
      if (keyIndex !== -1) {
        keyOrder.splice(keyIndex, 1);
      }
      keyOrder.splice(0, 0, dataKey);
    }

    DatabaseManager.set('historyKeyCollectionsOrder', JSON.stringify(keyOrder));
  }
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
