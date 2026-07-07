import cheerio from 'cheerio';
import he from 'he';
import { URL } from 'react-native-url-polyfill';

export const __ALIAS = 'meionovels';
export const DOMAIN = __ALIAS + '.com';
const BASE_URL = `https://${DOMAIN}`;

export interface NovelLatestRelease {
  title: string;
  thumbnailUrl: string;
  type: string;
  detailUrl: string;
  latestChapter: string;
}
export async function getLatestNovelRelease(
  page = 1,
  signal?: AbortSignal,
): Promise<NovelLatestRelease[]> {
  const response = await fetch(`${BASE_URL}/page/${page}/`, { signal });
  const data = await response.text();
  const $ = cheerio.load(data);

  const list = $('div.page-listing-item .page-item-detail');
  return list
    .map((i, el) => {
      const item = $(el);
      const title = item.find('div.post-title a').text().trim();
      const thumbnailUrl = item.find('div.c-image-hover a img').attr('src') || '';
      const detailUrl = item.find('div.c-image-hover a').attr('href') || '';
      const type = item.find('span.manga-type').first().text().trim();
      const latestChapter = item.find('div.chapter-item span a').first().text().trim();
      return { title, thumbnailUrl, detailUrl, type, latestChapter };
    })
    .toArray();
}

export interface NovelDetail {
  title: string;
  thumbnailUrl: string;
  synopsis: string;
  author: string;
  genres: string[];
  type: string;
  tags: string[];
  chapters: {
    chapter: string;
    chapterUrl: string;
    releaseDate: string;
  }[];
}
export async function getNovelDetail(url: string, signal?: AbortSignal): Promise<NovelDetail> {
  const response = await fetch(url, { signal });
  const data = await response.text();
  const $ = cheerio.load(data);

  const container = $('div.site-content');

  const title = container.find('div.post-title > h1').first().text().trim();
  const thumbnailUrl = container.find('div.summary_image a img').attr('src') || '';
  const synopsis = container.find('div.summary__content.show-more').text().trim();

  const table = container.find('div.summary_content .post-content_item');
  const tableKeyValue = table
    .map((i, el) => {
      const item = $(el);
      const key = item.find('.summary-heading h5').text().trim();
      const value = item.find('.summary-content');
      return { key, value };
    })
    .toArray();
  const author =
    tableKeyValue
      .find(item => item.key.includes('Author'))
      ?.value.text()
      .trim() || '';
  const genres =
    tableKeyValue
      .find(item => item.key.includes('Genre'))
      ?.value.find('a')
      .map((i, el) => $(el).text().trim() ?? '')
      .toArray() ?? [];
  const tags =
    tableKeyValue
      .find(item => item.key.includes('Tag'))
      ?.value.find('a')
      .map((i, el) => $(el).text().trim() ?? '')
      .toArray() ?? [];
  const type =
    tableKeyValue
      .find(item => item.key.includes('Type'))
      ?.value.text()
      .trim() || '';

  const chapterRequestUrl = new URL(url);
  chapterRequestUrl.pathname = `${chapterRequestUrl.pathname}/ajax/chapters/`.replace(/\/+/g, '/');
  chapterRequestUrl.searchParams.set('t', '1');

  const chaptersResponse = await fetch(chapterRequestUrl.toString(), {
    headers: {
      accept: '*/*',
      'accept-language': 'en-US,en;q=0.9',
      'cache-control': 'no-cache',
      pragma: 'no-cache',
      priority: 'u=1, i',
      'sec-ch-ua': '"Google Chrome";v="149", "Chromium";v="149", "Not)A;Brand";v="24"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-origin',
      'x-requested-with': 'XMLHttpRequest',
      Referer: url,
    },
    body: null,
    method: 'POST',
    signal,
  });
  const chaptersData = await chaptersResponse.text();
  const $$ = cheerio.load(chaptersData);

  const chapters = $$('li.wp-manga-chapter')
    .map((i, el) => {
      const item = $$(el);
      const chapterLink = item.find('a');
      const chapter = chapterLink.text().trim();
      const chapterUrl = chapterLink.attr('href') || '';
      const releaseDate = item.find('span.chapter-release-date').text().trim();
      return { chapter, chapterUrl, releaseDate };
    })
    .toArray();

  return {
    title,
    thumbnailUrl,
    synopsis,
    author,
    type,
    genres,
    tags,
    chapters,
  };
}

export interface NovelReading {
  title: string;
  chapter: string;
  htmlReading: string;
  thumbnailUrl: string;
  prev?: string;
  next?: string;
}
export async function getNovelReading(url: string, signal?: AbortSignal): Promise<NovelReading> {
  const response = await fetch(url, { signal });
  const data = await response.text();
  const $ = cheerio.load(data, {
    xmlMode: true,
  });
  const rawTitleStr = $('#chapter-heading').text().trim();
  const rawTitle = rawTitleStr.split(rawTitleStr.includes('- Volume') ? '- Volume' : '- Chapter');
  const title = rawTitle[0].trim();
  const volumeNChapter = rawTitleStr.includes('- Volume')
    ? 'Volume' + rawTitle[1]
    : 'Chapter' + rawTitle[1];
  const htmlReading = he.decode($('.read-container').html() ?? '');
  const thumbnailUrl = $('meta[property="og:image"]').attr('content')!;
  const prev = $('.btn.prev_page').first().attr('href');
  const next = $('.btn.next_page').first().attr('href');
  return {
    title,
    chapter: volumeNChapter,
    htmlReading,
    thumbnailUrl,
    prev,
    next,
  };
}

export interface NovelSearch {
  title: string;
  thumbnailUrl: string;
  detailUrl: string;
  latestChapter: string;
  authors: string;
  genres: string[];
  status: string;
  releaseYear: string;
}
export async function searchNovel(query: string, signal?: AbortSignal): Promise<NovelSearch[]> {
  const response = await fetch(`${BASE_URL}/?s=${encodeURIComponent(query)}&post_type=wp-manga`, {
    signal,
  });
  const data = await response.text();
  const $ = cheerio.load(data);

  const loopContent = $('#loop-content');
  const searchResult: NovelSearch[] = [];

  loopContent.find('.c-tabs-item__content').each((_, el) => {
    const item = $(el);
    const title = item.find('a').first().attr('title')!;
    const thumbnailUrl = item.find('img').first().attr('src')!;
    const detailUrl = item.find('a').first().attr('href')!;
    const latestChapter = item.find('div.latest-chap span a').first().text().trim();
    const authors = item.find('div.mg_author > .summary-content a').text().trim();
    const genres = item
      .find('div.mg_genres > .summary-content a')
      .map((i, el) => $(el).text().trim() ?? '')
      .toArray();
    const status = item.find('div.mg_status > .summary-content').text().trim();
    const releaseYear = item.find('div.mg_release > .summary-content a').text().trim();
    searchResult.push({
      title,
      thumbnailUrl,
      detailUrl,
      latestChapter,
      authors,
      genres,
      status,
      releaseYear,
    });
  });

  return searchResult;
}
