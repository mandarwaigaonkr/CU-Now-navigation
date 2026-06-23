// src/pages/auth/Onboarding.tsx
// Profile completion — Guest: name and organization

import React, { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase'
import { useAuth } from '../../hooks/useAuth'
import christLogo from '../../assets/christ-logo.png'
import './Onboarding.css'

export default function Onboarding() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [nameInput, setNameInput] = useState(user?.displayName || '')
  const [orgInput, setOrgInput] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  function validate() {
    const e: Record<string, string> = {}
    if (!nameInput.trim()) e.name = 'Name is required'
    if (!orgInput.trim()) e.org = 'Organization is required'
    return e
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return;
    
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }
    setLoading(true)
    try {
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        name: nameInput.trim(),
        email: user.email,
        photoURL: user.photoURL,
        organization: orgInput.trim(),
        role: 'guest',
        onboarded: true,
        updatedAt: serverTimestamp(),
      }, { merge: true })
      
      navigate('/dashboard', { replace: true })
    } catch (err) {
      console.error(err)
      setErrors({ submit: 'Failed to save profile. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  if (!user) return <Navigate to="/login" replace />

  return (
    <div className="onboarding-page">
      {/* Ambient glow */}
      <div className="onboarding-glow" />

      <div className="onboarding-card">
        {/* Header */}
        <div className="onboarding-header">
          <img src={christLogo} alt="Christ University" className="onboarding-logo" />
          <h1 className="onboarding-title">Complete your profile</h1>
          <p className="onboarding-subtitle">
            Hey {user?.displayName?.split(' ')[0] || 'there'}! Just a few details to get you in.
          </p>
          <span className="onboarding-role-badge onboarding-role-badge--guest">Guest</span>
        </div>

        <form onSubmit={handleSubmit} className="onboarding-form">
          <div className="form-group">
            <label className="form-label">
              Your Name <span className="form-required">*</span>
            </label>
            <input
              id="guestName"
              type="text"
              value={nameInput}
              onChange={(e) => { setNameInput(e.target.value); setErrors(prev => ({ ...prev, name: '' })) }}
              placeholder="Enter your name"
              className={`form-input ${errors.name ? 'form-input--error' : ''}`}
            />
            {errors.name && <p className="form-error">{errors.name}</p>}
          </div>

          <div className="form-group">
            <label className="form-label">
              Organization <span className="form-required">*</span>
            </label>
            <input
              id="guestOrg"
              type="text"
              value={orgInput}
              onChange={(e) => { setOrgInput(e.target.value); setErrors(prev => ({ ...prev, org: '' })) }}
              placeholder="e.g. Google, Self, Visiting Faculty"
              className={`form-input ${errors.org ? 'form-input--error' : ''}`}
            />
            {errors.org ? (
              <p className="form-error">{errors.org}</p>
            ) : (
              <p className="form-hint">
                Let us know where you are visiting from.
              </p>
            )}
          </div>

          {/* Submit error */}
          {errors.submit && (
            <p className="form-error form-error--box">{errors.submit}</p>
          )}

          {/* Submit */}
          <button
            id="onboarding-submit-btn"
            type="submit"
            disabled={loading}
            className="onboarding-submit"
          >
            {loading ? (
              <>
                <div className="spinner spinner--small" />
                Saving...
              </>
            ) : (
              'Complete Setup →'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
