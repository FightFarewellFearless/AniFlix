import { Dispatch, SetStateAction, createContext } from 'react';
import { Home } from '../types/anime';

export const HomeContext = createContext<{
  paramsState?: Home;
  setParamsState?: Dispatch<SetStateAction<Home>>;
}>({ paramsState: undefined, setParamsState: undefined });
