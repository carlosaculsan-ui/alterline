import { useEffect } from 'react'
import { Routes, Route, Navigate, useParams } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ErrorBoundary from './components/ErrorBoundary'
import CursorTrail from './components/CursorTrail'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import LoginPage from './pages/LoginPage'
import Dashboard from './pages/Dashboard'
import EntryPage from './pages/EntryPage'
import CategoryPage from './pages/CategoryPage'
import RecentPage from './pages/RecentPage'
import GraphPage from './pages/GraphPage'
import CarlopediaPage from './pages/CarlopediaPage'
import CarlopediaEntryPage from './pages/CarlopediaEntryPage'
import TutorialsPage from './pages/TutorialsPage'
import PrivacyPage from './pages/PrivacyPage'
import AboutPage from './pages/AboutPage'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUsers from './pages/admin/AdminUsers'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import SearchPage from './pages/SearchPage'
import ArchivePage from './pages/ArchivePage'

function KeyedEntryPage() {
  const { id } = useParams()
  return <EntryPage key={id} />
}

function KeyedCarlopediaEntryPage() {
  const { id } = useParams()
  return <CarlopediaEntryPage key={id} />
}

export default function App() {
  useEffect(() => {
    const splash = document.getElementById('splash')
    if (!splash) return
    splash.style.opacity = '0'
    const t = setTimeout(() => splash.remove(), 400)
    return () => clearTimeout(t)
  }, [])

  return (
    <ErrorBoundary>
    <CursorTrail />
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/tutorials" element={<TutorialsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/entry/:id" element={<KeyedEntryPage />} />
          <Route path="/category/:id" element={<CategoryPage />} />
          <Route path="/recent" element={<RecentPage />} />
          <Route path="/graph" element={<GraphPage />} />
          <Route path="/carlopedia" element={<CarlopediaPage />} />
          <Route path="/carlopedia/:id" element={<KeyedCarlopediaEntryPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/archive" element={<ArchivePage />} />
        </Route>
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUsers />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
    </ErrorBoundary>
  )
}
