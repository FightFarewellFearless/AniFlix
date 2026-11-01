export class EventEmitter<T extends Record<string, unknown> = Record<string, unknown>> {
  private listeners = new Map<keyof T, Set<(value: any) => void>>();
  emit(event: keyof T, value: any) {
    this.listeners.get(event)?.forEach(listener => listener(value));
  }
  addListener(event: keyof T, listener: (value: any) => void) {
    const eventListeners = this.listeners.get(event) ?? new Set();
    eventListeners.add(listener);
    this.listeners.set(event, eventListeners);
    return { remove: () => eventListeners.delete(listener) };
  }
}

export class NativeModule {}
export class SharedObject {}
export class SharedRef {}
export class CodedError extends Error {}
export class UnavailabilityError extends Error {}
export const Platform = { OS: 'windows' };
export const requireNativeModule = () => ({});
export const requireOptionalNativeModule = () => null;
