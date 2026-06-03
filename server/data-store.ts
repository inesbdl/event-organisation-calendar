import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataPath = path.join(__dirname, '..', 'data', 'store.json')

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

/** Créneau sans besoin de bénévole (poste + horaire) */
export interface ClosureRecord {
  post_id: string
  slot_index: number
}

export interface Store {
  events: EventRecord[]
  posts: PostRecord[]
  volunteers: VolunteerRecord[]
  availabilities: AvailabilityRecord[]
  assignments: AssignmentRecord[]
  closures: ClosureRecord[]
}

const emptyStore = (): Store => ({
  events: [],
  posts: [],
  volunteers: [],
  availabilities: [],
  assignments: [],
  closures: [],
})

function ensureDataDir() {
  const dir = path.dirname(dataPath)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

export function readStore(): Store {
  ensureDataDir()
  if (!fs.existsSync(dataPath)) {
    const store = emptyStore()
    writeStore(store)
    return store
  }
  const store = JSON.parse(fs.readFileSync(dataPath, 'utf-8')) as Store
  if (!store.closures) store.closures = []
  return store
}

export function writeStore(store: Store) {
  ensureDataDir()
  fs.writeFileSync(dataPath, JSON.stringify(store, null, 2))
}

export function updateStore(mutate: (store: Store) => void) {
  const store = readStore()
  mutate(store)
  writeStore(store)
}
