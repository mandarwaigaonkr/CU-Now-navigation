import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase'
import { useAuth } from '../../hooks/useAuth'
import Navbar from '../../components/Navbar'
import CustomSelect from '../../components/CustomSelect'
import toast from 'react-hot-toast'
import './Admin.css'

const PRIORITY_OPTIONS = [
  { label: 'High Priority (Red)', value: 'high' },
  { label: 'Medium Priority (Yellow)', value: 'medium' },
  { label: 'Low Priority (Blue)', value: 'low' },
]

export default function CreateNotification() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: '',
    message: '',
    priority: 'low'
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handlePriorityChange(val: any) {
    setForm(prev => ({ ...prev, priority: val }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim() || !form.message.trim()) {
      toast.error('Please fill in all required fields')
      return
    }

    setLoading(true)
    try {
      await addDoc(collection(db, 'notifications'), {
        ...form,
        createdBy: profile?.id,
        createdAt: serverTimestamp(),
      })
      toast.success('Notification created successfully')
      navigate('/admin')
    } catch (err) {
      console.error(err)
      toast.error('Failed to create notification')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div className="admin-header__inner">
          <h1 className="admin-header__title">New Notification</h1>
          <button className="admin-back-btn" onClick={() => navigate('/admin')}>
            Cancel
          </button>
        </div>
      </div>

      <div className="admin-content">
        <form onSubmit={handleSubmit} className="admin-form">
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input 
              type="text" 
              name="title"
              className="form-input" 
              placeholder="e.g., Campus Event Update"
              value={form.title}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Priority *</label>
            <CustomSelect 
              value={form.priority}
              options={PRIORITY_OPTIONS}
              onChange={handlePriorityChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Message *</label>
            <textarea 
              name="message"
              className="form-textarea" 
              placeholder="Enter notification details..."
              value={form.message}
              onChange={handleChange}
              required
              rows={4}
            />
          </div>

          <button 
            type="submit" 
            className="admin-submit-btn" 
            disabled={loading}
          >
            {loading ? 'Publishing...' : 'Publish Notification'}
          </button>
        </form>
      </div>

      <div style={{ flexShrink: 0 }}>
        <Navbar />
      </div>
    </div>
  )
}
