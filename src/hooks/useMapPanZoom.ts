import { useCallback, useEffect, useRef, useState } from 'react'
import { useMotionValue } from 'framer-motion'

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
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const scale = useMotionValue(1)
  
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

  const applyState = useCallback((nextX: number, nextY: number, nextScale: number) => {
    const { mapSize, vpW, vpH } = measure()
    if (!mapSize) return
    const s = clampScale(nextScale)
    const pan = clampPan(nextX, nextY, s, mapSize, vpW, vpH)
    x.set(pan.x)
    y.set(pan.y)
    scale.set(s)
  }, [measure, x, y, scale])

  useEffect(() => {
    const vp = viewportRef.current
    if (!vp) return
    const ro = new ResizeObserver(() => {
      const { mapSize, vpW, vpH } = measure()
      if (!mapSize) return
      const s = clampScale(scale.get())
      const pan = clampPan(x.get(), y.get(), s, mapSize, vpW, vpH)
      x.set(pan.x)
      y.set(pan.y)
      scale.set(s)
    })
    ro.observe(vp)
    measure()
    return () => ro.disconnect()
  }, [viewportRef, measure, x, y, scale])

  const frameRoute = useCallback((path: {x: number; y: number}[]) => {
    const { mapSize, vpW, vpH } = measure()
    if (!mapSize || path.length < 2) return

    const xs = path.map(p => p.x)
    const ys = path.map(p => p.y)
    
    const minX = Math.min(...xs)
    const maxX = Math.max(...xs)
    const minY = Math.min(...ys)
    const maxY = Math.max(...ys)

    // Prevent extreme zoom if start and end are practically the same point
    const bw = maxX - minX
    const bh = maxY - minY
    const cx = (minX + maxX) / 2
    const cy = (minY + maxY) / 2

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

    const newX = (0.5 - cx) * mapSize * newScale
    const newY = (0.5 - cy) * mapSize * newScale

    applyState(newX, newY, newScale)
  }, [measure, applyState])

  const resetView = useCallback(() => {
    applyState(0, 0, 1)
  }, [applyState])

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: x.get(), origY: y.get() }
    setIsDragging(true)
  }, [x, y])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return
    const dx = e.clientX - dragRef.current.startX
    const dy = e.clientY - dragRef.current.startY
    applyState(
      dragRef.current.origX + dx,
      dragRef.current.origY + dy,
      scale.get()
    )
  }, [scale, applyState])

  const onPointerUp = useCallback(() => {
    dragRef.current = null
    setIsDragging(false)
  }, [])

  const onWheel = useCallback((e: React.WheelEvent) => {
    const delta = e.deltaY > 0 ? -0.12 : 0.12
    applyState(x.get(), y.get(), scale.get() + delta)
  }, [x, y, scale, applyState])

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    setIsDragging(true)
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      pinchRef.current = {
        dist: Math.hypot(dx, dy),
        scale: scale.get(),
        origX: x.get(),
        origY: y.get(),
      }
    }
  }, [scale, x, y])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchRef.current) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      const dist = Math.hypot(dx, dy)
      const ratio = dist / pinchRef.current.dist
      applyState(
        pinchRef.current.origX,
        pinchRef.current.origY,
        pinchRef.current.scale * ratio
      )
    }
  }, [applyState])

  const onTouchEnd = useCallback(() => {
    pinchRef.current = null
    setIsDragging(false)
  }, [])

  const zoomIn = useCallback(() => {
    applyState(x.get(), y.get(), scale.get() + 0.25)
  }, [x, y, scale, applyState])

  const zoomOut = useCallback(() => {
    applyState(x.get(), y.get(), scale.get() - 0.25)
  }, [x, y, scale, applyState])

  return {
    x,
    y,
    scale,
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
