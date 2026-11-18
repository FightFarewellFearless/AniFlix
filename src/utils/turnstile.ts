/**
 * Registry for the Turnstile solver.
 *
 * `App.tsx` wires the implementation to the `<TurnstileWebView />` modal, the same
 * way `setWebViewOpen` is wired to `CFBypassWebView`. Scrapers only depend on this
 * small module, so they never import React Native UI code.
 */
export const turnstileSolver = {
  solve: (
    _siteKey: string,
    _action: string,
    _pageUrl: string,
    _signal?: AbortSignal,
  ): Promise<string> => Promise.reject(new Error('Turnstile solver belum siap')),
};
