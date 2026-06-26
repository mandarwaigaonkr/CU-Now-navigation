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
        <h1 className="map-navigation-title">
          CU Nav <span className="map-navigation-beta">Beta</span>
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
        />
      </div>
    </div>
  )
}
