import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import AdminLayout from './AdminLayout'
import { supabaseAdmin } from '../../lib/supabaseAdmin'

function fmt(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function getDisplayName(user) {
  return user?.user_metadata?.full_name || user?.email?.split('@')[0] || user?.email || '?'
}

function Avatar({ user }) {
  const name = getDisplayName(user)
  const avatarUrl = user?.user_metadata?.avatar_url
  const [imgError, setImgError] = useState(false)
  if (avatarUrl && !imgError) {
    return <img src={avatarUrl} alt={name} onError={() => setImgError(true)} className="w-8 h-8 rounded-full shrink-0 object-cover" />
  }
  return (
    <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center shrink-0 text-white text-[13px] font-semibold select-none">
      {name[0]?.toUpperCase() ?? '?'}
    </div>
  )
}

export default function AdminUsers() {
  const navigate = useNavigate()
  const [users, setUsers] = useState(null)
  const [entryCounts, setEntryCounts] = useState({})
  const [categoryCounts, setCategoryCounts] = useState({})
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [expandedUser, setExpandedUser] = useState(null)
  const [userEntries, setUserEntries] = useState({})
  const [loadingEntries, setLoadingEntries] = useState(false)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('active')
  const [sortDir, setSortDir] = useState('desc')

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const { data } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
    const list = data?.users ?? []
    setUsers(list)

    if (list.length === 0) return

    const ids = list.map((u) => u.id)

    const [{ data: entries }, { data: categories }] = await Promise.all([
      supabaseAdmin.from('entries').select('user_id').in('user_id', ids),
      supabaseAdmin.from('categories').select('user_id').in('user_id', ids),
    ])

    const ec = {}
    const cc = {}
    ids.forEach((id) => { ec[id] = 0; cc[id] = 0 })
    ;(entries ?? []).forEach((e) => { ec[e.user_id] = (ec[e.user_id] ?? 0) + 1 })
    ;(categories ?? []).forEach((c) => { cc[c.user_id] = (cc[c.user_id] ?? 0) + 1 })

    setEntryCounts(ec)
    setCategoryCounts(cc)
  }

  async function handleDelete(userId) {
    setDeleting(userId)

    // Get all entry IDs for this user first
    const { data: userEntryRows } = await supabaseAdmin
      .from('entries')
      .select('id')
      .eq('user_id', userId)
    const entryIds = (userEntryRows ?? []).map((e) => e.id)

    if (entryIds.length > 0) {
      await supabaseAdmin.from('entry_links').delete().in('from_entry_id', entryIds)
      await supabaseAdmin.from('entry_links').delete().in('to_entry_id', entryIds)
      await supabaseAdmin.from('profile_fields').delete().in('entry_id', entryIds)
      await supabaseAdmin.from('entries').delete().in('id', entryIds)
    }
    await supabaseAdmin.from('categories').delete().eq('user_id', userId)
    await supabaseAdmin.auth.admin.deleteUser(userId)

    setConfirmDelete(null)
    setDeleting(null)
    setUsers((prev) => prev.filter((u) => u.id !== userId))
  }

  async function toggleEntries(userId) {
    if (expandedUser === userId) {
      setExpandedUser(null)
      return
    }
    setExpandedUser(userId)
    if (userEntries[userId]) return
    setLoadingEntries(true)
    const { data } = await supabaseAdmin
      .from('entries')
      .select('id, title, type, created_at, updated_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
    setUserEntries((prev) => ({ ...prev, [userId]: data ?? [] }))
    setLoadingEntries(false)
  }

  function typeLabel(type) {
    if (type === 'carlopedia') return 'Carlopedia'
    if (type === 'story') return 'Story'
    return type ?? '—'
  }

  function toggleSort(col) {
    if (sortBy === col) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortBy(col); setSortDir('desc') }
  }

  const displayUsers = users === null ? null : [...users]
    .filter((u) => {
      if (!search.trim()) return true
      const q = search.toLowerCase()
      return getDisplayName(u).toLowerCase().includes(q) || (u.email ?? '').toLowerCase().includes(q)
    })
    .sort((a, b) => {
      if (sortBy === 'entries') {
        const av = entryCounts[a.id] ?? 0
        const bv = entryCounts[b.id] ?? 0
        return sortDir === 'asc' ? av - bv : bv - av
      }
      if (sortBy === 'name') {
        return sortDir === 'asc'
          ? getDisplayName(a).localeCompare(getDisplayName(b))
          : getDisplayName(b).localeCompare(getDisplayName(a))
      }
      if (sortBy === 'active') {
        const av = new Date(a.last_sign_in_at ?? 0).getTime()
        const bv = new Date(b.last_sign_in_at ?? 0).getTime()
        return sortDir === 'asc' ? av - bv : bv - av
      }
      const av = new Date(a.created_at).getTime()
      const bv = new Date(b.created_at).getTime()
      return sortDir === 'asc' ? av - bv : bv - av
    })

  const deleteTarget = confirmDelete && users ? users.find((u) => u.id === confirmDelete) ?? null : null

  return (
    <>
    <AdminLayout>
      <div className="px-6 py-8">
        <div className="mb-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h1 className="text-[22px] font-bold text-gray-900 dark:text-white">Users</h1>
              <p className="mt-1 text-[13px] text-gray-500 dark:text-[#777]">
                {users === null
                  ? 'Loading…'
                  : displayUsers !== null && displayUsers.length !== users.length
                    ? `${displayUsers.length} of ${users.length} accounts`
                    : `${users.length} account${users.length !== 1 ? 's' : ''}`}
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#555] pointer-events-none" width="13" height="13" viewBox="0 0 15 15" fill="none">
                <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.4" />
                <path d="M10.5 10.5L13.5 13.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
              <input
                type="text"
                placeholder="Search by name or email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-[13px] rounded-lg border border-[#e5e5e5] dark:border-[#2a2a2a] bg-white dark:bg-[#141414] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-[#555] focus:outline-none focus:ring-1 focus:ring-indigo-400 dark:focus:ring-indigo-600"
              />
            </div>
            <div className="flex items-center gap-1 p-1 rounded-lg bg-[#f0f0f0] dark:bg-[#1a1a1a] shrink-0 text-[12px]">
              {[['active', 'Active'], ['joined', 'Joined'], ['entries', 'Entries'], ['name', 'Name']].map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => toggleSort(val)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md font-medium transition-colors ${
                    sortBy === val
                      ? 'bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-500 dark:text-[#666] hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {label}
                  {sortBy === val && (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      {sortDir === 'asc'
                        ? <path d="M5 2L8 7H2L5 2Z" fill="currentColor" />
                        : <path d="M5 8L2 3H8L5 8Z" fill="currentColor" />}
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="border border-[#e5e5e5] dark:border-[#2a2a2a] rounded-xl overflow-hidden">
          {/* Desktop header */}
          <div className="hidden sm:grid grid-cols-[1fr_110px_80px_80px_120px] gap-4 px-5 py-3 border-b border-[#e5e5e5] dark:border-[#2a2a2a] bg-[#f9f9f9] dark:bg-[#141414] text-[12px] font-medium text-gray-900 dark:text-white">
            <span>User</span>
            <span>Last Active</span>
            <span className="text-center">Entries</span>
            <span className="text-center">Categories</span>
            <span />
          </div>

          {displayUsers === null ? (
            <div className="px-6 py-10 text-center text-[13px] text-gray-500 dark:text-[#777]">Loading…</div>
          ) : displayUsers.length === 0 ? (
            <div className="px-6 py-10 text-center text-[13px] text-gray-500 dark:text-[#777]">
              {search ? 'No users match your search.' : 'No users found.'}
            </div>
          ) : (
            <div>
              {displayUsers.map((user, i) => (
                <div key={user.id}>
                  {/* Desktop row */}
                  <div className={`hidden sm:grid grid-cols-[1fr_110px_80px_80px_120px] gap-4 items-center px-5 py-3.5 ${i < displayUsers.length - 1 || expandedUser === user.id ? 'border-b border-[#f0f0f0] dark:border-[#1e1e1e]' : ''}`}>
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar user={user} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <div className="text-[13px] font-medium text-gray-900 dark:text-white truncate">{getDisplayName(user)}</div>
                          {user.email === 'carlosaculsan123@gmail.com' && (
                            <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider shrink-0">Owner</span>
                          )}
                        </div>
                        <div className="text-[11px] text-gray-500 dark:text-[#777] truncate">{user.email}</div>
                      </div>
                    </div>
                    <div className="text-[12px] text-gray-500 dark:text-[#777]">{fmt(user.last_sign_in_at) || '—'}</div>
                    <div className="text-center text-[13px] font-semibold text-gray-900 dark:text-white tabular-nums">{entryCounts[user.id] ?? '—'}</div>
                    <div className="text-center text-[13px] font-semibold text-gray-900 dark:text-white tabular-nums">{categoryCounts[user.id] ?? '—'}</div>
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => toggleEntries(user.id)}
                        className={`text-[12px] font-medium px-2.5 py-1 rounded-md transition-colors border ${
                          expandedUser === user.id
                            ? 'border-indigo-400 dark:border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-transparent'
                            : 'border-transparent bg-[#f0f0f0] dark:bg-[#222] text-gray-900 dark:text-white hover:bg-[#e5e5e5] dark:hover:bg-[#2a2a2a]'
                        }`}
                      >
                        {expandedUser === user.id ? 'Hide' : 'View'}
                      </button>
                      <span title="Can't delete your own account" className={user.email === 'carlosaculsan123@gmail.com' ? 'cursor-not-allowed' : ''}>
                        <button onClick={() => setConfirmDelete(user.id)} disabled={user.email === 'carlosaculsan123@gmail.com'} className="text-[12px] font-medium px-2.5 py-1 rounded-md bg-[#f0f0f0] dark:bg-[#222] text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-30 disabled:pointer-events-none">
                          Delete
                        </button>
                      </span>
                    </div>
                  </div>

                  {/* Mobile card */}
                  <div className={`sm:hidden px-4 py-3.5 ${i < displayUsers.length - 1 || expandedUser === user.id ? 'border-b border-[#f0f0f0] dark:border-[#1e1e1e]' : ''}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar user={user} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <div className="text-[13px] font-medium text-gray-900 dark:text-white truncate">{getDisplayName(user)}</div>
                            {user.email === 'carlosaculsan123@gmail.com' && (
                              <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider shrink-0">Owner</span>
                            )}
                          </div>
                          <div className="text-[11px] text-gray-500 dark:text-[#777] truncate">{user.email}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => toggleEntries(user.id)}
                          className={`text-[12px] font-medium px-2.5 py-1 rounded-md transition-colors border ${
                            expandedUser === user.id
                              ? 'border-indigo-400 dark:border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-transparent'
                              : 'border-transparent bg-[#f0f0f0] dark:bg-[#222] text-gray-900 dark:text-white'
                          }`}
                        >
                          {expandedUser === user.id ? 'Hide' : 'View'}
                        </button>
                        <button onClick={() => setConfirmDelete(user.id)} disabled={user.email === 'carlosaculsan123@gmail.com'} className="text-[12px] font-medium px-2.5 py-1 rounded-md bg-[#f0f0f0] dark:bg-[#222] text-red-500 disabled:opacity-30 disabled:cursor-not-allowed">
                          Del
                        </button>
                      </div>
                    </div>
                    <div className="mt-2 ml-11 flex items-center gap-3 text-[11px] text-gray-500 dark:text-[#777]">
                      <span>Active {fmt(user.last_sign_in_at) || '—'}</span>
                      <span>·</span>
                      <span><strong className="text-gray-900 dark:text-white">{entryCounts[user.id] ?? 0}</strong> entries</span>
                      <span>·</span>
                      <span><strong className="text-gray-900 dark:text-white">{categoryCounts[user.id] ?? 0}</strong> cats</span>
                    </div>
                  </div>

                  {/* Expanded entries */}
                  {expandedUser === user.id && (
                    <div className="border-b border-b-[#e5e5e5] dark:border-b-[#2a2a2a] border-l-[3px] border-l-indigo-200 dark:border-l-indigo-800 bg-[#fafafa] dark:bg-[#0e0e0e]">
                      {loadingEntries && !userEntries[user.id] ? (
                        <div className="px-8 py-4 text-[12px] text-gray-500 dark:text-[#777]">Loading entries…</div>
                      ) : (userEntries[user.id] ?? []).length === 0 ? (
                        <div className="px-8 py-4 text-[12px] text-gray-500 dark:text-[#777]">No entries.</div>
                      ) : (
                        <div className="px-8 py-3">
                          <div className="text-[11px] font-medium uppercase tracking-wider text-gray-500 dark:text-[#777] mb-2">
                            {(userEntries[user.id] ?? []).length} entries
                          </div>
                          <div className="space-y-1">
                            {(userEntries[user.id] ?? []).map((entry) => (
                              <div key={entry.id} className="flex items-center gap-3 py-1.5">
                                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0 ${
                                  entry.type === 'carlopedia'
                                    ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                                    : 'bg-[#ebebeb] dark:bg-[#222] text-gray-900 dark:text-white'
                                }`}>
                                  {typeLabel(entry.type)}
                                </span>
                                <span className="flex-1 text-[13px] text-gray-900 dark:text-white truncate">
                                  {entry.title || <span className="italic text-gray-400 dark:text-[#555]">Untitled</span>}
                                </span>
                                <span className="text-[11px] text-gray-500 dark:text-[#777] shrink-0">{fmt(entry.updated_at)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>

    {deleteTarget && createPortal(
      <div
        className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md"
        onClick={(e) => { if (e.target === e.currentTarget) setConfirmDelete(null) }}
      >
        <div className="bg-white/95 dark:bg-[#1c1c1c]/95 rounded-2xl border border-black/[0.08] dark:border-white/10 shadow-2xl w-full max-w-[400px] p-6">
          <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mb-4">
            <svg width="18" height="18" viewBox="0 0 15 15" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 4h11M5 4V2.5h5V4M6 7v4.5M9 7v4.5M3 4l.8 8.5a1 1 0 001 .9h6.4a1 1 0 001-.9L13 4" />
            </svg>
          </div>
          <h2 className="text-[17px] font-bold text-gray-900 dark:text-white mb-1">Delete account?</h2>
          <p className="text-[13px] text-gray-500 dark:text-[#888] mb-1 leading-relaxed">You are about to permanently delete</p>
          <p className="text-[13px] font-semibold text-gray-900 dark:text-white mb-1">{getDisplayName(deleteTarget)}</p>
          <p className="text-[12px] text-gray-400 dark:text-[#666] mb-5">{deleteTarget.email}</p>
          <p className="text-[13px] text-gray-500 dark:text-[#888] mb-6 leading-relaxed">
            This will permanently delete their <strong className="text-gray-700 dark:text-gray-300">entries, folders, and all data</strong>. This cannot be undone.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setConfirmDelete(null)}
              disabled={!!deleting}
              className="flex-1 py-2 rounded-lg text-[13px] font-medium border border-[#e5e5e5] dark:border-[#2a2a2a] text-gray-700 dark:text-gray-300 hover:bg-[#f5f5f5] dark:hover:bg-[#252525] transition-colors disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              onClick={() => handleDelete(confirmDelete)}
              disabled={!!deleting}
              className="flex-1 py-2 rounded-lg text-[13px] font-medium bg-red-600 hover:bg-red-500 text-white transition-colors disabled:opacity-50"
            >
              {deleting ? 'Deleting…' : 'Delete account'}
            </button>
          </div>
        </div>
      </div>,
      document.body
    )}
    </>
  )
}
