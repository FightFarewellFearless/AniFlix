export type WorkletRuntime = Record<string, never>;

type WorkletCallback<T> = (...args: any[]) => T;

export const createWorkletRuntime = (_name: string): WorkletRuntime => ({});

export const runOnRuntime = <T>(
  _runtime: WorkletRuntime,
  callback: WorkletCallback<T>,
  ...args: any[]
): T => callback(...args);

export const runOnRuntimeAsync = async <T>(
  _runtime: WorkletRuntime,
  callback: WorkletCallback<T>,
  ...args: any[]
): Promise<T> => callback(...args);

export const scheduleOnRN = <T>(callback: WorkletCallback<T>, ...args: any[]): T =>
  callback(...args);

export const runOnJS = <T>(callback: WorkletCallback<T>): WorkletCallback<T> => callback;
