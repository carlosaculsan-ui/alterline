import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminLayout from './AdminLayout'
import { supabaseAdmin } from '../../lib/supabaseAdmin'

function StatCard({ label, value, sub }) {
  return (
    <div className="border border-[#e5e5e5] dark:border-[#2a2a2a] rounded-xl p-5 bg-white dark:bg-[#141414]">
      <div className="text-[28px] font-bold text-gray-900 dark:text-white tabular-nums">
        {value === null ? (
          <span className="inline-block w-12 h-7 rounded bg-[#f0f0f0] dark:bg-[#222] animate-pulse" />
        ) : value}
      </div>
      <div className="mt-1 text-[13px] text-gray-900 dark:text-white font-medium">{label}</div>
      {sub && <div className="mt-0.5 text-[11px] text-gray-500 dark:text-[#777]">{sub}</div>}
    </div>
  )
}

function typeLabel(type) {
  if (type === 'carlopedia') return 'Carlopedia'
  if (type === 'story') return 'Story'
  return type ?? '—'
}

function fmt(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    users: null,
    total: null,
    stories: null,
    carlopedia: null,
    categories: null,
    links: null,
    newUsersWeek: null,
    newEntriesWeek: null,
  })
  const [recent, setRecent] = useState(null)
  const [userMap, setUserMap] = useState({})

  useEffect(() => {
    async function load() {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)

      const [
        { data: usersData },
        { count: total },
        { count: stories },
        { count: carlopedia },
        { count: categories },
        { count: links },
        { count: newEntriesWeek },
        { data: recentData },
      ] = await Promise.all([
        supabaseAdmin.auth.admin.listUsers({ perPage: 1000 }),
        supabaseAdmin.from('entries').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('entries').select('*', { count: 'exact', head: true }).eq('type', 'story'),
        supabaseAdmin.from('entries').select('*', { count: 'exact', head: true }).eq('type', 'carlopedia'),
        supabaseAdmin.from('categories').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('entry_links').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('entries').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo.toISOString()),
        supabaseAdmin
          .from('entries')
          .select('id, title, type, user_id, created_at, updated_at')
          .order('updated_at', { ascending: false })
          .limit(12),
      ])

      const users = usersData?.users ?? []
      const map = {}
      users.forEach((u) => { map[u.id] = u.email })
      setUserMap(map)

      const newUsersWeek = users.filter(
        (u) => new Date(u.created_at) >= new Date(weekAgo)
      ).length

      setStats({ users: users.length, total, stories, carlopedia, categories, links, newUsersWeek, newEntriesWeek })
      setRecent(recentData ?? [])
    }
    load()
  }, [])

  return (
    <AdminLayout>
      <div className="px-6 py-8">
        <div className="mb-8">
          <h1 className="text-[22px] font-bold text-gray-900 dark:text-white">Overview</h1>
          <p className="mt-1 text-[13px] text-gray-500 dark:text-[#777]">Platform-wide stats across all users</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          <StatCard label="Total Users" value={stats.users} />
          <StatCard label="New Users" value={stats.newUsersWeek} sub="this week" />
          <StatCard label="Total Entries" value={stats.total} />
          <StatCard label="New Entries" value={stats.newEntriesWeek} sub="this week" />
          <StatCard label="Stories" value={stats.stories} />
          <StatCard label="Carlopedia Articles" value={stats.carlopedia} />
          <StatCard label="Categories" value={stats.categories} />
          <StatCard label="Entry Links" value={stats.links} />
        </div>

        {/* Recent activity */}
        <div>
          <h2 className="text-[15px] font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h2>
          <div className="border border-[#e5e5e5] dark:border-[#2a2a2a] rounded-xl overflow-hidden">
            {recent === null ? (
              <div className="px-6 py-10 text-center text-[13px] text-gray-500 dark:text-[#777]">Loading…</div>
            ) : recent.length === 0 ? (
              <div className="px-6 py-10 text-center text-[13px] text-gray-500 dark:text-[#777]">No entries yet.</div>
            ) : (
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-[#e5e5e5] dark:border-[#2a2a2a] bg-[#f9f9f9] dark:bg-[#141414]">
                    <th className="text-left px-5 py-3 font-medium text-gray-900 dark:text-white">Title</th>
                    <th className="text-left px-5 py-3 font-medium text-gray-900 dark:text-white">Type</th>
                    <th className="text-left px-5 py-3 font-medium text-gray-900 dark:text-white">User</th>
                    <th className="text-left px-5 py-3 font-medium text-gray-900 dark:text-white">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((entry, i) => (
                    <tr
                      key={entry.id}
                      className={`${i < recent.length - 1 ? 'border-b border-[#f0f0f0] dark:border-[#1e1e1e]' : ''}`}
                    >
                      <td className="px-5 py-3 font-medium text-gray-900 dark:text-white truncate max-w-[200px]">
                        {entry.title || <span className="text-gray-400 dark:text-[#555] italic">Untitled</span>}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded-full ${
                          entry.type === 'carlopedia'
                            ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                            : 'bg-[#f0f0f0] dark:bg-[#222] text-gray-900 dark:text-white'
                        }`}>
                          {typeLabel(entry.type)}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-500 dark:text-[#777] truncate max-w-[180px]">
                        {userMap[entry.user_id] ?? entry.user_id?.slice(0, 8) + '…'}
                      </td>
                      <td className="px-5 py-3 text-gray-500 dark:text-[#777]">{fmt(entry.updated_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
