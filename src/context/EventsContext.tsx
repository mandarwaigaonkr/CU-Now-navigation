import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from './AuthContext'

export interface AppEvent {
  id: string;
  startTime?: any;
  targetGroup?: number | 'all';
  name?: string;
  venue?: string;
  venueDirections?: string;
  directions?: string;
  description?: string;
  status?: string;
  [key: string]: any;
}

export interface EventsContextType {
  events: AppEvent[];
  loading: boolean;
}

const EventsContext = createContext<EventsContextType | null>(null)

export function useEvents(): EventsContextType {
  const context = useContext(EventsContext)
  if (!context) throw new Error('useEvents must be used within an EventsProvider')
  return context
}

interface EventsProviderProps {
  children: ReactNode;
}

export default function EventsProvider({ children }: EventsProviderProps) {
  const [events, setEvents] = useState<AppEvent[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const { profile, isAdmin, loading: authLoading } = useAuth()

  useEffect(() => {
    if (authLoading) return

    let q: any;

    if (isAdmin) {
      q = query(collection(db, 'events'), orderBy('startTime', 'asc'))
    } else if (profile?.group) {
      q = query(
        collection(db, 'events'),
        where('targetGroup', 'in', ['all', profile.group]),
        orderBy('startTime', 'asc')
      )
    } else {
      setEvents([])
      setLoading(false)
      return
    }

    const unsub = onSnapshot(q, (snap: any) => {
      setEvents(snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as AppEvent)))
      setLoading(false)
    })
    
    return () => unsub()
  }, [profile?.group, isAdmin, authLoading])

  return (
    <EventsContext.Provider value={{ events, loading }}>
      {children}
    </EventsContext.Provider>
  )
}
