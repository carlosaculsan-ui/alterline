import { useEffect, useState } from 'react'
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

  return (
    <AdminLayout>
      <div className="px-6 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-[22px] font-bold text-gray-900 dark:text-white">Users</h1>
            <p className="mt-1 text-[13px] text-gray-500 dark:text-[#777]">
              {users === null ? 'Loading…' : `${users.length} account${users.length !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>

        <div className="border border-[#e5e5e5] dark:border-[#2a2a2a] rounded-xl overflow-hidden">
          {/* Desktop header */}
          <div className="hidden sm:grid grid-cols-[1fr_100px_80px_80px_120px] gap-4 px-5 py-3 border-b border-[#e5e5e5] dark:border-[#2a2a2a] bg-[#f9f9f9] dark:bg-[#141414] text-[12px] font-medium text-gray-900 dark:text-white">
            <span>User</span>
            <span>Joined</span>
            <span className="text-center">Entries</span>
            <span className="text-center">Categories</span>
            <span />
          </div>

          {users === null ? (
            <div className="px-6 py-10 text-center text-[13px] text-gray-500 dark:text-[#777]">Loading…</div>
          ) : users.length === 0 ? (
            <div className="px-6 py-10 text-center text-[13px] text-gray-500 dark:text-[#777]">No users found.</div>
          ) : (
            <div>
              {users.map((user, i) => (
                <div key={user.id}>
                  {/* Desktop row */}
                  <div className={`hidden sm:grid grid-cols-[1fr_100px_80px_80px_120px] gap-4 items-center px-5 py-3.5 ${i < users.length - 1 || expandedUser === user.id ? 'border-b border-[#f0f0f0] dark:border-[#1e1e1e]' : ''}`}>
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar user={user} />
                      <div className="min-w-0">
                        <div className="text-[13px] font-medium text-gray-900 dark:text-white truncate">{getDisplayName(user)}</div>
                        <div className="text-[11px] text-gray-500 dark:text-[#777] truncate">{user.email}</div>
                        {user.email === 'carlosaculsan123@gmail.com' && (
                          <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Owner</span>
                        )}
                      </div>
                    </div>
                    <div className="text-[12px] text-gray-500 dark:text-[#777]">{fmt(user.created_at)}</div>
                    <div className="text-center text-[13px] font-semibold text-gray-900 dark:text-white tabular-nums">{entryCounts[user.id] ?? '—'}</div>
                    <div className="text-center text-[13px] font-semibold text-gray-900 dark:text-white tabular-nums">{categoryCounts[user.id] ?? '—'}</div>
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => toggleEntries(user.id)}
                        className={`text-[12px] font-medium px-2.5 py-1 rounded-md transition-colors ${
                          expandedUser === user.id
                            ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                            : 'bg-[#f0f0f0] dark:bg-[#222] text-gray-900 dark:text-white hover:bg-[#e5e5e5] dark:hover:bg-[#2a2a2a]'
                        }`}
                      >
                        {expandedUser === user.id ? 'Hide' : 'View'}
                      </button>
                      {confirmDelete === user.id ? (
                        <button onClick={() => handleDelete(user.id)} disabled={deleting === user.id} className="text-[12px] font-medium px-2.5 py-1 rounded-md bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50">
                          {deleting === user.id ? 'Deleting…' : 'Confirm'}
                        </button>
                      ) : (
                        <button onClick={() => setConfirmDelete(user.id)} disabled={user.email === 'carlosaculsan123@gmail.com'} className="text-[12px] font-medium px-2.5 py-1 rounded-md bg-[#f0f0f0] dark:bg-[#222] text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed" title={user.email === 'carlosaculsan123@gmail.com' ? "Can't delete your own account" : 'Delete user'}>
                          Delete
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Mobile card */}
                  <div className={`sm:hidden px-4 py-3.5 ${i < users.length - 1 || expandedUser === user.id ? 'border-b border-[#f0f0f0] dark:border-[#1e1e1e]' : ''}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar user={user} />
                        <div className="min-w-0">
                          <div className="text-[13px] font-medium text-gray-900 dark:text-white truncate">{getDisplayName(user)}</div>
                          <div className="text-[11px] text-gray-500 dark:text-[#777] truncate">{user.email}</div>
                          {user.email === 'carlosaculsan123@gmail.com' && (
                            <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Owner</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => toggleEntries(user.id)}
                          className={`text-[12px] font-medium px-2.5 py-1 rounded-md transition-colors ${
                            expandedUser === user.id
                              ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                              : 'bg-[#f0f0f0] dark:bg-[#222] text-gray-900 dark:text-white'
                          }`}
                        >
                          {expandedUser === user.id ? 'Hide' : 'View'}
                        </button>
                        {confirmDelete === user.id ? (
                          <button onClick={() => handleDelete(user.id)} disabled={deleting === user.id} className="text-[12px] font-medium px-2.5 py-1 rounded-md bg-red-500 text-white disabled:opacity-50">
                            {deleting === user.id ? '…' : 'Confirm'}
                          </button>
                        ) : (
                          <button onClick={() => setConfirmDelete(user.id)} disabled={user.email === 'carlosaculsan123@gmail.com'} className="text-[12px] font-medium px-2.5 py-1 rounded-md bg-[#f0f0f0] dark:bg-[#222] text-red-500 disabled:opacity-30 disabled:cursor-not-allowed">
                            Del
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 ml-11 flex items-center gap-3 text-[11px] text-gray-500 dark:text-[#777]">
                      <span>{fmt(user.created_at)}</span>
                      <span>·</span>
                      <span><strong className="text-gray-900 dark:text-white">{entryCounts[user.id] ?? 0}</strong> entries</span>
                      <span>·</span>
                      <span><strong className="text-gray-900 dark:text-white">{categoryCounts[user.id] ?? 0}</strong> cats</span>
                    </div>
                  </div>

                  {/* Expanded entries */}
                  {expandedUser === user.id && (
                    <div className="border-b border-[#f0f0f0] dark:border-[#1e1e1e] bg-[#fafafa] dark:bg-[#0e0e0e]">
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
  )
}
