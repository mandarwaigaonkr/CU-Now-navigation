import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, m } from 'framer-motion'
import toast from 'react-hot-toast'
import campusMap from '../assets/campus-map.png'
import { type MapPoint, type Waypoint, WAYPOINTS, VENUE_MAP_POSITIONS } from '../data/mapConfig'
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
}

type EditorMode = 'add' | 'connect'

export default function CampusMap({
  fromId,
  toId,
  fromPosition,
  toPosition,
  routeKey,
}: CampusMapProps) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<HTMLDivElement>(null)
  const [calibrationMode, setCalibrationMode] = useState(false)
  const [editorWaypoints, setEditorWaypoints] = useState<Waypoint[]>(() => cloneWaypoints(WAYPOINTS))
  const [editorMode, setEditorMode] = useState<EditorMode>('add')
  const [chainRoads, setChainRoads] = useState(true)
  const [selectedWpId, setSelectedWpId] = useState<string | null>(null)
  const [lastAddedId, setLastAddedId] = useState<string | null>(null)
  const [routePath, setRoutePath] = useState<MapPoint[]>([])
  const [exportCopied, setExportCopied] = useState(false)

  const { zoomToBounds, ...panZoom } = useMapPanZoom(viewportRef)

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
    const bounds = getRouteBounds(path)

    requestAnimationFrame(() => {
      zoomToBounds(bounds)
    })
  }, [routeKey, showRoute, fromPosition, toPosition, zoomToBounds, activeWaypoints])

  const updateWaypoints = useCallback((next: Waypoint[]) => {
    setEditorWaypoints(next)
    saveWaypointDraft(next)
  }, [])

  const openCalibration = useCallback(() => {
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
    if (!calibrationMode) return

    const pt = screenToNormalized(e.clientX, e.clientY)
    if (!pt) return

    const hit = findNearestWaypoint(pt, editorWaypoints)

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

  const svgPath = pointsToSvgPath(routePath)

  return (
    <div className="campus-map">
      <div className="campus-map__frame">
        <div
          ref={viewportRef}
          className={`campus-map__viewport ${calibrationMode ? 'campus-map__viewport--calibrate' : ''}`}
          {...(calibrationMode ? {} : panZoom.handlers)}
          onClick={handleMapClick}
        >
          <div
            ref={mapRef}
            className="campus-map__transform"
            style={{
              transform: `translate(calc(-50% + ${panZoom.x}px), calc(-50% + ${panZoom.y}px)) scale(${panZoom.scale})`,
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

              {calibrationMode && Object.entries(VENUE_MAP_POSITIONS).map(([id, pos]) => (
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

            {fromPosition && (
              <m.div
                key={`from-${fromId}`}
                className="campus-map__pin campus-map__pin--from"
                style={{ left: `${fromPosition.x * 100}%`, top: `${fromPosition.y * 100}%` }}
                initial={{ scale: 0, y: -20 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              >
                <span className="campus-map__pin-head" />
                <span className="campus-map__pin-pulse" />
              </m.div>
            )}

            {toPosition && (
              <m.div
                key={`to-${toId}`}
                className="campus-map__pin campus-map__pin--to"
                style={{ left: `${toPosition.x * 100}%`, top: `${toPosition.y * 100}%` }}
                initial={{ scale: 0, y: -20 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.1 }}
              >
                <span className="campus-map__pin-head" />
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
