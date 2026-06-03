import { useState } from 'react'
import { EventList } from './components/EventList'
import { EventPlanning } from './components/EventPlanning'

function App() {
  const [eventId, setEventId] = useState<string | null>(null)

  if (eventId) {
    return <EventPlanning eventId={eventId} onBack={() => setEventId(null)} />
  }

  return <EventList onSelect={setEventId} />
}

export default App
