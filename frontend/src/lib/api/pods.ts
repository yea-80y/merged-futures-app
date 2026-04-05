import { api } from './client'

export interface PodDocument {
  kind: 'pod'
  v: 1
  event: string
  talkId: string
  talkTitle: string
  talkTime: string
  talkRoom: string
  speakers: string[]
  holder: string
  issuedAt: number
  nonce: string
  issuer: string
  issuerSig: string
  ref: string // Swarm bytes ref
}

interface ApiResponse<T> {
  ok: boolean
  data?: T
  error?: string
}

const podCache = new Map<string, PodDocument[]>()

export function clearPodCache(address: string) {
  podCache.delete(address.toLowerCase())
}

async function fetchPods(key: string): Promise<PodDocument[]> {
  const res = await api.get<ApiResponse<PodDocument[]>>(
    `/api/pods/${key}`,
    false,
  )
  const pods = res.ok && res.data ? res.data : []
  podCache.set(key, pods)
  return pods
}

/**
 * Return cached pods immediately (if available), then revalidate in
 * the background. When the fresh result differs, `onUpdate` fires
 * so the caller can swap in the new data without a loading state.
 */
export async function getUserPods(
  address: string,
  onUpdate?: (pods: PodDocument[]) => void,
): Promise<PodDocument[]> {
  const key = address.toLowerCase()
  const cached = podCache.get(key)

  if (cached) {
    // Return stale data now, revalidate in background
    fetchPods(key).then(fresh => {
      if (onUpdate && !podsEqual(cached, fresh)) onUpdate(fresh)
    }).catch(() => {})
    return cached
  }

  // No cache — must await
  return fetchPods(key)
}

function podsEqual(a: PodDocument[], b: PodDocument[]): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    if (a[i].ref !== b[i].ref) return false
  }
  return true
}
