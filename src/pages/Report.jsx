import { useState, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../firebase.js'
import { AuthContext } from '../hooks/useAuth.jsx'
import Topbar from '../components/Topbar.jsx'

const ISSUE_TYPES = [
  { id: 'Pothole', label: 'Pothole', sub: 'Road damage', bg: '#fff0d8', color: '#e8a833' },
  { id: 'Drainage', label: 'Drainage', sub: 'Leak or overflow', bg: '#e8f4ff', color: '#378add' },
  { id: 'Street light', label: 'Street light', sub: 'Not working', bg: '#fdf0e8', color: '#d85a30' },
  { id: 'Garbage', label: 'Garbage', sub: 'Waste dumping', bg: '#eafaf0', color: '#3b6d11' },
  { id: 'Hazard', label: 'Hazard', sub: 'Safety risk', bg: '#fff0f0', color: '#dc2626' },
  { id: 'Other', label: 'Other', sub: 'Civic issue', bg: '#f5f0ff', color: '#7f77dd' },
]

export default function Report() {
  const { user } = useContext(AuthContext)
  const navigate = useNavigate()

  const [step, setStep] = useState(1)
  const [issueType, setIssueType] = useState('Pothole')
  const [photo, setPhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [location, setLocation] = useState({ address: '', lat: null, lng: null })
  const [gpsLoading, setGpsLoading] = useState(false)
  const [description, setDescription] = useState('')
  const [severity, setSeverity] = useState('Moderate')
  const [anonymous, setAnonymous] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Handle photo selection
  function handlePhotoChange(e) {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { setError('Photo must be under 10 MB'); return }
    setPhoto(file)
    setPhotoPreview(URL.createObjectURL(file))
    setError('')
  }

  // Get GPS location from browser
  function getGPS() {
    if (!navigator.geolocation) { setError('GPS not supported on this device'); return }
    setGpsLoading(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        // Reverse geocode using OpenStreetMap (free, no API key needed)
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          )
          const data = await res.json()
          setLocation({
            address: data.display_name || `${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E`,
            lat: latitude,
            lng: longitude
          })
        } catch {
          setLocation({
            address: `${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E`,
            lat: latitude,
            lng: longitude
          })
        }
        setGpsLoading(false)
      },
      (err) => {
        setError('Location access denied. Please type your address.')
        setGpsLoading(false)
      },
      { enableHighAccuracy: true }
    )
  }

  // Submit complaint to Firebase
  async function handleSubmit() {
    if (!location.address) { setError('Please add your location'); return }
    if (!description.trim()) { setError('Please describe the issue'); return }

    setSubmitting(true)
    setError('')

    try {
      let photoURL = null

      // Upload photo to Firebase Storage if selected
      if (photo) {
        const photoRef = ref(storage, `complaints/${user.uid}/${Date.now()}_${photo.name}`)
        await uploadBytes(photoRef, photo)
        photoURL = await getDownloadURL(photoRef)
      }

      // Save complaint to Firestore
      await addDoc(collection(db, 'complaints'), {
        issueType,
        description: description.trim(),
        severity,
        anonymous,
        location: {
          address: location.address,
          lat: location.lat,
          lng: location.lng,
        },
        photoURL,
        status: 'open',
        wardNumber: user.wardNumber,
        ward: user.ward,
        raisedBy: user.uid,
        raisedByName: user.name,
        supportCount: 0,
        supporters: [],
        createdAt: serverTimestamp(),
      })

      // Go to dashboard to see the new complaint
      navigate('/dashboard')

    } catch (err) {
      setError('Failed to submit. Please try again.')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Topbar />
      <div className="wrap">
        <h1 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '4px' }}>Report an issue</h1>
        <p style={{ fontSize: '13px', color: '#8a7050', marginBottom: '24px' }}>
          Filing for <span className="wt">{user?.ward || 'Your Ward'}</span>
        </p>

        {/* Step bar */}
        <div className="sb">
          {['Issue type', 'Photo & location', 'Details', 'Submit'].map((label, i) => (
            <div className="step" key={i}>
              <div className={`sc2 ${i + 1 < step ? 'dn' : i + 1 === step ? 'ac' : 'id'}`}>
                {i + 1 < step ? '✓' : i + 1}
              </div>
              <span className={`slb ${i + 1 === step ? 'ac' : ''}`}>{label}</span>
              {i < 3 && <div className={`sln ${i + 1 < step ? 'dn' : ''}`}></div>}
            </div>
          ))}
        </div>

        {error && (
          <div className="al d" style={{ marginBottom: '16px' }}>
            <div className="at">{error}</div>
          </div>
        )}

        {/* Step 1 — Issue type */}
        {step === 1 && (
          <div className="card">
            <div className="ctitle">What is the issue?</div>
            <div className="tgrid">
              {ISSUE_TYPES.map(t => (
                <div
                  key={t.id}
                  className={`tb ${issueType === t.id ? 'sel' : ''}`}
                  onClick={() => setIssueType(t.id)}
                >
                  <div className="tic" style={{ background: t.bg }}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <circle cx="10" cy="10" r="7" stroke={t.color} strokeWidth="1.5" />
                      <path d="M7 10l2 2 4-4" stroke={t.color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div className="tlb">{t.label}</div>
                  <div className="ts">{t.sub}</div>
                </div>
              ))}
            </div>
            <button className="btn btp btf" style={{ marginTop: '16px' }} onClick={() => setStep(2)}>
              Next — Add photo & location
            </button>
          </div>
        )}

        {/* Step 2 — Photo & location */}
        {step === 2 && (
          <>
            <div className="card">
              <div className="ctitle">Upload photo</div>
              <label className="uz" style={{ display: 'block', cursor: 'pointer' }}>
                <input type="file" accept="image/*" capture="environment" onChange={handlePhotoChange} style={{ display: 'none' }} />
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: '8px' }} />
                ) : (
                  <>
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                      <rect x="2" y="8" width="28" height="20" rx="4" stroke="#c8a870" strokeWidth="1.8" />
                      <circle cx="16" cy="18" r="5" stroke="#c8a870" strokeWidth="1.6" />
                      <path d="M11 8l2-3h6l2 3" stroke="#c8a870" strokeWidth="1.5" strokeLinejoin="round" />
                    </svg>
                    <div className="ul">Tap to take photo or upload</div>
                    <div className="uh">Clear photo = faster resolution · JPG/PNG · max 10 MB</div>
                  </>
                )}
              </label>
              {photoPreview && (
                <button className="btn" style={{ marginTop: '8px', fontSize: '12px' }} onClick={() => { setPhoto(null); setPhotoPreview(null) }}>
                  Remove photo
                </button>
              )}
            </div>

            <div className="card">
              <div className="ctitle">Location</div>

              {/* Simple map preview using OpenStreetMap iframe if coords available */}
              {location.lat ? (
                <iframe
                  title="location"
                  style={{ width: '100%', height: '170px', borderRadius: '10px', border: '1px solid #ddd0b8', marginBottom: '10px' }}
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${location.lng - 0.005},${location.lat - 0.005},${location.lng + 0.005},${location.lat + 0.005}&layer=mapnik&marker=${location.lat},${location.lng}`}
                />
              ) : (
                <div className="mb" style={{ marginBottom: '10px' }}>
                  <span style={{ fontSize: '13px', color: '#8a7050' }}>Use GPS or type your address below</span>
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <input
                  type="text"
                  id="loc"
                  value={location.address}
                  onChange={e => setLocation(l => ({ ...l, address: e.target.value }))}
                  placeholder="Type landmark or address"
                />
                <button className="btn btp" onClick={getGPS} disabled={gpsLoading} style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
                  {gpsLoading ? '...' : 'Use GPS'}
                </button>
              </div>
              <div className="in">Your ward ({user?.ward}) is pre-selected. Location helps the repair team reach the exact spot.</div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btf" style={{ flex: 1 }} onClick={() => setStep(1)}>Back</button>
              <button className="btn btp btf" style={{ flex: 2 }} onClick={() => setStep(3)}>Next — Add details</button>
            </div>
          </>
        )}

        {/* Step 3 — Description */}
        {step === 3 && (
          <div className="card">
            <div className="ctitle">Describe the issue</div>
            <div className="fg">
              <span className="fh">Size, severity, how long it's been there</span>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value.slice(0, 300))}
                placeholder="e.g. Large pothole about 2 feet wide near the water tank junction. Has been here for 3 weeks and causes bikes to swerve dangerously."
              />
              <div className="cc">{description.length}/300</div>
            </div>
            <div className="fg">
              <label className="fl">Severity</label>
              <select value={severity} onChange={e => setSeverity(e.target.value)}>
                <option>Minor — small inconvenience</option>
                <option>Moderate — daily disruption</option>
                <option>Severe — safety risk</option>
                <option>Emergency — immediate danger</option>
              </select>
            </div>
            <div className="tw" style={{ marginBottom: '16px' }}>
              <button className={`tg ${anonymous ? 'on' : ''}`} onClick={() => setAnonymous(!anonymous)}>
                <div className="td"></div>
              </button>
              <div style={{ fontSize: '13px', color: '#5a3e1a' }}>
                Post anonymously <span style={{ color: '#8a7050', fontSize: '12px' }}>— your name won't show on the ward dashboard</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btf" style={{ flex: 1 }} onClick={() => setStep(2)}>Back</button>
              <button className="btn btp btf" style={{ flex: 2 }} onClick={() => setStep(4)}>Review & Submit</button>
            </div>
          </div>
        )}

        {/* Step 4 — Review & Submit */}
        {step === 4 && (
          <div className="card">
            <div className="ctitle">Review your complaint</div>
            <div className="dr"><span className="dl">Issue type</span><span className="dv">{issueType}</span></div>
            <div className="dr"><span className="dl">Location</span><span className="dv" style={{ maxWidth: '60%', textAlign: 'right' }}>{location.address || 'Not set'}</span></div>
            <div className="dr"><span className="dl">Severity</span><span className="dv">{severity}</span></div>
            <div className="dr"><span className="dl">Description</span><span className="dv" style={{ maxWidth: '60%', textAlign: 'right' }}>{description || 'Not set'}</span></div>
            <div className="dr"><span className="dl">Photo</span><span className="dv">{photo ? '✓ Attached' : 'No photo'}</span></div>
            <div className="dr"><span className="dl">Posted as</span><span className="dv">{anonymous ? 'Anonymous' : user?.name}</span></div>
            <div className="dr"><span className="dl">Ward</span><span className="dv">{user?.ward}</span></div>

            <div className="cn" style={{ marginTop: '12px' }}>
              After submitting, your ward dashboard will update immediately. GVMC has 60 days to resolve before auto-escalation.
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
              <button className="btn btf" style={{ flex: 1 }} onClick={() => setStep(3)}>Back</button>
              <button
                className="btn btp btf"
                style={{ flex: 2 }}
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Submit complaint'}
              </button>
            </div>
            <p style={{ textAlign: 'center', fontSize: '11px', color: '#a08060', marginTop: '10px' }}>
              You will be notified when the issue is assigned and resolved
            </p>
          </div>
        )}
      </div>
    </>
  )
}
