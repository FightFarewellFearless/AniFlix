import {
  Blocked,
  EpsList,
  FromUrlMaintenance,
  Home,
  MovieList,
  NewAnimeList,
  SearchAnime,
  SingleEps,
  listAnimeTypeList,
} from '../types/anime';
import deviceUserAgent from './deviceUserAgent';

// NEXT: This feature will be available in next version
const localAPI = require('./animeLocalAPI');

class AnimeAPI {
  private static base_url = 'http://pnode2.danbot.host:4007/v4/';

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
    skipAutoRes?: boolean,
    signal?: AbortSignal,
  ): Promise<fromUrlJSON | 'Unsupported'> {
    const data = await fetch(
      this.base_url +
        `fromUrl?link=${link}${
          resolution !== undefined ? '&res=' + resolution : ''
        }${skipAutoRes !== undefined ? '&skipAutoRes=' + skipAutoRes : ''}`,
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
    // return await localAPI.fromUrl(link, resolution, skipAutoRes, signal) as fromUrlJSON;
  }
  
  static async listAnime(signal?: AbortSignal): Promise<listAnimeTypeList[]> {
    const data = await fetch(
      this.base_url +
        'listAnime',
        {
          signal,
          headers: {
            'User-Agent': deviceUserAgent,
          }
        }
    ).then(a => a.json()) as listAnimeTypeList[];
    return data;
  }
}

type fromUrlJSON = SingleEps | EpsList | FromUrlMaintenance | Blocked;

export default AnimeAPI;
