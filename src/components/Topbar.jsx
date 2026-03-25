import { useContext } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase.js'
import { AuthContext } from '../hooks/useAuth.jsx'
import Notifications from './Notifications.jsx'

export default function Topbar() {
  const { user } = useContext(AuthContext)
  const navigate = useNavigate()
  const location = useLocation()
  const isActive = (path) => location.pathname === path ? 'on' : ''

  async function handleLogout() {
    await signOut(auth)
    navigate('/login')
  }

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U'

  return (
    <nav className="topbar">
      <Link className="logo" to="/">
        WardSeva <em>Visakhapatnam</em>
      </Link>
      <div className="nav">
        {user ? (
          <>
            <Link to="/dashboard" className={isActive('/dashboard')}>My Ward</Link>
            <Link to="/report" className={isActive('/report')}>Report</Link>
            <Link to="/community" className={isActive('/community')}>Community</Link>
            {user.isAdmin && (
              <Link to="/admin" className={isActive('/admin')}>Admin</Link>
            )}
            <Notifications />
            <div
              className="av"
              title={`${user.name} — click to logout`}
              onClick={handleLogout}
              style={{ cursor: 'pointer', marginLeft: '4px' }}
            >
              {initials}
            </div>
          </>
        ) : (
          <>
            <Link to="/">Home</Link>
            <Link to="/register">Register</Link>
            <Link to="/login" className="btn btp" style={{ padding: '5px 14px', marginLeft: '6px' }}>
              Login
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}
