import { writable, derived, get } from 'svelte/store'
import { toggleReservation as apiToggle, type TalkMeta } from '../api/reservations'

// ---- User Profile ----
export interface UserProfile {
  name: string
  bio: string
  interests: string[]
  avatar: string // emoji fallback
  avatarRef?: string // Swarm bytes ref for uploaded photo
  createdAt: string
}

function createProfileStore() {
  const stored = localStorage.getItem('mf8-profile')
  const initial: UserProfile | null = stored ? JSON.parse(stored) : null
  const { subscribe, set, update } = writable<UserProfile | null>(initial)

  return {
    subscribe,
    save(profile: UserProfile) {
      localStorage.setItem('mf8-profile', JSON.stringify(profile))
      set(profile)
    },
    clear() {
      localStorage.removeItem('mf8-profile')
      set(null)
    },
  }
}

export const profile = createProfileStore()

// ---- Reservations ----
// Stores talk IDs the current user has reserved.
// When authenticated, toggles are persisted to the backend/Swarm.
// Falls back to localStorage-only when not authenticated (guest mode).

function createReservationsStore() {
  const stored = localStorage.getItem('mf8-reservations')
  const initial: string[] = stored ? JSON.parse(stored) : []
  const { subscribe, set, update } = writable<string[]>(initial)

  function persist(ids: string[]) {
    localStorage.setItem('mf8-reservations', JSON.stringify(ids))
  }

  return {
    subscribe,

    /** Flip local state immediately (optimistic). Does NOT call the API. */
    localToggle(talkId: string) {
      update(ids => {
        const next = ids.includes(talkId)
          ? ids.filter(id => id !== talkId)
          : [...ids, talkId]
        persist(next)
        return next
      })
    },

    /** Call the API to persist the toggle on Swarm. Returns server-confirmed result. */
    async remoteToggle(meta: TalkMeta): Promise<{ reserved: boolean; count: number; podRef?: string }> {
      const result = await apiToggle(meta)
      // Sync local state with server truth
      update(ids => {
        const next = result.reserved
          ? [...new Set([...ids, meta.talkId])]
          : ids.filter(id => id !== meta.talkId)
        persist(next)
        return next
      })
      return { reserved: result.reserved, count: result.count, podRef: result.podRef }
    },

    isReserved(talkId: string): boolean {
      return get({ subscribe }).includes(talkId)
    },

    syncFromRemote(talkIds: string[]) {
      set(talkIds)
      persist(talkIds)
    },
  }
}

export const reservations = createReservationsStore()

// ---- Forum Posts ----
export interface ForumPost {
  id: string
  talkId: string
  authorName: string
  authorAvatar: string
  content: string
  timestamp: string
}

function createForumStore() {
  const stored = localStorage.getItem('mf8-forum')
  const initial: ForumPost[] = stored ? JSON.parse(stored) : []
  const { subscribe, set, update } = writable<ForumPost[]>(initial)

  function persist(posts: ForumPost[]) {
    localStorage.setItem('mf8-forum', JSON.stringify(posts))
  }

  return {
    subscribe,
    addPost(talkId: string, content: string, author: UserProfile) {
      update(posts => {
        const post: ForumPost = {
          id: crypto.randomUUID(),
          talkId,
          authorName: author.name,
          authorAvatar: author.avatar,
          content,
          timestamp: new Date().toISOString(),
        }
        const next = [post, ...posts]
        persist(next)
        return next
      })
    },
    getPostsForTalk(talkId: string): ForumPost[] {
      return get({ subscribe }).filter(p => p.talkId === talkId)
    },
    deletePost(postId: string) {
      update(posts => {
        const next = posts.filter(p => p.id !== postId)
        persist(next)
        return next
      })
    },
  }
}

export const forum = createForumStore()

// ---- Router ----
export type Route =
  | { page: 'home' }
  | { page: 'login' }
  | { page: 'agenda' }
  | { page: 'talk'; id: string }
  | { page: 'schedule' }
  | { page: 'forum' }
  | { page: 'forum-talk'; id: string }
  | { page: 'profile' }
  | { page: 'org-dashboard' }

function parseHash(hash: string): Route {
  const h = hash.replace(/^#\/?/, '')
  if (h === '' || h === 'home') return { page: 'home' }
  if (h === 'login') return { page: 'login' }
  if (h === 'agenda') return { page: 'agenda' }
  if (h.startsWith('talk/')) return { page: 'talk', id: h.slice(5) }
  if (h === 'schedule') return { page: 'schedule' }
  if (h === 'forum') return { page: 'forum' }
  if (h.startsWith('forum/')) return { page: 'forum-talk', id: h.slice(6) }
  if (h === 'profile') return { page: 'profile' }
  if (h === 'org-dashboard') return { page: 'org-dashboard' }
  return { page: 'home' }
}

function createRouter() {
  const { subscribe, set } = writable<Route>(parseHash(window.location.hash))

  window.addEventListener('hashchange', () => {
    set(parseHash(window.location.hash))
    window.scrollTo(0, 0)
  })

  return {
    subscribe,
    navigate(path: string) {
      window.location.hash = path
    },
  }
}

export const router = createRouter()
