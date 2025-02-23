import { setDatabase } from '../misc/reduxSlice';
import { AppDispatch } from '../misc/reduxStore';
import { HistoryAdditionalData, HistoryJSON } from '../types/historyJSON';
import { RootStackNavigator } from '../types/navigation';

function setHistory(
  targetData: RootStackNavigator['Video']['data'],
  link: string,
  skipUpdateDate = false,
  additionalData: Partial<HistoryAdditionalData> | {} = {},
  historyData: string,
  dispatchSettings: AppDispatch,
  isMovie?: boolean,
) {
  const data: HistoryJSON[] = JSON.parse(historyData);
  const episodeIndex = targetData.title.toLowerCase().indexOf('episode');
  const title = episodeIndex >= 0 ? targetData.title.slice(0, episodeIndex) : targetData.title;
  const episode = episodeIndex < 0 ? null : targetData.title.slice(episodeIndex);
  const dataINDEX = data.findIndex(val => val.title === title);

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
  });
  dispatchSettings(
    setDatabase({
      target: 'history',
      value: JSON.stringify(data),
    }),
  );
}
export default setHistory;
