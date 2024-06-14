function throttle<F extends (...args: any[]) => any>(func: F, delay: number): (...args: Parameters<F>) => void {
  let prevDelay = 0;

  return (...args: Parameters<F>) => {
    const now = Date.now();
    if (now - prevDelay > delay) {
      prevDelay = now;
      return func(...args);
    }
  };
}
export default throttle;

