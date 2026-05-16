import { Routes, Route, Navigate } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import EntryPage from './pages/EntryPage'
import CategoryPage from './pages/CategoryPage'
import RecentPage from './pages/RecentPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/entry/:id" element={<EntryPage />} />
      <Route path="/category/:id" element={<CategoryPage />} />
      <Route path="/recent" element={<RecentPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
