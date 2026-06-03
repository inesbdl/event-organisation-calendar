import { generateTimeSlots } from './timeSlots.js'
import { getDb, withTransaction } from './db.js'

export interface EventRecord {
  id: string
  name: string
  start_time: string
  end_time: string
  created_at: number
}

export interface PostRecord {
  id: string
  event_id: string
  name: string
  required_count: number
  sort_order: number
}

export interface VolunteerRecord {
  id: string
  event_id: string
  name: string
  color: string
}

export interface AvailabilityRecord {
  volunteer_id: string
  slot_index: number
}

export interface AssignmentRecord {
  volunteer_id: string
  post_id: string
  slot_index: number
}

export interface ClosureRecord {
  post_id: string
  slot_index: number
}

export function listEvents(): EventRecord[] {
  return getDb()
    .prepare('SELECT * FROM events ORDER BY created_at DESC')
    .all() as unknown as EventRecord[]
}

export function createEvent(data: {
  name: string
  startTime: string
  endTime: string
}): string {
  const id = crypto.randomUUID()
  getDb()
    .prepare(
      `INSERT INTO events (id, name, start_time, end_time, created_at) VALUES (?, ?, ?, ?, ?)`,
    )
    .run(id, data.name, data.startTime, data.endTime, Math.floor(Date.now() / 1000))
  return id
}

export function deleteEvent(eventId: string) {
  getDb().prepare('DELETE FROM events WHERE id = ?').run(eventId)
}

export function getEventState(eventId: string) {
  const database = getDb()
  const event = database
    .prepare('SELECT * FROM events WHERE id = ?')
    .get(eventId) as unknown as EventRecord | undefined
  if (!event) return null

  const posts = database
    .prepare(
      `SELECT * FROM posts WHERE event_id = ? ORDER BY sort_order ASC, name ASC`,
    )
    .all(eventId) as unknown as PostRecord[]

  const volunteers = database
    .prepare(`SELECT * FROM volunteers WHERE event_id = ? ORDER BY name ASC`)
    .all(eventId) as unknown as VolunteerRecord[]

  const volunteerIds = volunteers.map((v) => v.id)
  const postIds = posts.map((p) => p.id)

  const availabilities =
    volunteerIds.length === 0
      ? []
      : (database
          .prepare(
            `SELECT volunteer_id, slot_index FROM availabilities
             WHERE volunteer_id IN (${volunteerIds.map(() => '?').join(',')})`,
          )
          .all(...volunteerIds) as unknown as AvailabilityRecord[])

  const assignments =
    volunteerIds.length === 0
      ? []
      : (database
          .prepare(
            `SELECT volunteer_id, post_id, slot_index FROM assignments
             WHERE volunteer_id IN (${volunteerIds.map(() => '?').join(',')})`,
          )
          .all(...volunteerIds) as unknown as AssignmentRecord[])

  const closures =
    postIds.length === 0
      ? []
      : (database
          .prepare(
            `SELECT post_id, slot_index FROM closures
             WHERE post_id IN (${postIds.map(() => '?').join(',')})`,
          )
          .all(...postIds) as unknown as ClosureRecord[])

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

export function addPost(
  eventId: string,
  data: { name: string; requiredCount: number },
): string {
  const database = getDb()
  const row = database
    .prepare(`SELECT COALESCE(MAX(sort_order), -1) AS m FROM posts WHERE event_id = ?`)
    .get(eventId) as { m: number }
  const id = crypto.randomUUID()
  database
    .prepare(
      `INSERT INTO posts (id, event_id, name, required_count, sort_order) VALUES (?, ?, ?, ?, ?)`,
    )
    .run(id, eventId, data.name, Math.max(1, data.requiredCount), row.m + 1)
  return id
}

export function deletePost(postId: string) {
  getDb().prepare('DELETE FROM posts WHERE id = ?').run(postId)
}

export function addVolunteer(
  eventId: string,
  data: { name: string; color: string },
): { id: string; color: string } {
  const id = crypto.randomUUID()
  getDb()
    .prepare(`INSERT INTO volunteers (id, event_id, name, color) VALUES (?, ?, ?, ?)`)
    .run(id, eventId, data.name, data.color)
  return { id, color: data.color }
}

export function countVolunteers(eventId: string): number {
  const row = getDb()
    .prepare(`SELECT COUNT(*) AS n FROM volunteers WHERE event_id = ?`)
    .get(eventId) as { n: number }
  return row.n
}

export function deleteVolunteer(volunteerId: string) {
  getDb().prepare('DELETE FROM volunteers WHERE id = ?').run(volunteerId)
}

export function toggleAvailability(
  volunteerId: string,
  slotIndex: number,
): boolean {
  const database = getDb()
  const existing = database
    .prepare(
      `SELECT 1 FROM availabilities WHERE volunteer_id = ? AND slot_index = ?`,
    )
    .get(volunteerId, slotIndex)
  if (existing) {
    database
      .prepare(`DELETE FROM availabilities WHERE volunteer_id = ? AND slot_index = ?`)
      .run(volunteerId, slotIndex)
    return false
  }
  database
    .prepare(`INSERT INTO availabilities (volunteer_id, slot_index) VALUES (?, ?)`)
    .run(volunteerId, slotIndex)
  return true
}

export function findAssignment(
  volunteerId: string,
  postId: string,
  slotIndex: number,
): AssignmentRecord | undefined {
  return getDb()
    .prepare(
      `SELECT volunteer_id, post_id, slot_index FROM assignments
       WHERE volunteer_id = ? AND post_id = ? AND slot_index = ?`,
    )
    .get(volunteerId, postId, slotIndex) as unknown as AssignmentRecord | undefined
}

export function isSlotClosed(postId: string, slotIndex: number): boolean {
  return Boolean(
    getDb()
      .prepare(`SELECT 1 FROM closures WHERE post_id = ? AND slot_index = ?`)
      .get(postId, slotIndex),
  )
}

export function findPost(postId: string): PostRecord | undefined {
  return getDb().prepare('SELECT * FROM posts WHERE id = ?').get(postId) as unknown as
    | PostRecord
    | undefined
}

export function hasAssignmentConflict(
  volunteerId: string,
  slotIndex: number,
): boolean {
  return Boolean(
    getDb()
      .prepare(
        `SELECT 1 FROM assignments WHERE volunteer_id = ? AND slot_index = ?`,
      )
      .get(volunteerId, slotIndex),
  )
}

export function removeAssignment(
  volunteerId: string,
  postId: string,
  slotIndex: number,
) {
  getDb()
    .prepare(
      `DELETE FROM assignments WHERE volunteer_id = ? AND post_id = ? AND slot_index = ?`,
    )
    .run(volunteerId, postId, slotIndex)
}

export function addAssignment(
  volunteerId: string,
  postId: string,
  slotIndex: number,
) {
  getDb()
    .prepare(
      `INSERT INTO assignments (volunteer_id, post_id, slot_index) VALUES (?, ?, ?)`,
    )
    .run(volunteerId, postId, slotIndex)
}

export function listPostsForEvent(eventId: string): PostRecord[] {
  return getDb()
    .prepare(`SELECT * FROM posts WHERE event_id = ?`)
    .all(eventId) as unknown as PostRecord[]
}

export function isColumnFullyClosed(eventId: string, slotIndex: number): boolean {
  const posts = listPostsForEvent(eventId)
  if (posts.length === 0) return false
  const database = getDb()
  return posts.every((p) =>
    Boolean(
      database
        .prepare(`SELECT 1 FROM closures WHERE post_id = ? AND slot_index = ?`)
        .get(p.id, slotIndex),
    ),
  )
}

export function toggleColumnClosure(eventId: string, slotIndex: number): boolean {
  const database = getDb()
  const posts = listPostsForEvent(eventId)
  const allClosed = isColumnFullyClosed(eventId, slotIndex)

  const delClosure = database.prepare(
    `DELETE FROM closures WHERE post_id = ? AND slot_index = ?`,
  )
  const insClosure = database.prepare(
    `INSERT OR IGNORE INTO closures (post_id, slot_index) VALUES (?, ?)`,
  )
  const delAssign = database.prepare(
    `DELETE FROM assignments WHERE post_id = ? AND slot_index = ?`,
  )

  withTransaction(database, () => {
    if (allClosed) {
      for (const p of posts) delClosure.run(p.id, slotIndex)
    } else {
      for (const p of posts) insClosure.run(p.id, slotIndex)
      for (const p of posts) delAssign.run(p.id, slotIndex)
    }
  })
  return !allClosed
}

export function toggleCellClosure(postId: string, slotIndex: number): boolean {
  const database = getDb()
  const exists = isSlotClosed(postId, slotIndex)

  withTransaction(database, () => {
    if (exists) {
      database
        .prepare(`DELETE FROM closures WHERE post_id = ? AND slot_index = ?`)
        .run(postId, slotIndex)
    } else {
      database
        .prepare(`INSERT INTO closures (post_id, slot_index) VALUES (?, ?)`)
        .run(postId, slotIndex)
      database
        .prepare(`DELETE FROM assignments WHERE post_id = ? AND slot_index = ?`)
        .run(postId, slotIndex)
    }
  })
  return !exists
}
