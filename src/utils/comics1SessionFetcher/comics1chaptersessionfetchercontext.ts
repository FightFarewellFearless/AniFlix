import { createContext } from 'react';
import { PromiseResRej } from './comics1sessionfetchercontext';

export const Comics1ChapterSessionFetcherContext = createContext<{
  isOpen: boolean;
  setIsOpen: (_isOpen: boolean) => void;
  chapterUrl: React.RefObject<string> | null;
  promisesCollector: { current: PromiseResRej[] };
}>({
  isOpen: false,
  setIsOpen: (_isOpen: boolean) => {},
  chapterUrl: null,
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

export const comics1FetchChapterSession = {
  getChapterSessionPath: (
    _chapterUrl: string,
    _res: PromiseResRej['resolve'],
    _rej: PromiseResRej['reject'],
  ) => {},
  abortCleanup: () => {},
};
