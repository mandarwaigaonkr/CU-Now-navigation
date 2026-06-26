import { useState, useRef, useEffect } from 'react'
import './CustomSelect.css'

export interface SelectOption {
  label: string;
  value: any;
}

interface CustomSelectProps {
  value: any;
  options: SelectOption[];
  onChange: (val: any) => void;
  error?: boolean;
  placeholder?: string;
}

export default function CustomSelect({ value, options, onChange, error, placeholder = 'Select an option' }: CustomSelectProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClick)
      return () => document.removeEventListener('mousedown', handleClick)
    }
  }, [open])

  // Focus search input when opened and clear query
  useEffect(() => {
    if (open) {
      setSearchQuery('')
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 50)
    }
  }, [open])

  function handleSelect(val: any) {
    onChange(val)
    setOpen(false)
  }

  // Find the label for the current value
  const selectedOption = options.find(opt => opt.value === value)
  const displayLabel = selectedOption ? selectedOption.label : placeholder

  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className={`custom-select-container ${error ? 'custom-select-container--error' : ''}`} ref={ref}>
      <div
        className={`custom-select__trigger ${open ? 'custom-select__trigger--open' : ''} ${!value ? 'custom-select__trigger--placeholder' : ''}`}
        onClick={() => {
          if (!open) setOpen(true)
        }}
      >
        {open ? (
          <input
            ref={searchInputRef}
            type="text"
            className="custom-select__inline-search"
            placeholder="Search venues..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        ) : (
          <span className="custom-select__value">{displayLabel}</span>
        )}
        <button 
          type="button"
          className="custom-select__trigger-btn"
          onClick={(e) => {
            e.stopPropagation()
            setOpen(prev => !prev)
          }}
        >
          <svg
            className={`custom-select__chevron ${open ? 'custom-select__chevron--open' : ''}`}
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
      </div>

      {open && (
        <div className="custom-select__dropdown">
          <div className="custom-select__options">
            {filteredOptions.length === 0 ? (
              <div className="custom-select__no-results">No venues found</div>
            ) : (
              filteredOptions.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  className={`custom-select__option ${value === opt.value ? 'custom-select__option--active' : ''}`}
                  onClick={() => handleSelect(opt.value)}
                >
                  {opt.label}
                  {value === opt.value && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
