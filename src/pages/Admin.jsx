import { useState } from 'react'
import { doc, updateDoc, serverTimestamp, addDoc, collection } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../firebase.js'
import Topbar from '../components/Topbar.jsx'
import Sidebar from '../components/Sidebar.jsx'
import { useAllComplaints, daysSince } from '../hooks/useComplaints.js'

export default function Admin() {
  const { complaints, loading, stats, badGovWards, wardOpenCounts } = useAllComplaints()
  const [selected, setSelected] = useState(null)
  const [repairPhoto, setRepairPhoto] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [filterStatus, setFilterStatus] = useState('all')

  const topWards = Object.entries(wardOpenCounts).sort((a, b) => b[1] - a[1]).slice(0, 5)
  const maxCount = topWards[0]?.[1] || 1

  async function assignComplaint(id) {
    await updateDoc(doc(db, 'complaints', id), { status: 'in_progress' })
    // Notify the citizen
    const complaint = complaints.find(c => c.id === id)
    if (complaint) {
      await addDoc(collection(db, 'notifications'), {
        userId: complaint.raisedBy,
        type: 'assigned',
        message: `Your complaint "${complaint.issueType} — ${complaint.location?.address?.slice(0, 40)}" has been assigned to a repair team.`,
        read: false,
        createdAt: serverTimestamp(),
      })
    }
  }

  async function markResolved(complaint) {
    setUploading(true)
    try {
      let repairPhotoURL = null
      if (repairPhoto) {
        const r = ref(storage, `repairs/${complaint.id}/${Date.now()}`)
        await uploadBytes(r, repairPhoto)
        repairPhotoURL = await getDownloadURL(r)
      }
      await updateDoc(doc(db, 'complaints', complaint.id), {
        status: 'resolved',
        resolvedAt: serverTimestamp(),
        repairPhotoURL,
      })
      // Notify the citizen
      await addDoc(collection(db, 'notifications'), {
        userId: complaint.raisedBy,
        type: 'resolved',
        message: `Your complaint "${complaint.issueType} — ${complaint.location?.address?.slice(0, 40)}" has been marked resolved by GVMC. Please confirm if the issue is fixed.`,
        read: false,
        createdAt: serverTimestamp(),
      })
      setSelected(null)
      setRepairPhoto(null)
    } finally {
      setUploading(false)
    }
  }

  const filtered = filterStatus === 'all'
    ? complaints
    : complaints.filter(c => c.status === filterStatus)

  return (
    <>
      <Topbar />
      <div className="layout">
        <Sidebar stats={stats} />

        <main className="main">
          {/* Stats */}
          <div className="sg">
            <div className="sc"><div className="sl">Total</div><div className="sv">{stats.total}</div></div>
            <div className="sc"><div className="sl">Open</div><div className="sv" style={{ color: '#92400E' }}>{stats.open}</div></div>
            <div className="sc"><div className="sl">In progress</div><div className="sv" style={{ color: '#1E40AF' }}>{stats.inProgress}</div></div>
            <div className="sc"><div className="sl">Resolved</div><div className="sv" style={{ color: '#065F46' }}>{stats.resolved}</div></div>
          </div>

          {/* Alerts */}
          {badGovWards.length > 0 && (
            <div className="al d">
              <div className="ai d">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 2L2 12h10L7 2Z" stroke="#fff" strokeWidth="1.5" fill="none" />
                  <line x1="7" y1="6" x2="7" y2="9" stroke="#fff" strokeWidth="1.5" />
                  <circle cx="7" cy="10.5" r=".7" fill="#fff" />
                </svg>
              </div>
              <div className="at">
                <strong>{badGovWards.length} wards flagged for bad governance</strong> —{' '}
                {badGovWards.map(w => `Ward ${w.ward}`).join(', ')} each have 10+ unresolved complaints.
                Escalated to Commissioner.
              </div>
            </div>
          )}

          {stats.overdue > 0 && (
            <div className="al w">
              <div className="ai w">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="5.5" stroke="#1a0800" strokeWidth="1.5" />
                  <line x1="7" y1="4" x2="7" y2="7.5" stroke="#1a0800" strokeWidth="1.5" />
                  <circle cx="7" cy="9.5" r=".7" fill="#1a0800" />
                </svg>
              </div>
              <div className="at">
                <strong>{stats.overdue} complaints have crossed 60 days</strong> — auto-escalated to Commissioner.
              </div>
            </div>
          )}

          {/* Filter + Table */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ fontSize: '14px', fontWeight: '700' }}>
              Complaints {filtered.length > 0 && <span style={{ color: '#8a7050', fontWeight: '400', fontSize: '13px' }}>({filtered.length})</span>}
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {['all', 'open', 'in_progress', 'resolved'].map(s => (
                <button
                  key={s}
                  className="btn"
                  style={{ fontSize: '11px', padding: '4px 10px', ...(filterStatus === s ? { background: '#fff8ec', borderColor: '#e8a833', color: '#b45309' } : {}) }}
                  onClick={() => setFilterStatus(s)}
                >
                  {s === 'all' ? 'All' : s === 'in_progress' ? 'In progress' : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="cw">
            <div className="ch">
              <div>ID</div><div>Issue</div><div>Ward</div><div>Support</div>
              <div>Status</div><div>Days</div><div>Action</div>
            </div>

            {loading ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#8a7050' }}>Loading complaints...</div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#8a7050' }}>No complaints found.</div>
            ) : filtered.map(c => {
              const days = daysSince(c.createdAt)
              return (
                <div
                  key={c.id}
                  className={`cr ${days >= 60 ? 'bg' : days >= 40 ? 'fl2' : ''}`}
                  onClick={() => setSelected(c)}
                >
                  <div style={{ fontSize: '11px', color: '#8a7050' }}>#{c.id.slice(-4)}</div>
                  <div>
                    <div>{c.issueType} — {c.location?.address?.slice(0, 28)}...</div>
                    <div style={{ fontSize: '11px', color: '#8a7050' }}>
                      {c.anonymous ? 'Anonymous' : c.raisedByName}
                      {c.escalated && <span style={{ color: '#dc2626', marginLeft: '6px', fontWeight: '700' }}>ESCALATED</span>}
                    </div>
                  </div>
                  <div><span className="wt">Ward {c.wardNumber}</span></div>
                  <div style={{ fontWeight: '800', color: '#b45309' }}>{c.supportCount || 0}</div>
                  <div>
                    <span className={`badge ${c.status === 'open' ? 'bo' : c.status === 'in_progress' ? 'bp' : 'bd2'}`}>
                      {c.status === 'in_progress' ? 'In progress' : c.status}
                    </span>
                  </div>
                  <div className={days >= 60 ? 'tc' : days >= 40 ? 'tw2' : 'tok'}>{days}d</div>
                  <div onClick={e => e.stopPropagation()}>
                    {c.status === 'open' && (
                      <button className="btn" style={{ fontSize: '11px', padding: '4px 10px' }}
                        onClick={() => assignComplaint(c.id)}>
                        Assign
                      </button>
                    )}
                    {c.status === 'in_progress' && (
                      <button className="btn btg" style={{ fontSize: '11px', padding: '4px 10px' }}
                        onClick={() => setSelected(c)}>
                        Resolve
                      </button>
                    )}
                    {(c.status === 'resolved' || c.status === 'confirmed_resolved') && (
                      <span style={{ fontSize: '11px', color: '#059669' }}>✓ Done</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Ward load chart */}
          {topWards.length > 0 && (
            <div className="card">
              <div className="ctitle">Ward complaint load</div>
              {topWards.map(([ward, count]) => (
                <div className="er" key={ward}>
                  <span className="ew">Ward {ward}</span>
                  <div className="eb">
                    <div className="eb2" style={{
                      width: `${(count / maxCount) * 100}%`,
                      background: count >= 10 ? '#dc2626' : count >= 6 ? '#e8a833' : '#6aab4f'
                    }} />
                  </div>
                  <span className="ec" style={{
                    color: count >= 10 ? '#dc2626' : '#8a7050',
                    fontWeight: count >= 10 ? '800' : '400'
                  }}>
                    {count}{count >= 10 ? ' ⚠ BAD GOV' : ''}
                  </span>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Resolve modal */}
      {selected && (
        <div className="mo on">
          <div className="mb2">
            <div className="mt">
              Complaint #{selected.id.slice(-4)} — {selected.issueType}, Ward {selected.wardNumber}
            </div>

            <div className="ir">
              <div className="ib">
                <div className="ilb">Reported photo</div>
                {selected.photoURL
                  ? <img src={selected.photoURL} alt="complaint" style={{ width: '100%', height: '90px', objectFit: 'cover' }} />
                  : <div className="iph">No photo attached</div>}
              </div>
              <div className="ib">
                <div className="ilb">Repair photo</div>
                {repairPhoto
                  ? <img src={URL.createObjectURL(repairPhoto)} alt="repair" style={{ width: '100%', height: '90px', objectFit: 'cover' }} />
                  : <div className="iph">Upload after repair</div>}
              </div>
            </div>

            <label className="uz" style={{ display: 'block', cursor: 'pointer', padding: '14px', marginBottom: '12px' }}>
              <input type="file" accept="image/*" style={{ display: 'none' }}
                onChange={e => setRepairPhoto(e.target.files[0])} />
              <div style={{ fontSize: '13px', color: '#5a3e1a', fontWeight: '700' }}>
                {repairPhoto ? '✓ ' + repairPhoto.name : 'Upload repair completion photo'}
              </div>
              <div style={{ fontSize: '11px', color: '#8a7050' }}>
                This photo will be shown to citizens for confirmation
              </div>
            </label>

            <div className="dr"><span className="dl">Raised by</span><span className="dv">{selected.anonymous ? 'Anonymous' : selected.raisedByName}</span></div>
            <div className="dr"><span className="dl">Days open</span><span className="dv" style={{ color: daysSince(selected.createdAt) >= 60 ? '#dc2626' : '#1a1008' }}>{daysSince(selected.createdAt)} days</span></div>
            <div className="dr"><span className="dl">Location</span><span className="dv" style={{ maxWidth: '60%', textAlign: 'right', fontSize: '11px' }}>{selected.location?.address}</span></div>
            <div className="dr"><span className="dl">Support</span><span className="dv">{selected.supportCount || 0} ward members</span></div>
            <div className="dr"><span className="dl">Severity</span><span className="dv">{selected.severity}</span></div>

            <div className="cn">
              After marking resolved, the citizen will be notified. They have 7 days to confirm.
              If 3+ citizens deny, the complaint reopens automatically.
            </div>

            <div className="br">
              <button
                className="btn btp"
                style={{ flex: 1 }}
                onClick={() => markResolved(selected)}
                disabled={uploading}
              >
                {uploading ? 'Saving...' : 'Mark as resolved'}
              </button>
              <button
                className="btn"
                style={{ flex: 1 }}
                onClick={() => { setSelected(null); setRepairPhoto(null) }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
