import { useEffect, useRef } from 'react';

export const reloadAppAsync = async () => {
  globalThis.location?.reload();
};

type EventEmitterLike = {
  addListener?: (event: string, listener: (payload: any) => void) => { remove: () => void };
};

/**
 * Minimal `expo` counterpart used by the shared application code. The old
 * no-op made every `useEventListener(player, ...)` callback dead in Electron,
 * which is why expo-video powered screens never reacted to playback events.
 */
export function useEventListener<T>(
  emitter: EventEmitterLike | null | undefined,
  eventName: string,
  listener: (payload: T) => void,
) {
  const listenerRef = useRef(listener);
  listenerRef.current = listener;

  useEffect(() => {
    const subscription = emitter?.addListener?.(eventName, payload =>
      listenerRef.current(payload),
    );
    return () => subscription?.remove();
  }, [emitter, eventName]);
}

export class EventEmitter<T extends Record<string, unknown>> {
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
