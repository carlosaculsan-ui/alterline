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

function IconPencil() {
  return (
    <svg width="11" height="11" viewBox="0 0 15 15" fill="none" className="shrink-0">
      <path d="M11.5 1.5l2 2-9 9H2.5v-2l9-9z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  )
}

function IconSidebarToggle() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" className="shrink-0">
      <rect x="1" y="1.5" width="13" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M5 1.5v12" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  )
}

function IconBook() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" className="shrink-0">
      <path d="M2 3.5C2 3.5 4 3 7.5 4.5V13C4 11.5 2 12 2 12V3.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M13 3.5C13 3.5 11 3 7.5 4.5V13C11 11.5 13 12 13 12V3.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M7.5 2V4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

const NAV = [
  { to: '/', label: 'Dashboard', icon: <IconGrid /> },
  { to: '/recent', label: 'Recent', icon: <IconClock /> },
]

const NAV_WIKI = [
  { to: '/carlopedia', label: 'Carlopedia', icon: <IconBook /> },
]

export default function Layout({ children, forceLight = false, wide = false }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [dark, setDark] = useState(() => {
    return localStorage.getItem('alterline-theme') !== 'light'
  })
  const [sidebarOpen, setSidebarOpen] = useState(true)
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
    <div className="relative flex h-screen overflow-hidden bg-white dark:bg-[#111] text-gray-900 dark:text-gray-100">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-[280px]' : 'w-0'} shrink-0 flex flex-col bg-[#f9f9f9] dark:bg-[#141414] border-r border-[#e5e5e5] dark:border-[#2a2a2a] overflow-hidden transition-[width] duration-200`}>
        {/* Logo */}
        <div className="px-5 py-[18px] border-b border-[#e5e5e5] dark:border-[#2a2a2a] flex items-center justify-between min-w-[280px]">
          <div className="flex items-center gap-3">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="shrink-0 text-gray-900 dark:text-white">
              <path d="M4 21L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M14 3L20 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M7 13H17" stroke="#ec4899" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span
              className="text-gray-900 dark:text-white"
              style={{ fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif", fontSize: '15px', fontWeight: 700, letterSpacing: '0.1em' }}
            >
              Alterline
            </span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-[#ebebeb] dark:hover:bg-[#222] p-1.5 rounded-md transition-colors"
            aria-label="Close sidebar"
          >
            <IconSidebarToggle />
          </button>
        </div>

        {/* Nav */}
        <nav className="px-2 pt-4 pb-2 space-y-1">
          {/* New Entry */}
          <button
            onClick={() => setShowEntryModal(true)}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-[14px] text-gray-800 dark:text-white hover:bg-[#f0f0f0] dark:hover:bg-[#1c1c1c] transition-colors"
          >
            <IconPlus />
            New Entry
          </button>

          {NAV.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-md text-[14px] transition-colors ${
                  isActive
                    ? 'bg-[#ebebeb] dark:bg-[#222] text-gray-900 dark:text-white'
                    : 'text-gray-800 dark:text-white hover:bg-[#f0f0f0] dark:hover:bg-[#1c1c1c]'
                }`
              }
            >
              {icon}
              {label}
            </NavLink>
          ))}

          <div className="mx-3 my-1 border-t border-[#e5e5e5] dark:border-[#2a2a2a]" />

          {NAV_WIKI.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-md text-[14px] transition-colors ${
                  isActive
                    ? 'bg-[#ebebeb] dark:bg-[#222] text-gray-900 dark:text-white'
                    : 'text-gray-800 dark:text-white hover:bg-[#f0f0f0] dark:hover:bg-[#1c1c1c]'
                }`
              }
            >
              {icon}
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Categories */}
        <div className="flex-1 overflow-y-auto px-2 pt-5 pb-3">
          <div className="px-3 mb-3 text-[11px] uppercase tracking-widest text-gray-500 dark:text-gray-400 font-medium select-none">
            Categories
          </div>
          <div className="space-y-1">
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
                      className={`flex w-full items-center gap-2.5 px-3 py-2 pr-[52px] rounded-md text-[14px] transition-colors cursor-pointer select-none ${
                        isActive
                          ? 'bg-[#ebebeb] dark:bg-[#222] text-gray-900 dark:text-white'
                          : 'text-gray-800 dark:text-white hover:bg-[#f0f0f0] dark:hover:bg-[#1c1c1c]'
                      }`}
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="flex-1 text-left truncate">
                        {cat.name}
                      </span>
                    </div>
                  )}
                  {!isEditing && !isConfirming && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditingId(cat.id)
                        setEditDraft({ name: cat.name, color: cat.color })
                      }}
                      className="absolute top-2 right-7 w-5 h-5 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-[#e5e5e5] dark:hover:bg-[#333] transition-all"
                      aria-label={`Edit ${cat.name}`}
                    >
                      <IconPencil />
                    </button>
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
                    className={`absolute top-2 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded leading-none transition-all ${
                      isConfirming
                        ? 'right-1 px-1.5 h-5 text-[11px] font-medium text-red-500 dark:text-red-400 bg-red-50 dark:bg-[#2a1515] opacity-100'
                        : 'right-1.5 w-5 h-5 text-[15px] text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-[#e5e5e5] dark:hover:bg-[#333]'
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
            className="mt-1 w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-[14px] text-gray-800 dark:text-white hover:bg-[#f0f0f0] dark:hover:bg-[#1c1c1c] transition-colors"
          >
            <IconPlus />
            New category
          </button>
        </div>

        {/* Theme toggle */}
        <div className="p-3 border-t border-[#e5e5e5] dark:border-[#2a2a2a]">
          <button
            onClick={() => setDark((d) => !d)}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-[14px] text-gray-800 dark:text-white hover:bg-[#f0f0f0] dark:hover:bg-[#1c1c1c] transition-colors"
          >
            {dark ? <IconSun /> : <IconMoon />}
            {dark ? 'Light mode' : 'Dark mode'}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Sidebar reopen button */}
        {!sidebarOpen && (
          <div className="absolute top-3 left-3 z-10">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-[#ebebeb] dark:hover:bg-[#222] p-1.5 rounded-md transition-colors"
              aria-label="Open sidebar"
            >
              <IconSidebarToggle />
            </button>
          </div>
        )}
        {/* Content */}
        <main className={`flex-1 overflow-auto ${forceLight ? 'bg-white' : 'bg-white dark:bg-[#111]'}`}>
          <div className={wide ? '' : 'max-w-5xl mx-auto'}>
            {children}
          </div>
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
          onConfirm={handleCreateEntry}
          onClose={() => setShowEntryModal(false)}
        />
      )}
      {toastMsg && <Toast message={toastMsg} onDismiss={() => setToastMsg(null)} />}
    </div>
  )
}
