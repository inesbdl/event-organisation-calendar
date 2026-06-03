import type { IncomingMessage, ServerResponse } from 'http'
import * as repo from './repository.js'

const VOLUNTEER_COLORS = [
  '#f97316', '#06b6d4', '#a855f7', '#22c55e', '#ec4899',
  '#eab308', '#3b82f6', '#ef4444', '#14b8a6', '#8b5cf6',
]

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

    switch (route.name) {
      case 'listEvents': {
        send(res, 200, repo.listEvents())
        return
      }

      case 'createEvent': {
        const { name, startTime, endTime } = body
        if (typeof name !== 'string' || !name.trim() || !startTime || !endTime) {
          send(res, 400, { error: 'Nom et horaires requis' })
          return
        }
        const id = repo.createEvent({
          name: name.trim(),
          startTime: String(startTime),
          endTime: String(endTime),
        })
        send(res, 201, { id })
        return
      }

      case 'getEvent': {
        const state = repo.getEventState(route.params.id)
        if (!state) {
          send(res, 404, { error: 'Événement introuvable' })
          return
        }
        send(res, 200, state)
        return
      }

      case 'deleteEvent': {
        repo.deleteEvent(route.params.id)
        send(res, 204)
        return
      }

      case 'addPost': {
        const { name, requiredCount } = body
        if (typeof name !== 'string' || !name.trim()) {
          send(res, 400, { error: 'Nom du poste requis' })
          return
        }
        const id = repo.addPost(route.params.eventId, {
          name: name.trim(),
          requiredCount: Number(requiredCount) || 1,
        })
        send(res, 201, { id })
        return
      }

      case 'patchPost':
      case 'deletePost': {
        if (route.name === 'deletePost') {
          repo.deletePost(route.params.id)
          send(res, 204)
        } else {
          send(res, 200, { ok: true })
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
        const count = repo.countVolunteers(eventId)
        const color = VOLUNTEER_COLORS[count % VOLUNTEER_COLORS.length]
        const { id } = repo.addVolunteer(eventId, { name: name.trim(), color })
        send(res, 201, { id, color })
        return
      }

      case 'deleteVolunteer': {
        repo.deleteVolunteer(route.params.id)
        send(res, 204)
        return
      }

      case 'toggleAvailability': {
        const available = repo.toggleAvailability(
          route.params.id,
          Number(route.params.slotIndex),
        )
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
        const vid = String(volunteerId)
        const pid = String(postId)

        if (repo.findAssignment(vid, pid, slot)) {
          repo.removeAssignment(vid, pid, slot)
          send(res, 200, { assigned: false })
          return
        }
        if (repo.isSlotClosed(pid, slot)) {
          send(res, 400, { error: 'Créneau marqué sans besoin de bénévole' })
          return
        }
        if (!repo.findPost(pid)) {
          send(res, 404, { error: 'Poste introuvable' })
          return
        }
        if (repo.hasAssignmentConflict(vid, slot)) {
          send(res, 400, { error: 'Le bénévole est déjà affecté sur ce créneau' })
          return
        }
        repo.addAssignment(vid, pid, slot)
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
          if (repo.listPostsForEvent(String(eventId)).length === 0) {
            send(res, 400, { error: 'Aucun poste' })
            return
          }
          const closed = repo.toggleColumnClosure(String(eventId), slot)
          send(res, 200, { closed })
          return
        }

        if (!postId) {
          send(res, 400, { error: 'Poste requis' })
          return
        }
        const closed = repo.toggleCellClosure(String(postId), slot)
        send(res, 200, { closed })
        return
      }

      default:
        send(res, 404, { error: 'Route introuvable' })
    }
  } catch {
    send(res, 500, { error: 'Erreur serveur' })
  }
}
