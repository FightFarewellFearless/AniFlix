function throttle(func: (...args: any[]) => any, delay: number) {
  let prevDelay = 0;

  return (...args: any[]) => {
    const now = Date.now();
    if (now - prevDelay > delay) {
      prevDelay = now;
      return func(...args);
    }
  };
}
export default throttle;
