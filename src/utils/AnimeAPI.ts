import { ToastAndroid } from 'react-native';
import {
  AniDetail,
  AniStreaming,
  EpisodeBaruHome,
  listAnimeTypeList,
  NewAnimeList,
  SearchAnime,
} from '../types/anime';
import Anime from './animeLocalAPI';
import { setWebViewOpen } from './CFBypass';
import deviceUserAgent from './deviceUserAgent';

class AnimeAPI {
  private static base_url = 'https://aniflix.pirles.ix.tc/v5/';

  static async home(signal?: AbortSignal): Promise<EpisodeBaruHome> {
    // const data = await fetch(this.base_url + 'home', {
    //   signal,
    //   headers: {
    //     'User-Agent': deviceUserAgent,
    //   },
    // });
    // return await (data.json() as Promise<EpisodeBaruHome>);

    const [newAnime, jadwalAnime] = await Promise.all([
      Anime.newAnime(undefined, signal),
      Anime.jadwalAnime(signal),
    ]);

    return {
      newAnime,
      jadwalAnime,
    };
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

  static async search(query: string, signal?: AbortSignal): Promise<SearchAnime> {
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
      result: await Anime.searchAnime(query, signal),
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
      const statusCode = await fetch(link, {
        headers: {
          'User-Agent': deviceUserAgent,
        },
        method: 'GET',
        signal,
      }).catch(() => {
        throw new Error('canceled');
      });
      // if(statusCode instanceof Error) {
      //   throw statusCode;
      // }
      const html = await statusCode.text();
      const regex = /<title>(.*?)<\/title>/;
      const title = html.match(regex)?.[1];
      if (statusCode.status === 403 && title === 'Just a moment...') {
        setWebViewOpen.openWebViewCF(true, link);
        throw new Error('Silahkan selesaikan captcha');
      }
      return (await Anime.fromUrl(
        link,
        resolution,
        skipAutoRes,
        detailOnly,
        signal,
      )) as fromUrlJSON;
    } catch (e: any) {
      // console.error(e.message)
      if (e.message === 'Silahkan selesaikan captcha') {
        ToastAndroid.show('Silahkan selesaikan captcha', ToastAndroid.SHORT);
        throw e;
      } else if (
        e.message !== 'Network Error' ||
        e.message !== 'AbortError' ||
        e.message !== 'canceled'
      ) {
        throw e;
      }
      return 'Unsupported';
    }
  }

  static async listAnime(
    signal?: AbortSignal,
    streamingCallback?: (data: listAnimeTypeList[]) => void,
  ): Promise<listAnimeTypeList[]> {
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

  static async reqResolution(
    requestData: string,
    reqNonceAction: string,
    reqResolutionWithNonceAction: string,
    signal?: AbortSignal,
  ): Promise<string | undefined> {
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

    return await Anime.fetchStreamingResolution(
      requestData,
      reqNonceAction,
      reqResolutionWithNonceAction,
      undefined,
      signal,
    );
  }
}

type fromUrlJSON = AniStreaming | AniDetail;

export default AnimeAPI;
