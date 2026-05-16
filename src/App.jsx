import { Routes, Route, Navigate, useParams } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import EntryPage from './pages/EntryPage'
import CategoryPage from './pages/CategoryPage'
import RecentPage from './pages/RecentPage'
import CarlopediaPage from './pages/CarlopediaPage'
import CarlopediaEntryPage from './pages/CarlopediaEntryPage'

function KeyedEntryPage() {
  const { id } = useParams()
  return <EntryPage key={id} />
}

function KeyedCarlopediaEntryPage() {
  const { id } = useParams()
  return <CarlopediaEntryPage key={id} />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/entry/:id" element={<KeyedEntryPage />} />
      <Route path="/category/:id" element={<CategoryPage />} />
      <Route path="/recent" element={<RecentPage />} />
      <Route path="/carlopedia" element={<CarlopediaPage />} />
      <Route path="/carlopedia/:id" element={<KeyedCarlopediaEntryPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
