import { api } from './client'

interface ReservationResult {
  reserved: boolean
  count: number
  attendees: string[]
  podRef?: string
}

interface ReservationInfo {
  count: number
  attendees: string[]
}

interface BulkResult {
  counts: Record<string, number>
  attendees: Record<string, string[]>
}

interface ApiResponse<T> {
  ok: boolean
  data?: T
  error?: string
}

export interface TalkMeta {
  talkId: string
  talkTitle: string
  talkTime: string
  talkRoom: string
  speakers: string[]
}

export async function toggleReservation(meta: TalkMeta): Promise<ReservationResult> {
  const res = await api.post<ApiResponse<ReservationResult>>(
    '/api/reservations/toggle',
    meta,
    true,
  )
  if (!res.ok || !res.data) throw new Error(res.error || 'Failed to toggle reservation')
  return res.data
}

export async function getReservation(talkId: string): Promise<ReservationInfo> {
  try {
    const res = await api.get<ApiResponse<ReservationInfo>>(`/api/reservations/${talkId}`, false)
    return res.ok && res.data ? res.data : { count: 0, attendees: [] }
  } catch {
    return { count: 0, attendees: [] }
  }
}

export async function getBulkReservations(talkIds: string[]): Promise<BulkResult> {
  try {
    const res = await api.post<ApiResponse<BulkResult>>(
      '/api/reservations/bulk',
      { talkIds },
      false,
    )
    return res.ok && res.data ? res.data : { counts: {}, attendees: {} }
  } catch {
    return { counts: {}, attendees: {} }
  }
}
