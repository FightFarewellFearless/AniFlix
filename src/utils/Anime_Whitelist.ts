export default class Anime_Whitelist {
  public static list: string[] = [];
}

fetch(
  'https://raw.githubusercontent.com/FightFarewellFearless/AniFlix/master/ANIME_WHITELIST.txt',
  {
    headers: {
      'Cache-Control': 'no-cache',
    },
  },
)
  .then(a => a.text() as Promise<string>)
  .then(result => {
    Anime_Whitelist.list = result
      .split('\n')
      .map(a => a.trim())
      .filter(a => a !== '');
  })
  .catch(() => {});
