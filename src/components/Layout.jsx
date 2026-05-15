import { useState, useEffect, useRef } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useCategories } from '../hooks/useCategories'
import NewCategoryModal from './NewCategoryModal'
import NewEntryModal from './NewEntryModal'
import Toast from './Toast'
import { supabase } from '../lib/supabase'

const COLORS = [
  '#5DCAA5', '#85B7EB', '#F0997B', '#ED93B1',
  '#AFA9EC', '#FAC775', '#E24B4A', '#888780',
]

function IconGrid() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" className="shrink-0">
      <rect x="1.5" y="1.5" width="5" height="5" rx="0.8" stroke="currentColor" strokeWidth="1.3" />
      <rect x="8.5" y="1.5" width="5" height="5" rx="0.8" stroke="currentColor" strokeWidth="1.3" />
      <rect x="1.5" y="8.5" width="5" height="5" rx="0.8" stroke="currentColor" strokeWidth="1.3" />
      <rect x="8.5" y="8.5" width="5" height="5" rx="0.8" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  )
}

function IconClock() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" className="shrink-0">
      <circle cx="7.5" cy="7.5" r="5.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M7.5 4.5V7.5L9.5 9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconSearch() {
  return (
    <svg width="14" height="14" viewBox="0 0 15 15" fill="none" className="shrink-0">
      <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M10 10L13 13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

function IconPlus() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" className="shrink-0">
      <path d="M6.5 1V12M1 6.5H12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function IconSun() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" className="shrink-0">
      <circle cx="7.5" cy="7.5" r="2.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M7.5 1.5V3M7.5 12V13.5M1.5 7.5H3M12 7.5H13.5M3.4 3.4L4.5 4.5M10.5 10.5L11.6 11.6M3.4 11.6L4.5 10.5M10.5 4.5L11.6 3.4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

function IconMoon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" className="shrink-0">
      <path d="M13 9.5A6 6 0 016 2.5a5.5 5.5 0 100 10A6 6 0 0113 9.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  )
}

const NAV = [
  { to: '/', label: 'Dashboard', icon: <IconGrid /> },
  { to: '/recent', label: 'Recent', icon: <IconClock /> },
  { to: '/search', label: 'Search', icon: <IconSearch /> },
]

export default function Layout({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [dark, setDark] = useState(() => {
    return localStorage.getItem('alterline-theme') !== 'light'
  })
  const [showModal, setShowModal] = useState(false)
  const [showEntryModal, setShowEntryModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editDraft, setEditDraft] = useState({ name: '', color: '' })
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [toastMsg, setToastMsg] = useState(null)
  const { categories, createCategory, updateCategory, deleteCategory } = useCategories()
  const editInputRef = useRef(null)
  const cancelEditRef = useRef(false)

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('alterline-theme', dark ? 'dark' : 'light')
  }, [dark])

  useEffect(() => {
    if (editingId) editInputRef.current?.focus()
  }, [editingId])

  async function saveEdit() {
    if (cancelEditRef.current) {
      cancelEditRef.current = false
      setEditingId(null)
      return
    }
    const name = editDraft.name.trim()
    const catId = editingId
    setEditingId(null)
    if (!name) return
    const original = categories.find((c) => c.id === catId)
    if (!original || (name === original.name && editDraft.color === original.color)) return
    await updateCategory(catId, name, editDraft.color)
  }

  async function handleCreateEntry(data, fields) {
    const { data: created, error } = await supabase
      .from('entries')
      .insert(data)
      .select('id')
      .single()
    if (error) { setToastMsg('Failed to create entry. Try again.'); return }
    if (created) {
      if (fields.length > 0) {
        await supabase.from('profile_fields').insert(
          fields.map(({ key, value }) => ({
            entry_id: created.id,
            field_key: key,
            field_value: value,
          }))
        )
      }
      setShowEntryModal(false)
      navigate(`/entry/${created.id}`)
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-white dark:bg-[#111] text-gray-900 dark:text-gray-100">
      {/* Sidebar */}
      <aside className="w-[220px] shrink-0 flex flex-col bg-[#f9f9f9] dark:bg-[#141414] border-r border-[#e5e5e5] dark:border-[#2a2a2a]">
        {/* App name */}
        <div className="px-4 py-4 border-b border-[#e5e5e5] dark:border-[#2a2a2a]">
          <div className="text-[13px] font-semibold tracking-wide text-gray-900 dark:text-white">
            Alterline
          </div>
          <div className="text-[11px] text-gray-400 dark:text-[#555] mt-0.5">
            your alternate universe
          </div>
        </div>

        {/* Nav */}
        <nav className="px-2 pt-3 pb-1 space-y-0.5">
          {NAV.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-[7px] rounded-md text-[13px] transition-colors ${
                  isActive
                    ? 'bg-[#ebebeb] dark:bg-[#222] text-gray-900 dark:text-white'
                    : 'text-gray-500 dark:text-[#777] hover:bg-[#f0f0f0] dark:hover:bg-[#1c1c1c] hover:text-gray-800 dark:hover:text-gray-300'
                }`
              }
            >
              {icon}
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Categories */}
        <div className="flex-1 overflow-y-auto px-2 pt-4 pb-2">
          <div className="px-3 mb-2 text-[10px] uppercase tracking-widest text-gray-400 dark:text-[#444] font-medium select-none">
            Categories
          </div>
          <div className="space-y-0.5">
            {categories.map((cat) => {
              const isActive = location.pathname === `/category/${cat.id}`
              const isEditing = editingId === cat.id

              const isConfirming = confirmDeleteId === cat.id

              return (
                <div key={cat.id} className="group relative" onMouseLeave={() => { if (isConfirming) setConfirmDeleteId(null) }}>
                  {isEditing ? (
                    <div className="px-3 py-2 rounded-md bg-[#f0f0f0] dark:bg-[#1e1e1e]">
                      <div className="flex items-center gap-2.5 pr-6">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: editDraft.color }}
                        />
                        <input
                          ref={editInputRef}
                          type="text"
                          value={editDraft.name}
                          onChange={(e) => setEditDraft((d) => ({ ...d, name: e.target.value }))}
                          onBlur={saveEdit}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') { e.preventDefault(); editInputRef.current?.blur() }
                            if (e.key === 'Escape') { cancelEditRef.current = true; editInputRef.current?.blur() }
                          }}
                          className="flex-1 bg-transparent text-[13px] text-gray-900 dark:text-white outline-none min-w-0"
                        />
                      </div>
                      <div className="flex gap-1.5 mt-2 pl-[18px] flex-wrap">
                        {COLORS.map((c) => (
                          <button
                            key={c}
                            onMouseDown={(e) => { e.preventDefault(); setEditDraft((d) => ({ ...d, color: c })) }}
                            className="w-3.5 h-3.5 rounded-full shrink-0 transition-transform hover:scale-110"
                            style={{
                              backgroundColor: c,
                              outline: editDraft.color === c ? `2px solid ${c}` : 'none',
                              outlineOffset: '2px',
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => navigate(`/category/${cat.id}`)}
                      className={`flex w-full items-center gap-2.5 px-3 py-[7px] pr-8 rounded-md text-[13px] transition-colors cursor-pointer select-none ${
                        isActive
                          ? 'bg-[#ebebeb] dark:bg-[#222] text-gray-900 dark:text-white'
                          : 'text-gray-500 dark:text-[#777] hover:bg-[#f0f0f0] dark:hover:bg-[#1c1c1c] hover:text-gray-800 dark:hover:text-gray-300'
                      }`}
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span
                        className="flex-1 text-left truncate"
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingId(cat.id)
                          setEditDraft({ name: cat.name, color: cat.color })
                        }}
                      >
                        {cat.name}
                      </span>
                    </div>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (isConfirming) {
                        deleteCategory(cat.id)
                        setConfirmDeleteId(null)
                      } else {
                        setConfirmDeleteId(cat.id)
                      }
                    }}
                    className={`absolute top-[7px] opacity-0 group-hover:opacity-100 flex items-center justify-center rounded leading-none transition-all ${
                      isConfirming
                        ? 'right-1 px-1.5 h-5 text-[11px] font-medium text-red-500 dark:text-red-400 bg-red-50 dark:bg-[#2a1515] opacity-100'
                        : 'right-1.5 w-5 h-5 text-[15px] text-gray-400 dark:text-[#555] hover:text-gray-700 dark:hover:text-gray-300 hover:bg-[#e5e5e5] dark:hover:bg-[#333]'
                    }`}
                    aria-label={`Delete ${cat.name}`}
                  >
                    {isConfirming ? 'Confirm?' : '×'}
                  </button>
                </div>
              )
            })}
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="mt-1 w-full flex items-center gap-2.5 px-3 py-[7px] rounded-md text-[13px] text-gray-400 dark:text-[#555] hover:bg-[#f0f0f0] dark:hover:bg-[#1c1c1c] hover:text-gray-700 dark:hover:text-gray-400 transition-colors"
          >
            <IconPlus />
            New category
          </button>
        </div>

        {/* Theme toggle */}
        <div className="p-2 border-t border-[#e5e5e5] dark:border-[#2a2a2a]">
          <button
            onClick={() => setDark((d) => !d)}
            className="w-full flex items-center gap-2.5 px-3 py-[7px] rounded-md text-[13px] text-gray-400 dark:text-[#555] hover:bg-[#f0f0f0] dark:hover:bg-[#1c1c1c] hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            {dark ? <IconSun /> : <IconMoon />}
            {dark ? 'Light mode' : 'Dark mode'}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-12 shrink-0 flex items-center gap-3 px-4 border-b border-[#e5e5e5] dark:border-[#2a2a2a] bg-white dark:bg-[#111]">
          <button
            onClick={() => navigate('/search')}
            className="flex-1 flex items-center gap-2 bg-[#f5f5f5] dark:bg-[#1a1a1a] border border-[#e5e5e5] dark:border-[#2a2a2a] rounded-md px-3 h-8 cursor-pointer text-left hover:border-[#d0d0d0] dark:hover:border-[#333] transition-colors"
          >
            <IconSearch />
            <span className="text-[13px] text-gray-400 dark:text-[#555]">Search entries…</span>
          </button>
          <button
            onClick={() => setShowEntryModal(true)}
            className="flex items-center gap-1.5 px-3 h-8 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-[13px] font-medium transition-colors shrink-0"
          >
            <IconPlus />
            New Entry
          </button>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto bg-white dark:bg-[#111]">
          {children}
        </main>
      </div>

      {showModal && (
        <NewCategoryModal
          onConfirm={createCategory}
          onClose={() => setShowModal(false)}
        />
      )}

      {showEntryModal && (
        <NewEntryModal
          categories={categories}
          defaultCategoryId={location.pathname.match(/^\/category\/(.+)/)?.[1] ?? null}
          onConfirm={handleCreateEntry}
          onClose={() => setShowEntryModal(false)}
        />
      )}
      {toastMsg && <Toast message={toastMsg} onDismiss={() => setToastMsg(null)} />}
    </div>
  )
}
