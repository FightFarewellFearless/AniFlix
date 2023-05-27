function throttle(func, delay) {
  let prevDelay = 0;

  return (...args) => {
    const now = Date.now();
    if (now - prevDelay > delay) {
      prevDelay = now;
      return func(...args);
    }
  };
}
export default throttle;
