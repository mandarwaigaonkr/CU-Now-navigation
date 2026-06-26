import { useMemo, useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import CampusMap from '../../components/CampusMap'
import CustomSelect from '../../components/CustomSelect'
import VENUES, { type Venue } from '../../data/venues'
import { getMapPosition } from '../../data/mapConfig'
import VenueDirections from '../../components/VenueDirections'
import MapInfoSheet from '../../components/MapInfoSheet'
import './MapNavigation.css'

const LOCATION_OPTIONS = [
  { label: 'Main Gate', value: 'main-gate' },
  ...VENUES.map(v => ({ label: v.name, value: v.id })),
]

export default function MapNavigation() {
  const [searchParams] = useSearchParams()
  
  const [fromId, setFromId] = useState<string | null>(null)
  const [toId, setToId] = useState<string | null>(searchParams.get('to'))

  useEffect(() => {
    const to = searchParams.get('to')
    if (to && to !== toId) {
      setToId(to)
    }
  }, [searchParams, toId])
  const [activeFromId, setActiveFromId] = useState<string | null>(null)
  const [activeToId, setActiveToId] = useState<string | null>(null)
  const [routeKey, setRouteKey] = useState(0)
  const [venueModal, setVenueModal] = useState<Venue | null>(null)
  const [infoModalOpen, setInfoModalOpen] = useState(false)

  const fromPosition = useMemo(
    () => (activeFromId ? getMapPosition(activeFromId) : null),
    [activeFromId],
  )
  const toPosition = useMemo(
    () => (activeToId ? getMapPosition(activeToId) : null),
    [activeToId],
  )

  function handleNavigate() {
    if (!fromId || !toId) {
      toast.error('Select both your location and destination')
      return
    }
    if (fromId === toId) {
      toast.error('Pick a different destination')
      return
    }
    setActiveFromId(fromId)
    setActiveToId(toId)
    setRouteKey(k => k + 1)
  }

  function handleClear() {
    setFromId(null)
    setToId(null)
    setActiveFromId(null)
    setActiveToId(null)
  }



  return (
    <div className="map-navigation-page">
      <div className="map-navigation-top-bar">
        <h1 className="map-navigation-title">
          CU Nav <span className="map-navigation-beta">Beta</span>
          <button 
            className="map-navigation-info-btn" 
            onClick={() => setInfoModalOpen(true)} 
            title="Know more about the feature"
            aria-label="More info about beta"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <span>Know more</span>
          </button>
        </h1>
        
        <div className="map-navigation-route-card">
          <div className="map-navigation-timeline">
             <div className="map-timeline-dot" />
             <div className="map-timeline-line" />
             <div className="map-timeline-square" />
          </div>
          <div className="map-navigation-fields">
            <CustomSelect
              value={fromId}
              options={LOCATION_OPTIONS}
              onChange={setFromId}
              placeholder="Current location"
            />
            <div className="map-navigation-divider" />
            <CustomSelect
              value={toId}
              options={LOCATION_OPTIONS.filter(o => o.value !== fromId)}
              onChange={setToId}
              placeholder="Where to?"
            />
          </div>
        </div>

        <div className="map-navigation-actions">
          <button type="button" className="map-navigation-btn map-navigation-btn--primary" onClick={handleNavigate}>
            Get Directions
          </button>
          {(activeFromId || activeToId || fromId || toId) && (
            <button type="button" className="map-navigation-btn map-navigation-btn--ghost" onClick={handleClear}>
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="map-navigation-map-wrapper">
        <CampusMap
          fromId={activeFromId}
          toId={activeToId}
          fromPosition={fromPosition}
          toPosition={toPosition}
          routeKey={routeKey}
          onVenueClick={setVenueModal}
        />
      </div>

      {venueModal && (
        <VenueDirections
          venue={venueModal}
          onClose={() => setVenueModal(null)}
        />
      )}

      {infoModalOpen && (
        <MapInfoSheet onClose={() => setInfoModalOpen(false)} />
      )}
    </div>
  )
}
