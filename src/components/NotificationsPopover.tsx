import { useState, useEffect } from 'react'
import { collection, query, orderBy, onSnapshot, doc, updateDoc, arrayUnion } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import './NotificationsPopover.css'

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
  createdAt?: any;
}

interface NotificationsPopoverProps {
  onClose: () => void;
  onUnreadCountChange: (count: number) => void;
}

export default function NotificationsPopover({ onClose, onUnreadCountChange }: NotificationsPopoverProps) {
  const { profile } = useAuth()
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [clearingIds, setClearingIds] = useState<Set<string>>(new Set())

  // Handle clicking outside to close
  useEffect(() => {
    const handleOutsideClick = () => onClose()
    document.addEventListener('click', handleOutsideClick)
    return () => document.removeEventListener('click', handleOutsideClick)
  }, [onClose])

  // Fetch all notifications
  useEffect(() => {
    const q = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, (snap) => {
      const allNotifs = snap.docs.map(d => ({ id: d.id, ...d.data() } as AppNotification))
      setNotifications(allNotifs)
    })
    return () => unsub()
  }, [])

  const clearedSet = new Set(profile?.clearedNotifications || [])
  const activeNotifications = notifications.filter(n => !clearedSet.has(n.id))

  // Update parent about unread count
  useEffect(() => {
    onUnreadCountChange(activeNotifications.length)
  }, [activeNotifications.length, onUnreadCountChange])

  const handleClear = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!profile?.id) return

    // Trigger slide-off animation
    setClearingIds(prev => new Set(prev).add(id))

    // Wait for animation
    setTimeout(async () => {
      try {
        await updateDoc(doc(db, 'users', profile.id), {
          clearedNotifications: arrayUnion(id)
        })
      } catch (err) {
        console.error('Failed to clear notification', err)
        // If it fails, remove it from clearing state to let user try again
        setClearingIds(prev => {
          const next = new Set(prev)
          next.delete(id)
          return next
        })
      }
    }, 300) // Match the CSS transition duration
  }

  return (
    <div className="notifications-popover" onClick={e => e.stopPropagation()}>
      <div className="notifications__header">
        <h3 className="notifications__title">Notifications</h3>
        {activeNotifications.length > 0 && (
          <span className="notifications__badge">{activeNotifications.length}</span>
        )}
      </div>
      
      <div className="notifications__list">
        {activeNotifications.length > 0 ? (
          activeNotifications.map(notif => (
            <div 
              key={notif.id} 
              className={`notification-card notification-card--${notif.priority} ${clearingIds.has(notif.id) ? 'clearing' : ''}`}
            >
              <div className="notification-card__header">
                <h4 className="notification-card__title">{notif.title}</h4>
                <button 
                  className="notification-card__clear-btn" 
                  onClick={(e) => handleClear(notif.id, e)}
                  aria-label="Clear notification"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
              <p className="notification-card__message">{notif.message}</p>
            </div>
          ))
        ) : (
          <div className="notifications__empty">
            No new notifications
          </div>
        )}
      </div>
    </div>
  )
}
