/**
 * In-memory prediction cache.
 * ─────────────────────────────────────────────────────────────────────────────
 * One structured prediction costs ~7 LLM calls. If two users ask for the same
 * fixture within the TTL, serve the cached result instead of paying again.
 *
 * Keyed by normalized "home|away|league". TTL is short enough that fresh news
 * (injuries announced hours before kickoff) still gets picked up on the next
 * miss, but long enough to absorb a burst of users opening the same match.
 *
 * For a single-instance deploy (Fly/Railway) an in-process Map is enough. If you
 * later scale to multiple instances, swap this module's body for a Redis client
 * with the same get/set signature — nothing else changes.
 */

const TTL_MS = 30 * 60 * 1000; // 30 minutes
const MAX_ENTRIES = 200;        // simple LRU cap

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const store = new Map<string, CacheEntry<unknown>>();

function normalize(s: string): string {
  return s.trim().replace(/\s+/g, " ").toLowerCase();
}

export function cacheKey(home: string, away: string, league: string): string {
  return `${normalize(home)}|${normalize(away)}|${normalize(league)}`;
}

export function getCached<T>(key: string): T | null {
  const hit = store.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) {
    store.delete(key);
    return null;
  }
  // Refresh LRU position.
  store.delete(key);
  store.set(key, hit);
  return hit.value as T;
}

export function setCached<T>(key: string, value: T): void {
  if (store.size >= MAX_ENTRIES) {
    // Evict oldest (first inserted) entry.
    const oldest = store.keys().next().value;
    if (oldest !== undefined) store.delete(oldest);
  }
  store.set(key, { value, expiresAt: Date.now() + TTL_MS });
}

export function invalidate(key: string): void {
  store.delete(key);
}

export function clearCache(): void {
  store.clear();
}
