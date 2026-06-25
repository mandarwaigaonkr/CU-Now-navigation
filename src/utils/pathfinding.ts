import {
  type MapPoint,
  type Waypoint,
  WAYPOINTS,
} from '../data/mapConfig'

function dist(a: MapPoint, b: MapPoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function nearestWaypoint(point: MapPoint, waypoints: Waypoint[]): string {
  if (waypoints.length === 0) return ''
  let bestId = waypoints[0].id
  let bestDist = Infinity
  for (const wp of waypoints) {
    const d = dist(point, wp)
    if (d < bestDist) {
      bestDist = d
      bestId = wp.id
    }
  }
  return bestId
}

function getWaypointById(waypoints: Waypoint[], id: string): Waypoint | undefined {
  return waypoints.find(w => w.id === id)
}

function dijkstra(startId: string, endId: string, waypoints: Waypoint[]): string[] {
  if (!startId || !endId) return []
  if (startId === endId) return [startId]

  const distances = new Map<string, number>()
  const previous = new Map<string, string | null>()
  const unvisited = new Set(waypoints.map(w => w.id))

  for (const wp of waypoints) {
    distances.set(wp.id, Infinity)
    previous.set(wp.id, null)
  }
  distances.set(startId, 0)

  while (unvisited.size > 0) {
    let current: string | null = null
    let minDist = Infinity
    for (const id of unvisited) {
      const d = distances.get(id) ?? Infinity
      if (d < minDist) {
        minDist = d
        current = id
      }
    }
    if (current === null || minDist === Infinity) break

    unvisited.delete(current)
    if (current === endId) break

    const wp = getWaypointById(waypoints, current)
    if (!wp) continue

    for (const neighborId of wp.connections) {
      if (!unvisited.has(neighborId)) continue
      const neighbor = getWaypointById(waypoints, neighborId)
      if (!neighbor) continue
      const alt = (distances.get(current) ?? Infinity) + dist(wp, neighbor)
      if (alt < (distances.get(neighborId) ?? Infinity)) {
        distances.set(neighborId, alt)
        previous.set(neighborId, current)
      }
    }
  }

  const path: string[] = []
  let cursor: string | null = endId
  while (cursor) {
    path.unshift(cursor)
    cursor = previous.get(cursor) ?? null
  }

  if (path[0] !== startId) return [startId, endId]
  return path
}

/** Build a road-following route between two map points */
export function findRoute(
  start: MapPoint,
  end: MapPoint,
  waypoints: Waypoint[] = WAYPOINTS,
): MapPoint[] {
  if (waypoints.length === 0) {
    return [start, end]
  }

  const startWpId = nearestWaypoint(start, waypoints)
  const endWpId = nearestWaypoint(end, waypoints)

  const wpIds = dijkstra(startWpId, endWpId, waypoints)
  const route: MapPoint[] = [start]

  for (const id of wpIds) {
    const wp = getWaypointById(waypoints, id)
    if (wp) route.push({ x: wp.x, y: wp.y })
  }

  route.push(end)

  return route.filter((pt, i) => {
    if (i === 0) return true
    return dist(pt, route[i - 1]) > 0.005
  })
}

export function pointsToSvgPath(points: MapPoint[]): string {
  if (points.length === 0) return ''
  return points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ')
}

export function getRouteBounds(points: MapPoint[], padding = 0.08) {
  const xs = points.map(p => p.x)
  const ys = points.map(p => p.y)
  const minX = Math.max(0, Math.min(...xs) - padding)
  const maxX = Math.min(1, Math.max(...xs) + padding)
  const minY = Math.max(0, Math.min(...ys) - padding)
  const maxY = Math.min(1, Math.max(...ys) + padding)
  return { minX, maxX, minY, maxY, cx: (minX + maxX) / 2, cy: (minY + maxY) / 2 }
}
