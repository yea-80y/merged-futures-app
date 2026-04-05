import { get } from 'svelte/store'
import { auth } from '../auth/auth-store'
import { signWithSession } from '../auth/session-delegation'
import { api } from './client'
import type { SignedPostPayload, CanonicalPost } from '../shared/types'
import { boardKey, threadKey, getCached, setCached, countNew } from './forum-cache'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

async function sha256Hex(text: string): Promise<`0x${string}`> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  const hex = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
  return `0x${hex}`
}

/** Build a signed payload + optimistic CanonicalPost without sending to server. */
async function buildSignedPost(
  talkId: string,
  content: string,
  displayName?: string,
  avatarRef?: string,
  threadRef?: string,
): Promise<{
  payload: SignedPostPayload
  signature: string
  optimistic: CanonicalPost
}> {
  const state = get(auth)
  if (!state.parentAddress) throw new Error('Not authenticated')

  const payload: SignedPostPayload = {
    subject: state.parentAddress as `0x${string}`,
    boardId: talkId,
    content,
    contentSha256: await sha256Hex(content),
    displayName,
    ...(avatarRef ? { avatarRef } : {}),
    createdAt: Date.now(),
    nonce: crypto.randomUUID(),
    version: 1,
    ...(threadRef ? { threadRef } : {}),
  }

  const signed = await signWithSession(JSON.stringify(payload))
  if (!signed) throw new Error('Session expired — please sign in again')

  // Optimistic post for immediate display (no real swarm ref yet)
  const optimistic: CanonicalPost = {
    kind: 'post',
    payload,
    signature: signed.signature as `0x${string}`,
    signatureType: 'eip191',
    server: {
      receivedAt: Date.now(),
      boardTopic: '0x0' as `0x${string}`,
      threadTopic: '0x0' as `0x${string}`,
    },
    v: 1,
  }

  return { payload, signature: signed.signature, optimistic }
}

export interface PostResult {
  optimistic: CanonicalPost
  upload: Promise<{ postRef: string; threadRef: string }>
}

/**
 * Submit a new thread-root post. Returns immediately with an optimistic post.
 * The `upload` promise resolves when the Swarm write completes.
 */
export function submitPost(
  talkId: string,
  content: string,
  displayName?: string,
  avatarRef?: string,
): Promise<PostResult> {
  return buildSignedPost(talkId, content, displayName, avatarRef).then(({ payload, signature, optimistic }) => {
    const upload = api.post<{ ok: boolean; data?: { postRef: string; threadRef: string }; error?: string }>(
      '/api/forum/post',
      { payload, signature },
      true,
    ).then(res => {
      if (!res.ok || !res.data) throw new Error(res.error || 'Failed to post')
      return res.data
    })

    return { optimistic, upload }
  })
}

/**
 * Submit a reply to an existing thread.
 */
export function submitReply(
  talkId: string,
  threadRef: string,
  content: string,
  displayName?: string,
  avatarRef?: string,
): Promise<PostResult> {
  return buildSignedPost(talkId, content, displayName, avatarRef, threadRef).then(({ payload, signature, optimistic }) => {
    const upload = api.post<{ ok: boolean; data?: { postRef: string; threadRef: string }; error?: string }>(
      '/api/forum/post',
      { payload, signature },
      true,
    ).then(res => {
      if (!res.ok || !res.data) throw new Error(res.error || 'Failed to post')
      return res.data
    })

    return { optimistic, upload }
  })
}

function parseBoardResponse(
  data: { posts: (CanonicalPost | null)[]; refs: string[] },
): { posts: CanonicalPost[]; refs: string[] } {
  const posts = data.posts
    .map((post, i) => {
      if (!post || post.kind !== 'post') return null
      ;(post as any)._ref = data.refs[i]
      return post
    })
    .filter((p): p is CanonicalPost => p !== null)
  return { posts, refs: data.refs.filter((_, i) => data.posts[i]?.kind === 'post') }
}

/** Fetch board posts from API without caching. */
export async function fetchPosts(talkId: string): Promise<{ posts: CanonicalPost[]; refs: string[] }> {
  const res = await api.get<{
    ok: boolean
    data?: { posts: (CanonicalPost | null)[]; refs: string[] }
  }>(
    `/api/forum/board-posts?boardId=${encodeURIComponent(talkId)}`,
    false,
  )
  if (!res.ok || !res.data?.posts) return { posts: [], refs: [] }
  return parseBoardResponse(res.data)
}

/** Fetch thread posts from API without caching. */
export async function fetchThread(talkId: string, threadRef: string): Promise<{ posts: CanonicalPost[]; refs: string[] }> {
  const res = await api.get<{
    ok: boolean
    data?: { posts: (CanonicalPost | null)[]; refs: string[] }
  }>(
    `/api/forum/thread-posts?boardId=${encodeURIComponent(talkId)}&threadRef=${encodeURIComponent(threadRef)}`,
    false,
  )
  if (!res.ok || !res.data?.posts) return { posts: [], refs: [] }
  const result = parseBoardResponse(res.data)
  return { posts: result.posts.reverse(), refs: result.refs.reverse() }
}

/**
 * Load board posts with stale-while-revalidate caching.
 * Returns { cached, load } where:
 *  - cached: immediately available cached data (may be null)
 *  - load: promise that resolves with { posts, newCount } when fresh data arrives
 */
export function loadPosts(talkId: string): {
  cached: CanonicalPost[] | null
  load: Promise<{ posts: CanonicalPost[]; newCount: number }>
} {
  const key = boardKey(talkId)
  const entry = getCached(key)

  const load = fetchPosts(talkId).then(({ posts, refs }) => {
    const newCount = entry ? countNew(entry.refs, refs) : 0
    setCached(key, posts, refs)
    return { posts, newCount }
  }).catch(() => ({ posts: entry?.posts ?? [], newCount: 0 }))

  return { cached: entry?.posts ?? null, load }
}

/**
 * Load thread posts with stale-while-revalidate caching.
 */
export function loadThread(talkId: string, threadRef: string): {
  cached: CanonicalPost[] | null
  load: Promise<{ posts: CanonicalPost[]; newCount: number }>
} {
  const key = threadKey(talkId, threadRef)
  const entry = getCached(key)

  const load = fetchThread(talkId, threadRef).then(({ posts, refs }) => {
    const newCount = entry ? countNew(entry.refs, refs) : 0
    setCached(key, posts, refs)
    return { posts, newCount }
  }).catch(() => ({ posts: entry?.posts ?? [], newCount: 0 }))

  return { cached: entry?.posts ?? null, load }
}
