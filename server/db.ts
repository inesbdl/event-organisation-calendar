import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { DatabaseSync } from 'node:sqlite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.join(__dirname, '..', 'data')
const dbPath = path.join(dataDir, 'planning.db')
const legacyJsonPath = path.join(dataDir, 'store.json')

let db: DatabaseSync | null = null

const schema = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  required_count INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS volunteers (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS availabilities (
  volunteer_id TEXT NOT NULL REFERENCES volunteers(id) ON DELETE CASCADE,
  slot_index INTEGER NOT NULL,
  PRIMARY KEY (volunteer_id, slot_index)
);

CREATE TABLE IF NOT EXISTS assignments (
  volunteer_id TEXT NOT NULL REFERENCES volunteers(id) ON DELETE CASCADE,
  post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  slot_index INTEGER NOT NULL,
  PRIMARY KEY (volunteer_id, post_id, slot_index)
);

CREATE TABLE IF NOT EXISTS closures (
  post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  slot_index INTEGER NOT NULL,
  PRIMARY KEY (post_id, slot_index)
);
`

interface LegacyStore {
  events?: Array<{
    id: string
    name: string
    start_time: string
    end_time: string
    created_at: number
  }>
  posts?: Array<{
    id: string
    event_id: string
    name: string
    required_count: number
    sort_order: number
  }>
  volunteers?: Array<{
    id: string
    event_id: string
    name: string
    color: string
  }>
  availabilities?: Array<{ volunteer_id: string; slot_index: number }>
  assignments?: Array<{
    volunteer_id: string
    post_id: string
    slot_index: number
  }>
  closures?: Array<{ post_id: string; slot_index: number }>
}

function migrateFromLegacyJson(database: DatabaseSync) {
  if (!fs.existsSync(legacyJsonPath)) return
  const count = database.prepare('SELECT COUNT(*) AS n FROM events').get() as { n: number }
  if (count.n > 0) return

  const raw = JSON.parse(fs.readFileSync(legacyJsonPath, 'utf-8')) as LegacyStore

  withTransaction(database, () => {
    const insEvent = database.prepare(
      `INSERT INTO events (id, name, start_time, end_time, created_at) VALUES (?, ?, ?, ?, ?)`,
    )
    const insPost = database.prepare(
      `INSERT INTO posts (id, event_id, name, required_count, sort_order) VALUES (?, ?, ?, ?, ?)`,
    )
    const insVol = database.prepare(
      `INSERT INTO volunteers (id, event_id, name, color) VALUES (?, ?, ?, ?)`,
    )
    const insAvail = database.prepare(
      `INSERT OR IGNORE INTO availabilities (volunteer_id, slot_index) VALUES (?, ?)`,
    )
    const insAssign = database.prepare(
      `INSERT OR IGNORE INTO assignments (volunteer_id, post_id, slot_index) VALUES (?, ?, ?)`,
    )
    const insClosure = database.prepare(
      `INSERT OR IGNORE INTO closures (post_id, slot_index) VALUES (?, ?)`,
    )

    for (const e of raw.events ?? []) {
      insEvent.run(e.id, e.name, e.start_time, e.end_time, e.created_at)
    }
    for (const p of raw.posts ?? []) {
      insPost.run(p.id, p.event_id, p.name, p.required_count, p.sort_order)
    }
    for (const v of raw.volunteers ?? []) {
      insVol.run(v.id, v.event_id, v.name, v.color)
    }
    for (const a of raw.availabilities ?? []) {
      insAvail.run(a.volunteer_id, a.slot_index)
    }
    for (const a of raw.assignments ?? []) {
      insAssign.run(a.volunteer_id, a.post_id, a.slot_index)
    }
    for (const c of raw.closures ?? []) {
      insClosure.run(c.post_id, c.slot_index)
    }
  })
}

export function withTransaction(database: DatabaseSync, fn: () => void) {
  database.exec('BEGIN')
  try {
    fn()
    database.exec('COMMIT')
  } catch (e) {
    database.exec('ROLLBACK')
    throw e
  }
}

export function getDb(): DatabaseSync {
  if (db) return db
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
  db = new DatabaseSync(dbPath)
  db.exec('PRAGMA journal_mode = WAL')
  db.exec(schema)
  migrateFromLegacyJson(db)
  return db
}
