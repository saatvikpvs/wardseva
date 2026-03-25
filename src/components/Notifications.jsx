// components/Notifications.jsx
// Shows a bell icon in topbar with unread notifications
// Citizens get notified when their complaint status changes

import { useContext, useEffect, useState, useRef } from 'react'
import { collection, query, where, orderBy, onSnapshot, updateDoc, doc } from 'firebase/firestore'
import { db } from '../firebase.js'
import { AuthContext } from '../hooks/useAuth.jsx'

export default function Notifications() {
  const { user } = useContext(AuthContext)
  const [notifications, setNotifications] = useState([])
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!user?.uid) return
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    )
    const unsub = onSnapshot(q, snap => {
      setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return () => unsub()
  }, [user?.uid])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handle(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  const unread = notifications.filter(n => !n.read).length

  async function markRead(notifId) {
    await updateDoc(doc(db, 'notifications', notifId), { read: true })
  }

  async function markAllRead() {
    for (const n of notifications.filter(n => !n.read)) {
      await updateDoc(doc(db, 'notifications', n.id), { read: true })
    }
  }

  function timeAgo(ts) {
    if (!ts) return ''
    const d = ts.toDate ? ts.toDate() : new Date(ts)
    const diff = Date.now() - d.getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  function notifIcon(type) {
    switch (type) {
      case 'resolved': return { bg: '#D1FAE5', color: '#065F46', symbol: '✓' }
      case 'assigned': return { bg: '#DBEAFE', color: '#1E40AF', symbol: '→' }
      case 'escalated': return { bg: '#FFE4E1', color: '#9B1C1C', symbol: '!' }
      case 'supported': return { bg: '#FEF3C7', color: '#92400E', symbol: '▲' }
      default: return { bg: '#f5f0e8', color: '#8a7050', symbol: '·' }
    }
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '34px', height: '34px', borderRadius: '50%',
          background: 'var(--bmd)', border: '1px solid #3a2a10',
          cursor: 'pointer', position: 'relative',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 1.5A5 5 0 003 6.5v3l-1.5 2h13L13 9.5v-3A5 5 0 008 1.5Z" stroke="#a0896a" strokeWidth="1.3" />
          <path d="M6.5 13.5a1.5 1.5 0 003 0" stroke="#a0896a" strokeWidth="1.3" />
        </svg>
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: '-3px', right: '-3px',
            background: '#dc2626', color: '#fff',
            fontSize: '9px', fontWeight: '800',
            width: '16px', height: '16px', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', right: 0, top: '42px',
          width: '320px', background: '#fff',
          border: '1px solid #ddd0b8', borderRadius: '12px',
          boxShadow: '0 4px 24px rgba(26,16,8,0.15)',
          zIndex: 200, overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{
            padding: '12px 16px', borderBottom: '1px solid #f0e8d8',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: '#faf6ee'
          }}>
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#1a1008' }}>
              Notifications {unread > 0 && <span style={{ color: '#dc2626' }}>({unread})</span>}
            </span>
            {unread > 0 && (
              <button onClick={markAllRead} style={{
                fontSize: '11px', color: '#b45309', background: 'none',
                border: 'none', cursor: 'pointer', fontWeight: '600'
              }}>
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#8a7050', fontSize: '13px' }}>
                No notifications yet
              </div>
            ) : (
              notifications.map(n => {
                const icon = notifIcon(n.type)
                return (
                  <div
                    key={n.id}
                    onClick={() => markRead(n.id)}
                    style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid #f5ede0',
                      display: 'flex', gap: '10px', alignItems: 'flex-start',
                      background: n.read ? '#fff' : '#fffbf0',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '50%',
                      background: icon.bg, color: icon.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '12px', fontWeight: '800', flexShrink: 0
                    }}>
                      {icon.symbol}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', color: '#1a1008', lineHeight: '1.4' }}>
                        {n.message}
                      </div>
                      <div style={{ fontSize: '11px', color: '#8a7050', marginTop: '3px' }}>
                        {timeAgo(n.createdAt)}
                      </div>
                    </div>
                    {!n.read && (
                      <div style={{
                        width: '7px', height: '7px', borderRadius: '50%',
                        background: '#e8a833', flexShrink: 0, marginTop: '6px'
                      }} />
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
