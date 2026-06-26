import type { MapPoint, Waypoint } from '../data/mapConfig'

const DRAFT_KEY = 'cu-nav-waypoint-draft'

export function cloneWaypoints(waypoints: Waypoint[]): Waypoint[] {
  return waypoints.map(wp => ({ ...wp, connections: [...wp.connections] }))
}

export function loadWaypointDraft(fallback: Waypoint[]): Waypoint[] {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return cloneWaypoints(fallback)
    const parsed = JSON.parse(raw) as Waypoint[]
    if (!Array.isArray(parsed) || parsed.length === 0) return cloneWaypoints(fallback)
    return parsed
  } catch {
    return cloneWaypoints(fallback)
  }
}

export function saveWaypointDraft(waypoints: Waypoint[]) {
  localStorage.setItem(DRAFT_KEY, JSON.stringify(waypoints))
}

export function clearWaypointDraft() {
  localStorage.removeItem(DRAFT_KEY)
}

export function findNearestWaypoint(
  point: MapPoint,
  waypoints: Waypoint[],
  threshold = 0.04,
): Waypoint | null {
  let best: Waypoint | null = null
  let bestDist = threshold
  for (const wp of waypoints) {
    const d = Math.hypot(point.x - wp.x, point.y - wp.y)
    if (d < bestDist) {
      bestDist = d
      best = wp
    }
  }
  return best
}

export function nextWaypointId(waypoints: Waypoint[]): string {
  const used = new Set(waypoints.map(wp => wp.id))
  let i = 1
  while (used.has(`road-${i}`)) i++
  return `road-${i}`
}

export function addWaypoint(
  waypoints: Waypoint[],
  point: MapPoint,
  options?: { chainToId?: string | null; id?: string },
): Waypoint[] {
  const id = options?.id ?? nextWaypointId(waypoints)
  const next: Waypoint = {
    id,
    x: point.x,
    y: point.y,
    connections: [],
  }

  if (!options?.chainToId) {
    return [...waypoints, next]
  }

  return connectWaypoints([...waypoints, next], options.chainToId, id)
}

export function connectWaypoints(
  waypoints: Waypoint[],
  fromId: string,
  toId: string,
): Waypoint[] {
  if (fromId === toId) return waypoints

  return waypoints.map(wp => {
    if (wp.id === fromId && !wp.connections.includes(toId)) {
      return { ...wp, connections: [...wp.connections, toId] }
    }
    if (wp.id === toId && !wp.connections.includes(fromId)) {
      return { ...wp, connections: [...wp.connections, fromId] }
    }
    return wp
  })
}

export function removeWaypoint(waypoints: Waypoint[], id: string): Waypoint[] {
  return waypoints
    .filter(wp => wp.id !== id)
    .map(wp => ({
      ...wp,
      connections: wp.connections.filter(conn => conn !== id),
    }))
}

export function getRoadSegments(waypoints: Waypoint[]) {
  const byId = new Map(waypoints.map(wp => [wp.id, wp]))
  const segments: Array<{ x1: number; y1: number; x2: number; y2: number; key: string }> = []
  const seen = new Set<string>()

  for (const wp of waypoints) {
    for (const connId of wp.connections) {
      const neighbor = byId.get(connId)
      if (!neighbor) continue
      const key = [wp.id, connId].sort().join('--')
      if (seen.has(key)) continue
      seen.add(key)
      segments.push({
        key,
        x1: wp.x,
        y1: wp.y,
        x2: neighbor.x,
        y2: neighbor.y,
      })
    }
  }

  return segments
}

export function formatWaypointsExport(waypoints: Waypoint[]): string {
  const lines = waypoints.map(wp => {
    const connections = wp.connections.map(id => `'${id}'`).join(', ')
    return `  { id: '${wp.id}', x: ${wp.x}, y: ${wp.y}, connections: [${connections}] },`
  })

  return `export const WAYPOINTS: Waypoint[] = [\n${lines.join('\n')}\n]`
}
