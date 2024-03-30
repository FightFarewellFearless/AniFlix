import {
  AniDetail,
  Home,
  NewAnimeList,
  SearchAnime,
  AniStreaming,
  listAnimeTypeList,
} from '../types/anime';
import Anime from './animeLocalAPI';

class AnimeAPI {
  private static base_url = 'https://aniflix.pirles.ix.tc/v5/';

  static async home(signal?: AbortSignal): Promise<Home> {
    // const data = await fetch(this.base_url + 'home', {
    //   signal,
    //   headers: {
    //     'User-Agent': deviceUserAgent,
    //   },
    // });
    // return await (data.json() as Promise<Home>);

    const [newAnime, jadwalAnime] = await Promise.all([Anime.newAnime(undefined, signal), Anime.jadwalAnime(signal)]);

    return {
      newAnime,
      jadwalAnime,
      announcment: { enable: false },
      uptime: 0,
      waktuServer: 'Unavailable',
    }

  }

  static async newAnime(
    page: number | undefined = 1,
    signal?: AbortSignal,
  ): Promise<NewAnimeList[]> {
    // const data = await fetch(this.base_url + `newAnime?page=${page}`, {
    //   signal,
    //   headers: {
    //     'User-Agent': deviceUserAgent,
    //   },
    // });
    // return await (data.json() as Promise<NewAnimeList[]>);

    return await Anime.newAnime(page, signal);

  }

  static async search(
    query: string,
    signal?: AbortSignal,
  ): Promise<SearchAnime> {
    // const data = await fetch(
    //   this.base_url +
    //     `search?q=${query}`,
    //   {
    //     signal,
    //     headers: {
    //       'User-Agent': deviceUserAgent,
    //     },
    //   },
    // );
    // return await (data.json() as Promise<SearchAnime>);

    return {
      result: await Anime.searchAnime(query, signal)
    };
  }

  static async fromUrl(
    link: string,
    resolution?: string,
    skipAutoRes?: boolean,
    detailOnly?: boolean,
    signal?: AbortSignal,
  ): Promise<fromUrlJSON | 'Unsupported'> {
    // const data = await fetch(
    //   this.base_url +
    //     `fromUrl?link=${link}${
    //       resolution !== undefined ? '&res=' + resolution : ''
    //     }${skipAutoRes !== undefined ? '&skipAutoRes=' + skipAutoRes : ''}`,
    //   {
    //     signal,
    //     headers: {
    //       'User-Agent': deviceUserAgent,
    //     },
    //   },
    // );
    // const dataString = await data.text();
    // if (dataString === 'Unsupported') {
    //   return 'Unsupported';
    // }
    // const dataJson: fromUrlJSON = JSON.parse(dataString);
    // return dataJson;
    try {
      return await Anime.fromUrl(link, resolution, skipAutoRes, detailOnly, signal) as fromUrlJSON;
    } catch (e) {
      // console.error(e.message)
      // @ts-expect-error
      if(e.message !== 'Network Error' || e.message !== 'AbortError' || e.message !== 'canceled') {
        throw e;
      }
      return 'Unsupported';
    }
  }
  
  static async listAnime(signal?: AbortSignal, streamingCallback?: (data: listAnimeTypeList[]) => void): Promise<listAnimeTypeList[]> {
    // const data = await fetch(
    //   this.base_url +
    //     'listAnime',
    //     {
    //       signal,
    //       headers: {
    //         'User-Agent': deviceUserAgent,
    //       }
    //     }
    // ).then(a => a.json()) as listAnimeTypeList[];
    // return data;
    return await Anime.listAnime(signal, streamingCallback);
  }

  static async reqResolution(requestData: string, reqNonceAction: string, reqResolutionWithNonceAction: string, signal?: AbortSignal): Promise<string | undefined> {
    // const data = await fetch(
    //   this.base_url +
    //     `reqResolution?requestData=${requestData}&reqNonceAction=${reqNonceAction}&reqResolutionWithNonceAction=${reqResolutionWithNonceAction}`,
    //   {
    //     signal,
    //     headers: {
    //       'User-Agent': deviceUserAgent,
    //     }
    //   }
    // ).then(a => a.text()) as string;
    // return data;

    return await Anime.fetchStreamingResolution(requestData, reqNonceAction, reqResolutionWithNonceAction, undefined, signal);
  }
}

type fromUrlJSON = AniStreaming | AniDetail;

export default AnimeAPI;
