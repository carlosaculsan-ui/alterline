import { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import AdminLayout from './AdminLayout'
import { supabaseAdmin } from '../../lib/supabaseAdmin'

const PAGE_SIZE = 25

function fmt(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function typeLabel(type) {
  if (type === 'carlopedia') return 'Carlopedia'
  if (type === 'story') return 'Story'
  return type ?? '—'
}

export default function AdminEntries() {
  const [entries, setEntries] = useState(null)
  const [total, setTotal] = useState(null)
  const [userMap, setUserMap] = useState({})
  const [carlopediaIds, setCarlopediaIds] = useState(new Set())
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const offsetRef = useRef(0)

  useEffect(() => {
    loadInitial()
  }, [])

  async function loadInitial() {
    const [
      { data: usersData },
      { data: carlopediaFields },
      { data: carlopediaTyped },
      { data: entriesData },
      { count: totalCount },
    ] = await Promise.all([
      supabaseAdmin.auth.admin.listUsers({ perPage: 1000 }),
      supabaseAdmin.from('profile_fields').select('entry_id').eq('field_key', 'carlopedia'),
      supabaseAdmin.from('entries').select('id').eq('type', 'carlopedia'),
      supabaseAdmin.from('entries')
        .select('id, title, type, user_id, created_at, updated_at')
        .order('updated_at', { ascending: false })
        .range(0, PAGE_SIZE - 1),
      supabaseAdmin.from('entries').select('*', { count: 'exact', head: true }),
    ])

    const map = {}
    ;(usersData?.users ?? []).forEach((u) => { map[u.id] = u.email })
    setUserMap(map)

    const ids = new Set([
      ...(carlopediaTyped ?? []).map((e) => e.id),
      ...(carlopediaFields ?? []).map((r) => r.entry_id),
    ])
    setCarlopediaIds(ids)
    setTotal(totalCount ?? 0)

    const enriched = (entriesData ?? []).map((e) => ({ ...e, type: ids.has(e.id) ? 'carlopedia' : e.type }))
    setEntries(enriched)
    setHasMore((entriesData ?? []).length === PAGE_SIZE)
    offsetRef.current = PAGE_SIZE
  }

  async function loadMore() {
    setLoadingMore(true)
    const { data } = await supabaseAdmin
      .from('entries')
      .select('id, title, type, user_id, created_at, updated_at')
      .order('updated_at', { ascending: false })
      .range(offsetRef.current, offsetRef.current + PAGE_SIZE - 1)
    const enriched = (data ?? []).map((e) => ({ ...e, type: carlopediaIds.has(e.id) ? 'carlopedia' : e.type }))
    setEntries((prev) => [...(prev ?? []), ...enriched])
    setHasMore((data ?? []).length === PAGE_SIZE)
    offsetRef.current += PAGE_SIZE
    setLoadingMore(false)
  }

  async function handleDelete(entryId) {
    setDeleting(entryId)
    await supabaseAdmin.from('entry_links').delete().eq('from_entry_id', entryId)
    await supabaseAdmin.from('entry_links').delete().eq('to_entry_id', entryId)
    await supabaseAdmin.from('profile_fields').delete().eq('entry_id', entryId)
    await supabaseAdmin.from('entries').delete().eq('id', entryId)
    setEntries((prev) => (prev ?? []).filter((e) => e.id !== entryId))
    setTotal((prev) => (prev ?? 1) - 1)
    setConfirmDelete(null)
    setDeleting(null)
  }

  const filtered = (entries ?? []).filter((e) => {
    if (typeFilter !== 'all' && e.type !== typeFilter) return false
    if (search) {
      const q = search.toLowerCase()
      if (!(e.title ?? '').toLowerCase().includes(q)) return false
    }
    return true
  })

  const deleteTarget = confirmDelete && entries ? entries.find((e) => e.id === confirmDelete) ?? null : null

  return (
    <>
    <AdminLayout>
      <div className="px-6 py-8">
        <div className="mb-6">
          <h1 className="text-[22px] font-bold text-gray-900 dark:text-white">Entries</h1>
          <p className="mt-1 text-[13px] text-gray-500 dark:text-[#777]">
            {entries === null
              ? 'Loading…'
              : total !== null
                ? `${entries.length} of ${total} entries loaded`
                : `${entries.length} loaded`}
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-5">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#555] pointer-events-none" width="13" height="13" viewBox="0 0 15 15" fill="none">
              <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.4" />
              <path d="M10.5 10.5L13.5 13.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              placeholder="Search by title…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-[13px] rounded-lg border border-[#e5e5e5] dark:border-[#2a2a2a] bg-white dark:bg-[#141414] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-[#555] focus:outline-none focus:ring-1 focus:ring-indigo-400 dark:focus:ring-indigo-600"
            />
          </div>
          <div className="flex items-center gap-1 p-1 rounded-lg bg-[#f0f0f0] dark:bg-[#1a1a1a] shrink-0">
            {[['all', 'All'], ['story', 'Stories'], ['carlopedia', 'Carlopedia']].map(([val, label]) => (
              <button
                key={val}
                onClick={() => setTypeFilter(val)}
                className={`px-3 py-1.5 text-[12px] font-medium rounded-md transition-colors ${
                  typeFilter === val
                    ? 'bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-[#666] hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="border border-[#e5e5e5] dark:border-[#2a2a2a] rounded-xl overflow-hidden">
          {entries === null ? (
            <div className="px-6 py-10 text-center text-[13px] text-gray-500 dark:text-[#777]">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <p className="text-[13px] text-gray-500 dark:text-[#777]">
                {search || typeFilter !== 'all' ? 'No entries match your filters.' : 'No entries yet.'}
              </p>
              {hasMore && (search || typeFilter !== 'all') && (
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="mt-3 text-[12px] text-indigo-600 dark:text-indigo-400 hover:underline disabled:opacity-50"
                >
                  {loadingMore ? 'Loading…' : 'Load more to search further'}
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-[#e5e5e5] dark:border-[#2a2a2a] bg-[#f9f9f9] dark:bg-[#141414]">
                      <th className="text-left px-4 py-3 font-medium text-gray-900 dark:text-white">Title</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-900 dark:text-white">Type</th>
                      <th className="hidden sm:table-cell text-left px-4 py-3 font-medium text-gray-900 dark:text-white">User</th>
                      <th className="hidden sm:table-cell text-left px-4 py-3 font-medium text-gray-900 dark:text-white">Updated</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((entry, i) => (
                      <tr key={entry.id} className={i < filtered.length - 1 ? 'border-b border-[#f0f0f0] dark:border-[#1e1e1e]' : ''}>
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white max-w-[140px] sm:max-w-[280px] truncate">
                          {entry.title || <span className="italic text-gray-400 dark:text-[#555]">Untitled</span>}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded-full ${
                            entry.type === 'carlopedia'
                              ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                              : 'bg-[#f0f0f0] dark:bg-[#222] text-gray-900 dark:text-white'
                          }`}>
                            {typeLabel(entry.type)}
                          </span>
                        </td>
                        <td className="hidden sm:table-cell px-4 py-3 text-gray-500 dark:text-[#777] max-w-[180px] truncate">
                          {userMap[entry.user_id] ?? entry.user_id?.slice(0, 8) + '…'}
                        </td>
                        <td className="hidden sm:table-cell px-4 py-3 text-gray-500 dark:text-[#777] whitespace-nowrap">{fmt(entry.updated_at)}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => setConfirmDelete(entry.id)}
                            className="text-[12px] font-medium px-2.5 py-1 rounded-md bg-[#f0f0f0] dark:bg-[#222] text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {hasMore && (
                <div className="px-4 py-3 border-t border-[#f0f0f0] dark:border-[#1e1e1e]">
                  <button
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="text-[13px] font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 disabled:opacity-50 transition-colors"
                  >
                    {loadingMore ? 'Loading…' : `Load more entries`}
                  </button>
                </div>
              )}
            </>
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
          <h2 className="text-[17px] font-bold text-gray-900 dark:text-white mb-1">Delete entry?</h2>
          <p className="text-[13px] text-gray-500 dark:text-[#888] mb-2 leading-relaxed">You are about to permanently delete</p>
          <p className="text-[13px] font-semibold text-gray-900 dark:text-white mb-5 truncate">
            {deleteTarget.title || <span className="italic text-gray-400 dark:text-[#555]">Untitled</span>}
          </p>
          <p className="text-[13px] text-gray-500 dark:text-[#888] mb-6 leading-relaxed">
            This will remove its <strong className="text-gray-700 dark:text-gray-300">links and profile fields</strong> as well. This cannot be undone.
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
              {deleting ? 'Deleting…' : 'Delete entry'}
            </button>
          </div>
        </div>
      </div>,
      document.body
    )}
    </>
  )
}
