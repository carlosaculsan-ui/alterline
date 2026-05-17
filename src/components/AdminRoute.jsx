import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const ADMIN_EMAIL = 'carlosaculsan123@gmail.com'

export default function AdminRoute() {
  const user = useAuth()
  if (user === undefined) return null
  if (!user) return <Navigate to="/login" replace />
  if (user.email !== ADMIN_EMAIL) return <Navigate to="/" replace />
  return <Outlet />
}
