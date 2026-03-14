import { sleep } from './time.js';

export function parseRetryAfter(value: string | null): number | null {
  if (!value) return null;

  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) {
    return seconds * 1000;
  }

  const dateMs = Date.parse(value);
  if (!Number.isNaN(dateMs)) {
    return Math.max(0, dateMs - Date.now());
  }

  return null;
}

export function backoff(attempt: number, baseMs = 500, maxMs = 10_000): number {
  const base = Math.min(baseMs * 2 ** attempt, maxMs);
  const jitter = Math.random() * 0.2 * base;
  return Math.round(base + jitter);
}
