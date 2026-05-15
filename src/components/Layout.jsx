import { useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useCategories } from '../hooks/useCategories'
import NewCategoryModal from './NewCategoryModal'

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
      <path d="M13 9.5A6 6 0 016 2.5a5.5 5.5 0 100 10A6 6 0 0013 9.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  )
}

const NAV = [
  { to: '/', label: 'Dashboard', icon: <IconGrid /> },
  { to: '/recent', label: 'Recent', icon: <IconClock /> },
  { to: '/search', label: 'Search', icon: <IconSearch /> },
]

export default function Layout({ children, onNewEntry }) {
  const navigate = useNavigate()
  const [dark, setDark] = useState(() => {
    return localStorage.getItem('alterline-theme') !== 'light'
  })
  const [showModal, setShowModal] = useState(false)
  const { categories, createCategory, deleteCategory } = useCategories()

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('alterline-theme', dark ? 'dark' : 'light')
  }, [dark])

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
            {categories.map((cat) => (
              <div key={cat.id} className="group relative">
                <NavLink
                  to={`/category/${cat.id}`}
                  className={({ isActive }) =>
                    `flex w-full items-center gap-2.5 px-3 py-[7px] pr-8 rounded-md text-[13px] transition-colors ${
                      isActive
                        ? 'bg-[#ebebeb] dark:bg-[#222] text-gray-900 dark:text-white'
                        : 'text-gray-500 dark:text-[#777] hover:bg-[#f0f0f0] dark:hover:bg-[#1c1c1c] hover:text-gray-800 dark:hover:text-gray-300'
                    }`
                  }
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="flex-1 text-left truncate">{cat.name}</span>
                  {cat.count != null && (
                    <span className="text-[11px] text-gray-300 dark:text-[#444]">{cat.count}</span>
                  )}
                </NavLink>
                <button
                  onClick={() => deleteCategory(cat.id)}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center rounded text-[15px] leading-none text-gray-400 dark:text-[#555] hover:text-gray-700 dark:hover:text-gray-300 hover:bg-[#e5e5e5] dark:hover:bg-[#333] transition-all"
                  aria-label={`Delete ${cat.name}`}
                >
                  ×
                </button>
              </div>
            ))}
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
            onClick={onNewEntry}
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
    </div>
  )
}
