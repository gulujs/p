import { SimpleQ } from '@lunjs/simpleq';

export function queue<T, R>(worker: (task: T) => R | Promise<R>, concurrency?: number): SimpleQ<T, R> {
  return new SimpleQ<T, R>(worker, concurrency);
}

export type { SimpleQ };
