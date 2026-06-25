// Campus map calibration data — all coordinates are normalized 0–1 (relative to image size).
// Use the ⊕ calibration tool on the map page to refine positions.

export interface MapPoint {
  x: number
  y: number
}

export interface Waypoint {
  id: string
  x: number
  y: number
  connections: string[]
}

export const MAP_IMAGE_SIZE = { width: 1254, height: 1254 }

export const MAIN_GATE: MapPoint = { x: 0.103, y: 0.273 }

/**
 * Road network nodes for route drawing.
 * Empty by default — use the ⊕ Road Editor on the map to add points and export.
 */
export const WAYPOINTS: Waypoint[] = [
  { id: 'road-1', x: 0.102, y: 0.265, connections: ['road-2'] },
  { id: 'road-2', x: 0.437, y: 0.245, connections: ['road-1', 'road-3'] },
  { id: 'road-3', x: 0.492, y: 0.263, connections: ['road-2', 'road-4'] },
  { id: 'road-4', x: 0.533, y: 0.263, connections: ['road-3', 'road-5'] },
  { id: 'road-5', x: 0.598, y: 0.257, connections: ['road-4', 'road-6'] },
  { id: 'road-6', x: 0.662, y: 0.263, connections: ['road-5', 'road-7'] },
  { id: 'road-7', x: 0.74, y: 0.252, connections: ['road-6'] },
]

/** Venue pin positions keyed by venue id */
export const VENUE_MAP_POSITIONS: Record<string, MapPoint> = {
  'coe-frontier-material-lab': { x: 0.724, y: 0.284 },
  'coe-bosch-workshop': { x: 0.724, y: 0.284 },
  'coe-robotics-lab': { x: 0.724, y: 0.284 },
  'coe-automation-lab': { x: 0.724, y: 0.284 },
  'block-1-audi': { x: 0.497, y: 0.173 },
  'pu-block': { x: 0.605, y: 0.614 },
  'cse-lab': { x: 0.609, y: 0.238 },
  'ece-lab': { x: 0.609, y: 0.238 },
  'block-3-audi': { x: 0.696, y: 0.237 },
  'block-4-audi': { x: 0.76, y: 0.235 },
  'eee-lab': { x: 0.696, y: 0.237 },
  'me-lab': { x: 0.873, y: 0.188 },
  'civil-lab': { x: 0.873, y: 0.188 },
  'open-audi': { x: 0.609, y: 0.238 },
  'arch-block': { x: 0.817, y: 0.514 },
  'devdan-block': { x: 0.92, y: 0.48 },
  'amphitheater': { x: 0.518, y: 0.413 },
  'basketball-court': { x: 0.518, y: 0.413 },
  'main-ground': { x: 0.518, y: 0.413 },
  'car-parking': { x: 0.103, y: 0.273 },
  'bike-parking': { x: 0.103, y: 0.273 },
}

export function getMapPosition(locationId: string): MapPoint | null {
  if (locationId === 'main-gate') return MAIN_GATE
  return VENUE_MAP_POSITIONS[locationId] ?? null
}

export function getWaypointById(id: string): Waypoint | undefined {
  return WAYPOINTS.find(w => w.id === id)
}
