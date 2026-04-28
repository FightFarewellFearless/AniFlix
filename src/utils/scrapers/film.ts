import { Datum, Datum2, HomepageApiResponse } from './filmTypes/homepage';
import { LatestMoviesResponse } from './filmTypes/latestMovies';

import deviceUserAgent from '@utils/deviceUserAgent';
import { ClaimApi } from './filmTypes/claimApi';
import { LatestSeriesResponse } from './filmTypes/latestSeries';
import { FilmMovieDetailsResponse } from './filmTypes/movie';
import { RedeemApi } from './filmTypes/redeemApi';
import { SearchFilmResponse } from './filmTypes/searchFilm';
import { SeriesDetailsResponse } from './filmTypes/series';
import { SeriesEpisodeResponse } from './filmTypes/seriesEpisode';
import { SeriesSeasonResponse } from './filmTypes/seriesSeason';

type FilmHomePage = Array<{
  title: string;
  url: string;
  contentType: string;
  thumbnailUrl: string;
  year: string;
  rating: string;
}>;
type SearchResult = Array<
  Omit<FilmHomePage[number], 'contentType'> & {
    synopsis: string;
    numberOfSeasons?: number;
    quality?: string;
    type: string;
  }
>;

type HlsVariant = {
  bw: number;
  resolution: string;
  name: string;
  url: string;
};

export type HashProgressData = {
  difficulty: number;
  elapsed: number;
  isCompleted: boolean;
  canSpeedUp?: boolean;
  isSpeedingUp?: boolean;
};
// TODO: Check this in about a month or two, and plan to remove quick crypto entirely and uninstall it depending on future needs
// async function solveChallenge(
//   challenge: string,
//   difficulty: number,
//   signal?: AbortSignal,
//   onProgress?: (data: HashProgressData, triggerSpeedUp?: () => void) => void,
// ): Promise<number | undefined> {
//   if (signal?.aborted) return undefined;

//   let interval: ReturnType<typeof setInterval> | undefined;
//   let elapsed = 0;
//   let speedUpActive = false;

//   const shouldStop = createSynchronizable(false);
//   const shouldSpeedUp = createSynchronizable(false);

//   const triggerSpeedUp = () => {
//     if (!speedUpActive) {
//       speedUpActive = true;
//       shouldSpeedUp.setBlocking(true);
//       if (onProgress) {
//         onProgress({
//           difficulty,
//           elapsed,
//           isCompleted: false,
//           canSpeedUp: false,
//           isSpeedingUp: true,
//         });
//       }
//     }
//   };

//   if (onProgress) {
//     onProgress(
//       { difficulty, elapsed, isCompleted: false, canSpeedUp: false, isSpeedingUp: false },
//       triggerSpeedUp,
//     );
//     interval = setInterval(() => {
//       elapsed++;
//       if (onProgress) {
//         onProgress(
//           {
//             difficulty,
//             elapsed,
//             isCompleted: false,
//             canSpeedUp: elapsed >= 5 && !speedUpActive,
//             isSpeedingUp: speedUpActive,
//           },
//           triggerSpeedUp,
//         );
//       }
//     }, 1000);
//   }

//   const onAbort = () => {
//     shouldStop.setBlocking(true);
//   };
//   if (signal) {
//     signal.addEventListener('abort', onAbort, { once: true });
//   }

//   const hashObj = NitroModules.createHybridObject<NativeHash>('Hash');
//   const targetPrefix = '0'.repeat(difficulty);
//   const maxAttempts = 1e7;

//   let currentNonce = 0;
//   let finalNonce: number | undefined;

//   const singleRes = await runOnRuntimeAsync(AniFlixRuntime, () => {
//     'worklet';
//     for (let nonce = 0; nonce < maxAttempts; nonce++) {
//       if (shouldStop.getDirty()) return { status: 'aborted' as const, nonce };
//       if (shouldSpeedUp.getDirty()) return { status: 'speedup' as const, nonce };

//       const data = challenge + String(nonce);
//       hashObj.createHash('sha256');
//       hashObj.update(data);
//       const hash = cryptoUtils.bufferToString(hashObj.digest('hex'), 'hex');

//       if (hash.startsWith(targetPrefix)) {
//         return { status: 'found' as const, nonce };
//       }
//     }
//     return { status: 'failed' as const, nonce: maxAttempts };
//   });

//   if (singleRes?.status === 'found') {
//     finalNonce = singleRes.nonce;
//   } else if (singleRes?.status === 'speedup') {
//     currentNonce = singleRes.nonce;

//     const TOTAL_THREADS = 4;
//     const extraRuntimes = Array.from({ length: TOTAL_THREADS - 1 }).map((_, i) =>
//       createWorkletRuntime(`HashWorker_${i + 1}`),
//     );

//     const activeRuntimes = [AniFlixRuntime, ...extraRuntimes];

//     const promises = activeRuntimes.map(async (runtime, workerId) => {
//       const multiHashObj = NitroModules.createHybridObject<NativeHash>('Hash');
//       const Worker_Length = activeRuntimes.length;

//       const mRes = await runOnRuntimeAsync(runtime, () => {
//         'worklet';
//         for (let nonce = currentNonce + workerId; nonce < maxAttempts; nonce += Worker_Length) {
//           if (shouldStop.getDirty()) break;

//           const data = challenge + String(nonce);
//           multiHashObj.createHash('sha256');
//           multiHashObj.update(data);
//           const hash = cryptoUtils.bufferToString(multiHashObj.digest('hex'), 'hex');

//           if (hash.startsWith(targetPrefix)) {
//             shouldStop.setBlocking(true);
//             return nonce;
//           }
//         }
//         return undefined;
//       });

//       multiHashObj.dispose();
//       return mRes;
//     });

//     const multiResults = await Promise.all(promises);
//     finalNonce = multiResults.find(n => n !== undefined);
//   }

//   hashObj.dispose();

//   if (signal) {
//     signal.removeEventListener('abort', onAbort);
//   }
//   if (interval) clearInterval(interval);

//   if (onProgress) {
//     onProgress({ difficulty, elapsed, isCompleted: true });
//   }
//   return finalNonce;
// }

// function extractDecryptedIframe(html: string): string {
//   const $ = cheerio.load(html);
//   const directIframe = $('iframe').attr('src');
//   if (directIframe) return directIframe;

//   const styleText = $('style').text();
//   const partBMatch = styleText.match(/--_[a-f0-9]+:"([a-f0-9]{32})"/i);
//   const partB = partBMatch ? partBMatch[1] : null;

//   const vaultDiv = $('div[data-a][data-p][data-v]');
//   const partA = vaultDiv.attr('data-a');
//   const dataP = vaultDiv.attr('data-p'); // Ciphertext (base64)
//   const dataV = vaultDiv.attr('data-v'); // IV (base64)

//   if (partA && partB && dataP && dataV) {
//     const keyHex = partA + partB;
//     const key = Buffer.from(keyHex, 'hex');
//     const iv = Buffer.from(dataV, 'base64');
//     const encryptedData = Buffer.from(dataP, 'base64');

//     const authTag = encryptedData.subarray(encryptedData.length - 16) as any;
//     const ciphertext = encryptedData.subarray(0, encryptedData.length - 16);

//     const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
//     decipher.setAuthTag(authTag);

//     const decryptedBuffer = decipher.update(ciphertext);
//     const finalBuffer = decipher.final();
//     const decryptedUrl = Buffer.concat([decryptedBuffer, finalBuffer]).toString('utf8');

//     return decryptedUrl;
//   }

//   throw new Error('Gagal mengekstrak atau mendekripsi URL video dari embed.');
// }

// async function getChallengeAndSolve(
//   contentId: string,
//   contentType: 'movie' | 'episode',
//   slug: string,
//   signal?: AbortSignal,
//   onProgress?: (data: HashProgressData, triggerSpeedUp?: () => void) => void,
// ): Promise<string> {
//   const apiUrl = `${BASE_URL}/api/watch/challenge`;
//   const response: ChallengeResponse = await fetchPage(apiUrl, {
//     headers: {
//       accept: '*/*',
//       'content-type': 'application/json',
//       origin: BASE_URL,
//       referer: BASE_URL + `/${contentType === 'movie' ? 'movie' : 'series'}/${slug}`,
//     },
//     body: JSON.stringify({ contentId, contentType }),
//     method: 'POST',
//     signal,
//     asJson: true,
//   });
//   const { challenge, difficulty, signature } = response;
//   const nonce = await solveChallenge(challenge, difficulty, signal, onProgress);

//   const solveResponse: SolveChallengeResponse = await fetchPage(BASE_URL + '/api/watch/solve', {
//     headers: {
//       accept: '*/*',
//       'content-type': 'application/json',
//       origin: BASE_URL,
//       referer: BASE_URL + `/${contentType === 'movie' ? 'movie' : 'series'}/${slug}`,
//     },
//     body: JSON.stringify({ challenge, nonce, signature }),
//     method: 'POST',
//     signal,
//     asJson: true,
//   });
//   global.gc?.();
//   return solveResponse.embedUrl;
// }

function resolveMasterPlaylist(content: string, masterUrl: string): HlsVariant[] {
  if (!content.includes('#EXT-X-STREAM-INF')) return [];
  const lines = content.split('\n');
  const variants: HlsVariant[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('#EXT-X-STREAM-INF')) {
      const bw = (lines[i].match(/BANDWIDTH=(\d+)/) || [0, '0'])[1];
      const res = (lines[i].match(/RESOLUTION=(\d+x\d+)/) || [0, 'Unknown'])[1];
      const name = (lines[i].match(/NAME="([^"]+)"/) || [0, res !== 'Unknown' ? res : 'Auto'])[1];
      let j = i + 1;
      while (j < lines.length && (lines[j].trim() === '' || lines[j].trim().startsWith('#'))) j++;
      if (j < lines.length) {
        const u = lines[j].trim();
        const fullUrl = u.startsWith('http') ? u : new URL(u, masterUrl).toString();
        variants.push({
          bw: parseInt(bw),
          resolution: res,
          name: name,
          url: fullUrl,
        });
      }
    }
  }
  variants.sort((a, b) => b.bw - a.bw);
  return variants;
}

export const __ALIAS = 'idlix';
export const FILM_DOMAIN = 'z1.idlixku.com';
export const FILM_BASE_URL = 'https://' + FILM_DOMAIN;
const BASE_URL = FILM_BASE_URL;
function fetchPage(url: string, opt?: RequestInit & { asJson?: false }): Promise<string>;
function fetchPage(url: string, opt?: RequestInit & { asJson: true }): Promise<any>;
async function fetchPage(url: string, opt?: RequestInit & { asJson?: boolean }) {
  const response = await fetch(url, {
    headers: {
      'user-agent': deviceUserAgent,
      ...opt?.headers,
    },
    ...opt,
  });
  const asJson = opt?.asJson ?? false;
  return await (asJson ? response.json() : response.text());
}

// interface JeniusReturnData {
//   hls: boolean;
//   videoImage: null;
//   videoSource: string;
//   securedLink: string;
//   downloadLinks: any[];
//   attachmentLinks: any[];
//   ck: string;
//   subtitleTrackUrl?: string;
// }

// interface MajorPlayAPIReturnData {
//   expiresAt: number;
//   hlsUrl: string;
//   isLegacy: boolean;
//   mpdUrl: string;
//   primaryUrl: string;
//   subtitles: Subtitle[];
// }

// interface Subtitle {
//   label: string;
//   lang: string;
//   path: string;
// }

// async function majorplayGetHLS(urlObj: URL, signal?: AbortSignal): Promise<JeniusReturnData> {
//   const videoId = urlObj.pathname.split('/').at(-1)!;
//   const response: MajorPlayAPIReturnData = await fetchPage(
//     'https://e2e.majorplay.net/api/token/viewer?videoId=' + videoId,
//     {
//       signal,
//       asJson: true,
//       headers: {
//         'user-agent': deviceUserAgent,
//         referer: 'https://e2e.majorplay.net/embed/' + videoId,
//       },
//       method: 'GET',
//     },
//   );
//   return {
//     hls: true,
//     videoImage: null,
//     videoSource: response.primaryUrl,
//     securedLink: response.hlsUrl,
//     downloadLinks: [],
//     attachmentLinks: [],
//     ck: '',
//     subtitleTrackUrl:
//       response.subtitles.find(a => a.lang === 'id')?.path ?? response.subtitles[0]?.path,
//   };
// }

// async function jeniusPlayGetHLS(url: string, signal?: AbortSignal): Promise<JeniusReturnData> {
//   const html: string = await fetchPage(url, {
//     headers: {
//       referer: 'https://jeniusplay.com/',
//     },
//     signal,
//   });
//   if (html.includes('The video is currently being prepared')) {
//     throw new Error('Video sedang disiapkan, silakan coba lagi nanti');
//   }
//   const packedScript =
//     'eval(function(p,a,c,k,e,d)' +
//     html.split('eval(function(p,a,c,k,e,d)')[1].split('</script>')[0];
//   const unpacked = unpack(packedScript);

//   const subtitleTrackUrl: string | undefined = unpacked
//     .split('"kind":"captions","file":"')[1]
//     ?.split('"')[0]
//     .replace(/\\/g, '');
//   const fireplayerId = unpacked.split('FirePlayer("')[1].split('"')[0];

//   const params = new URLSearchParams();
//   params.append('hash', fireplayerId);
//   params.append('r', 'https://jeniusplay.com/');

//   const response = (await fetchPage(
//     'https://jeniusplay.com/player/index.php?data=' + fireplayerId + '&do=getVideo',
//     {
//       method: 'POST',
//       headers: {
//         accept: '*/*',
//         'accept-language': 'en-US,en;q=0.9',
//         'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
//         'x-requested-with': 'XMLHttpRequest',
//         'user-agent':
//           'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
//         referer: 'https://jeniusplay.com/video/' + fireplayerId,
//         origin: 'https://jeniusplay.com',
//       },
//       body: params.toString(),
//       signal,
//       asJson: true,
//     },
//   )) as any;
//   return { ...response, subtitleTrackUrl };
// }

async function getHomepage(signal?: AbortSignal) {
  const api: HomepageApiResponse = await fetchPage(BASE_URL + '/api/homepage', {
    signal,
    asJson: true,
  });
  const allSections = [...api.above, ...api.below];

  const mapContent = (item: Datum | Datum2) => {
    const data = 'content' in item ? item.content : item;
    if (!data) {
      return {
        title: 'Unknown',
        url: '#',
        thumbnailUrl: '',
        contentType: 'Unknown',
        year: 'Unknown',
        rating: 'Unknown',
      };
    }
    const contentType =
      'contentType' in item ? item.contentType : 'contentType' in data ? data.contentType : 'movie';
    const slug = 'slug' in item ? item.slug : data?.slug;
    return {
      title: data.title!,
      url: `${BASE_URL}/api/${contentType === 'movie' ? 'movies' : 'series'}/${slug}`,
      // url: `${BASE_URL}/${contentType === 'movie' ? 'movie' : 'series'}/${slug}`,
      contentType,
      thumbnailUrl: `https://image.tmdb.org/t/p/w500${data.posterPath}`,
      year: (data.releaseDate || data.firstAirDate || 'Unknown').split('-')[0],
      rating: data.voteAverage ?? 'Unknown',
    };
  };

  const featured = allSections.find(s => s.type === 'featured')?.data.map(mapContent) ?? [];
  const trending = allSections.find(s => s.type === 'trending')?.data.map(mapContent) ?? [];
  return {
    featured,
    trending,
  };
}
async function getLatestMovies(page = 1, signal?: AbortSignal) {
  const api: LatestMoviesResponse = await fetchPage(
    `${BASE_URL}/api/movies?page=${page}&limit=36&sort=createdAt`,
    {
      signal,
      asJson: true,
    },
  );
  return api.data.map(item => ({
    title: item.title,
    // url: `${BASE_URL}/movie/${item.slug}`,
    url: `${BASE_URL}/api/movies/${item.slug}`,
    thumbnailUrl: `https://image.tmdb.org/t/p/w500${item.posterPath}`,
    year: item.releaseDate.split('-')[0],
    contentType: 'movie',
    rating: item.voteAverage ?? 'Unknown',
  }));
}
async function getLatestSeries(page = 1, signal?: AbortSignal) {
  const api: LatestSeriesResponse = await fetchPage(
    `${BASE_URL}/api/series?page=${page}&limit=36&sort=createdAt`,
    {
      signal,
      asJson: true,
    },
  );

  return api.data.map(item => ({
    title: item.title,
    // url: `${BASE_URL}/series/${item.slug}`,
    url: `${BASE_URL}/api/series/${item.slug}`,
    thumbnailUrl: `https://image.tmdb.org/t/p/w500${item.posterPath}`,
    year: item.firstAirDate?.split('-')[0],
    contentType: 'tv_series',
    rating: item.voteAverage ?? 'Unknown',
  }));
}

async function searchFilm(query: string, signal?: AbortSignal) {
  const searchUrl = `${BASE_URL}/api/search?q=${encodeURIComponent(query)}&page=1&limit=24`;
  const api: SearchFilmResponse = await fetchPage(searchUrl, {
    signal,
    asJson: true,
  });
  return api.results.map(item => ({
    title: item.title,
    // url: `${BASE_URL}/${item.contentType === 'movie' ? 'movie' : 'series'}/${item.slug}`,
    url: `${BASE_URL}/api/${item.contentType === 'movie' ? 'movies' : 'series'}/${item.slug}`,
    thumbnailUrl: `https://image.tmdb.org/t/p/w500${item.posterPath}`,
    year: item.releaseDate?.split('-')[0] || item.firstAirDate?.split('-')[0] || 'Unknown',
    rating: String(item.voteAverage ?? 'Unknown'),
    numberOfSeasons: item.numberOfSeasons,
    quality: item.quality,
    synopsis: item.overview,
    type: item.contentType === 'movie' ? 'Movie' : 'Series',
  }));
}

type FilmInfo = {
  title: string;
  genres: string[];
  releaseDate: string;
  coverImage: string;
  backgroundImage: string;
  synopsis: string;
  additionalInfo: { [key: string]: string };
};
type FilmEpisode = {
  episodeImage: string;
  episodeNumber: string;
  episodeId: string;
  episodeTitle: string;
  episodeUrl: string;
  releaseDate: string;
};
type FilmSeason = {
  season: string;
  seasonNumber: number;
  episodes: FilmEpisode[];
};

function getFilmInfo(api: SeriesDetailsResponse | FilmMovieDetailsResponse) {
  const releaseDate = ('releaseDate' in api ? api.releaseDate : api.firstAirDate) || 'Unknown';
  const year = releaseDate.split('-')[0];
  const title = api.title + `${year ? ` (${year})` : ''}`;
  const genres = api.genres?.map(g => g.name) || [];
  const coverImage = `https://image.tmdb.org/t/p/w500${api.posterPath}`;
  const backgroundImage = `https://image.tmdb.org/t/p/w780${api.backdropPath}`;
  const synopsis = api.overview || 'No synopsis available.';
  const additionalInfo: { [key: string]: string } = {};
  additionalInfo.Rating = api.voteAverage ? String(api.voteAverage) : 'Unknown';
  if ('runtime' in api && api.runtime) {
    additionalInfo['Rata-rata waktu tonton'] = `${api.runtime} menit`;
  }
  additionalInfo.Popularitas = api.popularity ? String(api.popularity) : 'Unknown';
  additionalInfo['Bahasa Asli'] = api.originalLanguage || 'Unknown';
  additionalInfo.Negara = api.country || 'Unknown';
  additionalInfo.Status = api.status || 'Unknown';
  additionalInfo.Produksi = api.productionCompanies
    ? api.productionCompanies.map(p => p.name).join(', ')
    : 'Unknown';
  if ('numberOfSeasons' in api && api.numberOfSeasons) {
    additionalInfo['Total season'] = api.numberOfSeasons.toString();
  }
  return { title, genres, releaseDate, coverImage, backgroundImage, synopsis, additionalInfo };
}

type FilmDetails_Detail = {
  type: 'detail';
  info: FilmInfo;
  defaultSeason: FilmSeason;
  seasons: number[];
};
type FilmDetail_Stream = {
  type: 'stream';
  streamingLink: string;
  subtitleLink?: string;
  title: string;
  originalLanguage: string;
  quality?: string;
  country: string;
  director?: string;
  releaseDate: string;
  backgroundImage: string;
  rating: string;
  genres: string[];
  synopsis: string;
  thumbnailUrl: string;
  season?: string;
  episode?: string;
  next?: string;
  prev?: string;
  variants?: HlsVariant[];
};
type FilmDetails = FilmDetails_Detail | FilmDetail_Stream;
type PossibleAPIResponse = SeriesDetailsResponse | SeriesEpisodeResponse | FilmMovieDetailsResponse;

async function getFilmDetails(
  filmUrl: string,
  signal?: AbortSignal,
  // onProgress?: (data: HashProgressData, triggerSpeedUp?: () => void) => void,
): Promise<FilmDetails> {
  const api: PossibleAPIResponse = await fetchPage(filmUrl, { signal, asJson: true });
  if ('defaultSeason' in api) {
    const info = getFilmInfo(api);
    const seasons = api.seasons.map(s => s.seasonNumber);
    const defaultSeason = {
      season: `Season ${api.defaultSeason.seasonNumber}`,
      seasonNumber: api.defaultSeason.seasonNumber,
      episodes: api.defaultSeason.episodes.map(e => ({
        episodeImage: `https://image.tmdb.org/t/p/w500${e.stillPath}`,
        episodeNumber: `${api.defaultSeason.seasonNumber} - ${e.episodeNumber}`,
        episodeId: e.id,
        episodeTitle: e.name,
        episodeUrl: `${BASE_URL}/api/series/${api.slug}/season/${api.defaultSeason.seasonNumber}/episode/${e.episodeNumber}`,
        releaseDate: e.airDate,
      })),
    };
    return { type: 'detail', info, defaultSeason, seasons };
  }
  if ('episode' in api) {
    const epApi = api;
    // const embedUrl = await getChallengeAndSolve(
    //   epApi.episode.id,
    //   'episode',
    //   epApi.series.slug,
    //   signal,
    //   onProgress,
    // );
    // const embedHtml = await fetchPage(BASE_URL + embedUrl, { signal });
    // const extractedEmbedUrl = extractDecryptedIframe(embedHtml);
    // const extractedEmbedUrlObj = new URL(extractedEmbedUrl);
    // let jeniusPlay: JeniusReturnData;
    // if (extractedEmbedUrlObj.host.includes('jeniusplay')) {
    //   jeniusPlay = await jeniusPlayGetHLS(extractedEmbedUrl, signal);
    // } else {
    //   jeniusPlay = await majorplayGetHLS(extractedEmbedUrlObj, signal);
    // }
    const claimApi: ClaimApi = await fetchPage(
      BASE_URL + '/api/watch/play-info/episode/' + epApi.episode.id,
      {
        signal,
        asJson: true,
      },
    );
    const redeemVid: RedeemApi = await fetchPage(claimApi.redeemUrl, {
      method: 'POST',
      asJson: true,
      body: JSON.stringify({ claim: claimApi.claim }),
    });
    let variants: HlsVariant[] = [];
    try {
      const manifestContent = await fetchPage(redeemVid.url, { signal });
      variants = resolveMasterPlaylist(manifestContent, redeemVid.url);
    } catch (e) {}

    const episodes = epApi.season.episodes;
    const currentIdx = episodes.findIndex(e => e.id === epApi.episode.id);

    const nextEp = episodes[currentIdx + 1];
    const prevEp = episodes[currentIdx - 1];

    const genres: string[] = await fetchPage(`${BASE_URL}/api/series/${epApi.series.slug}`, {
      signal,
      asJson: true,
    }).then(res => res.genres.map((g: any) => g.name));

    const year = epApi.series.firstAirDate?.split('-')[0];

    return {
      type: 'stream',
      title: epApi.series.title + `${year ? ` (${year})` : ''}`,
      originalLanguage: epApi.series.originalLanguage,
      country: epApi.series.country,
      streamingLink: redeemVid.url,
      subtitleLink:
        redeemVid.subtitles.find(s => s.lang === 'id')?.path ?? redeemVid.subtitles[0]?.path,
      releaseDate: epApi.episode.airDate,
      rating: epApi.episode.voteAverage || '0',
      genres,
      synopsis: epApi.episode.overview || 'Tidak ada deskripsi episode.',
      thumbnailUrl: `https://image.tmdb.org/t/p/w500${epApi.series.posterPath}`,
      backgroundImage: `https://image.tmdb.org/t/p/w780${epApi.series.backdropPath}`,
      season: epApi.season.seasonNumber.toString(),
      episode: epApi.episode.episodeNumber.toString(),
      next: nextEp
        ? `${BASE_URL}/api/series/${epApi.series.slug}/season/${epApi.season.seasonNumber}/episode/${nextEp.episodeNumber}`
        : undefined,
      prev: prevEp
        ? `${BASE_URL}/api/series/${epApi.series.slug}/season/${epApi.season.seasonNumber}/episode/${prevEp.episodeNumber}`
        : undefined,
      variants,
    };
  }

  // (Halaman Movie/Film)
  const movieApi = api;
  // const embedUrl = await getChallengeAndSolve(
  //   movieApi.id,
  //   'movie',
  //   movieApi.slug,
  //   signal,
  //   onProgress,
  // );
  // const embedHtml = await fetchPage(BASE_URL + embedUrl, { signal });
  // const extractedEmbedUrl = extractDecryptedIframe(embedHtml);
  // const extractedEmbedUrlObj = new URL(extractedEmbedUrl);
  // let jeniusPlay: JeniusReturnData;
  // if (extractedEmbedUrlObj.host.includes('jeniusplay')) {
  //   jeniusPlay = await jeniusPlayGetHLS(extractedEmbedUrl, signal);
  // } else {
  //   jeniusPlay = await majorplayGetHLS(extractedEmbedUrlObj, signal);
  // }

  const claimApi: ClaimApi = await fetchPage(
    BASE_URL + '/api/watch/play-info/movie/' + movieApi.id,
    {
      signal,
      asJson: true,
    },
  );
  const redeemVid: RedeemApi = await fetchPage(claimApi.redeemUrl, {
    method: 'POST',
    asJson: true,
    body: JSON.stringify({ claim: claimApi.claim }),
  });

  let variants: HlsVariant[] = [];
  try {
    const manifestContent = await fetchPage(redeemVid.url, { signal });
    variants = resolveMasterPlaylist(manifestContent, redeemVid.url);
  } catch (e) {}

  const year = movieApi.releaseDate?.split('-')[0];

  return {
    type: 'stream',
    title: movieApi.title + `${year ? ` (${year})` : ''}`,
    originalLanguage: movieApi.originalLanguage,
    quality: movieApi.quality,
    country: movieApi.country,
    director: movieApi.director,
    streamingLink: redeemVid.url,
    subtitleLink:
      redeemVid.subtitles.find(s => s.lang === 'id')?.path ?? redeemVid.subtitles[0]?.path,
    releaseDate: movieApi.releaseDate,
    rating: movieApi.voteAverage || '0',
    genres: movieApi.genres?.map(g => g.name) || [],
    synopsis: movieApi.overview || 'Tidak ada sinopsis.',
    thumbnailUrl: `https://image.tmdb.org/t/p/w500${movieApi.posterPath}`,
    backgroundImage: `https://image.tmdb.org/t/p/w780${movieApi.backdropPath}`,
    variants,
  };
}

async function getFilmSeasonDetails(seasonUrl: string, signal?: AbortSignal): Promise<FilmSeason> {
  const api: SeriesSeasonResponse = await fetchPage(seasonUrl, { signal, asJson: true });
  return {
    season: `Season ${api.season.seasonNumber}`,
    seasonNumber: api.season.seasonNumber,
    episodes: api.season.episodes.map(e => ({
      episodeImage: `https://image.tmdb.org/t/p/w500${e.stillPath}`,
      episodeNumber: `${api.season.seasonNumber} - ${e.episodeNumber}`,
      episodeId: e.id,
      episodeTitle: e.name,
      episodeUrl: `${BASE_URL}/api/series/${api.series.slug}/season/${api.season.seasonNumber}/episode/${e.episodeNumber}`,
      releaseDate: e.airDate,
    })),
  };
}

export {
  getFilmDetails,
  getFilmSeasonDetails,
  getHomepage,
  getLatestMovies,
  getLatestSeries,
  searchFilm,
};
export type {
  FilmDetail_Stream,
  FilmDetails,
  FilmDetails_Detail,
  FilmEpisode,
  FilmHomePage,
  FilmInfo,
  FilmSeason,
  HlsVariant,
  SearchResult,
};
