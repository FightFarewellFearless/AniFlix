declare global {
  var ErrorUtils: import('react-native').ErrorUtils;
  function requestIdleCallback(
    callback: (deadline: any) => void,
    options?: { timeout: number },
  ): number;
  function cancelIdleCallback(handle: number): void;
}

export {};
