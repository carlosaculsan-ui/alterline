import { Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import EntryPage from './pages/EntryPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/entry/:id" element={<EntryPage />} />
    </Routes>
  )
}
