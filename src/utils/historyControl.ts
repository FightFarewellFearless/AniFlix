import { HistoryItemKey } from '@/types/databaseTarget';
import { HistoryAdditionalData, HistoryJSON } from '@/types/historyJSON';
import { RootStackNavigator } from '@/types/navigation';
import { DatabaseManager } from './DatabaseManager';
import { ComicsReading } from './scrapers/comicsv2';
import { FilmDetail_Stream } from './scrapers/film';
import { KomikuReading } from './scrapers/komiku';
import { NovelReading } from './scrapers/novel';

async function setHistory(
  targetData:
    | RootStackNavigator['Video']['data']
    | ComicsReading
    | KomikuReading
    | FilmDetail_Stream
    | NovelReading,
  link: string,
  skipUpdateDate = false,
  additionalData: Partial<HistoryAdditionalData> | {} = {},
  isMovie?: boolean,
  isComics?: boolean,
  isNovel?: boolean,
) {
  const isFilm = 'type' in targetData && targetData.type === 'stream';
  let title: string;
  let episode: string | null;

  if (isNovel && 'chapter' in targetData) {
    episode = targetData.chapter;
    title = targetData.title;
  } else if (isComics && !('releaseDate' in targetData) && 'chapter' in targetData) {
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
    `historyItem:${title}:${isComics ?? 'false'}:${isMovie ?? 'false'}:${isNovel ?? 'false'}` as HistoryItemKey;
  const legacyDataKey =
    `historyItem:${title}:${isComics ?? 'false'}:${isMovie ?? 'false'}` as HistoryItemKey;

  let isDataExist = await DatabaseManager.get(dataKey);
  let hasMigrated = false;

  if (!isDataExist && !isNovel) {
    const legacyExist = await DatabaseManager.get(legacyDataKey);
    if (legacyExist) {
      isDataExist = legacyExist;
      hasMigrated = true;
      await DatabaseManager.delete(legacyDataKey);
    }
  }

  const historyData: HistoryJSON = JSON.parse(isDataExist ?? '{}');

  if (!isDataExist || hasMigrated || !skipUpdateDate) {
    const keyOrder: HistoryItemKey[] = JSON.parse(
      (await DatabaseManager.get('historyKeyCollectionsOrder')) ?? '[]',
    );

    if (hasMigrated) {
      const legacyIndex = keyOrder.findIndex(z => z === legacyDataKey);
      if (legacyIndex !== -1) {
        keyOrder.splice(legacyIndex, 1);
      }
    }

    if (!isDataExist || hasMigrated) {
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
      isNovel,
    }),
  );
}

export default setHistory;
