import { useEffect, useRef } from 'react';
import { ToastAndroid } from 'react-native';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';

import { Buffer } from 'buffer/';

import cheerio from 'cheerio';

import { unpack } from './unpacker';

export interface Movies {
  title: string;
  url: string;
  thumbnailUrl: string;
}

export interface MovieDetail {
  title: string;
  synopsis: string;
  streamingUrl: string;
  thumbnailUrl: string;
  genres: string[];
  rating: string;
  studio: string;
  releaseDate: string;
  updateDate: string;
}

type Props = {
  isWebViewShown: boolean;
  setIsWebViewShown: (state: boolean) => void;
  onAnimeMovieReady: () => void;
};
let isError = false;

export async function getLatestMovie(signal?: AbortSignal, page?: number) {
  if (isError) {
    return { isError };
  }
  const response = await fetch(
    `https://154.26.137.28/movie-terbaru/${page ? `page/${page}/` : ''}`,
    {
      signal,
    },
  );
  const data = await response.text();
  const $ = cheerio.load(data);
  const movies: Movies[] = [];
  $('div.listupd article').each((i, el) => {
    movies.push({
      title: $(el).find('div > a > .tt > h2').text().trim(),
      url: $(el).find('div > a').attr('href')!,
      thumbnailUrl: $(el).find('div > a > .limit > img').attr('src')!,
    });
  })!;
  return movies;
}

export async function getMovieDetail(url: string, signal?: AbortSignal): Promise<MovieDetail> {
  let err;
  const response = await fetch(url, {
    signal,
  }).catch(erro => {
    err = erro;
  });
  if (signal?.aborted) {
    throw new Error('canceled');
  }
  if (response === undefined) {
    throw err;
  }
  const data = await response.text();
  const $ = cheerio.load(data);
  const title = $('header > h1.entry-title').text().trim();
  const thumbnailUrl = $('div.entry-content.serial-info > img').attr('src')!;
  const streamingUrl = $('ul.daftar > li > a').attr('href')!;
  const mightBeSynopsisArray = $('div.entry-content.serial-info p').toArray();
  const synopsisText = [];
  for (const synopsis of mightBeSynopsisArray) {
    if ($(synopsis).text().trim() !== '') {
      synopsisText.push($(synopsis).text().trim());
    } else {
      break;
    }
  }
  const table = $('table > tbody > tr');
  const tableContents: { title: string; content: string }[] = [];
  table.each((i, el) => {
    tableContents[i] = {
      title: $(el).find('th').text().trim(),
      content: $(el).find('td').text().trim(),
    };
  });
  const rating =
    tableContents.find(el => el.title === 'Skor Anime:')?.content ?? 'Data Tidak Tersedia';
  const genres = tableContents.find(el => el.title === 'Genre:')?.content.split(', ') ?? [
    'Data Tidak Tersedia',
  ];
  const studio = tableContents.find(el => el.title === 'Studio:')?.content ?? 'Data Tidak Tersedia';
  const releaseDate =
    tableContents.find(el => el.title === 'Dirilis:')?.content ?? 'Data Tidak Tersedia';
  const updateDate = $('header > div > span.updated').text().trim();

  return {
    title,
    synopsis: synopsisText.join('\n'),
    streamingUrl,
    thumbnailUrl,
    genres,
    rating,
    studio,
    releaseDate,
    updateDate,
  };
}

type LinksType = { title: string; url: string }[];
export async function getStreamingDetail(url: string, signal?: AbortSignal) {
  const response = await fetch(url, {
    signal,
  });
  const data = await response.text();
  const $ = cheerio.load(data);

  const title = $('div.entry-content > i:nth-child(5) > a').text().trim();
  const originalDetailLink = $('div.nvs.nvsc > a').attr('href')!;

  const thumbnailUrl = $('div.entry-content > img').attr('src')!;

  const mirror = $('select.mirror option').filter((i, el) => {
    return $(el).attr('data-em') !== undefined && $(el).attr('data-em') !== '';
  });

  const pixelLinks: LinksType = [];
  mirror.each((i, el) => {
    const titleMirror = $(el).text().trim();
    if (titleMirror.toLowerCase().includes('pixel')) {
      pixelLinks.push({
        title: titleMirror,
        url: $(el).attr('data-em')!,
      });
    }
  });

  const pompomLinks: LinksType = [];
  mirror.each((i, el) => {
    const titleMirror = $(el).text().trim();
    if (titleMirror.toLowerCase().includes('pompom')) {
      pompomLinks.push({
        title: titleMirror,
        url: $(el).attr('data-em')!,
      });
    }
  });

  const mp4UploadLinks: LinksType = [];
  mirror.each((i, el) => {
    const titleMirror = $(el).text().trim();
    if (titleMirror.toLowerCase().includes('mp4')) {
      mp4UploadLinks.push({
        title: titleMirror,
        url: $(el).attr('data-em')!,
      });
    }
  });

  const acefileLinks: LinksType = [];
  mirror.each((i, el) => {
    const titleMirror = $(el).text().trim();
    if (
      titleMirror.toLowerCase().includes('acefile') ||
      titleMirror.toLowerCase().includes('video')
    ) {
      acefileLinks.push({
        title: titleMirror,
        url: $(el).attr('data-em')!,
      });
    }
  });

  const pogoLinks: LinksType = [];
  mirror.each((i, el) => {
    const titleMirror = $(el).text().trim();
    if (titleMirror.toLowerCase().includes('pogo')) {
      pogoLinks.push({
        title: titleMirror,
        url: $(el).attr('data-em')!,
      });
    }
  });

  // lokalLinks has no raw supported at the moment because of complex anti-bot system
  const lokalLinks: LinksType = [];
  mirror.each((i, el) => {
    const titleMirror = $(el).text().trim();
    if (titleMirror.toLowerCase().includes('lokal')) {
      lokalLinks.push({
        title: titleMirror,
        url: $(el).attr('data-em')!,
      });
    }
  });

  let isRawAvailable = true;
  let supportedRawLinks = [
    ...pompomLinks,
    ...pixelLinks,
    ...mp4UploadLinks,
    ...acefileLinks,
    ...pogoLinks,
  ];
  if (supportedRawLinks.length === 0) {
    isRawAvailable = false;
    mirror.each((i, el) => {
      const titleMirror = $(el).text().trim();
      supportedRawLinks.push({
        title: titleMirror,
        url: $(el).attr('data-em')!,
      });
    });
  } else {
    supportedRawLinks = [...supportedRawLinks, ...lokalLinks];
  }

  supportedRawLinks = supportedRawLinks.filter(
    (v, i, a) => a.findIndex(t => t.url === v.url) === i,
  );
  supportedRawLinks = supportedRawLinks.map((v, i, a) => {
    const filtered = a.filter(z => z.title === v.title);
    if (filtered.length > 1) {
      return {
        ...v,
        title: `${v.title} (${filtered.indexOf(v) + 1})`,
      };
    }
    return v;
  });

  const streamingLink = await getRawDataIfAvailable(
    supportedRawLinks.find(z => z.title.includes('480p')) ?? supportedRawLinks[0],
    signal,
  );
  if (streamingLink === false) {
    isRawAvailable = false;
  }
  if (signal?.aborted) {
    throw new Error('canceled');
  }
  return {
    title,
    thumbnailUrl,
    episodeData: {
      animeDetail: originalDetailLink,
      next: undefined,
      previous: undefined,
    },
    streamingType: isRawAvailable ? 'raw' : 'embed',
    streamingLink: isRawAvailable
      ? (streamingLink as string)
      : cheerio
          .load(
            Buffer.from(
              (supportedRawLinks.find(z => z.title.includes('480p')) ?? supportedRawLinks[0]).url,
              'base64',
            ).toString('utf8'),
          )('iframe')
          .attr('src')!,
    resolution: (supportedRawLinks.find(z => z.title.includes('480p')) ?? supportedRawLinks[0])
      .title,
    resolutionRaw: supportedRawLinks.map(x => ({
      resolution: x.title,
      dataContent: x.url,
    })),
  };
}

export async function getRawDataIfAvailable(data: LinksType[number], signal?: AbortSignal) {
  try {
    if (data.title.toLowerCase().includes('mp4')) {
      return await getMP4rawData(data.url, signal);
    } else if (
      data.title.toLowerCase().includes('pompom') ||
      data.title.toLowerCase().includes('pixel')
    ) {
      return await getPixelOrPompomRawData(data.url, signal);
    } else if (
      data.title.toLowerCase().includes('acefile') ||
      data.title.toLowerCase().includes('video')
    ) {
      try {
        await getAceRawData(data.url, signal);
        const res = await getAceRawData(data.url, signal);
        return res;
      } catch (e: any) {
        if (e.name === 'AbortError' || signal?.aborted) throw new Error('canceled');

        // Try again in 2 seconds (sometimes the data is not ready yet, so we need to try again [only in acefile])
        ToastAndroid.show(
          'AceFile error, mencoba lagi otomatis dalam 2.5 detik...',
          ToastAndroid.SHORT,
        );
        await new Promise(resolve => setTimeout(resolve, 2500));
        const res = await getAceRawData(data.url, signal);
        return res;
      }
    } else if (data.title.toLowerCase().includes('pogo')) {
      return await getPogoRawData(data.url, signal);
    }
  } catch (e: any) {
    if (e.name === 'AbortError' || signal?.aborted) throw new Error('canceled');
    return false;
  }
  return false;
}

async function getPogoRawData(pogodata: string, signal?: AbortSignal) {
  const url = cheerio.load(Buffer.from(pogodata, 'base64').toString('utf8'))('iframe').attr('src')!;
  const response = await fetch(url, {
    signal,
  });
  const text = await response.text();
  return text.split("src: '")[1].split("'")[0];
}

async function getAceRawData(acedata: string, signal?: AbortSignal) {
  const url = cheerio.load(Buffer.from(acedata, 'base64').toString('utf8'))('iframe').attr('src')!;
  const response = await fetch(url, {
    signal,
  });
  const text = await response.text();
  const $ = cheerio.load(text);
  let responseAce: Response;
  let aceLink: string;
  const isAlreadyAceFile = $('title').text().trim() === 'AceFile';
  if (isAlreadyAceFile) {
    aceLink = url;
    responseAce = response;
  } else {
    const iframe = $('iframe').attr('src')!;
    aceLink = iframe;
    responseAce = await fetch(iframe.startsWith('https') ? iframe : 'https:' + iframe, {
      signal,
    });
  }
  const videoId = aceLink.split('/').at(-1)!;
  await fetch('https://acefile.co/service/get_mirrors/' + videoId, {
    signal,
  }).catch(() => {});
  const ace = isAlreadyAceFile ? text : await responseAce.text();
  const $ace = cheerio.load(ace);
  const script = unpack($ace('script').text().trim());
  if (script.includes('var DUAR=false')) {
    const service = script
      .split('var service=')[1]
      .split(';')[0]
      .replace(/['"\\]/g, '');
    const link = script.split('$.getJSON("https://"+service+"')[1].split('"')[0];

    const serviceResponse = await fetch(`https://${service}${link}`, {
      signal,
    });
    const serviceText = await serviceResponse.text();
    const d = JSON.parse(serviceText);

    if (d.data && 'embed' in d) {
      return d.data;
    } else {
      return false;
    }
  }
  const nfck = script.split('var nfck="')[1].split('"')[0];
  const id = script.split('var DUAR=[{"id":"')[1].split('"')[0];

  const acefileVideoServer = 'https://acefile.co/local/' + id + '?key=' + nfck;
  const responseAcefile = await fetch(acefileVideoServer, {
    signal,
  });

  const resAceFileText = await responseAcefile.text();
  const streamLink = JSON.parse(
    Buffer.from(
      resAceFileText.split('sources: JSON.parse(atob("')[1].split('"')[0],
      'base64',
    ).toString('utf8'),
  )[0].file;
  return 'https://acefile.co' + streamLink;
}

async function getMP4rawData(mp4data: string, signal?: AbortSignal) {
  const url = cheerio.load(Buffer.from(mp4data, 'base64').toString('utf8'))('iframe').attr('src')!;
  const response = await fetch(url, {
    signal,
  });
  return (await response.text()).split('src: "')[1].split('"')[0];
}
async function getPixelOrPompomRawData(pixelorpompomdata: string, signal?: AbortSignal) {
  const url = cheerio
    .load(Buffer.from(pixelorpompomdata, 'base64').toString('utf8'))('iframe')
    .attr('src')!;
  const response = await fetch(url, {
    signal,
  });
  return cheerio
    .load(await response.text())('source')
    .attr('src')!;
}

export async function searchMovie(query: string, signal?: AbortSignal) {
  const response = await fetch('https://154.26.137.28/?s=' + encodeURIComponent(query), {
    signal,
  });
  const data = await response.text();
  const $ = cheerio.load(data);
  const list = $('div.listupd article');
  const movies: Movies[] = [];
  list
    .filter((i, el) => {
      return $(el).find('div > a > .tt > span').text().trim().toLowerCase().startsWith('movie');
    })
    .each((i, el) => {
      movies.push({
        title: $(el).find('div > a > .tt > h2').text().trim(),
        url: $(el).find('div > a').attr('href')!,
        thumbnailUrl: $(el).find('div > a > .limit > img').attr('src')!,
      });
    });
  return movies;
}

export function AnimeMovieWebView({ isWebViewShown, setIsWebViewShown, onAnimeMovieReady }: Props) {
  const webviewRef = useRef<WebView>(null);
  useEffect(() => {
    isError = false;
  }, []);
  return (
    <View style={{ height: 0, display: 'none' }}>
      {isWebViewShown && (
        <WebView
          ref={webviewRef}
          source={{ uri: 'https://154.26.137.28/' }}
          setSupportMultipleWindows={false}
          onError={() => {
            isError = true;
            setIsWebViewShown(false);
            onAnimeMovieReady();
            ToastAndroid.show('Gagal mempersiapkan data untuk movie', ToastAndroid.SHORT);
          }}
          onNavigationStateChange={event => {
            if (event.title.includes('AnimeSail')) {
              setIsWebViewShown(false);
              onAnimeMovieReady();
            } else if (event.title.toLowerCase().includes('error')) {
              isError = true;
              setIsWebViewShown(false);
              onAnimeMovieReady();
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
