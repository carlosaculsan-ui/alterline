import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import AdminLayout from './AdminLayout'
import { supabaseAdmin } from '../../lib/supabaseAdmin'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function StatCard({ label, value, sub }) {
  return (
    <div className="border border-[#e5e5e5] dark:border-[#2a2a2a] rounded-xl p-5 bg-white dark:bg-[#141414]">
      <div className="text-[28px] font-bold text-gray-900 dark:text-white tabular-nums">
        {value === null ? (
          <span className="inline-block w-12 h-7 rounded bg-[#f0f0f0] dark:bg-[#222] animate-pulse" />
        ) : value}
      </div>
      <div className="mt-1 text-[13px] text-gray-900 dark:text-white font-medium">{label}</div>
      <div className="mt-0.5 text-[11px] text-gray-500 dark:text-[#777]">{sub ?? ' '}</div>
    </div>
  )
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white dark:bg-[#1c1c1c] border border-[#e5e5e5] dark:border-[#2a2a2a] rounded-lg px-3 py-2 shadow-lg">
      <div className="text-[12px] text-gray-500 dark:text-[#777] mb-0.5">{label}</div>
      <div className="text-[14px] font-semibold text-gray-900 dark:text-white">{payload[0].value} entries</div>
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

function buildMonthlyData(entries) {
  const year = new Date().getFullYear()
  const counts = Array(12).fill(0)
  entries.forEach((e) => {
    const d = new Date(e.created_at)
    if (d.getFullYear() === year) counts[d.getMonth()]++
  })
  return MONTHS.map((month, i) => ({ month, count: counts[i] }))
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    users: null, total: null, stories: null, carlopedia: null,
    categories: null, links: null, newUsersWeek: null, newEntriesWeek: null,
  })
  const [recent, setRecent] = useState(null)
  const [userMap, setUserMap] = useState({})
  const [monthlyData, setMonthlyData] = useState(null)
  const [activeBar, setActiveBar] = useState(null)
  const [chartYear, setChartYear] = useState(new Date().getFullYear())
  const [chartLoading, setChartLoading] = useState(false)

  useEffect(() => {
    async function load() {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)

      const [
        { data: usersData },
        { count: total },
        ,
        { data: carlopediaTyped },
        { data: carlopediaFields },
        { count: categories },
        { count: links },
        { count: newEntriesWeek },
        { data: recentData },
      ] = await Promise.all([
        supabaseAdmin.auth.admin.listUsers({ perPage: 1000 }),
        supabaseAdmin.from('entries').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('entries').select('*', { count: 'exact', head: true }).eq('type', 'story'),
        supabaseAdmin.from('entries').select('id').eq('type', 'carlopedia'),
        supabaseAdmin.from('profile_fields').select('entry_id').eq('field_key', 'carlopedia'),
        supabaseAdmin.from('categories').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('entry_links').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('entries').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo.toISOString()),
        supabaseAdmin.from('entries').select('id, title, type, user_id, created_at, updated_at').order('updated_at', { ascending: false }).limit(12),
      ])

      const users = usersData?.users ?? []
      const map = {}
      users.forEach((u) => { map[u.id] = u.email })
      setUserMap(map)

      const newUsersWeek = users.filter((u) => new Date(u.created_at) >= new Date(weekAgo)).length
      const carlopediaIds = new Set([
        ...(carlopediaTyped ?? []).map((e) => e.id),
        ...(carlopediaFields ?? []).map((r) => r.entry_id),
      ])
      const carlopedia = carlopediaIds.size
      const stories = (total ?? 0) - carlopedia

      setStats({ users: users.length, total, stories, carlopedia, categories, links, newUsersWeek, newEntriesWeek })
      setRecent((recentData ?? []).map((e) => ({
        ...e,
        type: carlopediaIds.has(e.id) ? 'carlopedia' : e.type,
      })))
    }
    load()
  }, [])

  useEffect(() => {
    setActiveBar(null)
    setChartLoading(true)
    const yearStart = new Date(chartYear, 0, 1).toISOString()
    const yearEnd = new Date(chartYear + 1, 0, 1).toISOString()
    supabaseAdmin.from('entries').select('created_at')
      .gte('created_at', yearStart).lt('created_at', yearEnd)
      .then(({ data }) => {
        const counts = Array(12).fill(0)
        ;(data ?? []).forEach((e) => { counts[new Date(e.created_at).getMonth()]++ })
        setMonthlyData(MONTHS.map((month, i) => ({ month, count: counts[i] })))
        setChartLoading(false)
      })
  }, [chartYear])

  return (
    <AdminLayout>
      <div className="px-6 py-8">
        <div className="mb-8">
          <h1 className="text-[22px] font-bold text-gray-900 dark:text-white">Overview</h1>
          <p className="mt-1 text-[13px] text-gray-500 dark:text-[#777]">Platform-wide stats across all users</p>
        </div>

        {/* Stat cards */}
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

        {/* Monthly activity chart */}
        <div className="border border-[#e5e5e5] dark:border-[#2a2a2a] rounded-xl p-6 bg-white dark:bg-[#141414] mb-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-[15px] font-semibold text-gray-900 dark:text-white">Monthly Entry Activity</h2>
              <p className="text-[12px] text-gray-500 dark:text-[#777] mt-0.5">Entries created per month</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setChartYear((y) => y - 1)}
                className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-[#f0f0f0] dark:hover:bg-[#222] text-gray-900 dark:text-white transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 15 15" fill="none">
                  <path d="M9.5 3L5.5 7.5L9.5 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <span className="text-[13px] font-semibold text-gray-900 dark:text-white w-10 text-center tabular-nums">{chartYear}</span>
              <button
                onClick={() => setChartYear((y) => y + 1)}
                className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-[#f0f0f0] dark:hover:bg-[#222] text-gray-900 dark:text-white transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 15 15" fill="none">
                  <path d="M5.5 3L9.5 7.5L5.5 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>

          {monthlyData === null || chartLoading ? (
            <div className="h-48 flex items-center justify-center text-[13px] text-gray-500 dark:text-[#777]">Loading…</div>
          ) : monthlyData.every((d) => d.count === 0) ? (
            <div className="h-48 flex items-center justify-center text-[13px] text-gray-500 dark:text-[#777]">No entries for {chartYear}</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyData} barSize={28} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: 'currentColor' }}
                  tickLine={false}
                  axisLine={false}
                  className="text-gray-500 dark:text-[#777]"
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: 'currentColor' }}
                  tickLine={false}
                  axisLine={false}
                  className="text-gray-500 dark:text-[#777]"
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                <Bar
                  dataKey="count"
                  radius={[4, 4, 0, 0]}
                  onMouseEnter={(_, index) => setActiveBar(index)}
                  onMouseLeave={() => setActiveBar(null)}
                >
                  {monthlyData.map((_, index) => (
                    <Cell
                      key={index}
                      fill={activeBar === index ? '#4f46e5' : '#6366f1'}
                      opacity={activeBar !== null && activeBar !== index ? 0.4 : 1}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
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
                    <th className="text-left px-4 py-3 font-medium text-gray-900 dark:text-white">Title</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-900 dark:text-white">Type</th>
                    <th className="hidden sm:table-cell text-left px-4 py-3 font-medium text-gray-900 dark:text-white">User</th>
                    <th className="hidden sm:table-cell text-left px-4 py-3 font-medium text-gray-900 dark:text-white">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((entry, i) => (
                    <tr key={entry.id} className={`${i < recent.length - 1 ? 'border-b border-[#f0f0f0] dark:border-[#1e1e1e]' : ''}`}>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white max-w-[120px] sm:max-w-[200px] truncate">
                        {entry.title || <span className="text-gray-400 dark:text-[#555] italic">Untitled</span>}
                      </td>
                      <td className="px-4 py-3">
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
                      <td className="hidden sm:table-cell px-4 py-3 text-gray-500 dark:text-[#777]">{fmt(entry.updated_at)}</td>
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
