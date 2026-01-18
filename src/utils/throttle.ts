export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;

  return function (this: any, ...args: Parameters<T>) {
    lastArgs = args;

    if (!timeout) {
      func.apply(this, lastArgs);
      timeout = setTimeout(() => {
        timeout = null;
      }, wait);
    }
  };
}
