function setHistory(
  targetData,
  link,
  skipUpdateDate = false,
  additionalData = {},
  settingsContext,
  dispatchSettings,
) {
  const data = JSON.parse(settingsContext.history);
  const episodeIndex = targetData.title.toLowerCase().indexOf('episode');
  const title =
    episodeIndex >= 0 // Episode is exist (anime is not movie)
      ? targetData.title.slice(0, episodeIndex)
      : targetData.title;
  const episode =
    episodeIndex < 0 ? null : targetData.title.slice(episodeIndex);
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
  });
  dispatchSettings({
    target: 'history',
    value: JSON.stringify(data),
  });
  return setHistory;
}
export default setHistory;
