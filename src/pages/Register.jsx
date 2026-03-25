import { useState, useContext } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { doc, setDoc } from 'firebase/firestore'
import { db } from '../firebase.js'
import { AuthContext } from '../hooks/useAuth.jsx'
import Topbar from '../components/Topbar.jsx'

const WARDS = [
  'Ward 1 — Bheemunipatnam', 'Ward 8 — Ukkunagaram',
  'Ward 16 — MVP Colony', 'Ward 31 — Madhura Nagar',
  'Ward 42 — Gajuwaka', 'Ward 55 — Dondaparthy',
  'Ward 67 — Kommadi', 'Ward 72 — Rushikonda',
  'Ward 85 — Gajuwaka North', 'Ward 98 — Pedagantyada'
]

export default function Register() {
  const { user } = useContext(AuthContext)
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', ward: '', wardNumber: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleWardChange(e) {
    const val = e.target.value
    const num = val.match(/Ward (\d+)/)?.[1] || ''
    setForm(f => ({ ...f, ward: val, wardNumber: num }))
  }

  async function handleSubmit() {
    if (!form.name.trim()) { setError('Please enter your name'); return }
    if (!form.ward) { setError('Please select your ward'); return }
    if (!user) { setError('You must be logged in first'); return }

    setLoading(true)
    setError('')
    try {
      // Save user profile to Firestore
      await setDoc(doc(db, 'users', user.uid), {
        name: form.name.trim(),
        ward: form.ward,
        wardNumber: form.wardNumber,
        phone: user.phoneNumber || '',
        isAdmin: false,
        createdAt: new Date()
      })
      navigate('/dashboard')
    } catch (err) {
      setError('Something went wrong. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Topbar />
      <div className="aw">
        <div className="ac" style={{ maxWidth: '460px' }}>
          <h2 className="at2">Complete your profile</h2>
          <p className="as">Register with your ward to start reporting issues</p>

          {error && (
            <div className="al d" style={{ marginBottom: '16px' }}>
              <div className="at">{error}</div>
            </div>
          )}

          <div className="fg">
            <label className="fl">Full name</label>
            <input
              type="text"
              placeholder="As per Aadhaar"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            />
          </div>

          <div className="fg">
            <label className="fl">Select your ward</label>
            <select value={form.ward} onChange={handleWardChange}>
              <option value="">— Select ward —</option>
              {WARDS.map(w => <option key={w} value={w}>{w}</option>)}
            </select>
            <span className="fh" style={{ marginTop: '5px' }}>
              You will only see complaints and posts from your ward
            </span>
          </div>

          <button
            className="btn btp btf"
            onClick={handleSubmit}
            disabled={loading}
            style={{ marginBottom: '12px' }}
          >
            {loading ? 'Saving...' : 'Complete registration'}
          </button>

          <p style={{ textAlign: 'center', fontSize: '13px', color: '#8a7050' }}>
            Already registered? <Link to="/login" style={{ color: '#b45309', fontWeight: '700' }}>Login here</Link>
          </p>
        </div>
      </div>
    </>
  )
}
