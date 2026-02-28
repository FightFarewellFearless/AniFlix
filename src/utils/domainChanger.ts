import { __ALIAS as aliasAnime, BASE as animeBase } from './scrapers/animeSeries';
import { __ALIAS as aliasComics1, DOMAIN as comics1Domain } from './scrapers/comics1';
import { __ALIAS as aliasComics2, DOMAIN as comics2Domain } from './scrapers/comics2';
import { __ALIAS as filmAlias, FILM_DOMAIN as filmDomain } from './scrapers/film';
import { __ALIAS as aliasKomiku, DOMAIN as komikuDomain } from './scrapers/komiku';

type Type = 'komiku' | 'comics1' | 'comics2' | 'anime' | 'movie' | 'film';

export function determineType(url: string): Type {
  const urlObj = new URL(url);
  if (urlObj.hostname.includes(aliasKomiku)) return 'komiku';
  if (urlObj.hostname.includes(aliasComics1)) return 'comics1';
  if (urlObj.hostname.includes(aliasComics2)) return 'comics2';
  if (urlObj.hostname.includes(aliasAnime)) return 'anime';
  if (urlObj.hostname.includes(filmAlias)) return 'film';
  return 'movie';
}

export function generateUrlWithLatestDomain(url: string): string {
  const urlObj = new URL(url);
  const type = determineType(url);

  let newDomain = '';
  let matchedAlias = '';

  switch (type) {
    case 'komiku':
      newDomain = komikuDomain;
      matchedAlias = aliasKomiku;
      break;
    case 'comics1':
      newDomain = comics1Domain;
      matchedAlias = aliasComics1;
      break;
    case 'comics2':
      newDomain = comics2Domain;
      matchedAlias = aliasComics2;
      break;
    case 'anime':
      newDomain = animeBase.domain;
      matchedAlias = aliasAnime;
      break;
    case 'film':
      newDomain = filmDomain;
      matchedAlias = filmAlias;
      break;
    case 'movie':
      return urlObj.toString();
  }

  const oldAliasIndex = urlObj.hostname.indexOf(matchedAlias);
  const newAliasIndex = newDomain.indexOf(matchedAlias);

  let oldSubdomain = '';
  if (oldAliasIndex > 0) {
    oldSubdomain = urlObj.hostname.substring(0, oldAliasIndex);
  }
  let newSubdomain = '';
  if (newAliasIndex > 0) {
    newSubdomain = newDomain.substring(0, newAliasIndex);
  }
  if (newSubdomain !== '') {
    urlObj.hostname = newDomain;
  } else {
    urlObj.hostname = oldSubdomain + newDomain;
  }

  return urlObj.toString();
}
