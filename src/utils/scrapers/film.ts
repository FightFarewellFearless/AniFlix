/* eslint-disable no-eval */
import { Buffer } from 'buffer/';
import cheerio, { CheerioAPI } from 'cheerio';
import CryptoJS from 'crypto-js';
import { unpack } from '../unpacker';

type FilmHomePage = Array<{
  title: string;
  url: string;
  thumbnailUrl: string;
  year: string;
  rating: string;
}>;
type SearchResult = Array<
  FilmHomePage[number] & {
    synopsis: string;
    type: string;
  }
>;

const CryptoJSAesJson = {
  encrypt: function (value: Object, password: string) {
    return CryptoJS.AES.encrypt(JSON.stringify(value), password, {
      format: CryptoJSAesJson,
    }).toString();
  },
  decrypt: function (jsonStr: string, password: string) {
    return CryptoJS.AES.decrypt(jsonStr, password, {
      format: CryptoJSAesJson,
    }).toString(CryptoJS.enc.Utf8);
  },
  stringify: function (cipherParams: CryptoJS.lib.CipherParams) {
    const j: { ct: string; iv?: string; s?: string } = {
      ct: cipherParams.ciphertext.toString(CryptoJS.enc.Base64),
    };
    if (cipherParams.iv) j.iv = cipherParams.iv.toString();
    if (cipherParams.salt) j.s = cipherParams.salt.toString();
    return JSON.stringify(j).replace(/\s/g, '');
  },
  parse: function (jsonStr: string) {
    const j = JSON.parse(jsonStr);
    const cipherParams = CryptoJS.lib.CipherParams.create({
      ciphertext: CryptoJS.enc.Base64.parse(j.ct),
    });
    if (j.iv) cipherParams.iv = CryptoJS.enc.Hex.parse(j.iv);
    if (j.s) cipherParams.salt = CryptoJS.enc.Hex.parse(j.s);
    return cipherParams;
  },
};

function reconstructKey(rawKey: string, embedUrl: string) {
  const e = JSON.parse(embedUrl);

  const r = rawKey.split('\\x');
  let n = '';

  // @ts-expect-error
  const m_reversed = e.m.split('').reduce((t, e2) => e2 + t, '');

  const decoded = Buffer.from(m_reversed, 'base64').toString('binary');

  const indices = decoded.split('|');
  for (const s of indices) {
    if (s !== '') {
      n += '\\x' + r[parseInt(s) + 1];
    }
  }
  return n;
}

export const FILM_BASE_URL = 'https://tv12.idlixku.com';
const BASE_URL = FILM_BASE_URL;
async function fetchPage(url: string, opt?: RequestInit) {
  const response = await fetch(url, opt);
  return await response.text();
}

async function getEncryptedUrl(html: string, url: string, signal?: AbortSignal) {
  const $ = cheerio.load(html, { xmlMode: true, decodeEntities: false });
  const playerOptSul = $('ul#playeroptionsul');
  const HLS = playerOptSul.find('li').filter((i, el) => {
    return $(el).text().trim().includes('HLS') || $(el).text().trim().endsWith('p');
  });
  const dataType = HLS.attr('data-type');
  const dataPost = HLS.attr('data-post');
  const dataNume = HLS.attr('data-nume');

  const postResponse = await fetchPage(BASE_URL + '/wp-admin/admin-ajax.php', {
    headers: {
      accept: '*/*',
      'accept-language': 'en-US,en;q=0.9',
      'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
      priority: 'u=1, i',
      'sec-ch-ua': '"Chromium";v="140", "Not=A?Brand";v="24", "Google Chrome";v="140"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Linux"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-origin',
      'x-requested-with': 'XMLHttpRequest',
    },
    referrer: url,
    mode: 'cors',
    credentials: 'include',
    body: `action=doo_player_ajax&post=${dataPost}&nume=${dataNume}&type=${dataType}`,
    method: 'POST',
    signal,
  });
  const postData = JSON.parse(postResponse);
  return postData;
}

async function decryptHtml(html: string, url: string, signal?: AbortSignal) {
  const encryptedData = await getEncryptedUrl(html, url, signal);
  const realKey = reconstructKey(encryptedData.key, encryptedData.embed_url);
  const decrypted = CryptoJSAesJson.decrypt(encryptedData.embed_url, realKey);
  return decrypted.replace(/\\|"/g, '');
}

interface JeniusReturnData {
  hls: boolean;
  videoImage: null;
  videoSource: string;
  securedLink: string;
  downloadLinks: any[];
  attachmentLinks: any[];
  ck: string;
  subtitleTrackUrl: string;
}

async function jeniusPlayGetHLS(url: string, signal?: AbortSignal): Promise<JeniusReturnData> {
  const html: string = await fetchPage(url, {
    headers: {
      referer: 'https://jeniusplay.com/',
    },
    signal,
  });
  const packedScript =
    'eval(function(p,a,c,k,e,d)' +
    html.split('eval(function(p,a,c,k,e,d)')[1].split('</script>')[0];
  const unpacked = unpack(packedScript);

  const subtitleTrackUrl = unpacked
    .split('"kind":"captions","file":"')[1]
    .split('"')[0]
    .replace(/\\/g, '');
  const fireplayerId = unpacked.split('FirePlayer("')[1].split('"')[0];

  const params = new URLSearchParams();
  params.append('hash', fireplayerId);
  params.append('r', 'https://jeniusplay.com/');

  const response = await fetchPage(
    'https://jeniusplay.com/player/index.php?data=' + fireplayerId + '&do=getVideo',
    {
      method: 'POST',
      headers: {
        accept: '*/*',
        'accept-language': 'en-US,en;q=0.9',
        'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'x-requested-with': 'XMLHttpRequest',
        'user-agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        referer: 'https://jeniusplay.com/video/' + fireplayerId,
        origin: 'https://jeniusplay.com',
      },
      body: params.toString(),
      signal,
    },
  ).then(a => JSON.parse(a));
  return { ...response, subtitleTrackUrl };
}

async function getFeatured(signal?: AbortSignal) {
  const html = await fetchPage(BASE_URL, { signal });
  const $ = cheerio.load(html, { xmlMode: true, decodeEntities: false });
  const featured: FilmHomePage = [];
  const featuredElements = $('div.items.featured article');
  featuredElements.each((i, el) => {
    const title = $(el).find('h3').text().trim();
    const url = $(el).find('a').attr('href') || '';
    const thumbnailUrl = $(el).find('img').attr('src') || '';
    const year = $(el).find('div.data.dfeatur > span').text().trim();
    const rating = $(el).find('div.poster > div.rating').text().trim();
    featured.push({ title, url, thumbnailUrl, year, rating });
  });
  return featured;
}
async function getLatest(signal?: AbortSignal) {
  const html = await fetchPage(BASE_URL, { signal });
  const $ = cheerio.load(html, { xmlMode: true, decodeEntities: false });
  const latest: FilmHomePage = [];
  const latestElements = $('div#dt-movies article');
  latestElements.each((i, el) => {
    const title = $(el).find('h3').text().trim();
    const url = $(el).find('a').attr('href') || '';
    const thumbnailUrl = $(el).find('img').attr('src') || '';
    const year = $(el).find('div.data > span').text().trim();
    const rating = $(el).find('div.poster > div.rating').text().trim();
    latest.push({ title, url, thumbnailUrl, year, rating });
  });
  return latest;
}

async function searchFilm(query: string, signal?: AbortSignal) {
  const searchUrl = `${BASE_URL}/search/${encodeURIComponent(query)}`;
  const html = await fetchPage(searchUrl, { signal });
  const $ = cheerio.load(html, { xmlMode: true, decodeEntities: false });
  const results: SearchResult = [];
  const resultElements = $('div.search-page div.result-item');
  resultElements.each((i, el) => {
    const title = $(el).find('div.title').text().trim();
    const url = $(el).find('a').attr('href') || '';
    const thumbnailUrl = $(el).find('img').attr('src') || '';
    const year = $(el).find('div.meta > .year').text().trim();
    const rating = $(el).find('div.meta > .rating').text().trim();
    const synopsis = $(el).find('div.contenido').text().trim();
    const type = $(el).find('div.thumbnail.animation-2 > a > span').text().trim();
    results.push({ title, url, thumbnailUrl, year, rating, synopsis, type });
  });
  return results;
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
  episodeTitle: string;
  episodeUrl: string;
  releaseDate: string;
};
type FilmSeason = {
  season: string;
  episodes: FilmEpisode[];
};

function getFilmSeasons($: CheerioAPI) {
  const seasonsItem = $('div#serie_contenido > div#seasons div.se-c');
  const seasons: FilmSeason[] = [];
  seasonsItem.each((i, el) => {
    const season = $(el).find('.se-q .title').contents().first().text().trim();
    const episodes: FilmEpisode[] = [];
    $(el)
      .find('.se-a ul li')
      .each((j, episodeEl) => {
        const episodeImage = $(episodeEl).find('img').attr('src') || '';
        const episodeNumber = $(episodeEl).find('.numerando').text().trim();
        const episodeTitle = $(episodeEl).find('.episodiotitle > a').text().trim();
        const episodeUrl = $(episodeEl).find('a').attr('href') || '';
        const releaseDate = $(episodeEl).find('.episodiotitle .date').text().trim();
        episodes.push({ episodeNumber, episodeTitle, episodeUrl, releaseDate, episodeImage });
      });
    seasons.push({ season, episodes });
  });
  return seasons;
}

function getFilmEpisode($: CheerioAPI) {
  const episode = $('div#serie_contenido > div#seasons div.se-a ul li');
  const episodes: FilmEpisode[] = [];
  episode.each((i, el) => {
    const episodeImage = $(el).find('img').attr('src') || '';
    const episodeNumber = $(el).find('.numerando').text().trim();
    const episodeTitle = $(el).find('.episodiotitle > a').text().trim();
    const episodeUrl = $(el).find('a').attr('href') || '';
    const releaseDate = $(el).find('.episodiotitle .date').text().trim();
    episodes.push({ episodeNumber, episodeTitle, episodeUrl, releaseDate, episodeImage });
  });
  return episodes;
}

function getFilmInfo($: CheerioAPI, episode$?: CheerioAPI) {
  const title = episode$
    ? episode$('div.data > h1').text().trim()
    : $('div.data > h1').text().trim();
  const genres = $('div.sgeneros a[rel="tag"]')
    .map((i, el) => $(el).text().trim())
    .get();
  const releaseDate = $('.extra span.date').text().trim();
  const coverImage = $('.poster > img').attr('src') || '';
  const backgroundImage = $('#dt_galery > div:nth-child(1) > a > img').attr('src') || '';
  const synopsis = $('#single > div > center p').text().trim();
  const additionalInfo: { [key: string]: string } = {};
  $('div.custom_fields').each((i, el) => {
    const key = $(el).find('b').first().text().trim();
    if (key.toLowerCase().includes('rating')) {
      const value = $(el).find('strong').text().trim();
      additionalInfo[key] = value;
      return;
    }
    const value = $(el).find('span').text().trim();
    additionalInfo[key] = value;
  });
  return { title, genres, releaseDate, coverImage, backgroundImage, synopsis, additionalInfo };
}

type FilmDetails_Detail = {
  type: 'detail';
  info: FilmInfo;
  seasonData: FilmSeason[];
};
type FilmDetail_Stream = {
  type: 'stream';
  streamingLink: string;
  subtitleLink: string;
  title: string;
  releaseDate: string;
  rating: string;
  genres: string[];
  synopsis: string;
  thumbnailUrl: string;
  next?: string;
  prev?: string;
};
type FilmDetails = FilmDetails_Detail | FilmDetail_Stream;
async function getFilmDetails(filmUrl: string, signal?: AbortSignal): Promise<FilmDetails> {
  const html = await fetchPage(filmUrl, { signal });
  const $ = cheerio.load(html, { xmlMode: true, decodeEntities: false });
  const isSeasonNEpisode =
    $('div#serie_contenido').length > 0 &&
    $('li').filter((i, el) => {
      return $(el).text().trim().includes('HLS') || $(el).text().trim().endsWith('p');
    }).length === 0;
  const isSeasons = $('div#seasons .se-q').length > 0;
  if (isSeasonNEpisode) {
    let info: FilmInfo;
    const seasonData: FilmSeason[] = [];
    if (isSeasons) {
      const seasons = getFilmSeasons($);
      info = getFilmInfo($);
      seasonData.push(...seasons);
    } else {
      const season = await fetchPage($('div.sgeneros > a').attr('href')!, { signal });
      const episode = getFilmEpisode($);
      seasonData.push({ season: '', episodes: episode });
      const $$ = cheerio.load(season, { xmlMode: true, decodeEntities: false });
      info = getFilmInfo($$, $);
    }
    return { type: 'detail', info, seasonData };
  } else {
    if (filmUrl.includes('/movie/')) {
      const streamingData = await decryptHtml($.html(), filmUrl, signal).then(z =>
        jeniusPlayGetHLS(z, signal),
      );
      const title = $('div.data > h1').text().trim();
      const thumbnailUrl = $('div.poster > img').attr('src')!;
      const releaseDate = $('.extra span.date').text().trim();
      const rating = $('div[data-rating]').attr('data-rating')!?.trim();
      const genres = $('div.sgeneros a[rel="tag"]')
        .map((i, el) => $(el).text().trim())
        .get();
      const synopsis = $('div[itemprop="description"]').text().trim();
      return {
        type: 'stream',
        streamingLink: streamingData.securedLink,
        subtitleLink: streamingData.subtitleTrackUrl,
        title,
        thumbnailUrl,
        releaseDate,
        rating,
        genres,
        synopsis,
      };
    } else {
      const streamingData = await decryptHtml($.html(), filmUrl, signal).then(z =>
        jeniusPlayGetHLS(z, signal),
      );
      const episodeLink = $('span:contains("ALL")').parent().attr('href')!;
      const episodeHtml = await fetchPage(episodeLink, { signal });
      const episodeInfo = getFilmInfo(
        cheerio.load(episodeHtml, { xmlMode: true, decodeEntities: false }),
      );
      const title = $('h1.epih1').text().trim();
      const releaseDate = $('span.date').first().text().trim();
      const rating =
        Object.entries(episodeInfo.additionalInfo).find(([key]) => {
          return key.toLowerCase().includes('rating');
        })?.[1] || 'Tidak tersedia';
      const genres = episodeInfo.genres;
      const synopsis = episodeInfo.synopsis;
      const prev = $('span:contains("PREV")').parent().attr('href');
      const next = $('span:contains("NEXT")').parent().attr('href');
      return {
        type: 'stream',
        streamingLink: streamingData.securedLink,
        subtitleLink: streamingData.subtitleTrackUrl,
        thumbnailUrl: episodeInfo.coverImage,
        title,
        releaseDate,
        rating,
        genres,
        synopsis,
        next: next === '#' ? undefined : next,
        prev: prev === '#' ? undefined : prev,
      };
    }
  }
}

export { getFeatured, getLatest, searchFilm, getFilmDetails };
export type {
  SearchResult,
  FilmHomePage,
  FilmDetails,
  FilmEpisode,
  FilmInfo,
  FilmSeason,
  FilmDetail_Stream,
  FilmDetails_Detail,
};
