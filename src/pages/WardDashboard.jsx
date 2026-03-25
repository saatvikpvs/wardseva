import { useContext, useState } from 'react'
import { Link } from 'react-router-dom'
import { doc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase.js'
import { AuthContext } from '../hooks/useAuth.jsx'
import { useWardComplaints, daysSince } from '../hooks/useComplaints.js'
import Topbar from '../components/Topbar.jsx'
import ComplaintCard from '../components/ComplaintCard.jsx'

const WARD_INFO = {
  '42': { sachivalayam: 'VSP-42-SCH-07', officer: 'Sri K. Venkat Rao', phone: '9848012345', police: 'Gajuwaka PS', policePhone: '0891-2587100' },
  '16': { sachivalayam: 'VSP-16-SCH-03', officer: 'Sri P. Ramana', phone: '9848023456', police: 'MVP Colony PS', policePhone: '0891-2764100' },
  '31': { sachivalayam: 'VSP-31-SCH-05', officer: 'Smt. L. Devi', phone: '9848034567', police: 'Madhura Nagar PS', policePhone: '0891-2543100' },
}

export default function WardDashboard() {
  const { user } = useContext(AuthContext)
  const { complaints, loading, stats } = useWardComplaints(user?.wardNumber)
  const [filter, setFilter] = useState('all')

  const wardInfo = WARD_INFO[user?.wardNumber] || {}

  const filtered = filter === 'all' ? complaints
    : complaints.filter(c => c.status === filter)

  async function confirmResolved(complaint) {
    await updateDoc(doc(db, 'complaints', complaint.id), {
      status: 'confirmed_resolved',
      confirmedAt: serverTimestamp(),
    })
  }

  async function reopenComplaint(complaint) {
    await updateDoc(doc(db, 'complaints', complaint.id), {
      status: 'open',
      reopenedAt: serverTimestamp(),
    })
    // Notify admin
    await addDoc(collection(db, 'notifications'), {
      userId: 'admin',
      type: 'escalated',
      message: `Complaint #${complaint.id.slice(-4)} was denied resolution by citizen ${user.name} in Ward ${user.wardNumber}.`,
      read: false,
      createdAt: serverTimestamp(),
    })
  }

  return (
    <>
      <Topbar />
      <div className="wrap" style={{ maxWidth: '860px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '800' }}>{user?.ward}</h1>
            <p style={{ fontSize: '13px', color: '#8a7050' }}>Greater Visakhapatnam Municipal Corporation</p>
          </div>
          <Link to="/report" className="btn btp">+ Report issue</Link>
        </div>

        {/* Ward profile */}
        <div className="card">
          <div className="ctitle">Ward profile</div>
          <div className="wig">
            <div className="wi">
              <div className="wil">Sachivalayam no.</div>
              <div className="wiv">{wardInfo.sachivalayam || `VSP-${user?.wardNumber}-SCH`}</div>
            </div>
            <div className="wi">
              <div className="wil">Ward officer</div>
              <div className="wiv">{wardInfo.officer || 'Contact GVMC'} {wardInfo.phone && <span style={{ color: '#8a7050', fontWeight: '400' }}>· {wardInfo.phone}</span>}</div>
            </div>
            <div className="wi">
              <div className="wil">Police station</div>
              <div className="wiv">{wardInfo.police || 'Nearest PS'} {wardInfo.policePhone && <span style={{ color: '#8a7050', fontWeight: '400' }}>· {wardInfo.policePhone}</span>}</div>
            </div>
            <div className="wi">
              <div className="wil">GVMC helpline</div>
              <div className="wiv">1800-425-0011 <span style={{ color: '#8a7050', fontWeight: '400' }}>(Toll free)</span></div>
            </div>
            <div className="wi">
              <div className="wil">Registered citizens</div>
              <div className="wiv">{user?.ward}</div>
            </div>
            <div className="wi">
              <div className="wil">Your ward number</div>
              <div className="wiv">Ward {user?.wardNumber}</div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="sg" style={{ gridTemplateColumns: 'repeat(3,minmax(0,1fr))' }}>
          <div className="sc">
            <div className="sl">Open issues</div>
            <div className="sv" style={{ color: '#92400E' }}>{stats.open}</div>
            <div className="ss" style={{ color: stats.isBadGov ? '#dc2626' : '#8a7050' }}>
              {stats.isBadGov ? '⚠ Bad governance flagged' : 'needs attention'}
            </div>
          </div>
          <div className="sc">
            <div className="sl">In progress</div>
            <div className="sv" style={{ color: '#1E40AF' }}>{stats.inProgress}</div>
            <div className="ss">being worked on</div>
          </div>
          <div className="sc">
            <div className="sl">Resolved</div>
            <div className="sv" style={{ color: '#065F46' }}>{stats.resolved}</div>
            <div className="ss" style={{ color: '#059669' }}>
              {stats.open + stats.inProgress + stats.resolved > 0
                ? Math.round((stats.resolved / (stats.open + stats.inProgress + stats.resolved)) * 100) + '% rate'
                : 'this year'}
            </div>
          </div>
        </div>

        {/* Escalated alerts */}
        {stats.escalated > 0 && (
          <div className="al w">
            <div className="ai w">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="5.5" stroke="#1a0800" strokeWidth="1.5" />
                <line x1="7" y1="4" x2="7" y2="7.5" stroke="#1a0800" strokeWidth="1.5" />
                <circle cx="7" cy="9.5" r=".7" fill="#1a0800" />
              </svg>
            </div>
            <div className="at">
              <strong>{stats.escalated} complaint{stats.escalated > 1 ? 's' : ''} escalated to GVMC Commissioner</strong> — these have been open for over 60 days.
            </div>
          </div>
        )}

        {stats.isBadGov && (
          <div className="al d">
            <div className="ai d">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 2L2 12h10L7 2Z" stroke="#fff" strokeWidth="1.5" fill="none" />
                <line x1="7" y1="6" x2="7" y2="9" stroke="#fff" strokeWidth="1.5" />
                <circle cx="7" cy="10.5" r=".7" fill="#fff" />
              </svg>
            </div>
            <div className="at">
              <strong>{user?.ward} is flagged for bad governance</strong> — {stats.open} unresolved complaints.
              Escalated to the GVMC Commissioner.
            </div>
          </div>
        )}

        {/* Filter + complaints */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div style={{ fontSize: '14px', fontWeight: '700' }}>Ward complaints</div>
          <div style={{ display: 'flex', gap: '6px' }}>
            {['all', 'open', 'in_progress', 'resolved'].map(f => (
              <button key={f} className="btn"
                style={{ fontSize: '11px', padding: '4px 10px', ...(filter === f ? { background: '#fff8ec', borderColor: '#e8a833', color: '#b45309' } : {}) }}
                onClick={() => setFilter(f)}>
                {f === 'all' ? 'All' : f === 'in_progress' ? 'In progress' : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="cw">
          <div className="ch">
            <div>ID</div><div>Issue</div><div>Type</div><div>Support</div>
            <div>Status</div><div>Days open</div><div>Action</div>
          </div>

          {loading ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#8a7050' }}>Loading complaints...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#8a7050' }}>
              {filter === 'all'
                ? <span>No complaints yet. <Link to="/report" style={{ color: '#b45309' }}>Be the first to report an issue!</Link></span>
                : `No ${filter} complaints.`}
            </div>
          ) : filtered.map(c => (
            <div key={c.id}>
              <ComplaintCard complaint={c} />
              {/* Confirmation row for resolved complaints */}
              {c.status === 'resolved' && (
                <div style={{ padding: '8px 16px', background: '#f0fdf4', borderBottom: '1px solid #d1fae5', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '12px', color: '#065F46', flex: 1 }}>
                    GVMC marked this resolved. Was it actually fixed?
                  </span>
                  {c.repairPhotoURL && (
                    <a href={c.repairPhotoURL} target="_blank" rel="noreferrer"
                      className="btn" style={{ fontSize: '11px', padding: '3px 8px' }}>
                      View repair photo
                    </a>
                  )}
                  <button className="btn btg" style={{ fontSize: '11px', padding: '3px 10px' }}
                    onClick={() => confirmResolved(c)}>
                    Yes, confirm ✓
                  </button>
                  <button className="btn" style={{ fontSize: '11px', padding: '3px 10px', color: '#dc2626', borderColor: '#dc2626' }}
                    onClick={() => reopenComplaint(c)}>
                    No, reopen
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Community board preview */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '20px 0 12px' }}>
          <div style={{ fontSize: '14px', fontWeight: '700' }}>Community board</div>
          <Link to="/community" className="btn" style={{ fontSize: '11px', padding: '4px 10px' }}>View all</Link>
        </div>

        <div style={{ padding: '24px', textAlign: 'center', background: '#fff', borderRadius: '14px', border: '1px solid #ddd0b8', color: '#8a7050', fontSize: '13px' }}>
          <Link to="/community" style={{ color: '#b45309', fontWeight: '700' }}>
            Go to Community board →
          </Link>
          <div style={{ marginTop: '4px' }}>Post festival announcements, events, and ward news</div>
        </div>

      </div>
    </>
  )
}
