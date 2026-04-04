import { createContext } from 'react';
import { Session } from './scrapers/comics1';

export type PromiseResRej = { resolve: (value: Session) => void; reject: (reason?: any) => void };
export const Comics1SessionFetcherContext = createContext({
  isOpen: false,
  setIsOpen: (_isOpen: boolean) => {},
  promisesCollector: <{ current: PromiseResRej[] }>{
    current: [],
  },
});
// export class CFCookie {
//     static #cookie = "";
//     static get cookies() {
//         return this.#cookie;
//     };
//     static set cookies(value: string) {
//         this.#cookie = value;
//     }
// }

export const comics1FetchSession = {
  fetchSession: (_res: PromiseResRej['resolve'], _rej: PromiseResRej['reject']) => {},
  abortCleanup: () => {},
};
