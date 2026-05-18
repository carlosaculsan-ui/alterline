import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useCategories } from '../hooks/useCategories'
import NewCategoryModal from './NewCategoryModal'
import NewEntryModal from './NewEntryModal'
import Toast from './Toast'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useWorld } from '../contexts/WorldContext'

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

function IconHamburger() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="shrink-0">
      <path d="M2 4.5H16M2 9H16M2 13.5H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
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

function IconGraph() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" className="shrink-0">
      <circle cx="7.5" cy="7.5" r="1.8" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="2" cy="3" r="1.5" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="13" cy="3" r="1.5" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="2" cy="12" r="1.5" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="13" cy="12" r="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M3.2 3.8L6.5 6.5M11.8 3.8L8.5 6.5M3.2 11.2L6.5 8.5M11.8 11.2L8.5 8.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

const NAV = [
  { to: '/', label: 'Dashboard', icon: <IconGrid /> },
  { to: '/recent', label: 'Recent', icon: <IconClock /> },
  { to: '/graph', label: 'Graph', icon: <IconGraph /> },
]

const NAV_WIKI = [
  { to: '/carlopedia', label: 'Carlopedia', icon: <IconBook /> },
]

function IconLogOut() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" className="shrink-0">
      <path d="M6 2H2.5A1.5 1.5 0 001 3.5v8A1.5 1.5 0 002.5 13H6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M10 10l3-2.5L10 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13 7.5H6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

export default function Layout({ children, forceLight = false, wide = false }) {
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuth()
  const { worlds, activeWorld, activeWorldId, setActiveWorldId, createWorld, updateWorld, deleteWorld } = useWorld()
  const [dark, setDark] = useState(() => {
    return localStorage.getItem('alterline-theme') !== 'light'
  })
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showEntryModal, setShowEntryModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editDraft, setEditDraft] = useState({ name: '', color: '' })
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [toastMsg, setToastMsg] = useState(null)
  const { categories, createCategory, updateCategory, deleteCategory } = useCategories()
  const editInputRef = useRef(null)
  const cancelEditRef = useRef(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showLearnMore, setShowLearnMore] = useState(false)
  const [learnMorePos, setLearnMorePos] = useState(null)
  const userMenuRef = useRef(null)
  const learnMoreRef = useRef(null)
  const learnMorePortalRef = useRef(null)
  const [showWorldSwitcher, setShowWorldSwitcher] = useState(false)
  const [showNewWorld, setShowNewWorld] = useState(false)
  const [newWorldName, setNewWorldName] = useState('')
  const [newWorldColor, setNewWorldColor] = useState(COLORS[0])
  const [creatingWorld, setCreatingWorld] = useState(false)
  const [renamingWorldId, setRenamingWorldId] = useState(null)
  const [renameValue, setRenameValue] = useState('')
  const [deleteWorldTarget, setDeleteWorldTarget] = useState(null)
  const [deleteConfirmName, setDeleteConfirmName] = useState('')
  const [deletingWorld, setDeletingWorld] = useState(false)
  const worldSwitcherRef = useRef(null)

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('alterline-theme', dark ? 'dark' : 'light')
  }, [dark])

  useEffect(() => {
    document.title = activeWorld ? `${activeWorld.name} — alterline` : 'alterline'
  }, [activeWorld])

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (editingId) editInputRef.current?.focus()
  }, [editingId])

  useEffect(() => {
    if (!showUserMenu) return
    function handleClick(e) {
      const inMenu = userMenuRef.current?.contains(e.target)
      const inPortal = learnMorePortalRef.current?.contains(e.target)
      if (!inMenu && !inPortal) {
        setShowUserMenu(false)
        setShowLearnMore(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showUserMenu])

  useEffect(() => {
    if (!showWorldSwitcher) return
    function handleClick(e) {
      if (!worldSwitcherRef.current?.contains(e.target)) {
        setShowWorldSwitcher(false)
        setShowNewWorld(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showWorldSwitcher])

  async function handleCreateWorld(e) {
    e.preventDefault()
    if (!newWorldName.trim() || creatingWorld) return
    setCreatingWorld(true)
    const world = await createWorld(newWorldName.trim(), newWorldColor)
    if (world) {
      setActiveWorldId(world.id)
      setShowWorldSwitcher(false)
      setShowNewWorld(false)
      setNewWorldName('')
      setNewWorldColor(COLORS[0])
    }
    setCreatingWorld(false)
  }

  async function handleDeleteWorld() {
    if (!deleteWorldTarget || deletingWorld) return
    setDeletingWorld(true)
    await deleteWorld(deleteWorldTarget.id)
    setDeletingWorld(false)
    setDeleteWorldTarget(null)
    setDeleteConfirmName('')
    setShowWorldSwitcher(false)
  }

  async function handleRenameWorld(id) {
    const trimmed = renameValue.trim()
    const world = worlds.find((w) => w.id === id)
    setRenamingWorldId(null)
    if (trimmed && world && trimmed !== world.name) {
      await updateWorld(id, trimmed, world.color)
    }
  }

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
      {/* Mobile backdrop */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:relative inset-y-0 left-0 z-50 lg:z-auto shrink-0 flex flex-col w-[280px] bg-[#f9f9f9] dark:bg-[#141414] border-r border-[#e5e5e5] dark:border-[#2a2a2a] overflow-hidden transition-transform lg:transition-[width] duration-200 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} ${sidebarOpen ? '' : 'lg:w-0'}`}>
        {/* Logo */}
        <div className="px-5 py-[18px] border-b border-[#e5e5e5] dark:border-[#2a2a2a] flex items-center justify-between min-w-[280px]">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-3 hover:opacity-75 transition-opacity"
          >
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
          </button>
          <button
            onClick={() => { setSidebarOpen(false); setMobileMenuOpen(false) }}
            className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-[#ebebeb] dark:hover:bg-[#222] p-1.5 rounded-md transition-colors"
            aria-label="Close sidebar"
          >
            <IconSidebarToggle />
          </button>
        </div>

        {/* World switcher */}
        <div className="px-3 py-2 border-b border-[#e5e5e5] dark:border-[#2a2a2a] relative min-w-[280px]" ref={worldSwitcherRef}>
          <button
            onClick={() => { setShowWorldSwitcher((v) => !v); setShowNewWorld(false) }}
            className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-[#f0f0f0] dark:hover:bg-[#1c1c1c] transition-colors group"
          >
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: activeWorld?.color ?? '#6366f1' }}
            />
            <span className="flex-1 text-left text-[13px] font-semibold text-gray-900 dark:text-white truncate">
              {activeWorld?.name ?? '…'}
            </span>
            <svg width="12" height="12" viewBox="0 0 15 15" fill="none" className="shrink-0 text-gray-900 dark:text-white opacity-40">
              <path d="M3.5 5.5L7.5 9.5L11.5 5.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {showWorldSwitcher && (
            <div className="absolute top-full left-3 right-3 mt-1 z-50 bg-white dark:bg-[#1c1c1c] border border-[#e5e5e5] dark:border-[#2a2a2a] rounded-xl shadow-xl py-1 overflow-hidden">
              {worlds.map((world) => (
                <div key={world.id} className="relative group">
                  {renamingWorldId === world.id ? (
                    <div className="flex items-center gap-2 px-3 py-1.5">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: world.color }} />
                      <input
                        autoFocus
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') { e.preventDefault(); handleRenameWorld(world.id) }
                          if (e.key === 'Escape') setRenamingWorldId(null)
                        }}
                        onBlur={() => handleRenameWorld(world.id)}
                        className="flex-1 bg-[#f5f5f5] dark:bg-[#222] border border-indigo-400 rounded-md px-2 py-0.5 text-[12px] text-gray-900 dark:text-white outline-none"
                      />
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        if (world.id !== activeWorldId) {
                          setActiveWorldId(world.id)
                          if (/^\/(entry|carlopedia)\//.test(location.pathname)) navigate('/')
                        }
                        setShowWorldSwitcher(false)
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-[13px] transition-colors ${
                        world.id === activeWorldId
                          ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
                          : 'text-gray-900 dark:text-white hover:bg-[#f5f5f5] dark:hover:bg-[#252525]'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: world.color }} />
                      <span className="flex-1 text-left truncate font-medium">{world.name}</span>
                      {world.id === activeWorldId && (
                        <svg width="12" height="12" viewBox="0 0 15 15" fill="none" className="shrink-0">
                          <path d="M2 7.5L6 11.5L13 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </button>
                  )}
                  {renamingWorldId !== world.id && (
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 flex items-center transition-all">
                      <button
                        onClick={(e) => { e.stopPropagation(); setRenamingWorldId(world.id); setRenameValue(world.name) }}
                        className="p-1 rounded text-gray-400 dark:text-[#666] hover:text-gray-700 dark:hover:text-white transition-colors"
                        title="Rename"
                      >
                        <svg width="11" height="11" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M10.5 1.5L13.5 4.5L5 13H2V10L10.5 1.5Z" />
                        </svg>
                      </button>
                      {worlds.length > 1 && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeleteWorldTarget(world); setDeleteConfirmName('') }}
                          className="p-1 rounded text-gray-400 dark:text-[#666] hover:text-red-500 transition-colors"
                          title="Delete world"
                        >
                          <svg width="11" height="11" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M2 4h11M5 4V2.5h5V4M6 7v4.5M9 7v4.5M3 4l.8 8.5a1 1 0 001 .9h6.4a1 1 0 001-.9L13 4" />
                          </svg>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}

              <div className="mx-3 my-1 border-t border-[#f0f0f0] dark:border-[#2a2a2a]" />

              {showNewWorld ? (
                <form onSubmit={handleCreateWorld} className="px-3 py-2">
                  <input
                    autoFocus
                    type="text"
                    value={newWorldName}
                    onChange={(e) => setNewWorldName(e.target.value)}
                    placeholder="World name…"
                    className="w-full bg-[#f5f5f5] dark:bg-[#222] border border-[#e5e5e5] dark:border-[#333] rounded-lg px-2.5 py-1.5 text-[12px] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-[#555] outline-none focus:border-indigo-500 transition-colors mb-2"
                  />
                  <div className="flex gap-1.5 mb-2 flex-wrap">
                    {COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setNewWorldColor(c)}
                        className="w-4 h-4 rounded-full transition-transform hover:scale-110"
                        style={{
                          backgroundColor: c,
                          outline: newWorldColor === c ? `2px solid ${c}` : 'none',
                          outlineOffset: '2px',
                        }}
                      />
                    ))}
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      type="submit"
                      disabled={!newWorldName.trim() || creatingWorld}
                      className="flex-1 py-1 rounded-md text-[12px] font-medium bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white transition-colors"
                    >
                      {creatingWorld ? '…' : 'Create'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowNewWorld(false)}
                      className="px-2 py-1 rounded-md text-[12px] text-gray-500 dark:text-[#666] hover:bg-[#f0f0f0] dark:hover:bg-[#252525] transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setShowNewWorld(true)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-gray-900 dark:text-white hover:bg-[#f5f5f5] dark:hover:bg-[#252525] transition-colors"
                >
                  <svg width="11" height="11" viewBox="0 0 13 13" fill="none" className="shrink-0">
                    <path d="M6.5 1V12M1 6.5H12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                  New world
                </button>
              )}
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="px-2 pt-4 pb-2 space-y-1">
          {/* New Entry */}
          <button
            onClick={() => { setMobileMenuOpen(false); setShowEntryModal(true) }}
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
              onClick={() => setMobileMenuOpen(false)}
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
              onClick={() => setMobileMenuOpen(false)}
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
            Folders
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
                      onClick={() => { setMobileMenuOpen(false); navigate(`/category/${cat.id}`) }}
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
            onClick={() => { setMobileMenuOpen(false); setShowModal(true) }}
            className="mt-1 w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-[14px] text-gray-800 dark:text-white hover:bg-[#f0f0f0] dark:hover:bg-[#1c1c1c] transition-colors"
          >
            <IconPlus />
            New folder
          </button>
        </div>

        {/* User menu */}
        <div className="p-3 border-t border-[#e5e5e5] dark:border-[#2a2a2a] relative" ref={userMenuRef}>
          {/* Popover */}
          {showUserMenu && user && (
            <div className="absolute bottom-full left-0 right-0 mb-2 mx-0 bg-white dark:bg-[#1c1c1c] border border-[#e5e5e5] dark:border-[#2a2a2a] rounded-xl shadow-lg py-1">
              <div className="px-4 py-2.5 text-[12px] text-gray-500 dark:text-[#777] truncate border-b border-[#f0f0f0] dark:border-[#2a2a2a] mb-1">
                {user.email}
              </div>
              <button
                onClick={() => { setDark((d) => !d) }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-[13px] text-gray-800 dark:text-white hover:bg-[#f5f5f5] dark:hover:bg-[#252525] transition-colors"
              >
                {dark ? <IconSun /> : <IconMoon />}
                {dark ? 'Light mode' : 'Dark mode'}
              </button>
              {/* Learn more */}
              <div ref={learnMoreRef}>
                <button
                  onClick={() => {
                    const rect = learnMoreRef.current?.getBoundingClientRect()
                    if (rect) setLearnMorePos({ top: rect.top, left: rect.right })
                    setShowLearnMore((v) => !v)
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-[13px] text-gray-800 dark:text-white hover:bg-[#f5f5f5] dark:hover:bg-[#252525] transition-colors"
                >
                  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" className="shrink-0">
                    <circle cx="7.5" cy="7.5" r="6" stroke="currentColor" strokeWidth="1.3" />
                    <path d="M7.5 5v.5M7.5 7v3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                  </svg>
                  <span className="flex-1 text-left">Learn more</span>
                  <svg width="12" height="12" viewBox="0 0 15 15" fill="none" className="shrink-0 opacity-40">
                    <path d="M5.5 3.5L9.5 7.5L5.5 11.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>

              {user?.email === 'carlosaculsan123@gmail.com' && (
                <button
                  onClick={() => { setShowUserMenu(false); navigate('/admin') }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-[13px] text-gray-800 dark:text-white hover:bg-[#f5f5f5] dark:hover:bg-[#252525] transition-colors"
                >
                  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" className="shrink-0">
                    <rect x="1.5" y="1.5" width="5" height="5" rx="0.8" stroke="currentColor" strokeWidth="1.3" />
                    <rect x="8.5" y="1.5" width="5" height="5" rx="0.8" stroke="currentColor" strokeWidth="1.3" />
                    <rect x="1.5" y="8.5" width="5" height="5" rx="0.8" stroke="currentColor" strokeWidth="1.3" />
                    <rect x="8.5" y="8.5" width="5" height="5" rx="0.8" stroke="currentColor" strokeWidth="1.3" />
                  </svg>
                  Admin panel
                </button>
              )}
              <div className="mx-3 my-1 border-t border-[#f0f0f0] dark:border-[#2a2a2a]" />
              <button
                onClick={async () => { setShowUserMenu(false); await supabase.auth.signOut(); navigate('/login') }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-[13px] text-gray-800 dark:text-white hover:bg-[#f5f5f5] dark:hover:bg-[#252525] transition-colors"
              >
                <IconLogOut />
                Log out
              </button>
            </div>
          )}
          {/* Trigger */}
          {user && (
            <button
              onClick={() => { setShowUserMenu((v) => !v); setShowLearnMore(false) }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#f0f0f0] dark:hover:bg-[#1c1c1c] transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-indigo-500 flex items-center justify-center shrink-0 text-white text-[15px] font-semibold select-none">
                {(user.user_metadata?.full_name || user.email)[0].toUpperCase()}
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="text-[13px] text-gray-900 dark:text-white font-medium truncate">
                  {user.user_metadata?.full_name || user.email.split('@')[0]}
                </div>
                <div className="text-[11px] text-gray-500 dark:text-[#777] truncate">
                  {user.email}
                </div>
              </div>
              <svg width="14" height="14" viewBox="0 0 15 15" fill="none" className="shrink-0 text-gray-900 dark:text-white opacity-40">
                <circle cx="7.5" cy="3.5" r="1.2" fill="currentColor" />
                <circle cx="7.5" cy="7.5" r="1.2" fill="currentColor" />
                <circle cx="7.5" cy="11.5" r="1.2" fill="currentColor" />
              </svg>
            </button>
          )}
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <div className="lg:hidden shrink-0 flex items-center justify-between px-4 py-3 border-b border-[#f0f0f0] dark:border-[#1e1e1e] bg-white dark:bg-[#111]">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="text-gray-900 dark:text-white p-1.5 hover:bg-[#f0f0f0] dark:hover:bg-[#1c1c1c] rounded-md transition-colors"
            aria-label="Open menu"
          >
            <IconHamburger />
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 hover:opacity-75 transition-opacity"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0 text-gray-900 dark:text-white">
              <path d="M4 21L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M14 3L20 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M7 13H17" stroke="#ec4899" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span
              className="text-gray-900 dark:text-white"
              style={{ fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif", fontSize: '14px', fontWeight: 700, letterSpacing: '0.1em' }}
            >
              Alterline
            </span>
          </button>
          <button
            onClick={() => setShowEntryModal(true)}
            className="text-gray-900 dark:text-white p-1.5 hover:bg-[#f0f0f0] dark:hover:bg-[#1c1c1c] rounded-md transition-colors"
            aria-label="New Entry"
          >
            <IconPlus />
          </button>
        </div>

        {/* Desktop sidebar reopen button */}
        {!sidebarOpen && (
          <div className="hidden lg:block absolute top-3 left-3 z-10">
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
          <div className={wide ? 'h-full' : 'max-w-5xl mx-auto'}>
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

      {/* Learn more portal — renders at body level to escape sidebar overflow:hidden */}
      {showLearnMore && learnMorePos && createPortal(
        <div
          ref={learnMorePortalRef}
          style={{ position: 'fixed', top: learnMorePos.top, left: Math.min(learnMorePos.left + 8, window.innerWidth - 200), zIndex: 9999 }}
          className="w-48 bg-white dark:bg-[#1c1c1c] border border-[#e5e5e5] dark:border-[#2a2a2a] rounded-xl shadow-xl py-1"
        >
          {[
            { label: 'Tutorials', path: '/tutorials' },
            { label: 'Privacy policy', path: '/privacy' },
            { label: 'About Alterline', path: '/about' },
          ].map(({ label, path }) => (
            <button
              key={path}
              onClick={() => { setShowLearnMore(false); setShowUserMenu(false); window.open(path, '_blank') }}
              className="w-full flex items-center px-4 py-2 text-[13px] text-gray-900 dark:text-white hover:bg-[#f5f5f5] dark:hover:bg-[#252525] transition-colors text-left"
            >
              {label}
            </button>
          ))}
        </div>,
        document.body
      )}

      {/* Delete world confirmation modal */}
      {deleteWorldTarget && createPortal(
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60" onClick={(e) => { if (e.target === e.currentTarget) { setDeleteWorldTarget(null); setDeleteConfirmName('') } }}>
          <div className="bg-white dark:bg-[#1c1c1c] rounded-2xl border border-[#e5e5e5] dark:border-[#2a2a2a] shadow-2xl w-full max-w-[400px] p-6">
            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mb-4">
              <svg width="18" height="18" viewBox="0 0 15 15" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 4h11M5 4V2.5h5V4M6 7v4.5M9 7v4.5M3 4l.8 8.5a1 1 0 001 .9h6.4a1 1 0 001-.9L13 4" />
              </svg>
            </div>
            <h2 className="text-[17px] font-bold text-gray-900 dark:text-white mb-2">
              Delete &ldquo;{deleteWorldTarget.name}&rdquo;?
            </h2>
            <p className="text-[13px] text-gray-500 dark:text-[#888] mb-5 leading-relaxed">
              This will permanently delete <strong className="text-gray-700 dark:text-gray-300">all entries, folders, and Carlopedia articles</strong> inside this world. This cannot be undone.
            </p>
            <p className="text-[12px] text-gray-500 dark:text-[#777] mb-2">
              Type <span className="font-semibold text-gray-900 dark:text-white">{deleteWorldTarget.name}</span> to confirm
            </p>
            <input
              autoFocus
              type="text"
              value={deleteConfirmName}
              onChange={(e) => setDeleteConfirmName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && deleteConfirmName === deleteWorldTarget.name) handleDeleteWorld() }}
              placeholder={deleteWorldTarget.name}
              className="w-full bg-[#f5f5f5] dark:bg-[#222] border border-[#e5e5e5] dark:border-[#333] rounded-lg px-3 py-2 text-[13px] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-[#555] outline-none focus:border-red-400 transition-colors mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setDeleteWorldTarget(null); setDeleteConfirmName('') }}
                className="flex-1 py-2 rounded-lg text-[13px] font-medium border border-[#e5e5e5] dark:border-[#2a2a2a] text-gray-700 dark:text-gray-300 hover:bg-[#f5f5f5] dark:hover:bg-[#252525] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteWorld}
                disabled={deleteConfirmName !== deleteWorldTarget.name || deletingWorld}
                className="flex-1 py-2 rounded-lg text-[13px] font-medium bg-red-600 hover:bg-red-500 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {deletingWorld ? 'Deleting…' : 'Delete world'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
