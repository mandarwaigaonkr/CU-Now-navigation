import { useEffect, useRef, useState } from 'react'
import { m, useMotionTemplate, useTransform } from 'framer-motion'
import campusMap from '../assets/campus-map.png'
import { type MapPoint, WAYPOINTS, VENUE_MAP_POSITIONS } from '../data/mapConfig'
import VENUES, { type Venue } from '../data/venues'
import { useMapPanZoom } from '../hooks/useMapPanZoom'
import { findRoute, pointsToSvgPath } from '../utils/pathfinding'
import './CampusMap.css'

interface CampusMapProps {
  fromId: string | null
  toId: string | null
  fromPosition: MapPoint | null
  toPosition: MapPoint | null
  routeKey: number
  onVenueClick?: (venue: Venue) => void
}

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
  const [routePath, setRoutePath] = useState<MapPoint[]>([])

  const { frameRoute, ...panZoom } = useMapPanZoom(viewportRef)
  const transformTemplate = useMotionTemplate`translate(calc(-50% + ${panZoom.x}px), calc(-50% + ${panZoom.y}px)) scale(${panZoom.scale})`
  const inverseScale = useTransform(panZoom.scale, s => 1 / s)

  const showRoute = fromPosition && toPosition && fromId && toId && fromId !== toId

  useEffect(() => {
    if (!showRoute || !fromPosition || !toPosition) {
      setRoutePath([])
      return
    }
    const path = findRoute(fromPosition, toPosition, WAYPOINTS)
    setRoutePath(path)

    requestAnimationFrame(() => {
      frameRoute(path)
    })
  }, [routeKey, showRoute, fromPosition, toPosition, frameRoute])

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
          className="campus-map__viewport"
          {...panZoom.handlers}
        >
          <m.div
            ref={mapRef}
            className="campus-map__transform"
            style={{
              transform: transformTemplate,
              transition: panZoom.isDragging ? 'none' : 'transform 1.2s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <img
              src={campusMap}
              alt="Campus map"
              className="campus-map__image"
              draggable={false}
              fetchPriority="high"
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

              {showRoute && svgPath && (
                <>
                  <path d={svgPath} className="campus-map__route-glow" filter="url(#route-glow)" />
                  <path d={svgPath} className="campus-map__route-line" />
                  <path d={svgPath} className="campus-map__route-dash" />
                </>
              )}
            </svg>

            {/* Permanent Venue Pins */}
            {Object.entries(VENUE_MAP_POSITIONS).map(([id, pos]) => {
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
                  <svg width="4" height="4" viewBox="0 0 4 4" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="2" cy="2" r="2" fill="rgba(255,255,255,0.9)" />
                  </svg>
                </button>
              )
            })}

            {fromPosition && (
              <m.div
                key={`from-${fromId}`}
                className="campus-map__pin"
                style={{ left: `${fromPosition.x * 100}%`, top: `${fromPosition.y * 100}%`, scale: inverseScale, x: "-50%", y: "-50%", rotate: startAngle }}
              >
                <m.div
                  initial={{ scale: 0, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="campus-map__pin-svg">
                    <path d="M12 2L3 20L12 15L21 20L12 2Z" fill="#10B981" stroke="rgba(0,0,0,0.8)" strokeWidth="2" strokeLinejoin="round" />
                  </svg>
                  <span className="campus-map__pin-pulse campus-map__pin-pulse--green" />
                </m.div>
              </m.div>
            )}

            {toPosition && (
              <m.div
                key={`to-${toId}`}
                className="campus-map__pin"
                style={{ left: `${toPosition.x * 100}%`, top: `${toPosition.y * 100}%`, scale: inverseScale, x: "-50%", y: "-50%" }}
              >
                <m.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.1 }}
                  style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="campus-map__pin-svg">
                    <polygon points="12,2 22,12 12,22 2,12" fill="#EF4444" stroke="rgba(0,0,0,0.8)" strokeWidth="2" strokeLinejoin="round" />
                  </svg>
                  <span className="campus-map__pin-pulse campus-map__pin-pulse--red" />
                </m.div>
              </m.div>
            )}
          </m.div>

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
        </div>
      </div>
    </div>
  )
}
