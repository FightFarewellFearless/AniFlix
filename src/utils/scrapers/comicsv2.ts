import * as comics1 from './comics1';
import * as comics2 from './comics2';

export type LatestComicsRelease = comics1.LatestComicsRelease1 | comics2.LatestComicsRelease2;
export type ComicsDetail = comics1.ComicsDetail1 | comics2.ComicsDetail2;
export type ComicsReading = comics1.ComicsReading1 | comics2.ComicsReading2;
export type ComicsSearch = (comics1.ComicsSearch1 | comics2.ComicsSearch2) & { source: string };

export async function getLatestComicsReleases(
  page: number = 1,
  signal?: AbortSignal,
): Promise<LatestComicsRelease[]> {
  return await comics1.getLatestComicsReleases1(page, signal);
}

export async function getComicsDetailFromUrl(
  url: string,
  signal?: AbortSignal,
): Promise<ComicsDetail> {
  if (url.includes(comics1.__ALIAS)) {
    return await comics1.getComicsDetailFromUrl1(url, signal);
  } else if (url.includes(comics2.__ALIAS)) {
    return await comics2.getComicsDetailFromUrl2(url, signal);
  } else {
    throw new Error('Unsupported URL');
  }
}

export async function getComicsReading(url: string, signal?: AbortSignal): Promise<ComicsReading> {
  if (url.includes(comics1.__ALIAS)) {
    return await comics1.getComicsReading1(url, signal);
  } else if (url.includes(comics2.__ALIAS)) {
    return await comics2.getComicsReading2(url, signal);
  } else {
    throw new Error('Unsupported URL');
  }
}

export async function comicsSearch(query: string, signal?: AbortSignal): Promise<ComicsSearch[]> {
  const [results1, results2] = await Promise.all([
    comics1.comicsSearch1(query, signal),
    comics2.comicsSearch2(query, signal),
  ]);

  const tagged1 = results1.map(res => ({
    ...res,
    source: comics1.__ALIAS || 'Source 1',
  }));

  const tagged2 = results2.map(res => ({
    ...res,
    source: comics2.__ALIAS || 'Source 2',
  }));

  return [...tagged1, ...tagged2];
}
