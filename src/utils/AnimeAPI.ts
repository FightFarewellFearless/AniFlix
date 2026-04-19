import {
  AniDetail,
  AniStreaming,
  EpisodeBaruHome,
  listAnimeTypeList,
  NewAnimeList,
  SearchAnime,
} from '@/types/anime';
import { ToastAndroid } from 'react-native';
import { setWebViewOpen } from './CFBypass';
import deviceUserAgent from './deviceUserAgent';
import {
  BASE,
  fetchStreamingResolution,
  fromUrl,
  jadwalAnime,
  listAnime,
  newAnime,
  searchAnime,
} from './scrapers/animeSeries';

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

    const [newAnimeRelease, jadwalAnimeRelease] = await Promise.all([
      newAnime(undefined, signal),
      jadwalAnime(signal),
    ]);

    return {
      newAnime: newAnimeRelease,
      jadwalAnime: jadwalAnimeRelease,
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

    return await newAnime(page, signal);
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
    const { status } = await fetch(BASE.url + `/?s=${query}&post_type=anime`, {
      method: 'HEAD',
      signal,
      headers: {
        'User-Agent': deviceUserAgent,
      },
    });
    if (status === 403) {
      setWebViewOpen.openWebViewCF(true, BASE.url + `/?s=${query}&post_type=anime`);
      throw new Error('Silahkan selesaikan captcha');
    }
    return {
      result: await searchAnime(query, signal),
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
        method: 'HEAD',
        signal,
      }).catch(err => {
        if (err instanceof Error && err.message.includes('Aborted')) throw new Error('canceled');
        else return err as Error;
      });
      if (statusCode instanceof Error) {
        throw statusCode;
      }
      if (statusCode.status === 403) {
        setWebViewOpen.openWebViewCF(true, link);
        throw new Error('Silahkan selesaikan captcha');
      }
      return (await fromUrl(link, resolution, skipAutoRes, detailOnly, signal)) as fromUrlJSON;
    } catch (e: any) {
      // console.error(e.message)
      if (e.message === 'Silahkan selesaikan captcha') {
        ToastAndroid.show('Silahkan selesaikan captcha', ToastAndroid.SHORT);
        throw e;
      } else if (
        e.message !== 'Network Error' ||
        e.name !== 'AbortError' ||
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
    return await listAnime(signal, streamingCallback);
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

    return await fetchStreamingResolution(
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
