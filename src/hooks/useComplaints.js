// hooks/useComplaints.js
// Shared hook used by both WardDashboard and Admin
// Handles real-time fetching + auto-escalation logic

import { useEffect, useState } from 'react'
import {
  collection, query, where, orderBy,
  onSnapshot, doc, updateDoc, serverTimestamp
} from 'firebase/firestore'
import { db } from '../firebase.js'

function daysSince(timestamp) {
  if (!timestamp) return 0
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return Math.floor((Date.now() - date.getTime()) / 86400000)
}

// Ward dashboard — only this ward's complaints
export function useWardComplaints(wardNumber) {
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!wardNumber) return
    const q = query(
      collection(db, 'complaints'),
      where('wardNumber', '==', wardNumber),
      orderBy('createdAt', 'desc')
    )
    const unsub = onSnapshot(q, async (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))

      // Auto-escalation: if complaint > 60 days and not resolved, mark escalated
      for (const c of data) {
        const days = daysSince(c.createdAt)
        if (days >= 60 && c.status === 'open' && !c.escalated) {
          await updateDoc(doc(db, 'complaints', c.id), {
            escalated: true,
            escalatedAt: serverTimestamp(),
            escalatedReason: 'auto_60_days'
          })
        }
      }

      setComplaints(data)
      setLoading(false)
    })
    return () => unsub()
  }, [wardNumber])

  // Derived stats
  const open = complaints.filter(c => c.status === 'open').length
  const inProgress = complaints.filter(c => c.status === 'in_progress').length
  const resolved = complaints.filter(
    c => c.status === 'resolved' || c.status === 'confirmed_resolved'
  ).length
  const escalated = complaints.filter(c => c.escalated).length
  const isBadGov = open >= 10

  return { complaints, loading, stats: { open, inProgress, resolved, escalated, isBadGov } }
}

// Admin — ALL complaints across all wards
export function useAllComplaints() {
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, 'complaints'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, (snap) => {
      setComplaints(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return () => unsub()
  }, [])

  // Ward-level stats for bad governance detection
  const wardOpenCounts = complaints.reduce((acc, c) => {
    if (c.status === 'open' || c.status === 'in_progress') {
      acc[c.wardNumber] = (acc[c.wardNumber] || 0) + 1
    }
    return acc
  }, {})

  const badGovWards = Object.entries(wardOpenCounts)
    .filter(([, count]) => count >= 10)
    .map(([ward, count]) => ({ ward, count }))

  const overdue = complaints.filter(
    c => c.status !== 'resolved' && daysSince(c.createdAt) >= 60
  )

  const stats = {
    total: complaints.length,
    open: complaints.filter(c => c.status === 'open').length,
    inProgress: complaints.filter(c => c.status === 'in_progress').length,
    resolved: complaints.filter(c => c.status === 'resolved').length,
    badGov: badGovWards.length,
    overdue: overdue.length,
  }

  return { complaints, loading, stats, badGovWards, overdue, wardOpenCounts }
}

export { daysSince }
