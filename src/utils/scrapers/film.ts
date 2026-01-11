/* eslint-disable no-eval */
import { Buffer } from 'buffer/';
import cheerio, { CheerioAPI } from 'cheerio';
import CryptoJS from 'crypto-js';
import { unpack } from '../unpacker';

type FilmHomePage = Array<{
  title: string;
  url: string;
  img: string;
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

const BASE_URL = 'https://tv12.idlixku.com';
async function fetchPage(url: string, opt?: RequestInit) {
  const response = await fetch(url, opt);
  return await response.text();
}

async function getEncryptedUrl(html: string, url: string) {
  const $ = cheerio.load(html);
  const playerOptSul = $('ul#playeroptionsul');
  const HLS = playerOptSul.find("li:contains('HLS')");
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
  });
  const postData = JSON.parse(postResponse);
  return postData;
}

async function decryptUrl(url: string) {
  const html = await fetchPage(url);
  const encryptedData = await getEncryptedUrl(html, url);
  const realKey = reconstructKey(encryptedData.key, encryptedData.embed_url);
  const decrypted = CryptoJSAesJson.decrypt(encryptedData.embed_url, realKey);
  return eval(`${decrypted}`);
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

async function jeniusPlayGetHLS(url: string): Promise<JeniusReturnData> {
  const html: string = await fetchPage(url, {
    headers: {
      referer: 'https://jeniusplay.com/',
    },
  });
  const packedScript =
    'eval(function(p,a,c,k,e,d)' +
    cheerio.load(html)('script').eq(-1).html()!.split('eval(function(p,a,c,k,e,d)')[1];
  const unpacked = unpack(packedScript);

  const subtitleTrackUrl = eval(
    `"${eval(`'${unpacked.split('"kind":"captions","file":"')[1].split('"')[0]}'`)}"`,
  );
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
    },
  ).then(a => JSON.parse(a));
  return { ...response, subtitleTrackUrl };
}

async function getFeatured() {
  const html = await fetchPage(BASE_URL);
  const $ = cheerio.load(html);
  const featured: FilmHomePage = [];
  const featuredElements = $('div.items.featured article');
  featuredElements.each((i, el) => {
    const title = $(el).find('h3').text().trim();
    const url = $(el).find('a').attr('href') || '';
    const img = $(el).find('img').attr('src') || '';
    const year = $(el).find('div.data.dfeatur > span').text().trim();
    const rating = $(el).find('div.poster > div.rating').text().trim();
    featured.push({ title, url, img, year, rating });
  });
  return featured;
}
async function getLatest() {
  const html = await fetchPage(BASE_URL);
  const $ = cheerio.load(html);
  const latest: FilmHomePage = [];
  const latestElements = $('div#dt-movies article');
  latestElements.each((i, el) => {
    const title = $(el).find('h3').text().trim();
    const url = $(el).find('a').attr('href') || '';
    const img = $(el).find('img').attr('src') || '';
    const year = $(el).find('div.data > span').text().trim();
    const rating = $(el).find('div.poster > div.rating').text().trim();
    latest.push({ title, url, img, year, rating });
  });
  return latest;
}

async function searchFilm(query: string) {
  const searchUrl = `${BASE_URL}/search/${encodeURIComponent(query)}`;
  const html = await fetchPage(searchUrl);
  const $ = cheerio.load(html);
  const results: SearchResult = [];
  const resultElements = $('div.search-page div.result-item');
  resultElements.each((i, el) => {
    const title = $(el).find('div.title').text().trim();
    const url = $(el).find('a').attr('href') || '';
    const img = $(el).find('img').attr('src') || '';
    const year = $(el).find('div.meta > .year').text().trim();
    const rating = $(el).find('div.meta > .rating').text().trim();
    const synopsis = $(el).find('div.contenido').text().trim();
    const type = $(el).find('div.thumbnail.animation-2 > a > span').text().trim();
    results.push({ title, url, img, year, rating, synopsis, type });
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

async function getFilmSeasons($: CheerioAPI) {
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

async function getFilmEpisode($: CheerioAPI) {
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

async function getFilmInfo($: CheerioAPI, episode$?: CheerioAPI) {
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

async function getFilmDetails(filmUrl: string) {
  const html = await fetchPage(filmUrl);
  const $ = cheerio.load(html);
  const isSeasonNEpisode = $('div#serie_contenido').length > 0;
  const isSeasons = $('div#seasons se-q').length > 0;
  if (isSeasonNEpisode) {
    let info: FilmInfo;
    const seasonData: FilmSeason[] = [];
    if (isSeasons) {
      const seasons = await getFilmSeasons($);
      info = await getFilmInfo($);
      seasonData.push(...seasons);
    } else {
      const season = await fetchPage($('div.sgeneros > a').attr('href')!);
      const episode = await getFilmEpisode($);
      seasonData.push({ season: '', episodes: episode });
      const $$ = cheerio.load(season);
      info = await getFilmInfo($$, $);
    }
    return { info, seasonData };
  }
}
