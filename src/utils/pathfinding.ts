import {
  type MapPoint,
  type Waypoint,
  WAYPOINTS,
} from '../data/mapConfig'

function dist(a: MapPoint, b: MapPoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function getWaypointById(waypoints: Waypoint[], id: string): Waypoint | undefined {
  return waypoints.find(w => w.id === id)
}

function findClosestWaypoints(point: MapPoint, waypoints: Waypoint[], count: number = 3): Waypoint[] {
  return [...waypoints]
    .sort((a, b) => dist(point, a) - dist(point, b))
    .slice(0, count)
}

function dijkstra(start: MapPoint, end: MapPoint, waypoints: Waypoint[]): string[] {
  if (waypoints.length === 0) return []

  const distances = new Map<string, number>()
  const previous = new Map<string, string | null>()
  
  const V_START = 'VIRTUAL_START'
  const V_END = 'VIRTUAL_END'

  const unvisited = new Set<string>([V_START, V_END, ...waypoints.map(w => w.id)])

  for (const id of unvisited) {
    distances.set(id, Infinity)
    previous.set(id, null)
  }
  distances.set(V_START, 0)

  const startConnections = findClosestWaypoints(start, waypoints, 3).map(w => w.id)
  const endConnections = findClosestWaypoints(end, waypoints, 3).map(w => w.id)
  const wpMap = new Map<string, Waypoint>(waypoints.map(w => [w.id, w]))

  const getConnections = (id: string): string[] => {
    if (id === V_START) return startConnections
    if (id === V_END) return []
    const wp = wpMap.get(id)
    if (!wp) return []
    const conns = [...wp.connections]
    if (endConnections.includes(id)) conns.push(V_END)
    return conns
  }

  const getDist = (id1: string, id2: string): number => {
    const p1 = id1 === V_START ? start : (id1 === V_END ? end : wpMap.get(id1)!)
    const p2 = id2 === V_START ? start : (id2 === V_END ? end : wpMap.get(id2)!)
    return dist(p1, p2)
  }

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
    if (current === V_END) break

    const connections = getConnections(current)

    for (const neighborId of connections) {
      if (!unvisited.has(neighborId)) continue
      
      const alt = (distances.get(current) ?? Infinity) + getDist(current, neighborId)
      if (alt < (distances.get(neighborId) ?? Infinity)) {
        distances.set(neighborId, alt)
        previous.set(neighborId, current)
      }
    }
  }

  const path: string[] = []
  let cursor: string | null = V_END
  while (cursor) {
    if (cursor !== V_START && cursor !== V_END) {
      path.unshift(cursor)
    }
    cursor = previous.get(cursor) ?? null
  }

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

  const wpIds = dijkstra(start, end, waypoints)
  const route: MapPoint[] = [start]

  for (const id of wpIds) {
    const wp = getWaypointById(waypoints, id)
    if (wp) route.push({ x: wp.x, y: wp.y })
  }

  route.push(end)

  return route
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
