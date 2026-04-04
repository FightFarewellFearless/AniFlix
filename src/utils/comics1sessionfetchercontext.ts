import { createContext } from 'react';

export type PromiseResRej = { resolve: (value: string) => void; reject: (reason?: any) => void };
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
  getSessionPath: (_res: PromiseResRej['resolve'], _rej: PromiseResRej['reject']) => {},
  abortCleanup: () => {},
};
