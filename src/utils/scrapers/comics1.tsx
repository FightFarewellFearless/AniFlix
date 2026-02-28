// import { Buffer } from 'buffer/';
import cheerio, { CheerioAPI } from 'cheerio';
// import CryptoJS from 'crypto-js';
import he from 'he';
import moment from 'moment';
import { useEffect, useRef } from 'react';
import { ToastAndroid, View } from 'react-native';
import WebView from 'react-native-webview';
import deviceUserAgent from '../deviceUserAgent';

// let isError = false;
export const __ALIAS = 'softkomik';
export const DOMAIN = __ALIAS + '.co';
const API_DOMAIN = 'v2.softdevices.my.id';
export const BASE_URL = `https://${DOMAIN}`; // export needed for referer header
const API_URL = `https://${API_DOMAIN}`;
const IMAGE_COVER_BASE_URL = 'https://cover.softdevices.my.id/softkomik-cover';

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

let Cookie = '';
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
interface Session {
  token: string;
  sign: string;
}
async function getSession(signal?: AbortSignal): Promise<Session> {
  // if (isError) throw new Error('Data awal error, mohon muat ulang aplikasi');
  if (!Cookie) {
    await updateCookie(signal);
  }
  const response = await fetch(`${BASE_URL}/api/sessions`, {
    headers: { 'User-Agent': deviceUserAgent, Cookie },
    signal,
  });
  const data: Session = await response.json();
  const sessionToken = data.token;
  const sessionSign = data.sign;
  return { token: sessionToken, sign: sessionSign };
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
      thumbnailUrl: normalizeUrl(thumbnailUrl),
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
export async function getComicsDetailFromUrl1(
  url: string,
  signal?: AbortSignal,
): Promise<ComicsDetail1> {
  const response = await fetch(url, {
    headers: { 'User-Agent': deviceUserAgent, Cookie },
    signal,
  });
  const data = await response.text();
  const buildId = /"buildId":"([^"]+)"/.exec(data)?.[1];
  if (!buildId) throw new Error('Failed to extract buildId');
  const titleSlug = new URL(url).pathname;
  const json = (await fetch(
    `${BASE_URL}/_next/data/${buildId}${titleSlug}.json?title_slug=${titleSlug.replace(/\//g, '')}`,
    {
      headers: { 'User-Agent': deviceUserAgent, Cookie },
      signal,
    },
  )
    .then(res => res.json())
    .then(x => x.pageProps.data)) as ComicsDetailRawJSON;
  const chapterUrl = `${API_URL}/komik/${json.title_slug}/chapter?limit=9999999`;
  const session = await getSession(signal);
  const chaptersResponse = await fetch(chapterUrl, {
    signal,
    headers: {
      'User-Agent': deviceUserAgent,
      'X-Token': session.token,
      'X-Sign': session.sign,
      Cookie,
    },
  });
  const chaptersData: ChaptersData = await chaptersResponse.json();
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
}
interface Chapter {
  chapter: string;
}
interface Data {
  _id: string;
  chapter: string;
  imageSrc: string[];
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
export async function getComicsReading1(
  url: string,
  signal?: AbortSignal,
): Promise<ComicsReading1> {
  const response = await fetch(url, { signal, headers: { 'User-Agent': deviceUserAgent, Cookie } });
  const data = await response.text();
  const $ = cheerio.load(data, {
    xmlMode: true,
    decodeEntities: false,
  });
  const jsonPage: ComicsReadingRawJSON = JSON.parse($('script#__NEXT_DATA__').text()).props
    .pageProps.data;
  const session = await getSession(signal);
  const jsonApi = await fetch(
    `${API_URL}/komik/${jsonPage.komik.title_slug}/chapter/${jsonPage.chapter}/img/${jsonPage.data._id}`,
    {
      headers: {
        'User-Agent': deviceUserAgent,
        'X-Token': session.token,
        'X-Sign': session.sign,
        Cookie,
      },
      signal,
    },
  ).then(res => res.json());
  const title = jsonPage.komik.title;
  const chapter = jsonPage.chapter;
  const thumbnailUrl = compressedImageUrl(
    await (async () => {
      const baseChapterUrl = `${BASE_URL}/${jsonPage.komik.title_slug}`;
      return (
        await fetch(baseChapterUrl, { headers: { 'User-Agent': deviceUserAgent, Cookie }, signal })
      )
        .text()
        .then(x => {
          return `${IMAGE_COVER_BASE_URL}/${/["']?gambar["']?\s*:\s*["']([^"']+)["']/.exec(x)?.[1]}`;
        })
        .catch(() => {
          return '';
        });
    })(),
  );
  const detectedCdn = await detectCDNImage($, signal);
  const cdn1 = detectedCdn?.[0]?.link;
  const comicImages = jsonApi.imageSrc.map((src: string) => {
    return (cdn1 ? cdn1 : `https://f1.${DOMAIN}/file/softkomik-image`) + '/' + src;
  });
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

async function detectCDNImage(
  $: CheerioAPI,
  signal?: AbortSignal,
): Promise<
  | null
  | {
      link: string;
      name: string;
      value: string;
    }[]
> {
  const scriptUrl = $('script').eq(16).attr('src');
  if (!scriptUrl) return null;
  const scriptRes = await fetch(BASE_URL + scriptUrl, {
    headers: { 'User-Agent': deviceUserAgent, Cookie },
    signal,
  });
  const scriptData = await scriptRes.text();
  const cdnMatch = scriptData.match(/(\[\{.*?CDN 1.*?\},?\])/);
  // eslint-disable-next-line no-new-func
  return cdnMatch ? new Function(`return ${cdnMatch[0]}`)() : null;
}
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
          source={{ uri: BASE_URL }}
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
