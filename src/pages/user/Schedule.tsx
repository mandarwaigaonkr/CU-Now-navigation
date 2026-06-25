// src/pages/user/Schedule.tsx
// Schedule page — Today's events and Upcoming events

import { useState, useMemo } from 'react'
import { useEvents, AppEvent } from '../../context/EventsContext'
import { formatTime } from '../../utils/formatters'
import { getVenueByName, Venue } from '../../data/venues'
import VenueDirections from '../../components/VenueDirections'
import './Schedule.css'

interface VenueModalState {
  venue: Venue | null;
  directions: string;
}

export default function Schedule() {
  const { events, loading } = useEvents()
  const [activeTab, setActiveTab] = useState<'today' | 'upcoming'>('today')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [venueModal, setVenueModal] = useState<VenueModalState | null>(null)

  const { todayEvents, upcomingEvents } = useMemo(() => {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    const tomorrowStart = todayStart + 24 * 60 * 60 * 1000

    const today: AppEvent[] = []
    const upcoming: AppEvent[] = []

    events.forEach(e => {
      if (e.status !== 'active') return
      
      const start = e.startTime?.toDate ? e.startTime.toDate() : new Date(e.startTime as any)
      const startTimeMs = start.getTime()

      if (startTimeMs >= todayStart && startTimeMs < tomorrowStart) {
        today.push(e)
      } else if (startTimeMs >= tomorrowStart) {
        upcoming.push(e)
      }
    })

    // Sort by start time ascending
    const sortFn = (a: AppEvent, b: AppEvent) => {
      const aStart = a.startTime?.toDate ? a.startTime.toDate().getTime() : new Date(a.startTime as any).getTime()
      const bStart = b.startTime?.toDate ? b.startTime.toDate().getTime() : new Date(b.startTime as any).getTime()
      return aStart - bStart
    }

    return {
      todayEvents: today.sort(sortFn),
      upcomingEvents: upcoming.sort(sortFn)
    }
  }, [events])

  const displayedEvents = activeTab === 'today' ? todayEvents : upcomingEvents

  function toggleExpand(id: string) {
    setExpandedId(prev => prev === id ? null : id)
  }

  function getStatusBadge(event: AppEvent) {
    const now = new Date()
    const start = event.startTime?.toDate ? event.startTime.toDate() : new Date(event.startTime as any)
    const end = event.endTime?.toDate ? event.endTime.toDate() : new Date(event.endTime as any)

    if (now >= start && now <= end) return { label: 'LIVE', type: 'live' }
    if (now > end) return { label: 'Done', type: 'done' }
    return null
  }

  return (
    <div className="schedule-page">
      {/* Header */}
      <div className="schedule-header">
        <div className="schedule-header__inner">
          <h1 className="schedule-header__title">Schedule</h1>
          <p className="schedule-header__sub">Campus Events</p>
        </div>

        {/* Tab selector */}
        <div className="schedule-toggle-container">
          <div className="schedule-toggle__track">
            <div
              className={`schedule-toggle__slider ${activeTab === 'upcoming' ? 'schedule-toggle__slider--right' : ''}`}
            />
            <button
              type="button"
              className={`schedule-toggle__btn ${activeTab === 'today' ? 'schedule-toggle__btn--active' : ''}`}
              onClick={() => { setActiveTab('today'); setExpandedId(null) }}
            >
              <span>Today {todayEvents.length > 0 && `(${todayEvents.length})`}</span>
            </button>
            <button
              type="button"
              className={`schedule-toggle__btn ${activeTab === 'upcoming' ? 'schedule-toggle__btn--active' : ''}`}
              onClick={() => { setActiveTab('upcoming'); setExpandedId(null) }}
            >
              <span>Upcoming {upcomingEvents.length > 0 && `(${upcomingEvents.length})`}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="schedule-content">
        {loading ? (
          <div className="schedule-skeleton">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="skeleton-card" />
            ))}
          </div>
        ) : displayedEvents.length === 0 ? (
          <div className="schedule-empty">
            <span className="schedule-empty__icon">
              {activeTab === 'today' ? (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              ) : (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              )}
            </span>
            <p className="schedule-empty__text">
              {activeTab === 'today' ? "No events scheduled for today" : "No upcoming events"}
            </p>
            <p className="schedule-empty__sub">
              {activeTab === 'today' 
                ? "Check the Upcoming tab for future events." 
                : "New events will appear here once announced."}
            </p>
          </div>
        ) : (
          <div className="schedule-list">
            {displayedEvents.map((event, idx) => {
              const isExpanded = expandedId === event.id
              const badge = getStatusBadge(event)
              return (
                <div
                  key={event.id}
                  className={`schedule-card ${isExpanded ? 'schedule-card--expanded' : ''}`}
                  onClick={() => toggleExpand(event.id!)}
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  {/* Timeline dot */}
                  <div className="schedule-card__timeline">
                    <div className={`timeline-dot ${badge?.type === 'live' ? 'timeline-dot--live' : badge?.type === 'done' ? 'timeline-dot--done' : ''}`} />
                    {idx < displayedEvents.length - 1 && <div className="timeline-line" />}
                  </div>

                  <div className="schedule-card__body">
                    {/* Collapsed view */}
                    <div className="schedule-card__header">
                      <div className="schedule-card__time">
                        {activeTab === 'upcoming' && event.startTime && (
                          <span style={{ marginRight: '8px', color: 'var(--color-text-secondary)' }}>
                            {event.startTime?.toDate 
                              ? event.startTime.toDate().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                              : new Date(event.startTime as any).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                            {' · '}
                          </span>
                        )}
                        {formatTime(event.startTime as any)}
                        {event.endTime && ` – ${formatTime(event.endTime as any)}`}
                      </div>
                      {badge && (
                        <span className={`schedule-badge schedule-badge--${badge.type}`}>
                          {badge.label}
                        </span>
                      )}
                    </div>
                    <h3 className="schedule-card__name">{event.name}</h3>
                    <div className="schedule-card__venue">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" strokeLinecap="round" strokeLinejoin="round"/>
                        <circle cx="12" cy="10" r="3"/>
                      </svg>
                      {event.venue}
                    </div>

                    {/* Expanded details */}
                    <div className={`schedule-card__details ${isExpanded ? 'schedule-card__details--open' : ''}`}>
                      {event.description && (
                        <div className="schedule-detail">
                          <h4 className="schedule-detail__label">Description</h4>
                          <p className="schedule-detail__text">{event.description}</p>
                        </div>
                      )}
                      <div className="schedule-detail">
                        <h4 className="schedule-detail__label">Venue</h4>
                        <p className="schedule-detail__text">{event.venue}</p>
                      </div>
                      <div className="schedule-detail">
                        <h4 className="schedule-detail__label">Date & Time</h4>
                        <p className="schedule-detail__text">
                          {event.startTime?.toDate 
                            ? event.startTime.toDate().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })
                            : new Date(event.startTime as any).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })}
                          <br />
                          {formatTime(event.startTime as any)} – {formatTime(event.endTime as any)}
                        </p>
                      </div>
                      {/* Get Directions button */}
                      {(() => {
                        const venueData = getVenueByName(event.venue || '')
                        if (!venueData) return null
                        return (
                          <button
                            className="schedule-directions-btn"
                            onClick={e => {
                              e.stopPropagation()
                              setVenueModal({ venue: venueData, directions: event.venueDirections || '' })
                            }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                              <circle cx="12" cy="10" r="3"/>
                            </svg>
                            Get Directions
                          </button>
                        )
                      })()}
                    </div>

                    {/* Expand indicator */}
                    <div className="schedule-card__expand">
                      <svg
                        className={`schedule-card__chevron ${isExpanded ? 'schedule-card__chevron--open' : ''}`}
                        width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
                      >
                        <polyline points="6 9 12 15 18 9" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span className="schedule-card__expand-text">
                        {isExpanded ? 'Less' : 'Details'}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {venueModal && (
        <VenueDirections
          venue={venueModal.venue}
          directions={venueModal.directions}
          onClose={() => setVenueModal(null)}
        />
      )}
    </div>
  )
}
