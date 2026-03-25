import { useContext, useState } from 'react'
import { doc, updateDoc, arrayUnion, arrayRemove, increment } from 'firebase/firestore'
import { db } from '../firebase.js'
import { AuthContext } from '../hooks/useAuth.jsx'

// How many days since a date
function daysSince(timestamp) {
  if (!timestamp) return 0
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  const diff = Date.now() - date.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

function TimerBadge({ days }) {
  const remaining = 60 - days
  if (remaining <= 5) return <span className="tc">{days}d — {remaining}d left!</span>
  if (remaining <= 15) return <span className="tw2">{days}d open</span>
  return <span className="tok">{days}d open</span>
}

function StatusBadge({ status }) {
  const map = {
    open: ['bo', 'Open'],
    in_progress: ['bp', 'In Progress'],
    resolved: ['bd2', 'Resolved'],
  }
  const [cls, label] = map[status] || ['bo', status]
  return <span className={`badge ${cls}`}>{label}</span>
}

export default function ComplaintCard({ complaint, showWard = false }) {
  const { user } = useContext(AuthContext)
  const [supporting, setSupporting] = useState(false)

  const days = daysSince(complaint.createdAt)
  const hasSupported = complaint.supporters?.includes(user?.uid)

  async function toggleSupport() {
    if (!user || supporting) return
    setSupporting(true)
    const ref = doc(db, 'complaints', complaint.id)
    try {
      if (hasSupported) {
        await updateDoc(ref, {
          supporters: arrayRemove(user.uid),
          supportCount: increment(-1)
        })
      } else {
        await updateDoc(ref, {
          supporters: arrayUnion(user.uid),
          supportCount: increment(1)
        })
      }
    } finally {
      setSupporting(false)
    }
  }

  return (
    <div className={`cr ${days >= 50 ? 'bg' : days >= 30 ? 'fl2' : ''}`}>
      <div style={{ fontSize: '11px', color: '#8a7050' }}>#{complaint.id?.slice(-4)}</div>
      <div>
        <div>{complaint.issueType} — {complaint.location?.address || 'Location not set'}</div>
        <div style={{ fontSize: '11px', color: '#8a7050' }}>
          By {complaint.anonymous ? 'Anonymous' : complaint.raisedByName}
        </div>
      </div>
      {showWard && <div><span className="wt">Ward {complaint.wardNumber}</span></div>}
      <div>
        <span
          className={`badge ${hasSupported ? 'bd2' : 'bo'}`}
          style={{ cursor: 'pointer' }}
          onClick={toggleSupport}
        >
          {supporting ? '...' : `▲ ${complaint.supportCount || 0}`}
        </span>
      </div>
      <div><StatusBadge status={complaint.status} /></div>
      <div><TimerBadge days={days} /></div>
      {complaint.photoURL && (
        <div>
          <a href={complaint.photoURL} target="_blank" rel="noreferrer"
            className="btn" style={{ fontSize: '11px', padding: '3px 8px' }}>
            View photo
          </a>
        </div>
      )}
    </div>
  )
}
