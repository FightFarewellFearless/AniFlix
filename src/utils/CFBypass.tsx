import { createContext } from 'react';

export const CFBypassIsOpen = createContext({
  isOpen: false,
  url: '',
  setIsOpen: (_isOpen: boolean) => {},
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

export const setWebViewOpen = { openWebViewCF: (_isOpen: boolean, _url: string) => {} };
