import { useLocation, useOutlet } from 'react-router-dom'
import { AnimatePresence, LazyMotion, domAnimation, m } from 'framer-motion'
import { useState } from 'react'
import Navbar from './Navbar'

const TAB_ORDER = ['/dashboard', '/navigation', '/schedule', '/about', '/profile']

export default function Layout() {
  const location = useLocation()
  const outlet = useOutlet()
  
  const [animState, setAnimState] = useState({
    prevPath: location.pathname,
    direction: 0,
    prevIndex: TAB_ORDER.findIndex(path => location.pathname.startsWith(path))
  })

  // Synchronous state update for derived state to prevent animation direction lag
  if (location.pathname !== animState.prevPath) {
    const currentIndex = TAB_ORDER.findIndex(path => location.pathname.startsWith(path))
    let newDirection = animState.direction
    
    if (currentIndex !== -1 && animState.prevIndex !== -1 && currentIndex !== animState.prevIndex) {
      newDirection = currentIndex > animState.prevIndex ? 1 : -1
    }
    
    setAnimState({
      prevPath: location.pathname,
      direction: newDirection,
      prevIndex: currentIndex !== -1 ? currentIndex : animState.prevIndex
    })
  }

  const direction = animState.direction;

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0,
      position: 'absolute' as const,
      width: '100%',
      height: '100%',
      top: 0,
      left: 0
    }),
    center: {
      x: 0,
      opacity: 1,
      position: 'relative' as const,
      width: '100%',
      height: '100%',
      top: 0,
      left: 0
    },
    exit: (direction: number) => ({
      x: direction > 0 ? '-30%' : '30%',
      opacity: 0,
      position: 'absolute' as const,
      width: '100%',
      height: '100%',
      top: 0,
      left: 0,
      zIndex: -1
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden' }}>
      <div style={{ flexGrow: 1, position: 'relative', overflow: 'hidden' }}>
        <LazyMotion features={domAnimation} strict>
          <AnimatePresence initial={false} custom={direction}>
            <m.div
              key={location.pathname}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: 'spring', stiffness: 350, damping: 35 },
                opacity: { duration: 0.2 }
              }}
              style={{ 
                overflowY: 'auto', 
                paddingBottom: '100px',
                WebkitOverflowScrolling: 'touch',
                backgroundColor: 'var(--color-bg-base)',
                willChange: 'transform, opacity'
              }}
            >
              {outlet}
            </m.div>
          </AnimatePresence>
        </LazyMotion>
      </div>
      <Navbar />
    </div>
  )
}
