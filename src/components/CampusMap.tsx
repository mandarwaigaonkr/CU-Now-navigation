import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, m } from 'framer-motion'
import toast from 'react-hot-toast'
import campusMap from '../assets/campus-map.png'
import { type MapPoint, type Waypoint, WAYPOINTS, VENUE_MAP_POSITIONS } from '../data/mapConfig'
import VENUES, { type Venue } from '../data/venues'
import { useMapPanZoom } from '../hooks/useMapPanZoom'
import { findRoute, getRouteBounds, pointsToSvgPath } from '../utils/pathfinding'
import {
  addWaypoint,
  clearWaypointDraft,
  cloneWaypoints,
  connectWaypoints,
  findNearestWaypoint,
  formatWaypointsExport,
  getRoadSegments,
  removeWaypoint,
  saveWaypointDraft,
} from '../utils/waypointEditor'
import './CampusMap.css'

interface CampusMapProps {
  fromId: string | null
  toId: string | null
  fromPosition: MapPoint | null
  toPosition: MapPoint | null
  routeKey: number
  onVenueClick?: (venue: Venue) => void
}

type EditorMode = 'add' | 'connect'

export default function CampusMap({
  fromId,
  toId,
  fromPosition,
  toPosition,
  routeKey,
  onVenueClick,
}: CampusMapProps) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<HTMLDivElement>(null)
  const [calibrationMode, setCalibrationMode] = useState(false)
  const [venueMode, setVenueMode] = useState(false)
  const [editorWaypoints, setEditorWaypoints] = useState<Waypoint[]>(() => cloneWaypoints(WAYPOINTS))
  const [editorVenues, setEditorVenues] = useState<Record<string, MapPoint>>(() => ({ ...VENUE_MAP_POSITIONS }))
  const [editorMode, setEditorMode] = useState<EditorMode>('add')
  const [chainRoads, setChainRoads] = useState(true)
  const [selectedWpId, setSelectedWpId] = useState<string | null>(null)
  const [lastAddedId, setLastAddedId] = useState<string | null>(null)
  const [routePath, setRoutePath] = useState<MapPoint[]>([])
  const [exportCopied, setExportCopied] = useState(false)
  const pointerDownRef = useRef<{ x: number; y: number } | null>(null)

  const { frameRoute, ...panZoom } = useMapPanZoom(viewportRef)

  const activeWaypoints = calibrationMode ? editorWaypoints : WAYPOINTS
  const roadSegments = getRoadSegments(calibrationMode ? editorWaypoints : [])
  const showRoute = fromPosition && toPosition && fromId && toId && fromId !== toId

  useEffect(() => {
    if (!showRoute || !fromPosition || !toPosition) {
      setRoutePath([])
      return
    }
    const path = findRoute(fromPosition, toPosition, activeWaypoints)
    setRoutePath(path)

    requestAnimationFrame(() => {
      frameRoute(path)
    })
  }, [routeKey, showRoute, fromPosition, toPosition, frameRoute, activeWaypoints])

  const updateWaypoints = useCallback((next: Waypoint[]) => {
    setEditorWaypoints(next)
    saveWaypointDraft(next)
  }, [])

  const openCalibration = useCallback(() => {
    setVenueMode(false)
    clearWaypointDraft()
    setEditorWaypoints(cloneWaypoints(WAYPOINTS))
    setCalibrationMode(true)
    setSelectedWpId(null)
    setLastAddedId(null)
  }, [])

  const closeCalibration = useCallback(() => {
    setCalibrationMode(false)
    setSelectedWpId(null)
  }, [])

  const openVenueMode = useCallback(() => {
    setCalibrationMode(false)
    setSelectedWpId(null)
    setEditorVenues({ ...VENUE_MAP_POSITIONS })
    setVenueMode(true)
  }, [])

  const closeVenueMode = useCallback(() => {
    setVenueMode(false)
  }, [])

  const screenToNormalized = useCallback((clientX: number, clientY: number): MapPoint | null => {
    const map = mapRef.current
    if (!map) return null
    const rect = map.getBoundingClientRect()
    const x = (clientX - rect.left) / rect.width
    const y = (clientY - rect.top) / rect.height
    if (x < 0 || x > 1 || y < 0 || y > 1) return null
    return { x: Math.round(x * 1000) / 1000, y: Math.round(y * 1000) / 1000 }
  }, [])

  const handleMapClick = useCallback((e: React.MouseEvent) => {
    if (!calibrationMode && !venueMode) return

    if (pointerDownRef.current) {
      const dx = e.clientX - pointerDownRef.current.x
      const dy = e.clientY - pointerDownRef.current.y
      if (Math.hypot(dx, dy) > 5) return // Ignored because it was a drag, not a clean click
    }

    const pt = screenToNormalized(e.clientX, e.clientY)
    if (!pt) return

    if (venueMode) {
      const name = window.prompt('Enter Venue ID (e.g., cse-lab, library):')
      if (name?.trim()) {
        const id = name.trim()
        setEditorVenues(prev => ({ ...prev, [id]: pt }))
        toast.success(`Added venue: ${id}`)
      }
      return
    }

    // Use a dynamic threshold based on zoom scale so we can place points closer together when zoomed in
    const threshold = 0.02 / panZoom.scale
    const hit = findNearestWaypoint(pt, editorWaypoints, threshold)

    if (editorMode === 'connect') {
      if (!hit) {
        toast.error('Tap a purple road point')
        return
      }
      if (!selectedWpId) {
        setSelectedWpId(hit.id)
        return
      }
      if (selectedWpId === hit.id) {
        setSelectedWpId(null)
        return
      }
      updateWaypoints(connectWaypoints(editorWaypoints, selectedWpId, hit.id))
      setSelectedWpId(hit.id)
      toast.success('Road connected')
      return
    }

    if (hit) {
      setSelectedWpId(hit.id)
      return
    }

    const chainToId = chainRoads ? (selectedWpId ?? lastAddedId) : null
    const next = addWaypoint(editorWaypoints, pt, { chainToId })
    const added = next[next.length - 1]
    updateWaypoints(next)
    setSelectedWpId(added.id)
    setLastAddedId(added.id)
    toast.success(`Added ${added.id}`)
  }, [
    calibrationMode,
    venueMode,
    chainRoads,
    editorMode,
    editorWaypoints,
    lastAddedId,
    screenToNormalized,
    selectedWpId,
    updateWaypoints,
  ])

  const handleDeleteSelected = useCallback(() => {
    if (!selectedWpId) return
    const next = removeWaypoint(editorWaypoints, selectedWpId)
    updateWaypoints(next)
    setSelectedWpId(null)
    setLastAddedId(null)
    toast.success('Road point removed')
  }, [editorWaypoints, selectedWpId, updateWaypoints])

  const handleResetRoads = useCallback(() => {
    const fresh = cloneWaypoints(WAYPOINTS)
    updateWaypoints(fresh)
    clearWaypointDraft()
    setSelectedWpId(null)
    setLastAddedId(null)
    toast.success('Roads reset to saved file')
  }, [updateWaypoints])

  const handleExportRoads = useCallback(async () => {
    const text = formatWaypointsExport(editorWaypoints)
    try {
      await navigator.clipboard.writeText(text)
      setExportCopied(true)
      toast.success('Roads copied — paste into mapConfig.ts')
      setTimeout(() => setExportCopied(false), 2000)
    } catch {
      toast.error('Could not copy to clipboard')
    }
  }, [editorWaypoints])

  const handleResetVenues = useCallback(() => {
    setEditorVenues({ ...VENUE_MAP_POSITIONS })
    toast.success('Venues reset to saved file')
  }, [])

  const handleExportVenues = useCallback(async () => {
    const lines = Object.entries(editorVenues)
      .map(([id, pt]) => `  '${id}': { x: ${pt.x}, y: ${pt.y} },`)
      .join('\\n')
    const text = `export const VENUE_MAP_POSITIONS: Record<string, MapPoint> = {\\n${lines}\\n}`

    try {
      await navigator.clipboard.writeText(text)
      setExportCopied(true)
      toast.success('Venues copied! Paste into mapConfig.ts')
      setTimeout(() => setExportCopied(false), 2000)
    } catch {
      toast.error('Could not copy to clipboard')
    }
  }, [editorVenues])

  const svgPath = pointsToSvgPath(routePath)
  
  let startAngle = 0
  if (routePath.length > 1) {
    const dx = routePath[1].x - routePath[0].x
    const dy = routePath[1].y - routePath[0].y
    startAngle = (Math.atan2(dy, dx) * 180 / Math.PI) + 90
  }

  return (
    <div className="campus-map">
      <div className="campus-map__frame">
        <div
          ref={viewportRef}
          className={`campus-map__viewport ${(calibrationMode || venueMode) ? 'campus-map__viewport--calibrate' : ''}`}
          {...panZoom.handlers}
          onPointerDownCapture={e => {
            pointerDownRef.current = { x: e.clientX, y: e.clientY }
          }}
          onClick={handleMapClick}
        >
          <div
            ref={mapRef}
            className="campus-map__transform"
            style={{
              transform: `translate(calc(-50% + ${panZoom.x}px), calc(-50% + ${panZoom.y}px)) scale(${panZoom.scale})`,
              transition: panZoom.isDragging ? 'none' : 'transform 1.2s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <img
              src={campusMap}
              alt="Campus map"
              className="campus-map__image"
              draggable={false}
            />

            <svg
              className="campus-map__overlay"
              viewBox="0 0 1 1"
              preserveAspectRatio="none"
            >
              <defs>
                <filter id="route-glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="0.008" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <linearGradient id="route-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3B82F6" />
                  <stop offset="50%" stopColor="#8B5CF6" />
                  <stop offset="100%" stopColor="#3B82F6" />
                </linearGradient>
              </defs>

              {calibrationMode && roadSegments.map(seg => (
                <line
                  key={seg.key}
                  x1={seg.x1}
                  y1={seg.y1}
                  x2={seg.x2}
                  y2={seg.y2}
                  className="campus-map__road-line"
                />
              ))}

              {calibrationMode && editorWaypoints.map(wp => (
                <g key={wp.id}>
                  <circle
                    cx={wp.x}
                    cy={wp.y}
                    r={selectedWpId === wp.id ? 0.006 : 0.003}
                    className={`campus-map__waypoint-dot ${selectedWpId === wp.id ? 'campus-map__waypoint-dot--selected' : ''}`}
                  />
                  <text x={wp.x + 0.006} y={wp.y - 0.004} className="campus-map__waypoint-label">
                    {wp.id}
                  </text>
                </g>
              ))}

              {(calibrationMode || venueMode) && Object.entries(venueMode ? editorVenues : VENUE_MAP_POSITIONS).map(([id, pos]) => (
                <g key={`venue-${id}`}>
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={0.003}
                    fill="#F87171"
                    stroke="#fff"
                    strokeWidth="0.001"
                  />
                  <text x={pos.x + 0.005} y={pos.y + 0.002} fill="#F87171" fontSize="0.006" fontWeight="600" style={{ pointerEvents: 'none', textShadow: '0 0 2px #000, 0 0 2px #000' }}>
                    {id.split('-').join(' ')}
                  </text>
                </g>
              ))}

              {showRoute && svgPath && (
                <>
                  <path d={svgPath} className="campus-map__route-glow" filter="url(#route-glow)" />
                  <path d={svgPath} className="campus-map__route-line" />
                  <path d={svgPath} className="campus-map__route-dash" />
                </>
              )}
            </svg>

            {/* Permanent Venue Pins */}
            {!calibrationMode && !venueMode && Object.entries(VENUE_MAP_POSITIONS).map(([id, pos]) => {
              const venue = VENUES.find(v => v.id === id)
              if (!venue) return null
              // Don't show pin if it's currently selected as start or destination
              if (id === fromId || id === toId) return null

              return (
                <button
                  key={`venue-pin-${id}`}
                  className="campus-map__venue-btn"
                  style={{ left: `${pos.x * 100}%`, top: `${pos.y * 100}%` }}
                  onClick={(e) => {
                    e.stopPropagation()
                    onVenueClick?.(venue)
                  }}
                  title={venue.name}
                  type="button"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                </button>
              )
            })}

            {fromPosition && (
              <m.div
                key={`from-${fromId}`}
                className="campus-map__pin"
                style={{ left: `${fromPosition.x * 100}%`, top: `${fromPosition.y * 100}%` }}
                initial={{ scale: 0, x: "-50%", y: "-50%", rotate: startAngle - 45 }}
                animate={{ scale: 1 / panZoom.scale, x: "-50%", y: "-50%", rotate: startAngle }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="campus-map__pin-svg">
                  <path d="M12 2L3 20L12 15L21 20L12 2Z" fill="#10B981" stroke="rgba(0,0,0,0.8)" strokeWidth="2" strokeLinejoin="round" />
                </svg>
                <span className="campus-map__pin-pulse campus-map__pin-pulse--green" />
              </m.div>
            )}

            {toPosition && (
              <m.div
                key={`to-${toId}`}
                className="campus-map__pin"
                style={{ left: `${toPosition.x * 100}%`, top: `${toPosition.y * 100}%` }}
                initial={{ scale: 0, x: "-50%", y: "-50%" }}
                animate={{ scale: 1 / panZoom.scale, x: "-50%", y: "-50%" }}
                transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.1 }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="campus-map__pin-svg">
                  <polygon points="12,2 22,12 12,22 2,12" fill="#EF4444" stroke="rgba(0,0,0,0.8)" strokeWidth="2" strokeLinejoin="round" />
                </svg>
                <span className="campus-map__pin-pulse campus-map__pin-pulse--red" />
              </m.div>
            )}
          </div>

        </div>

        <div className="campus-map__controls">
          <button type="button" className="campus-map__ctrl-btn" onClick={panZoom.zoomIn} aria-label="Zoom in">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
          <button type="button" className="campus-map__ctrl-btn" onClick={panZoom.zoomOut} aria-label="Zoom out">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
          <button type="button" className="campus-map__ctrl-btn" onClick={panZoom.resetView} aria-label="Reset view">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
          </button>
          <button
            type="button"
            className={`campus-map__ctrl-btn campus-map__ctrl-btn--calibrate ${venueMode ? 'campus-map__ctrl-btn--active' : ''}`}
            onClick={() => (venueMode ? closeVenueMode() : openVenueMode())}
            aria-label="Venue editor"
            title="Venue editor"
          >
            📍
          </button>
          <button
            type="button"
            className={`campus-map__ctrl-btn campus-map__ctrl-btn--calibrate ${calibrationMode ? 'campus-map__ctrl-btn--active' : ''}`}
            onClick={() => (calibrationMode ? closeCalibration() : openCalibration())}
            aria-label="Road editor"
            title="Road editor"
          >
            ⊕
          </button>
        </div>
      </div>

      <AnimatePresence>
        {venueMode && (
          <m.div
            className="campus-map__calib-panel"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <div className="campus-map__calib-header">
              <span>Venue Editor</span>
              <button type="button" onClick={closeVenueMode}>Done</button>
            </div>

            <p className="campus-map__calib-hint">
              Tap anywhere on the map to drop a pin. You will be prompted to enter a Venue ID.
            </p>

            <div className="campus-map__calib-meta">
              <span>{Object.keys(editorVenues).length} venues plotted</span>
            </div>

            <div className="campus-map__calib-actions">
              <button type="button" onClick={handleResetVenues}>Reset</button>
              <button type="button" onClick={handleExportVenues}>
                {exportCopied ? 'Copied!' : 'Export venues'}
              </button>
            </div>
          </m.div>
        )}

        {calibrationMode && (
          <m.div
            className="campus-map__calib-panel"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <div className="campus-map__calib-header">
              <span>Road Editor</span>
              <button type="button" onClick={closeCalibration}>Done</button>
            </div>

            <div className="campus-map__mode-row">
              <button
                type="button"
                className={`campus-map__mode-btn ${editorMode === 'add' ? 'campus-map__mode-btn--active' : ''}`}
                onClick={() => setEditorMode('add')}
              >
                Add road point
              </button>
              <button
                type="button"
                className={`campus-map__mode-btn ${editorMode === 'connect' ? 'campus-map__mode-btn--active' : ''}`}
                onClick={() => setEditorMode('connect')}
              >
                Connect roads
              </button>
            </div>

            <p className="campus-map__calib-hint">
              {editorMode === 'add'
                ? 'Tap along the road to drop purple points. Turn on chain mode to auto-link each new point to the previous one.'
                : 'Tap point A, then point B to connect them with a road line.'}
            </p>

            {editorMode === 'add' && (
              <label className="campus-map__chain-toggle">
                <input
                  type="checkbox"
                  checked={chainRoads}
                  onChange={e => setChainRoads(e.target.checked)}
                />
                Chain roads (auto-link to previous point)
              </label>
            )}

            <div className="campus-map__calib-meta">
              <span>{editorWaypoints.length} road points</span>
              {selectedWpId && <span>Selected: {selectedWpId}</span>}
            </div>

            <div className="campus-map__calib-actions">
              <button type="button" onClick={handleDeleteSelected} disabled={!selectedWpId}>
                Delete
              </button>
              <button type="button" onClick={handleResetRoads}>Reset</button>
              <button type="button" onClick={handleExportRoads}>
                {exportCopied ? 'Copied!' : 'Export roads'}
              </button>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  )
}
