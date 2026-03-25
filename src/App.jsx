import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useContext } from 'react'
import { AuthContext, AuthProvider } from './hooks/useAuth.jsx'

import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import WardDashboard from './pages/WardDashboard.jsx'
import Report from './pages/Report.jsx'
import Community from './pages/Community.jsx'
import Admin from './pages/Admin.jsx'

// Protect pages that need login
function PrivateRoute({ children }) {
  const { user, loading } = useContext(AuthContext)
  if (loading) return <div className="loading">Loading...</div>
  return user ? children : <Navigate to="/login" />
}

// Admin-only route
function AdminRoute({ children }) {
  const { user, loading } = useContext(AuthContext)
  if (loading) return <div className="loading">Loading...</div>
  return user?.isAdmin ? children : <Navigate to="/" />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<PrivateRoute><WardDashboard /></PrivateRoute>} />
          <Route path="/report" element={<PrivateRoute><Report /></PrivateRoute>} />
          <Route path="/community" element={<PrivateRoute><Community /></PrivateRoute>} />
          <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
