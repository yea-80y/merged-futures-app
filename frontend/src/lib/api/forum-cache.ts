import type { CanonicalPost } from '../shared/types'

interface CacheEntry {
  posts: CanonicalPost[]
  refs: string[]
  ts: number
}

const STALE_MS = 3 * 60 * 1000 // treat as stale after 3 minutes

const _cache = new Map<string, CacheEntry>()

export function boardKey(talkId: string) {
  return `board:${talkId}`
}

export function threadKey(talkId: string, threadRef: string) {
  return `thread:${talkId}:${threadRef}`
}

export function getCached(key: string): CacheEntry | null {
  return _cache.get(key) ?? null
}

export function setCached(key: string, posts: CanonicalPost[], refs: string[]) {
  _cache.set(key, { posts, refs, ts: Date.now() })
}

/** Returns how many new refs are in `freshRefs` that weren't in `cachedRefs`. */
export function countNew(cachedRefs: string[], freshRefs: string[]): number {
  const seen = new Set(cachedRefs)
  return freshRefs.filter(r => !seen.has(r)).length
}

export function isStale(key: string): boolean {
  const entry = _cache.get(key)
  return !entry || Date.now() - entry.ts > STALE_MS
}
