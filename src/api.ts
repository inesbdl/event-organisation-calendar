import type { EventState, EventSummary } from './types'

const BASE = '/api'

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error((err as { error?: string }).error ?? 'Erreur serveur')
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

export const api = {
  listEvents: () => request<EventSummary[]>('/events'),

  createEvent: (data: { name: string; startTime: string; endTime: string }) =>
    request<{ id: string }>('/events', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getEvent: (id: string) => request<EventState>(`/events/${id}`),

  deleteEvent: (id: string) =>
    request<void>(`/events/${id}`, { method: 'DELETE' }),

  addPost: (eventId: string, data: { name: string; requiredCount: number }) =>
    request<{ id: string }>(`/events/${eventId}/posts`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updatePost: (id: string, data: { name?: string; requiredCount?: number }) =>
    request<{ ok: boolean }>(`/posts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deletePost: (id: string) =>
    request<void>(`/posts/${id}`, { method: 'DELETE' }),

  addVolunteer: (eventId: string, name: string) =>
    request<{ id: string; color: string }>(`/events/${eventId}/volunteers`, {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),

  deleteVolunteer: (id: string) =>
    request<void>(`/volunteers/${id}`, { method: 'DELETE' }),

  toggleAvailability: (volunteerId: string, slotIndex: number) =>
    request<{ available: boolean }>(
      `/volunteers/${volunteerId}/availability/${slotIndex}`,
      { method: 'PUT' },
    ),

  toggleAssignment: (data: {
    volunteerId: string
    postId: string
    slotIndex: number
  }) =>
    request<{ assigned: boolean }>('/assignments', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  toggleClosure: (data: {
    postId?: string
    slotIndex: number
    eventId?: string
    scope?: 'column'
  }) =>
    request<{ closed: boolean }>('/closures', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
}
