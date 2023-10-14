import {
  Blocked,
  EpsList,
  FromUrlMaintenance,
  Home,
  MovieList,
  NewAnimeList,
  SearchAnime,
  SingleEps,
} from '../types/anime';
import deviceUserAgent from './deviceUserAgent';

class AnimeAPI {
  private static base_url = 'https://animeapi.aceracia.repl.co/v4/';

  static async home(signal?: AbortSignal): Promise<Home> {
    const data = await fetch(this.base_url + 'home', {
      signal,
      headers: {
        'User-Agent': deviceUserAgent,
      },
    });
    return await (data.json() as Promise<Home>);
  }

  static async newAnime(
    page: number | undefined = 1,
    signal?: AbortSignal,
  ): Promise<NewAnimeList[]> {
    const data = await fetch(this.base_url + `newAnime?page=${page}`, {
      signal,
      headers: {
        'User-Agent': deviceUserAgent,
      },
    });
    return await (data.json() as Promise<NewAnimeList[]>);
  }

  static async movie(
    page: number | undefined = 1,
    signal?: AbortSignal,
  ): Promise<MovieList[]> {
    const data = await fetch(this.base_url + `movie?page=${page}`, {
      signal,
      headers: {
        'User-Agent': deviceUserAgent,
      },
    });
    return await (data.json() as Promise<MovieList[]>);
  }

  static async search(
    query: string,
    page?: number,
    signal?: AbortSignal,
  ): Promise<SearchAnime> {
    const data = await fetch(
      this.base_url +
        `search?q=${query}${page !== undefined ? '&page=' + page : ''}`,
      {
        signal,
        headers: {
          'User-Agent': deviceUserAgent,
        },
      },
    );
    return await (data.json() as Promise<SearchAnime>);
  }

  static async fromUrl(
    link: string,
    resolution?: string,
    signal?: AbortSignal,
  ): Promise<fromUrlJSON | 'Unsupported'> {
    const data = await fetch(
      this.base_url +
        `fromUrl?link=${link}${
          resolution !== undefined ? '&res=' + resolution : ''
        }&appVer=pre-view`,
      {
        signal,
        headers: {
          'User-Agent': deviceUserAgent,
        },
      },
    );
    const dataString = await data.text();
    if (dataString === 'Unsupported') {
      return 'Unsupported';
    }
    const dataJson: fromUrlJSON = JSON.parse(dataString);
    return dataJson;
  }
}

type fromUrlJSON = SingleEps | EpsList | FromUrlMaintenance | Blocked;

export default AnimeAPI;
