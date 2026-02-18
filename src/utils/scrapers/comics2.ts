import cheerio from 'cheerio';
import deviceUserAgent from '../deviceUserAgent';

export const __ALIAS = 'komikindo';
const DOMAIN = __ALIAS + '.ch';
const BASE_URL = `https://${DOMAIN}`;

function normalizeUrl(url: string | undefined): string {
  if (!url) return '';
  return url.startsWith('http') ? url : `${BASE_URL}${url}`;
}

export interface LatestComicsRelease2 {
  title: string;
  thumbnailUrl: string;
  detailUrl: string;
  type: 'Manga' | 'Manhwa' | 'Manhua';
  latestChapter: string;
  updatedAt: string;
}

export interface ComicsDetail2 {
  title: string;
  altTitle: string;
  type: 'Manga' | 'Manhwa' | 'Manhua';
  author: string | null;
  status: 'Ongoing' | 'Tamat';
  thumbnailUrl: string;
  genres: string[];
  synopsis: string;
  chapters: {
    chapter: string;
    chapterUrl: string;
  }[];
}

export interface ComicsReading2 {
  title: string;
  chapter: string;
  thumbnailUrl: string;
  comicImages: string[];
  nextChapter: string | undefined;
  prevChapter: string | undefined;
}

export interface ComicsSearch2 {
  title: string;
  thumbnailUrl: string;
  detailUrl: string;
  type: 'Manga' | 'Manhwa' | 'Manhua';
  latestChapter: string;
  status: string;
  additionalInfo: string;
}

export async function getLatestComicsReleases2(
  page: number = 1,
  signal?: AbortSignal,
): Promise<LatestComicsRelease2[]> {
  const url = page === 1 ? `${BASE_URL}/komik-terbaru/` : `${BASE_URL}/komik-terbaru/page/${page}/`;

  const response = await fetch(url, {
    headers: { 'User-Agent': deviceUserAgent },
    signal,
  });

  const data = await response.text();
  const $ = cheerio.load(data, {
    xmlMode: true,
  });
  const results: LatestComicsRelease2[] = [];

  $('.animepost').each((i, el) => {
    const $el = $(el);

    const title = $el.find('.bigors .tt h3 a').text().trim();
    const detailUrl = $el.find('.animposx > a').attr('href') || '';

    let thumbnailUrl = $el.find('.limit img').attr('src') || '';
    if (thumbnailUrl.includes('data:image')) {
      thumbnailUrl = $el.find('.limit img').attr('data-src') || '';
    }

    const typeClass = $el.find('.limit span.typeflag').attr('class') || '';
    let type: 'Manga' | 'Manhwa' | 'Manhua' = 'Manga';
    if (typeClass.toLowerCase().includes('manhwa')) type = 'Manhwa';
    else if (typeClass.toLowerCase().includes('manhua')) type = 'Manhua';

    const latestChapter = $el.find('.bigors .adds .lsch a').text().trim();
    const updatedAt = $el.find('.bigors .adds .lsch .datech').text().trim();

    results.push({
      title,
      thumbnailUrl: normalizeUrl(thumbnailUrl),
      detailUrl: normalizeUrl(detailUrl),
      type,
      latestChapter,
      updatedAt,
    });
  });

  return results;
}

export async function getComicsDetailFromUrl2(
  url: string,
  signal?: AbortSignal,
): Promise<ComicsDetail2> {
  const response = await fetch(url, {
    headers: { 'User-Agent': deviceUserAgent },
    signal,
  });

  const data = await response.text();
  const $ = cheerio.load(data, {
    xmlMode: true,
  });

  const infoRoot = $('.infoanime');

  const title = infoRoot
    .find('.entry-title')
    .text()
    .replace(/^Komik\s+/i, '')
    .trim();

  const altTitle = infoRoot
    .find('.infox .spe span')
    .filter((_, el) => $(el).text().includes('Judul Alternatif:'))
    .text()
    .replace('Judul Alternatif:', '')
    .trim();

  const statusRaw = infoRoot
    .find('.infox .spe span')
    .filter((_, el) => $(el).text().includes('Status:'))
    .text()
    .replace('Status:', '')
    .trim();
  const status = statusRaw.toLowerCase() === 'berjalan' ? 'Ongoing' : 'Tamat';

  const author =
    infoRoot
      .find('.infox .spe span')
      .filter((_, el) => $(el).text().includes('Pengarang:'))
      .text()
      .replace('Pengarang:', '')
      .trim() || null;

  const typeRaw = infoRoot
    .find('.infox .spe span')
    .filter((_, el) => $(el).text().includes('Jenis Komik:'))
    .find('a')
    .text()
    .trim();

  let type: 'Manga' | 'Manhwa' | 'Manhua' = 'Manga';
  if (typeRaw.toLowerCase() === 'manhwa') type = 'Manhwa';
  if (typeRaw.toLowerCase() === 'manhua') type = 'Manhua';

  const thumbnailUrl = infoRoot.find('.thumb img').attr('src') || '';

  const theme =
    infoRoot
      .find('.infox .spe span')
      .filter((_, el) => $(el).text().includes('Tema:'))
      .find('a')
      .map((_, el) => $(el).text().trim())
      .toArray() || null;
  const content =
    infoRoot
      .find('.infox .spe span')
      .filter((_, el) => $(el).text().includes('Konten:'))
      .find('a')
      .map((_, el) => $(el).text().trim())
      .toArray() || null;
  const genresSet: Set<string> = new Set([...(theme ?? []), ...(content ?? [])]);
  infoRoot.find('.infox .genre-info a').each((_, el) => {
    genresSet.add($(el).text().trim());
  });
  const genres = Array.from(genresSet);

  const synopsis = $('#sinopsis .entry-content p').text().trim().replace(/\s+/g, ' ');

  const chapters: { chapter: string; chapterUrl: string }[] = [];
  $('#chapter_list ul li').each((_, el) => {
    const $el = $(el);
    const link = $el.find('.lchx a');
    const chapterTitle = link.text().trim();
    const chapterUrl = link.attr('href') || '';

    if (chapterTitle && chapterUrl) {
      chapters.push({
        chapter: chapterTitle,
        chapterUrl: normalizeUrl(chapterUrl),
      });
    }
  });

  if (signal?.aborted) throw new Error('canceled');

  return {
    title,
    altTitle,
    type,
    author,
    status,
    thumbnailUrl: normalizeUrl(thumbnailUrl),
    genres,
    synopsis,
    chapters,
  };
}

export async function getComicsReading2(
  url: string,
  signal?: AbortSignal,
): Promise<ComicsReading2> {
  const response = await fetch(url, {
    headers: { 'User-Agent': deviceUserAgent },
    signal,
  });

  const data = await response.text();
  const $ = cheerio.load(data, {
    xmlMode: true,
  });

  const rawTitle = $('.entry-title')
    .text()
    .replace(/^Komik\s+/i, '')
    .trim();
  let title = rawTitle;
  let chapter = '';
  const chapterMatch = rawTitle.match(/(.*?)\s+(Chapter\s+[\d\.]+.*)$/i);
  if (chapterMatch) {
    title = chapterMatch[1].trim();
    chapter = chapterMatch[2].trim();
  } else {
    chapter = 'Unknown';
  }

  const comicImages: string[] = [];
  $('#chimg-auh img').each((_, el) => {
    const $el = $(el);
    let src = $el.attr('src');

    if (!src || src.includes('data:image')) {
      src = $el.attr('data-src');
    }

    if (src) {
      comicImages.push(src.trim());
    }
  });

  const navRoot = $('.navig .nextprev').first();
  const prevLink = navRoot.find('a[rel="prev"]').attr('href') || undefined;
  const nextLink = navRoot.find('a[rel="next"]').attr('href') || undefined;
  const listLink = navRoot.find('a:has(.daftarch)').attr('href') || null;

  let thumbnailUrl = $('.infoanime .thumb img').attr('src') || '';

  if ((!thumbnailUrl || thumbnailUrl === '') && listLink) {
    try {
      const parentUrl = normalizeUrl(listLink);
      const parentResponse = await fetch(parentUrl, {
        headers: { 'User-Agent': deviceUserAgent },
        signal,
      });
      const parentData = await parentResponse.text();
      const $parent = cheerio.load(parentData, {
        xmlMode: true,
      });
      thumbnailUrl = $parent('.thumb img').attr('src') || '';
    } catch (error) {
      console.error('Failed to fetch parent thumbnail:', error);
    }
  }

  if (signal?.aborted) throw new Error('canceled');

  return {
    title,
    chapter,
    thumbnailUrl: normalizeUrl(thumbnailUrl),
    comicImages,
    nextChapter: nextLink ? normalizeUrl(nextLink) : undefined,
    prevChapter: prevLink ? normalizeUrl(prevLink) : undefined,
  };
}

export async function comicsSearch2(query: string, signal?: AbortSignal): Promise<ComicsSearch2[]> {
  const url = `${BASE_URL}/?s=${encodeURIComponent(query)}`;

  const response = await fetch(url, {
    headers: { 'User-Agent': deviceUserAgent },
    signal,
  });

  const data = await response.text();
  const $ = cheerio.load(data, {
    xmlMode: true,
  });
  const results: ComicsSearch2[] = [];

  $('.animepost').each((i, el) => {
    const $el = $(el);

    const title = $el.find('.bigors .tt h3 a').text().trim();
    const detailUrl = $el.find('.animposx > a').attr('href') || '';

    let thumbnailUrl = $el.find('.limit img').attr('src') || '';
    if (!thumbnailUrl || thumbnailUrl.includes('data:image')) {
      thumbnailUrl = $el.find('.limit img').attr('data-src') || '';
    }

    const typeClass = $el.find('.limit span.typeflag').attr('class') || '';
    let type: 'Manga' | 'Manhwa' | 'Manhua' = 'Manga';
    if (typeClass.toLowerCase().includes('manhwa')) type = 'Manhwa';
    else if (typeClass.toLowerCase().includes('manhua')) type = 'Manhua';

    const rating = $el.find('.rating i').text().trim();

    const status = 'Unknown';
    const latestChapter = '';
    const additionalInfo = rating ? `Rating: ${rating}` : '';

    results.push({
      title,
      thumbnailUrl: normalizeUrl(thumbnailUrl),
      detailUrl: normalizeUrl(detailUrl),
      type,
      latestChapter,
      status,
      additionalInfo,
    });
  });

  return results;
}
