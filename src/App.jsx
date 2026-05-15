import { Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import EntryPage from './pages/EntryPage'
import SearchPage from './pages/SearchPage'
import CategoryPage from './pages/CategoryPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/entry/:id" element={<EntryPage />} />
      <Route path="/search" element={<SearchPage />} />
      <Route path="/category/:id" element={<CategoryPage />} />
    </Routes>
  )
}
