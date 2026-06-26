import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import CampusMap from '../../components/CampusMap'
import CustomSelect from '../../components/CustomSelect'
import VENUES from '../../data/venues'
import { getMapPosition } from '../../data/mapConfig'
import './MapNavigation.css'

const LOCATION_OPTIONS = [
  { label: 'Main Gate', value: 'main-gate' },
  ...VENUES.map(v => ({ label: v.name, value: v.id })),
]

export default function MapNavigation() {
  const [fromId, setFromId] = useState<string | null>(null)
  const [toId, setToId] = useState<string | null>(null)
  const [activeFromId, setActiveFromId] = useState<string | null>(null)
  const [activeToId, setActiveToId] = useState<string | null>(null)
  const [routeKey, setRouteKey] = useState(0)
  const [panelOpen, setPanelOpen] = useState(true)

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
    setPanelOpen(false)
  }

  function handleClear() {
    setFromId(null)
    setToId(null)
    setActiveFromId(null)
    setActiveToId(null)
    setPanelOpen(true)
  }

  const fromLabel = LOCATION_OPTIONS.find(o => o.value === activeFromId)?.label
  const toLabel = LOCATION_OPTIONS.find(o => o.value === activeToId)?.label

  return (
    <div className="map-navigation-page">
      <div className="map-navigation-top-bar">
        <h1 className="map-navigation-title">Campus Map</h1>
        
        <div className="map-navigation-inputs">
          <div className="map-navigation-input-row">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: '#3B82F6' }}>
              <circle cx="12" cy="12" r="6" />
            </svg>
            <CustomSelect
              value={fromId}
              options={LOCATION_OPTIONS}
              onChange={setFromId}
              placeholder="Where are you?"
            />
          </div>
          <div className="map-navigation-input-row">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: '#EF4444' }}>
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
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
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polygon points="3 11 22 2 13 21 11 13 3 11" />
            </svg>
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
        />
      </div>
    </div>
  )
}
