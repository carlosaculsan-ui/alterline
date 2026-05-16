import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function ProtectedRoute() {
  const user = useAuth()
  if (user === undefined) return <div className="h-screen bg-white dark:bg-[#111]" />
  if (!user) return <Navigate to="/login" replace />
  return <Outlet />
}
