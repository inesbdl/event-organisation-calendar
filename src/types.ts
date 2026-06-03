export interface EventSummary {
  id: string
  name: string
  start_time: string
  end_time: string
  created_at: number
}

export interface Post {
  id: string
  event_id: string
  name: string
  required_count: number
  sort_order: number
}

export interface Volunteer {
  id: string
  event_id: string
  name: string
  color: string
}

export interface Availability {
  volunteer_id: string
  slot_index: number
}

export interface Assignment {
  volunteer_id: string
  post_id: string
  slot_index: number
}

export interface Closure {
  post_id: string
  slot_index: number
}

export interface EventState {
  event: EventSummary
  timeSlots: string[]
  posts: Post[]
  volunteers: Volunteer[]
  availabilities: Availability[]
  assignments: Assignment[]
  closures: Closure[]
}
