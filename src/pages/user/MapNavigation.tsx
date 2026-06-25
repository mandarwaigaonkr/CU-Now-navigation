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
      <header className="map-navigation-header">
        <div className="map-navigation-header__inner">
          <div>
            <h1 className="map-navigation-title">Campus Map</h1>
            {activeFromId && activeToId && !panelOpen && (
              <p className="map-navigation-subtitle">
                {fromLabel} → {toLabel}
              </p>
            )}
          </div>
          <button
            type="button"
            className="map-navigation-toggle"
            onClick={() => setPanelOpen(v => !v)}
          >
            {panelOpen ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="18 15 12 9 6 15" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {panelOpen && (
        <div className="map-navigation-panel">
          <div className="map-navigation-field">
            <label className="map-navigation-label">
              <span className="map-navigation-dot map-navigation-dot--blue" />
              You are here
            </label>
            <CustomSelect
              value={fromId}
              options={LOCATION_OPTIONS}
              onChange={setFromId}
              placeholder="Select current location"
            />
          </div>

          <div className="map-navigation-field">
            <label className="map-navigation-label">
              <span className="map-navigation-dot map-navigation-dot--red" />
              Destination
            </label>
            <CustomSelect
              value={toId}
              options={LOCATION_OPTIONS.filter(o => o.value !== fromId)}
              onChange={setToId}
              placeholder="Select destination"
            />
          </div>

          <div className="map-navigation-actions">
            <button type="button" className="map-navigation-btn map-navigation-btn--primary" onClick={handleNavigate}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polygon points="3 11 22 2 13 21 11 13 3 11" />
              </svg>
              Get Directions
            </button>
            {(activeFromId || activeToId) && (
              <button type="button" className="map-navigation-btn map-navigation-btn--ghost" onClick={handleClear}>
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      <CampusMap
        fromId={activeFromId}
        toId={activeToId}
        fromPosition={fromPosition}
        toPosition={toPosition}
        routeKey={routeKey}
      />
    </div>
  )
}
