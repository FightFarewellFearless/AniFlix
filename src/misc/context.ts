import { Dispatch, SetStateAction, createContext } from 'react';
import { EpisodeBaruHome } from '../types/anime';
import { Movies } from '../utils/scrapers/animeMovie';
import { LatestComicsRelease } from '../utils/scrapers/comicsv2';
import { FilmHomePage } from '../utils/scrapers/film';

export const EpisodeBaruHomeContext = createContext<{
  paramsState?: EpisodeBaruHome;
  setParamsState?: Dispatch<SetStateAction<EpisodeBaruHome>>;
}>({ paramsState: undefined, setParamsState: undefined });

export const MovieListHomeContext = createContext<{
  paramsState?: Movies[];
  setParamsState?: Dispatch<SetStateAction<Movies[]>>;
}>({ paramsState: undefined, setParamsState: undefined });

export const FilmListHomeContext = createContext<{
  paramsState?: FilmHomePage;
  setParamsState?: Dispatch<SetStateAction<FilmHomePage>>;
}>({ paramsState: undefined, setParamsState: undefined });

export const ComicsListContext = createContext<{
  paramsState?: LatestComicsRelease[];
  setParamsState?: Dispatch<SetStateAction<LatestComicsRelease[]>>;
}>({ paramsState: undefined, setParamsState: undefined });
