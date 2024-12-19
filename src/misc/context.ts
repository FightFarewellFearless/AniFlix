import { Dispatch, SetStateAction, createContext } from 'react';
import { EpisodeBaruHome } from '../types/anime';
import { Movies } from '../utils/animeMovie';

export const EpisodeBaruHomeContext = createContext<{
  paramsState?: EpisodeBaruHome;
  setParamsState?: Dispatch<SetStateAction<EpisodeBaruHome>>;
}>({ paramsState: undefined, setParamsState: undefined });

export const MovieListHomeContext = createContext<{
  paramsState?: Movies[];
  setParamsState?: Dispatch<SetStateAction<Movies[]>>;
}>({ paramsState: undefined, setParamsState: undefined });
