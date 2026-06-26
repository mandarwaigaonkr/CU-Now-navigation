import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import './VenueDirections.css'

interface MapInfoSheetProps {
  onClose: () => void;
}

export default function MapInfoSheet({ onClose }: MapInfoSheetProps) {
  useEffect(() => {
    // Lock body scroll to prevent app getting stuck
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  const content = (
    <div className="venue-backdrop" onClick={onClose}>
      <div className="venue-sheet" onClick={e => e.stopPropagation()}>
        <div className="venue-sheet__handle" />
        {/* Header */}
        <div className="venue-sheet__header">
          <div>
            <h2 className="venue-sheet__title">About Map Navigation (Beta)</h2>
          </div>
          <button className="venue-sheet__close" onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="venue-sheet__directions">
          <p className="venue-sheet__directions-text">
            This feature is currently very new, and many more professional additions will be made very soon for all visitors to navigate around our beautiful campus seamlessly.
          </p>
        </div>
      </div>
    </div>
  )

  return createPortal(content, document.body)
}
