import { useState, useEffect } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

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

function IconUsers() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" className="shrink-0">
      <circle cx="5.5" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M1 13c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M11 7c1.2 0 2.5.8 2.5 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="11" cy="4.5" r="1.8" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  )
}

function IconEntries() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" className="shrink-0">
      <rect x="2" y="1.5" width="11" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M5 5h5M5 7.5h5M5 10h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

function IconArrowLeft() {
  return (
    <svg width="14" height="14" viewBox="0 0 15 15" fill="none" className="shrink-0">
      <path d="M9 3L5 7.5L9 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
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

function IconLogOut() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" className="shrink-0">
      <path d="M6 2H2.5A1.5 1.5 0 001 3.5v8A1.5 1.5 0 002.5 13H6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M10 10l3-2.5L10 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13 7.5H6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

const NAV = [
  { to: '/admin', label: 'Overview', icon: <IconGrid />, end: true },
  { to: '/admin/users', label: 'Users', icon: <IconUsers />, end: false },
  { to: '/admin/entries', label: 'Entries', icon: <IconEntries />, end: false },
]

export default function AdminLayout({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuth()
  const [dark, setDark] = useState(() => localStorage.getItem('alterline-theme') !== 'light')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    if (dark) document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
    localStorage.setItem('alterline-theme', dark ? 'dark' : 'light')
  }, [dark])

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') setMobileMenuOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="relative flex h-screen overflow-hidden bg-white dark:bg-[#111] text-gray-900 dark:text-gray-100">
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:relative inset-y-0 left-0 z-50 lg:z-auto shrink-0 flex flex-col w-[280px] bg-[#f9f9f9] dark:bg-[#141414] border-r border-[#e5e5e5] dark:border-[#2a2a2a] overflow-hidden transition-transform lg:transition-[width] duration-200 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} ${sidebarOpen ? '' : 'lg:w-0'}`}>
        {/* Logo */}
        <div className="px-5 py-[18px] border-b border-[#e5e5e5] dark:border-[#2a2a2a] flex items-center justify-between min-w-[280px]">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="shrink-0 text-gray-900 dark:text-white">
              <path d="M4 21L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M14 3L20 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M7 13H17" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <div className="flex items-center gap-2">
              <span
                className="text-gray-900 dark:text-white"
                style={{ fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif", fontSize: '15px', fontWeight: 700, letterSpacing: '0.1em' }}
              >
                Alterline
              </span>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                Admin
              </span>
            </div>
          </button>
          <button
            onClick={() => { setSidebarOpen(false); setMobileMenuOpen(false) }}
            className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-[#ebebeb] dark:hover:bg-[#222] p-1.5 rounded-md transition-colors"
          >
            <IconSidebarToggle />
          </button>
        </div>

        {/* Nav */}
        <nav className="px-2 pt-4 pb-2 space-y-1">
          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-md text-[14px] text-gray-800 dark:text-white hover:bg-[#f0f0f0] dark:hover:bg-[#1c1c1c] transition-colors"
          >
            <IconArrowLeft />
            Back to app
          </button>

          <div className="mx-3 my-1 border-t border-[#e5e5e5] dark:border-[#2a2a2a]" />

          {NAV.map(({ to, label, icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2.5 rounded-md text-[14px] transition-colors ${
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
                    : 'text-gray-800 dark:text-white hover:bg-[#f0f0f0] dark:hover:bg-[#1c1c1c]'
                }`
              }
            >
              {icon}
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="flex-1" />

        {/* User strip */}
        <div className="p-3 border-t border-[#e5e5e5] dark:border-[#2a2a2a]">
          {user && (
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg">
              {user.user_metadata?.avatar_url ? (
                <img src={user.user_metadata.avatar_url} alt="" className="w-8 h-8 rounded-full shrink-0 object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center shrink-0 text-white text-[13px] font-semibold select-none">
                  {user.email[0].toUpperCase()}
                </div>
              )}
              <span className="flex-1 text-left text-[13px] text-gray-900 dark:text-white truncate font-medium">
                {user.email}
              </span>
            </div>
          )}
          <button
            onClick={async () => { await supabase.auth.signOut(); navigate('/login') }}
            className="mt-1 w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] text-gray-800 dark:text-white hover:bg-[#f0f0f0] dark:hover:bg-[#1c1c1c] transition-colors"
          >
            <IconLogOut />
            Log out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <div className="lg:hidden shrink-0 flex items-center justify-between px-4 py-3 border-b border-[#f0f0f0] dark:border-[#1e1e1e] bg-white dark:bg-[#111]">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="text-gray-900 dark:text-white p-1.5 hover:bg-[#f0f0f0] dark:hover:bg-[#1c1c1c] rounded-md transition-colors"
          >
            <IconHamburger />
          </button>
          <div className="flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0 text-gray-900 dark:text-white">
              <path d="M4 21L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M14 3L20 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M7 13H17" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '14px', fontWeight: 700, letterSpacing: '0.1em' }} className="text-gray-900 dark:text-white">
              Admin
            </span>
          </div>
          <div className="w-8" />
        </div>

        {/* Sidebar reopen */}
        {!sidebarOpen && (
          <div className="hidden lg:block absolute top-3 left-3 z-10">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-[#ebebeb] dark:hover:bg-[#222] p-1.5 rounded-md transition-colors"
            >
              <IconSidebarToggle />
            </button>
          </div>
        )}

        <main className="flex-1 overflow-auto bg-white dark:bg-[#111]">
          <div className="max-w-5xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
