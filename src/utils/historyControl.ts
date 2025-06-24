import { HistoryAdditionalData, HistoryJSON } from '../types/historyJSON';
import { RootStackNavigator } from '../types/navigation';
import { DatabaseManager } from './DatabaseManager';
import { KomikuReading } from './komiku';

async function setHistory(
  targetData: RootStackNavigator['Video']['data'] | KomikuReading,
  link: string,
  skipUpdateDate = false,
  additionalData: Partial<HistoryAdditionalData> | {} = {},
  isMovie?: boolean,
  isComics?: boolean,
) {
  const data: HistoryJSON[] = JSON.parse((await DatabaseManager.get('history')) ?? '[]');
  const episodeIndex = targetData.title.toLowerCase().indexOf(isComics ? 'chapter' : 'episode');
  const title = episodeIndex >= 0 ? targetData.title.slice(0, episodeIndex) : targetData.title;
  const episode = episodeIndex < 0 ? null : targetData.title.slice(episodeIndex);
  const dataINDEX = data.findIndex(
    val => val.title === title && val.isComics === isComics && val.isMovie === isMovie,
  );

  const date = data[dataINDEX]?.date;

  if (dataINDEX >= 0) {
    data.splice(dataINDEX, 1);
  }
  data.splice(0, 0, {
    ...additionalData,
    title,
    episode,
    link,
    thumbnailUrl: targetData.thumbnailUrl,
    date: skipUpdateDate ? date : Date.now(),
    isMovie,
    isComics,
  });
  DatabaseManager.set('history', JSON.stringify(data));
}
export default setHistory;
