import { useCallback, useEffect, useRef, useState } from 'react'

interface PanZoomState {
  scale: number
  x: number
  y: number
}

const MIN_SCALE = 1
const MAX_SCALE = 4

function clampPan(
  x: number,
  y: number,
  scale: number,
  mapSize: number,
  vpW: number,
  vpH: number,
): { x: number; y: number } {
  const scaled = mapSize * scale
  const maxPanX = Math.max(0, (scaled - vpW) / 2)
  const maxPanY = Math.max(0, (scaled - vpH) / 2)
  return {
    x: Math.max(-maxPanX, Math.min(maxPanX, x)),
    y: Math.max(-maxPanY, Math.min(maxPanY, y)),
  }
}

function clampScale(scale: number): number {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale))
}

export function useMapPanZoom(viewportRef: React.RefObject<HTMLDivElement | null>) {
  const [state, setState] = useState<PanZoomState>({ scale: 1, x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null)
  const pinchRef = useRef<{ dist: number; scale: number; origX: number; origY: number } | null>(null)
  const metricsRef = useRef({ mapSize: 0, vpW: 0, vpH: 0 })

  const measure = useCallback(() => {
    const vp = viewportRef.current
    if (!vp) return metricsRef.current
    const vpW = vp.clientWidth
    const vpH = vp.clientHeight
    const mapSize = Math.max(vpW, vpH)
    metricsRef.current = { mapSize, vpW, vpH }
    return metricsRef.current
  }, [viewportRef])

  const applyState = useCallback((next: PanZoomState) => {
    const { mapSize, vpW, vpH } = measure()
    if (!mapSize) return
    const scale = clampScale(next.scale)
    const pan = clampPan(next.x, next.y, scale, mapSize, vpW, vpH)
    setState({ scale, ...pan })
  }, [measure])

  useEffect(() => {
    const vp = viewportRef.current
    if (!vp) return
    const ro = new ResizeObserver(() => {
      setState(prev => {
        const { mapSize, vpW, vpH } = measure()
        if (!mapSize) return prev
        const scale = clampScale(prev.scale)
        const pan = clampPan(prev.x, prev.y, scale, mapSize, vpW, vpH)
        return { scale, ...pan }
      })
    })
    ro.observe(vp)
    measure()
    return () => ro.disconnect()
  }, [viewportRef, measure])

  const frameRoute = useCallback((path: {x: number; y: number}[]) => {
    const { mapSize, vpW, vpH } = measure()
    if (!mapSize || path.length < 2) return

    const xs = path.map(p => p.x)
    const ys = path.map(p => p.y)
    
    const minX = Math.min(...xs)
    const maxX = Math.max(...xs)
    const minY = Math.min(...ys)
    const maxY = Math.max(...ys)

    const bw = maxX - minX
    const bh = maxY - minY
    const cx = (minX + maxX) / 2
    const cy = (minY + maxY) / 2

    // Prevent extreme zoom if start and end are practically the same point
    const safeBw = Math.max(bw, 0.05)
    const safeBh = Math.max(bh, 0.05)

    // We want the route to fit within 75% of the screen (leaving a 12.5% padding on all sides)
    const availableW = Math.max(vpW * 0.75, 100)
    const availableH = Math.max(vpH * 0.75, 100)

    // Calculate the scale required to fit the route's physical size into the available screen space
    const scaleX = availableW / (safeBw * mapSize)
    const scaleY = availableH / (safeBh * mapSize)
    
    // Take the smaller scale to ensure BOTH dimensions fit perfectly
    const newScale = clampScale(Math.min(scaleX, scaleY))

    const x = (0.5 - cx) * mapSize * newScale
    const y = (0.5 - cy) * mapSize * newScale

    applyState({ scale: newScale, x, y })
  }, [measure, applyState])

  const resetView = useCallback(() => {
    applyState({ scale: 1, x: 0, y: 0 })
  }, [applyState])

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: state.x, origY: state.y }
    setIsDragging(true)
  }, [state.x, state.y])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return
    const dx = e.clientX - dragRef.current.startX
    const dy = e.clientY - dragRef.current.startY
    applyState({
      scale: state.scale,
      x: dragRef.current.origX + dx,
      y: dragRef.current.origY + dy,
    })
  }, [state.scale, applyState])

  const onPointerUp = useCallback(() => {
    dragRef.current = null
    setIsDragging(false)
  }, [])

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.12 : 0.12
    applyState({ scale: state.scale + delta, x: state.x, y: state.y })
  }, [state.scale, state.x, state.y, applyState])

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    setIsDragging(true)
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      pinchRef.current = {
        dist: Math.hypot(dx, dy),
        scale: state.scale,
        origX: state.x,
        origY: state.y,
      }
    }
  }, [state.scale, state.x, state.y])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchRef.current) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      const dist = Math.hypot(dx, dy)
      const ratio = dist / pinchRef.current.dist
      applyState({
        scale: pinchRef.current.scale * ratio,
        x: pinchRef.current.origX,
        y: pinchRef.current.origY,
      })
    }
  }, [applyState])

  const onTouchEnd = useCallback(() => {
    pinchRef.current = null
    setIsDragging(false)
  }, [])

  const zoomIn = useCallback(() => {
    applyState({ scale: state.scale + 0.25, x: state.x, y: state.y })
  }, [state.scale, state.x, state.y, applyState])

  const zoomOut = useCallback(() => {
    applyState({ scale: state.scale - 0.25, x: state.x, y: state.y })
  }, [state.scale, state.x, state.y, applyState])

  return {
    ...state,
    isDragging,
    frameRoute,
    resetView,
    zoomIn,
    zoomOut,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onWheel,
      onTouchStart,
      onTouchMove,
      onTouchEnd,
    },
  }
}
