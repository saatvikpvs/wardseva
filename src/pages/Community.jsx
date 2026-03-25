import { useContext, useEffect, useState } from 'react'
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase.js'
import { AuthContext } from '../hooks/useAuth.jsx'
import Topbar from '../components/Topbar.jsx'

const CATEGORIES = ['Festival / Event', 'Complaint support', 'General announcement']

export default function Community() {
  const { user } = useContext(AuthContext)
  const [posts, setPosts] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ category: 'Festival / Event', title: '', body: '', anonymous: false })
  const [submitting, setSubmitting] = useState(false)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    if (!user?.wardNumber) return
    const q = query(
      collection(db, 'posts'),
      where('wardNumber', '==', user.wardNumber),
      orderBy('createdAt', 'desc')
    )
    const unsub = onSnapshot(q, snap => setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
    return () => unsub()
  }, [user?.wardNumber])

  async function submitPost() {
    if (!form.title.trim() || !form.body.trim()) return
    setSubmitting(true)
    await addDoc(collection(db, 'posts'), {
      ...form,
      wardNumber: user.wardNumber,
      ward: user.ward,
      authorId: user.uid,
      authorName: user.name,
      createdAt: serverTimestamp(),
    })
    setForm({ category: 'Festival / Event', title: '', body: '', anonymous: false })
    setShowModal(false)
    setSubmitting(false)
  }

  const tagClass = (cat) => cat === 'Festival / Event' ? 'tfest' : cat === 'Complaint support' ? 'tcomp' : 'tgen'
  const tagLabel = (cat) => cat === 'Festival / Event' ? 'Festival' : cat === 'Complaint support' ? 'Complaint' : 'General'

  const filtered = filter === 'all' ? posts
    : posts.filter(p => tagLabel(p.category).toLowerCase() === filter)

  return (
    <>
      <Topbar />
      <div className="wrap" style={{ maxWidth: '680px' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: '800' }}>Community board</h1>
            <p style={{ fontSize: '13px', color: '#8a7050' }}><span className="wt">{user?.ward}</span></p>
          </div>
          <button className="btn btp" onClick={() => setShowModal(true)}>+ New post</button>
        </div>

        <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {['all', 'festival', 'complaint', 'general'].map(f => (
            <button key={f} className="btn" style={{ fontSize: '12px', padding: '5px 12px', ...(filter === f ? { background: '#fff8ec', borderColor: '#e8a833', color: '#b45309' } : {}) }} onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {filtered.length === 0 && (
          <div style={{ padding: '32px', textAlign: 'center', color: '#8a7050', background: '#fff', borderRadius: '14px', border: '1px solid #ddd0b8' }}>
            No posts yet. Be the first to post something for your ward!
          </div>
        )}

        {filtered.map(post => (
          <div className="pc" key={post.id}>
            <div className="pm">
              <span className={`ptag ${tagClass(post.category)}`}>{tagLabel(post.category)}</span>
              <span>{post.anonymous ? 'Anonymous' : post.authorName}</span>
              <span>{post.createdAt?.toDate?.()?.toLocaleDateString('en-IN') || 'Just now'}</span>
            </div>
            <div className="pti">{post.title}</div>
            <div className="pb">{post.body}</div>
          </div>
        ))}
      </div>

      {/* New post modal */}
      {showModal && (
        <div className="mo on">
          <div className="mb2">
            <div className="mt">Create a post for {user?.ward}</div>
            <div className="fg">
              <label className="fl">Category</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="fg">
              <label className="fl">Title</label>
              <input type="text" placeholder="Short, clear title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="fg">
              <label className="fl">Details</label>
              <textarea placeholder="Share the details with your ward..." value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} style={{ minHeight: '100px' }} />
            </div>
            <div className="tw" style={{ marginBottom: '14px' }}>
              <button className={`tg ${form.anonymous ? 'on' : ''}`} onClick={() => setForm(f => ({ ...f, anonymous: !f.anonymous }))}>
                <div className="td"></div>
              </button>
              <div style={{ fontSize: '13px', color: '#5a3e1a' }}>Post anonymously</div>
            </div>
            <div className="br">
              <button className="btn btp" style={{ flex: 1 }} onClick={submitPost} disabled={submitting}>
                {submitting ? 'Posting...' : 'Post to ward'}
              </button>
              <button className="btn" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
