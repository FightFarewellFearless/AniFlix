import cheerio from 'cheerio';
import { ToastAndroid } from 'react-native';
import deviceUserAgent from '../deviceUserAgent';

const DOMAIN = 'komiku.org';
const BASE_URL = `https://${DOMAIN}`;
const API_URL = `https://api.${DOMAIN}`;

function normalizeUrl(url: string) {
  if (url === '') return url;
  return url.startsWith('http') ? url : `${BASE_URL}${url}`;
}

export interface LatestKomikuRelease {
  title: string;
  thumbnailUrl: string;
  detailUrl: string;
  type: 'Manga' | 'Manhwa' | 'Manhua';
  latestChapter: string;
  concept: string;
  shortDescription: string;
  additionalInfo: string;
}
export async function getLatestKomikuReleases(
  page: number = 1,
  signal?: AbortSignal,
): Promise<LatestKomikuRelease[]> {
  const response = await fetch(`${API_URL}/manga/page/${page}/`, {
    headers: { 'User-Agent': deviceUserAgent },
    signal,
  });
  const data = await response.text();
  const $ = cheerio.load(data);
  const list = $('div.bge');
  return list
    .map((i, el) => {
      const listItem = $(el);
      const title = listItem.find('div.kan h3').text().trim();
      const thumbnailUrl = listItem.find('img').attr('src') || '';
      const detailUrl = listItem.find('a').attr('href') || '';
      const type = listItem.find('div.tpe1_inf b').text().trim() as LatestKomikuRelease['type'];
      const latestChapter = listItem.find('div.new1').eq(1).find('span').eq(1).text().trim();
      const concept = listItem.find('div.tpe1_inf').clone().find('b').remove().end().text().trim();
      const shortDescription = listItem.find('div.kan p').text().trim();
      const additionalInfo = listItem.find('span.judul2').text().trim();
      return {
        title,
        thumbnailUrl: normalizeUrl(thumbnailUrl),
        detailUrl: normalizeUrl(detailUrl),
        type,
        latestChapter,
        concept,
        shortDescription,
        additionalInfo,
      };
    })
    .toArray();
}

export interface KomikuDetail {
  title: string;
  indonesianTitle: string;
  type: 'Manga' | 'Manhwa' | 'Manhua' | 'Data tidak tersedia';
  author: string;
  status: 'Ongoing' | 'End' | 'Data tidak tersedia';
  minAge: string;
  concept: string;
  readingDirection: string;
  headerImageUrl: string;
  thumbnailUrl: string;
  genres: string[];
  synopsis: string;
  chapters: {
    chapter: string;
    chapterUrl: string;
    releaseDate: string;
    views: string;
  }[];
}
export async function getKomikuDetailFromUrl(
  url: string,
  signal?: AbortSignal,
): Promise<KomikuDetail> {
  const response = await fetch(url, { signal, headers: { 'User-Agent': deviceUserAgent } });
  const data = await response.text();
  const $ = cheerio.load(data, {
    xmlMode: true,
    decodeEntities: false,
  });
  const tableInfo = $('table.inftable tr')
    .map((_i, el) => {
      const row = $(el).find('td');
      const key = row.eq(0).text().trim();
      const value = row.eq(1).text().trim();
      return { key, value };
    })
    .toArray();
  const title = tableInfo.find(item => item.key === 'Judul Komik')?.value ?? 'Data tidak tersedia';
  const indonesianTitle =
    tableInfo.find(item => item.key === 'Judul Indonesia')?.value ?? 'Data tidak tersedia';
  const type =
    (tableInfo.find(item => item.key === 'Jenis Komik')?.value as KomikuDetail['type']) ??
    'Data tidak tersedia';
  const author = tableInfo.find(item => item.key === 'Pengarang')?.value ?? 'Data tidak tersedia';
  const status =
    (tableInfo.find(item => item.key === 'Status')?.value as KomikuDetail['status']) ??
    'Data tidak tersedia';
  const minAge =
    tableInfo.find(item => item.key === 'Umur Pembaca')?.value ?? 'Data tidak tersedia';
  const concept =
    tableInfo.find(item => item.key === 'Konsep Cerita')?.value ?? 'Data tidak tersedia';
  const readingDirection =
    tableInfo.find(item => item.key === 'Cara Baca')?.value ?? 'Data tidak tersedia';
  const headerImageUrl = data.match(/url\((.*?)\)/)?.[1] ?? '';
  const thumbnailUrl = $('.ims > img').attr('src') ?? '';
  const genres = $('ul.genre > li')
    .map((_i, el) => $(el).text().trim())
    .toArray();
  const synopsis = $('section#Sinopsis > p').text().trim();
  const allChapterElements = $('table#Daftar_Chapter tr:has(td)').toArray();
  const batchSize = 150;
  const chapters = [];
  for (let i = 0; i < allChapterElements.length; i += batchSize) {
    if (signal?.aborted) break;
    const batch = allChapterElements.slice(i, i + batchSize);
    const batchResults = batch.map(el => {
      const td = $(el);
      const judulseries = td.find('.judulseries');
      const chapterUrl = judulseries.find('a').attr('href');
      return {
        chapter: judulseries.text().trim(),
        chapterUrl: normalizeUrl(chapterUrl ?? ''),
        releaseDate: td.find('.tanggalseries').text().trim(),
        views: td.find('.pembaca > i').text().trim(),
      };
    });
    chapters.push(...batchResults);
    await new Promise(resolve => setTimeout(resolve, 10));
  }

  if (signal?.aborted) throw new Error('canceled');

  return {
    title,
    indonesianTitle,
    type,
    author,
    status,
    minAge,
    concept,
    readingDirection,
    headerImageUrl,
    thumbnailUrl,
    genres,
    synopsis,
    chapters,
  };
}

export interface KomikuReading {
  title: string;
  chapter: string;
  thumbnailUrl: string;
  releaseDate: string;
  comicImages: string[];
  nextChapter: string | undefined;
  prevChapter: string | undefined;
}
export async function getKomikuReading(url: string, signal?: AbortSignal): Promise<KomikuReading> {
  const response = await fetch(url, { signal, headers: { 'User-Agent': deviceUserAgent } });
  const data = await response.text();
  const $ = cheerio.load(data, {
    xmlMode: true,
    decodeEntities: false,
  });
  const title = $('header > h1').text().trim() || 'Data tidak tersedia';
  const chapter =
    $('div[data-chapter-title]').attr('data-chapter-title')?.trim() || 'Data tidak tersedia';
  let thumbnailUrl = data.split("data[5] = '")[1]?.split("'")[0];
  if (!thumbnailUrl) {
    const coverUrl = data
      .split('const data = [')[1]
      ?.split('];')[0]
      ?.split(',')
      .filter(a => a.trim() !== '')
      .at(-1)
      ?.trim()
      ?.replace(new RegExp('\'|"', 'g'), '');
    if (!coverUrl) {
      thumbnailUrl = data
        .split('thumbnail: "')[1]
        ?.split('"')[0]
        ?.replace(new RegExp('\\\\', 'g'), '');
      if (!thumbnailUrl) {
        ToastAndroid.show('Gagal mendapatkan url thumbnail', ToastAndroid.SHORT);
        thumbnailUrl = '';
      }
    } else thumbnailUrl = coverUrl;
  }
  const releaseDate = $('time[property="datePublished"]').text().trim() || 'Data tidak tersedia';
  const comicImages = $('div#Baca_Komik img')
    .map((_i, el) => {
      return $(el).attr('src');
    })
    .toArray();
  const nextChapter = normalizeUrl($('svg[data-icon="caret-right"]').parent().attr('href') ?? '');
  const prevChapter = normalizeUrl($('svg[data-icon="caret-left"]').parent().attr('href') ?? '');

  return {
    title,
    chapter,
    thumbnailUrl,
    releaseDate,
    comicImages,
    nextChapter: nextChapter === '' ? undefined : nextChapter,
    prevChapter: prevChapter === '' ? undefined : prevChapter,
  };
}

export interface KomikuSearch {
  title: string;
  thumbnailUrl: string;
  detailUrl: string;
  type: 'Manga' | 'Manhwa' | 'Manhua';
  latestChapter: string;
  concept: string;
  additionalInfo: string;
}
export async function komikuSearch(query: string, signal?: AbortSignal): Promise<KomikuSearch[]> {
  const response = await fetch(`${API_URL}/?post_type=manga&s=${query}`, {
    headers: { 'User-Agent': deviceUserAgent },
    signal,
  });
  const data = await response.text();
  const $ = cheerio.load(data);
  const list = $('div.bge');
  return list
    .map((i, el) => {
      const listItem = $(el);
      const title = listItem.find('div.kan h3').text().trim();
      const thumbnailUrl = listItem.find('img').attr('src') || '';
      const detailUrl = listItem.find('a').attr('href') || '';
      const type = listItem.find('div.tpe1_inf b').text().trim() as KomikuSearch['type'];
      const latestChapter = listItem.find('div.new1').eq(1).find('span').eq(1).text().trim();
      const concept = listItem.find('div.tpe1_inf').clone().find('b').remove().end().text().trim();
      const additionalInfo = listItem.find('div.kan p').text().trim();
      return {
        title,
        thumbnailUrl: normalizeUrl(thumbnailUrl),
        detailUrl: normalizeUrl(detailUrl),
        type,
        latestChapter,
        concept,
        additionalInfo,
      };
    })
    .toArray();
}
