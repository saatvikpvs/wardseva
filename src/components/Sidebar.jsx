import { Link, useLocation } from 'react-router-dom'

export default function Sidebar({ stats = {} }) {
  const location = useLocation()
  const isActive = (path) => location.pathname === path ? 'on' : ''

  return (
    <aside className="sidebar">
      <div className="slbl">Main</div>
      <Link className={`si ${isActive('/admin')}`} to="/admin">
        <span className="dot"></span>Overview
      </Link>
      <Link className={`si ${isActive('/admin/complaints')}`} to="/admin">
        <span className="dot"></span>All complaints
        {stats.open > 0 && (
          <span style={{ marginLeft: 'auto', fontSize: '10px', background: '#FEF3C7', color: '#92400E', padding: '1px 6px', borderRadius: '10px', fontWeight: '700' }}>
            {stats.open}
          </span>
        )}
      </Link>
      <Link className="si" to="/admin">
        <span className="dot"></span>By ward
      </Link>
      <Link className="si" to="/admin">
        <span className="dot"></span>Escalations
        {stats.overdue > 0 && (
          <span style={{ marginLeft: 'auto', fontSize: '10px', background: '#FFE4E1', color: '#9B1C1C', padding: '1px 6px', borderRadius: '10px', fontWeight: '700' }}>
            {stats.overdue}
          </span>
        )}
      </Link>

      <div className="slbl">Monitor</div>
      <Link className="si red" to="/admin">
        <span className="dot"></span>Bad governance
        {stats.badGov > 0 && (
          <span style={{ marginLeft: 'auto', fontSize: '10px', background: '#dc2626', color: '#fff', padding: '1px 6px', borderRadius: '10px', fontWeight: '700' }}>
            {stats.badGov}
          </span>
        )}
      </Link>
      <Link className="si" to="/admin">
        <span className="dot"></span>Overdue (&gt;60d)
      </Link>
      <Link className="si" to="/admin">
        <span className="dot"></span>Community posts
      </Link>

      <div className="slbl">Settings</div>
      <Link className="si" to="/admin">
        <span className="dot"></span>Ward officers
      </Link>
      <Link className="si" to="/admin">
        <span className="dot"></span>Notifications
      </Link>

      <div style={{ padding: '20px', marginTop: 'auto' }}>
        <div style={{ fontSize: '10px', color: '#5a4020', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>GVMC Admin</div>
        <Link to="/" style={{ fontSize: '12px', color: '#a0896a', textDecoration: 'none' }}>
          ← Back to WardSeva
        </Link>
      </div>
    </aside>
  )
}
