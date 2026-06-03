import type { IncomingMessage, ServerResponse } from 'http'
import { generateTimeSlots } from './timeSlots.js'
import { readStore, updateStore, type Store } from './data-store.js'

const VOLUNTEER_COLORS = [
  '#f97316', '#06b6d4', '#a855f7', '#22c55e', '#ec4899',
  '#eab308', '#3b82f6', '#ef4444', '#14b8a6', '#8b5cf6',
]

function getEventState(store: Store, eventId: string) {
  const event = store.events.find((e) => e.id === eventId)
  if (!event) return null

  const posts = store.posts
    .filter((p) => p.event_id === eventId)
    .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name))

  const volunteers = store.volunteers
    .filter((v) => v.event_id === eventId)
    .sort((a, b) => a.name.localeCompare(b.name))

  const volunteerIds = new Set(volunteers.map((v) => v.id))
  const availabilities = store.availabilities.filter((a) =>
    volunteerIds.has(a.volunteer_id),
  )
  const assignments = store.assignments.filter((a) =>
    volunteerIds.has(a.volunteer_id),
  )

  const postIds = new Set(posts.map((p) => p.id))
  const closures = (store.closures ?? []).filter((c) => postIds.has(c.post_id))

  return {
    event,
    timeSlots: generateTimeSlots(event.start_time, event.end_time),
    posts,
    volunteers,
    availabilities,
    assignments,
    closures,
  }
}

async function readBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(chunk as Buffer)
  const raw = Buffer.concat(chunks).toString()
  if (!raw) return {}
  return JSON.parse(raw)
}

function send(res: ServerResponse, status: number, data?: unknown) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  if (data === undefined) {
    res.end()
    return
  }
  res.end(JSON.stringify(data))
}

function matchRoute(
  method: string,
  url: string,
): { name: string; params: Record<string, string> } | null {
  const [pathname] = url.split('?')
  const parts = pathname.split('/').filter(Boolean)

  if (parts[0] !== 'api') return null

  if (method === 'GET' && parts[1] === 'events' && parts.length === 2)
    return { name: 'listEvents', params: {} }
  if (method === 'POST' && parts[1] === 'events' && parts.length === 2)
    return { name: 'createEvent', params: {} }
  if (method === 'GET' && parts[1] === 'events' && parts.length === 3)
    return { name: 'getEvent', params: { id: parts[2] } }
  if (method === 'DELETE' && parts[1] === 'events' && parts.length === 3)
    return { name: 'deleteEvent', params: { id: parts[2] } }
  if (method === 'POST' && parts[1] === 'events' && parts[3] === 'posts')
    return { name: 'addPost', params: { eventId: parts[2] } }
  if (method === 'PATCH' && parts[1] === 'posts' && parts.length === 3)
    return { name: 'patchPost', params: { id: parts[2] } }
  if (method === 'DELETE' && parts[1] === 'posts' && parts.length === 3)
    return { name: 'deletePost', params: { id: parts[2] } }
  if (method === 'POST' && parts[1] === 'events' && parts[3] === 'volunteers')
    return { name: 'addVolunteer', params: { eventId: parts[2] } }
  if (method === 'DELETE' && parts[1] === 'volunteers' && parts.length === 3)
    return { name: 'deleteVolunteer', params: { id: parts[2] } }
  if (
    method === 'PUT' &&
    parts[1] === 'volunteers' &&
    parts[3] === 'availability' &&
    parts.length === 5
  )
    return {
      name: 'toggleAvailability',
      params: { id: parts[2], slotIndex: parts[4] },
    }
  if (method === 'PUT' && parts[1] === 'assignments' && parts.length === 2)
    return { name: 'toggleAssignment', params: {} }
  if (method === 'PUT' && parts[1] === 'closures' && parts.length === 2)
    return { name: 'toggleClosure', params: {} }

  return null
}

export async function handleApi(req: IncomingMessage, res: ServerResponse) {
  const method = req.method ?? 'GET'
  const url = req.url ?? '/'

  if (method === 'OPTIONS') {
    res.statusCode = 204
    res.end()
    return
  }

  const route = matchRoute(method, url)
  if (!route) {
    send(res, 404, { error: 'Route introuvable' })
    return
  }

  try {
    const body = (await readBody(req)) as Record<string, unknown>
    const store = readStore()

    switch (route.name) {
      case 'listEvents': {
        const events = [...store.events].sort((a, b) => b.created_at - a.created_at)
        send(res, 200, events)
        return
      }

      case 'createEvent': {
        const { name, startTime, endTime } = body
        if (typeof name !== 'string' || !name.trim() || !startTime || !endTime) {
          send(res, 400, { error: 'Nom et horaires requis' })
          return
        }
        const id = crypto.randomUUID()
        updateStore((s) => {
          s.events.push({
            id,
            name: name.trim(),
            start_time: String(startTime),
            end_time: String(endTime),
            created_at: Math.floor(Date.now() / 1000),
          })
        })
        send(res, 201, { id })
        return
      }

      case 'getEvent': {
        const state = getEventState(store, route.params.id)
        if (!state) {
          send(res, 404, { error: 'Événement introuvable' })
          return
        }
        send(res, 200, state)
        return
      }

      case 'deleteEvent': {
        const id = route.params.id
        updateStore((s) => {
          const postIds = new Set(
            s.posts.filter((p) => p.event_id === id).map((p) => p.id),
          )
          s.events = s.events.filter((e) => e.id !== id)
          s.posts = s.posts.filter((p) => p.event_id !== id)
          const volIds = new Set(
            s.volunteers.filter((v) => v.event_id === id).map((v) => v.id),
          )
          s.volunteers = s.volunteers.filter((v) => v.event_id !== id)
          s.availabilities = s.availabilities.filter((a) => !volIds.has(a.volunteer_id))
          s.assignments = s.assignments.filter((a) => !volIds.has(a.volunteer_id))
          s.closures = (s.closures ?? []).filter((c) => !postIds.has(c.post_id))
        })
        send(res, 204)
        return
      }

      case 'addPost': {
        const { name, requiredCount } = body
        if (typeof name !== 'string' || !name.trim()) {
          send(res, 400, { error: 'Nom du poste requis' })
          return
        }
        const eventId = route.params.eventId
        const id = crypto.randomUUID()
        updateStore((s) => {
          const maxOrder = Math.max(
            -1,
            ...s.posts.filter((p) => p.event_id === eventId).map((p) => p.sort_order),
          )
          s.posts.push({
            id,
            event_id: eventId,
            name: name.trim(),
            required_count: Math.max(1, Number(requiredCount) || 1),
            sort_order: maxOrder + 1,
          })
        })
        send(res, 201, { id })
        return
      }

      case 'patchPost':
      case 'deletePost': {
        send(res, route.name === 'deletePost' ? 204 : 200, route.name === 'deletePost' ? undefined : { ok: true })
        if (route.name === 'deletePost') {
          updateStore((s) => {
            s.posts = s.posts.filter((p) => p.id !== route.params.id)
            s.assignments = s.assignments.filter((a) => a.post_id !== route.params.id)
            s.closures = (s.closures ?? []).filter((c) => c.post_id !== route.params.id)
          })
        }
        return
      }

      case 'addVolunteer': {
        const { name } = body
        if (typeof name !== 'string' || !name.trim()) {
          send(res, 400, { error: 'Nom requis' })
          return
        }
        const eventId = route.params.eventId
        const count = store.volunteers.filter((v) => v.event_id === eventId).length
        const id = crypto.randomUUID()
        const color = VOLUNTEER_COLORS[count % VOLUNTEER_COLORS.length]
        updateStore((s) => {
          s.volunteers.push({
            id,
            event_id: eventId,
            name: name.trim(),
            color,
          })
        })
        send(res, 201, { id, color })
        return
      }

      case 'deleteVolunteer': {
        const id = route.params.id
        updateStore((s) => {
          s.volunteers = s.volunteers.filter((v) => v.id !== id)
          s.availabilities = s.availabilities.filter((a) => a.volunteer_id !== id)
          s.assignments = s.assignments.filter((a) => a.volunteer_id !== id)
        })
        send(res, 204)
        return
      }

      case 'toggleAvailability': {
        const volunteerId = route.params.id
        const slotIndex = Number(route.params.slotIndex)
        let available = false
        updateStore((s) => {
          const idx = s.availabilities.findIndex(
            (a) => a.volunteer_id === volunteerId && a.slot_index === slotIndex,
          )
          if (idx >= 0) {
            s.availabilities.splice(idx, 1)
            available = false
          } else {
            s.availabilities.push({ volunteer_id: volunteerId, slot_index: slotIndex })
            available = true
          }
        })
        send(res, 200, { available })
        return
      }

      case 'toggleAssignment': {
        const { volunteerId, postId, slotIndex } = body
        if (!volunteerId || !postId || slotIndex === undefined) {
          send(res, 400, { error: 'Paramètres manquants' })
          return
        }
        const slot = Number(slotIndex)
        const fresh = readStore()
        const existing = fresh.assignments.find(
          (a) =>
            a.volunteer_id === volunteerId &&
            a.post_id === postId &&
            a.slot_index === slot,
        )
        if (existing) {
          updateStore((s) => {
            s.assignments = s.assignments.filter(
              (a) =>
                !(
                  a.volunteer_id === volunteerId &&
                  a.post_id === postId &&
                  a.slot_index === slot
                ),
            )
          })
          send(res, 200, { assigned: false })
          return
        }
        const closed = (fresh.closures ?? []).some(
          (c) => c.post_id === postId && c.slot_index === slot,
        )
        if (closed) {
          send(res, 400, { error: 'Créneau marqué sans besoin de bénévole' })
          return
        }
        const post = fresh.posts.find((p) => p.id === postId)
        if (!post) {
          send(res, 404, { error: 'Poste introuvable' })
          return
        }
        const conflict = fresh.assignments.some(
          (a) => a.volunteer_id === volunteerId && a.slot_index === slot,
        )
        if (conflict) {
          send(res, 400, { error: 'Le bénévole est déjà affecté sur ce créneau' })
          return
        }
        updateStore((s) => {
          s.assignments.push({
            volunteer_id: String(volunteerId),
            post_id: String(postId),
            slot_index: slot,
          })
        })
        send(res, 200, { assigned: true })
        return
      }

      case 'toggleClosure': {
        const { postId, slotIndex, eventId, scope } = body as {
          postId?: string
          slotIndex?: number
          eventId?: string
          scope?: string
        }
        if (slotIndex === undefined) {
          send(res, 400, { error: 'Créneau requis' })
          return
        }
        const slot = Number(slotIndex)

        if (scope === 'column' && eventId) {
          const eventPosts = store.posts.filter((p) => p.event_id === eventId)
          if (eventPosts.length === 0) {
            send(res, 400, { error: 'Aucun poste' })
            return
          }
          const allClosed = eventPosts.every((p) =>
            (store.closures ?? []).some(
              (c) => c.post_id === p.id && c.slot_index === slot,
            ),
          )
          updateStore((s) => {
            if (!s.closures) s.closures = []
            if (allClosed) {
              const ids = new Set(eventPosts.map((p) => p.id))
              s.closures = s.closures.filter(
                (c) => !(ids.has(c.post_id) && c.slot_index === slot),
              )
            } else {
              for (const p of eventPosts) {
                const exists = s.closures.some(
                  (c) => c.post_id === p.id && c.slot_index === slot,
                )
                if (!exists) s.closures.push({ post_id: p.id, slot_index: slot })
              }
              const ids = new Set(eventPosts.map((p) => p.id))
              s.assignments = s.assignments.filter(
                (a) => !(ids.has(a.post_id) && a.slot_index === slot),
              )
            }
          })
          send(res, 200, { closed: !allClosed })
          return
        }

        if (!postId) {
          send(res, 400, { error: 'Poste requis' })
          return
        }
        const fresh = readStore()
        const exists = (fresh.closures ?? []).some(
          (c) => c.post_id === postId && c.slot_index === slot,
        )
        updateStore((s) => {
          if (!s.closures) s.closures = []
          if (exists) {
            s.closures = s.closures.filter(
              (c) => !(c.post_id === postId && c.slot_index === slot),
            )
          } else {
            s.closures.push({ post_id: String(postId), slot_index: slot })
            s.assignments = s.assignments.filter(
              (a) => !(a.post_id === postId && a.slot_index === slot),
            )
          }
        })
        send(res, 200, { closed: !exists })
        return
      }

      default:
        send(res, 404, { error: 'Route introuvable' })
    }
  } catch {
    send(res, 500, { error: 'Erreur serveur' })
  }
}
