import { api } from './client'
import type { UserProfile, UpdateProfileRequest } from '../shared/types'

interface ApiResponse<T> {
  ok: boolean
  data?: T
  error?: string
}

export async function fetchProfile(address: string): Promise<UserProfile | null> {
  try {
    const res = await api.get<ApiResponse<UserProfile>>(
      `/api/profile/${address}`,
      false,
    )
    return res.ok && res.data ? res.data : null
  } catch {
    return null
  }
}

export async function saveProfile(updates: UpdateProfileRequest): Promise<UserProfile> {
  const res = await api.post<ApiResponse<UserProfile>>('/api/profile', updates, true)
  if (!res.ok || !res.data) throw new Error(res.error || 'Failed to save profile')
  return res.data
}

export async function uploadAvatar(imageBase64: string): Promise<string> {
  const res = await api.post<ApiResponse<{ avatarRef: string }>>(
    '/api/profile/avatar',
    { image: imageBase64 },
    true,
  )
  if (!res.ok || !res.data) throw new Error(res.error || 'Failed to upload avatar')
  return res.data.avatarRef
}
