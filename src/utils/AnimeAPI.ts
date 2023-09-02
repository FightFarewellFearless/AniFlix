import {
  Blocked,
  EpsList,
  FromUrlMaintenance,
  Home,
  Maintenance,
  MovieList,
  NewAnimeList,
  SearchAnimeList,
  SingleEps,
} from '../types/anime';
import deviceUserAgent from './deviceUserAgent';

class AnimeAPI {
  private static base_url = 'https://animeapi.aceracia.repl.co/v3/';

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
    signal?: AbortSignal,
  ): Promise<SearchAnimeList[] | Maintenance> {
    const data = await fetch(this.base_url + `search?q=${query}`, {
      signal,
      headers: {
        'User-Agent': deviceUserAgent,
      },
    });
    return await (data.json() as Promise<SearchAnimeList[] | Maintenance>);
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
        }`,
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
