import aniflixruntime from '@/misc/AniFlixRuntime';
import cheerio from 'cheerio';
import CryptoJS from 'crypto-js';
import he from 'he';
import moment from 'moment';
import { useEffect, useRef } from 'react';
import { ToastAndroid, View } from 'react-native';
import WebView from 'react-native-webview';
import { runOnRuntimeAsync } from 'react-native-worklets';

import { comics1FetchChapterSession } from '@utils/comics1SessionFetcher/comics1chaptersessionfetchercontext';
import { comics1FetchSession } from '@utils/comics1SessionFetcher/comics1sessionfetchercontext';
import deviceUserAgent from '@utils/deviceUserAgent';

// let isError = false;
export const __ALIAS = 'softkomik';
export const DOMAIN = __ALIAS + '.app';
const API_DOMAIN = 'v2.softdevices.my.id';
export const BASE_URL = `https://${DOMAIN}`; // export needed for referer header
const API_URL = `https://${API_DOMAIN}`;
const IMAGE_COVER_BASE_URL = 'https://cover.softdevices.my.id/softkomik-cover';
const CHAPTER_ENCRYPTION_KEY = 'nYTInq9MwR4pWa8yeXtu/2iO3t9nGP65WHpWEvqpEdU=';

type Enumerate<N extends number, Acc extends number[] = []> = Acc['length'] extends N
  ? Acc[number]
  : Enumerate<N, [...Acc, Acc['length']]>;

type IntRange<F extends number, T extends number> = Exclude<Enumerate<T>, Enumerate<F>> | T;

function normalizeUrl(url: string) {
  if (url === '') return url;
  return url.startsWith('http') ? url : `${BASE_URL}${url}`;
}
function compressedImageUrl(
  url: string,
  width: 16 | 32 | 48 | 64 | 96 | 128 | 256 | 384 = 256,
  quality: IntRange<1, 100> = 75,
) {
  if (url === '') return url;
  const encodedUrl = encodeURIComponent(url);
  return `${BASE_URL}/_next/image?url=${encodedUrl}&w=${width}&q=${quality}`;
}

export let Cookie = '';
async function updateCookie(signal?: AbortSignal) {
  const response = await fetch(BASE_URL + '/komik/update', {
    headers: { 'User-Agent': deviceUserAgent },
    signal,
    method: 'HEAD',
  });
  const cookies = response.headers
    .get('set-cookie')
    ?.split(',')
    .map(cookie => cookie.trim());
  if (cookies && cookies.length > 0) {
    Cookie = cookies.map(cookie => cookie.split(';')[0]).join('; ');
  }
}
export interface Session {
  token: string;
  sign: string;
  ex: number;
}
let currentSession: Partial<Session> = {};
async function getSessionPath(signal?: AbortSignal): Promise<string> {
  const onAbort = () => {
    comics1FetchSession.abortCleanup();
  };
  signal?.addEventListener('abort', onAbort, { once: true });
  const data: string = await new Promise((res, rej) =>
    comics1FetchSession.getSessionPath(res, rej),
  );
  signal?.removeEventListener('abort', onAbort);
  return data;
}
async function fetchNewSession(signal?: AbortSignal): Promise<Session> {
  const path = await getSessionPath(signal);
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: {
      Accept: 'application/json, text/plain, */*',
      'User-Agent': deviceUserAgent,
      Cookie,
      Referer: `${BASE_URL}/komik/update`,
    },
    signal,
  });
  const data: Session = await response.json();
  const sessionToken = data.token;
  const sessionSign = data.sign.split('|')[0];
  const expired = data.ex;
  return { token: sessionToken, sign: sessionSign, ex: expired };
}
async function getSession(signal?: AbortSignal): Promise<Session> {
  // if (isError) throw new Error('Data awal error, mohon muat ulang aplikasi');
  if (!Cookie) {
    await updateCookie(signal);
  }
  if (!currentSession.token || Date.now() > (currentSession.ex ?? Infinity)) {
    const newSession = await fetchNewSession(signal);
    currentSession = newSession;
    return newSession;
  }
  return currentSession as Session;
}

let currentChapterSession: Partial<Session> = {};
async function getChapterSessionPath(signal?: AbortSignal): Promise<string> {
  const onAbort = () => {
    comics1FetchChapterSession.abortCleanup();
  };
  signal?.addEventListener('abort', onAbort, { once: true });
  const data: string = await new Promise((res, rej) =>
    comics1FetchChapterSession.getChapterSessionPath(res, rej),
  );
  signal?.removeEventListener('abort', onAbort);
  return data;
}
async function fetchNewChapterSession(chapterUrl: string, signal?: AbortSignal): Promise<Session> {
  const path = await getChapterSessionPath(signal);
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: {
      Accept: 'application/json, text/plain, */*',
      'User-Agent': deviceUserAgent,
      Cookie,
      Referer: chapterUrl,
    },
    signal,
  });
  const data: Session = await response.json();
  const sessionToken = data.token;
  const sessionSign = data.sign.split('|')[0];
  const expired = data.ex;
  return { token: sessionToken, sign: sessionSign, ex: expired };
}

// not used for now, potentially gonna be removed in the future
async function getChapterSession(chapterUrl: string, signal?: AbortSignal): Promise<Session> {
  // if (isError) throw new Error('Data awal error, mohon muat ulang aplikasi');
  if (!Cookie) {
    await updateCookie(signal);
  }
  if (!currentChapterSession.token || Date.now() > (currentChapterSession.ex ?? Infinity)) {
    const newSession = await fetchNewChapterSession(chapterUrl, signal);
    currentChapterSession = newSession;
    return newSession;
  }
  return currentChapterSession as Session;
}

export interface LatestComicsRelease1 {
  title: string;
  thumbnailUrl: string;
  detailUrl: string;
  type: 'Manga' | 'Manhwa' | 'Manhua';
  latestChapter: string;
  updatedAt: string;
}
interface LatestReleaseJSON {
  _id: string;
  title: string;
  title_slug: string;
  post: string[] | string;
  status: string;
  type: 'manga' | 'manhwa' | 'manhua';
  gambar: string;
  latest_chapter: string;
  updated_at: string;
  visitor?: number;
  latestChapter: number;
}
export async function getLatestComicsReleases1(
  page: number = 1,
  signal?: AbortSignal,
): Promise<LatestComicsRelease1[]> {
  const session = await getSession(signal);
  const response = await fetch(`${API_URL}/komik?page=${page}&limit=24&sortBy=new`, {
    headers: {
      'User-Agent': deviceUserAgent,
      Referer: BASE_URL + '/komik/update',
      Origin: BASE_URL,
      'X-Token': session.token,
      'X-Sign': session.sign,
      Cookie,
    },
    signal,
  });
  // const data = await response.text();
  // const $ = cheerio.load(data, { xmlMode: true });
  // const json: LatestReleaseJSON[] = JSON.parse($('script#__NEXT_DATA__').text()).props.pageProps
  //   .data.data;
  const json: LatestReleaseJSON[] = await response.json().then(x => x.data);
  return json.map(x => {
    const title = he.decode(x.title ?? '');
    const thumbnailUrl = `${IMAGE_COVER_BASE_URL}/${x.gambar}`;
    const detailUrl = `${BASE_URL}/${x.title_slug}`;
    const type = capitalizeFirstLetter(x.type);
    const latestChapter = x.latest_chapter;
    const updatedAt = x.updated_at;
    return {
      title,
      thumbnailUrl: compressedImageUrl(normalizeUrl(thumbnailUrl)),
      detailUrl: normalizeUrl(detailUrl),
      type,
      latestChapter,
      updatedAt,
    };
  });
}

export interface ComicsDetail1 {
  title: string;
  altTitle: string;
  releaseYear?: string;
  type: 'Manga' | 'Manhwa' | 'Manhua';
  author: string | null;
  status: 'Ongoing' | 'Tamat';
  thumbnailUrl: string;
  // headerImageUrl: string;
  genres: string[];
  synopsis: string;
  chapters: {
    chapter: string;
    chapterUrl: string;
  }[];
}
interface ComicsDetailRawJSON {
  rating: Rating;
  _id: string;
  title: string;
  title_alt: string;
  sinopsis: string;
  author: string | null;
  tahun: null | string;
  status: 'ongoing' | 'tamat';
  type: LatestReleaseJSON['type'];
  gambar: string;
  latest_chapter: string;
  updated_at: string;
  title_slug: string;
  Genre: string[];
  visitor: number;
}

interface Rating {
  value: number;
  member: number;
}

interface ChaptersData {
  title: string;
  startChapter: StartChapter[];
  newChapter: StartChapter[];
  chapter: StartChapter[];
}

interface StartChapter {
  chapter: string;
}

interface ComicsDetailEncryptedPayload {
  data: ComicsDetailRawJSON;
  chapterData: ChaptersData;
}

async function getComicDetailPayloadFromUrl1(
  url: string,
  signal?: AbortSignal,
): Promise<ComicsDetailEncryptedPayload> {
  const response = await fetch(url, {
    headers: { 'User-Agent': deviceUserAgent, Cookie },
    signal,
  });
  const data = await response.text();
  const nextDataText = await runOnRuntimeAsync(aniflixruntime, () => {
    'worklet';
    return cheerio
      .load(data, {
        xmlMode: true,
        decodeEntities: false,
      })('script#__NEXT_DATA__')
      .text();
  });
  const pageProps = JSON.parse(nextDataText).props?.pageProps;
  const encryptedPayload = pageProps?._stk;
  if (typeof encryptedPayload !== 'string') {
    throw new Error('Failed to extract encrypted detail payload');
  }
  const decryptedPayload = CryptoJS.AES.decrypt(encryptedPayload, CHAPTER_ENCRYPTION_KEY).toString(
    CryptoJS.enc.Utf8,
  );
  if (!decryptedPayload) {
    throw new Error('Failed to decrypt detail payload');
  }
  return JSON.parse(decryptedPayload) as ComicsDetailEncryptedPayload;
}

export async function getComicsDetailFromUrl1(
  url: string,
  signal?: AbortSignal,
): Promise<ComicsDetail1> {
  const payload = await getComicDetailPayloadFromUrl1(url, signal);
  const json = payload.data;
  const chaptersData = payload.chapterData;
  const chapters = chaptersData.chapter.map(chapter => ({
    chapter: chapter.chapter,
    chapterUrl: `${BASE_URL}/${json.title_slug}/chapter/${chapter.chapter}`,
  }));
  const releaseYear = json.tahun ?? 'Tahun rilis tidak tersedia';
  const thumbnailUrl = compressedImageUrl(`${IMAGE_COVER_BASE_URL}/${json.gambar}`);
  // const headerImageUrl = IMAGE_COVER_BASE_URL + '/' + json.gambar;
  const genres = json.Genre;
  const synopsis = he.decode(json.sinopsis ?? 'Sinopsis tidak tersedia');
  const title = he.decode(json.title ?? '');
  const altTitle = json.title_alt;
  const type = capitalizeFirstLetter(json.type) as ComicsDetail1['type'];
  const author = json.author;
  const status = capitalizeFirstLetter(json.status);

  if (signal?.aborted) throw new Error('canceled');

  return {
    title,
    altTitle,
    releaseYear,
    type,
    author,
    status,
    thumbnailUrl,
    // headerImageUrl,
    genres,
    synopsis,
    chapters,
  };
}

export interface ComicsReading1 {
  title: string;
  chapter: string;
  thumbnailUrl: string;
  comicImages: string[];
  nextChapter: string | undefined;
  prevChapter: string | undefined;
}
interface ComicsReadingRawJSON {
  komik: Komik;
  chapter: string;
  data: Data;
  prevChapter?: Chapter[];
  nextChapter?: Chapter[];
  imgList?: string[];
}
interface ComicsReadingPayload {
  data: ComicsReadingRawJSON;
  imgList: string[];
}
interface Chapter {
  chapter: string;
}
interface Data {
  _id: string;
  chapter: string;
  imageSrc?: string[];
  imgList?: string[];
  backBS3?: boolean | string;
  storageInter2?: boolean | string;
}
interface Komik {
  rating: Rating;
  _id: string;
  link: string;
  title: string;
  title_slug: string;
  title_alt?: string;
  author: string;
  type: string;
  Genre: string[];
}
interface Rating {
  value: number;
  member: number;
}

async function getChapterImageId(html: string, signal?: AbortSignal): Promise<string> {
  const scriptSources = await runOnRuntimeAsync(aniflixruntime, () => {
    'worklet';
    return cheerio
      .load(html, {
        xmlMode: true,
        decodeEntities: false,
      })('script[src]')
      .map((_, element) => element.attribs.src)
      .get()
      .filter(src => /\/_next\/static\/chunks\//.test(src));
  });

  let fallbackImageId: string | undefined;
  for (const scriptSource of scriptSources) {
    const scriptUrl = new URL(scriptSource, BASE_URL).toString();
    const scriptResponse = await fetch(scriptUrl, {
      signal,
      headers: { 'User-Agent': deviceUserAgent, Cookie },
    });
    if (!scriptResponse.ok) continue;
    const scriptText = await scriptResponse.text();
    const imageId = /(?:let\s+t\s*=\s*)String\(\s*["']([A-Za-z0-9_-]{6,64})["']\s*\)/.exec(
      scriptText,
    )?.[1];
    if (imageId) return imageId;
    fallbackImageId ??= /String\(\s*["']([A-Za-z0-9_-]{6,64})["']\s*\)/.exec(scriptText)?.[1];
  }

  if (fallbackImageId) return fallbackImageId;
  throw new Error('Failed to extract chapter image id');
}

export async function getComicsReading1(
  url: string,
  signal?: AbortSignal,
): Promise<ComicsReading1> {
  const response = await fetch(url, {
    signal,
    headers: {
      'User-Agent': deviceUserAgent,
      Cookie,
    },
  });
  const data = await response.text();
  const buildId = /"buildId":"([^"]+)"/.exec(data)?.[1];
  if (!buildId) {
    throw new Error('Failed to extract chapter buildId');
  }
  const chapterPath = new URL(url).pathname;
  const chapterPathParts = chapterPath.split('/').filter(Boolean);
  const titleSlug = chapterPathParts.at(-2);
  const routeChapter = chapterPathParts.at(-1);
  if (!titleSlug || !routeChapter) {
    throw new Error('Failed to extract chapter route parameters');
  }
  const htmlPageProps = JSON.parse(
    await runOnRuntimeAsync(aniflixruntime, () => {
      'worklet';
      return cheerio
        .load(data, {
          xmlMode: true,
          decodeEntities: false,
        })('script#__NEXT_DATA__')
        .text();
    }),
  ).props?.pageProps;
  const htmlEncryptedPayload = htmlPageProps?._stk;
  if (typeof htmlEncryptedPayload !== 'string') {
    throw new Error('Failed to extract encrypted chapter HTML payload');
  }
  const htmlDecryptedPayload = CryptoJS.AES.decrypt(
    htmlEncryptedPayload,
    CHAPTER_ENCRYPTION_KEY,
  ).toString(CryptoJS.enc.Utf8);
  if (!htmlDecryptedPayload) {
    throw new Error('Failed to decrypt chapter HTML payload');
  }
  const htmlPayload = JSON.parse(htmlDecryptedPayload) as ComicsReadingPayload;
  const htmlChapter = htmlPayload.data;
  const imageId = await getChapterImageId(data, signal);
  const nextDataResponse = await fetch(
    `${BASE_URL}/_next/data/${buildId}${chapterPath}.json?title_slug=${encodeURIComponent(titleSlug)}&chapter=${encodeURIComponent(routeChapter)}`,
    {
      signal,
      headers: { 'User-Agent': deviceUserAgent, Cookie },
    },
  );
  const pageProps = (await nextDataResponse.json()).pageProps;
  const encryptedPayload = pageProps?._stk;
  if (typeof encryptedPayload !== 'string') {
    throw new Error('Failed to extract encrypted chapter payload');
  }
  const decryptedPayload = CryptoJS.AES.decrypt(encryptedPayload, CHAPTER_ENCRYPTION_KEY).toString(
    CryptoJS.enc.Utf8,
  );
  if (!decryptedPayload) {
    throw new Error('Failed to decrypt chapter payload');
  }
  const jsonPage = JSON.parse(decryptedPayload).data as ComicsReadingRawJSON;
  const title = jsonPage.komik.title;
  const chapter = jsonPage.chapter;
  const detailData = await getComicDetailPayloadFromUrl1(
    `${BASE_URL}/${jsonPage.komik.title_slug}`,
    signal,
  );
  const thumbnailUrl = compressedImageUrl(`${IMAGE_COVER_BASE_URL}/${detailData.data.gambar}`);
  const imageSources = (
    htmlPayload.imgList?.length
      ? htmlPayload.imgList
      : (htmlChapter.data.imageSrc ?? htmlChapter.data.imgList ?? [])
  ).map(src => {
    if (/^https?:\/\//i.test(src)) return src;
    const configuredBaseUrl =
      typeof htmlChapter.data.backBS3 === 'string' ? htmlChapter.data.backBS3 : undefined;
    const baseUrl =
      configuredBaseUrl ||
      (htmlChapter.data.backBS3 ? 'https://psy1.komik.im' : 'https://image.komik.im/softkomik');
    const imageUrl = `${baseUrl.replace(/\/+$/, '')}/${src.replace(/^\/+/, '')}`;
    return `${imageUrl}${imageUrl.includes('?') ? '&' : '?'}id=${encodeURIComponent(imageId)}`;
  });
  const comicImages = imageSources;
  const nextChapter = jsonPage.nextChapter ? jsonPage.nextChapter[0]?.chapter : '';
  const prevChapter = jsonPage.prevChapter ? jsonPage.prevChapter[0]?.chapter : '';
  return {
    title,
    chapter,
    thumbnailUrl,
    comicImages,
    nextChapter:
      nextChapter === '' || nextChapter === undefined
        ? undefined
        : BASE_URL + '/' + jsonPage.komik.title_slug + '/chapter/' + nextChapter,
    prevChapter:
      prevChapter === '' || prevChapter === undefined
        ? undefined
        : BASE_URL + '/' + jsonPage.komik.title_slug + '/chapter/' + prevChapter,
  };
}
// async function detectCDNImage(
//   $: CheerioAPI,
//   signal?: AbortSignal,
// ): Promise<
//   | null
//   | {
//       link: string;
//       name: string;
//       value: string;
//     }[]
// > {
//   const scriptUrl = $('script').eq(16).attr('src');
//   if (!scriptUrl) return null;
//   const scriptRes = await fetch(BASE_URL + scriptUrl, {
//     headers: { 'User-Agent': deviceUserAgent, Cookie },
//     signal,
//   });
//   const scriptData = await scriptRes.text();
//   const cdnMatch = scriptData.match(/(\[\{.*?CDN 1.*?\},?\])/g);
//   // eslint-disable-next-line no-new-func
//   return cdnMatch ? new Function(`return ${cdnMatch[1] ?? cdnMatch[0]}`)() : null;
// }
export interface ComicsSearch1 {
  title: string;
  thumbnailUrl: string;
  detailUrl: string;
  type: 'Manga' | 'Manhwa' | 'Manhua';
  latestChapter: string;
  status: string;
  additionalInfo: string;
}
interface SearchRawData {
  page: number;
  maxPage: number;
  data: Datum[];
}
interface Datum {
  _id: string;
  title: string;
  post: string[] | string;
  status: string;
  type: LatestReleaseJSON['type'];
  gambar: string;
  latest_chapter: string;
  updated_at: string;
  title_slug: string;
  visitor: number;
  latestChapter: number;
}
export async function comicsSearch1(query: string, signal?: AbortSignal): Promise<ComicsSearch1[]> {
  const session = await getSession(signal);
  const response = await fetch(
    `${API_URL}/komik?page=1&limit=24&sortBy=newKomik&name=${encodeURIComponent(query)}`,
    {
      headers: {
        Origin: BASE_URL,
        Referer: BASE_URL + '/komik/list?name=' + encodeURIComponent(query),
        'User-Agent': deviceUserAgent,
        'X-Token': session.token,
        'X-Sign': session.sign,
        Cookie,
      },
      signal,
    },
  );
  const data: SearchRawData = await response.json();
  return data.data.map(x => {
    const title = he.decode(x.title ?? '');
    const thumbnailUrl = compressedImageUrl(`${IMAGE_COVER_BASE_URL}/${x.gambar}`);
    const detailUrl = `${BASE_URL}/${x.title_slug}`;
    const type = capitalizeFirstLetter(x.type);
    const latestChapter = x.latest_chapter;
    const status = x.status;
    const additionalInfo = `Update ${moment(x.updated_at).fromNow()}`;
    return {
      title,
      thumbnailUrl: normalizeUrl(thumbnailUrl),
      detailUrl: normalizeUrl(detailUrl),
      type,
      latestChapter,
      status,
      additionalInfo,
    };
  });
}

function capitalizeFirstLetter<T extends string>(str: T): Capitalize<T> {
  if (!str) return str as Capitalize<T>;
  return (str.charAt(0).toUpperCase() + str.slice(1)) as Capitalize<T>;
}

type WebProps = {
  isWebViewShown: boolean;
  setIsWebViewShown: (state: boolean) => void;
  onComics1Ready: () => void;
};
// NOTE: UNUSED FOR NOW, MAYBE USED IN THE FUTURE TO HANDLE CLOUDFARE OR OTHER PROTECTION
export function Comics1WebView({ isWebViewShown, setIsWebViewShown, onComics1Ready }: WebProps) {
  const webviewRef = useRef<WebView>(null);
  useEffect(() => {
    // isError = false;
  }, []);
  useEffect(() => {
    if (isWebViewShown) {
      const timeout = setTimeout(() => {
        // isError = true;
        setIsWebViewShown(false);
        onComics1Ready();
        ToastAndroid.show('Gagal mengambil data movie: timeout', ToastAndroid.SHORT);
      }, 15_000);
      return () => {
        clearTimeout(timeout);
      };
    }
  }, [isWebViewShown, onComics1Ready, setIsWebViewShown]);
  return (
    <View style={{ height: 0, display: 'none' }}>
      {isWebViewShown && (
        <WebView
          ref={webviewRef}
          userAgent={deviceUserAgent}
          source={{ uri: BASE_URL + '/komik/update' }}
          setSupportMultipleWindows={false}
          onError={() => {
            // isError = true;
            setIsWebViewShown(false);
            onComics1Ready();
            ToastAndroid.show('Gagal mempersiapkan data untuk komik', ToastAndroid.SHORT);
          }}
          onNavigationStateChange={event => {
            if (event.title.toLowerCase().includes(__ALIAS) && event.loading === false) {
              setIsWebViewShown(false);
              onComics1Ready();
            } else if (event.title.toLowerCase().includes('error')) {
              // isError = true;
              setIsWebViewShown(false);
              onComics1Ready();
              ToastAndroid.show(
                'Error saat mempersiapkan data, coba lagi nanti',
                ToastAndroid.SHORT,
              );
            }
          }}
        />
      )}
    </View>
  );
}
