import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import AdminLayout from './AdminLayout'
import { supabaseAdmin } from '../../lib/supabaseAdmin'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function useCountUp(target, duration = 650) {
  const [count, setCount] = useState(0)
  const isFirst = useRef(true)
  useEffect(() => {
    if (target === null) return
    if (!isFirst.current) { setCount(target); return }
    isFirst.current = false
    if (target === 0) { setCount(0); return }
    let raf
    const start = Date.now()
    const tick = () => {
      const progress = Math.min((Date.now() - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(eased * target))
      if (progress < 1) raf = requestAnimationFrame(tick)
      else setCount(target)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target])
  return count
}

function StatCard({ label, value, sub, to }) {
  const displayValue = useCountUp(value)

  const inner = (
    <>
      <div className="text-[28px] font-bold text-gray-900 dark:text-white tabular-nums">
        {value === null ? (
          <span className="inline-block w-12 h-7 rounded bg-[#f0f0f0] dark:bg-[#222] animate-pulse" />
        ) : displayValue}
      </div>
      <div className="mt-1 text-[13px] text-gray-900 dark:text-white font-medium">{label}</div>
      <div className="mt-0.5 text-[11px] text-gray-500 dark:text-[#777]">{sub ?? ' '}</div>
    </>
  )

  const cls = "border border-[#e5e5e5] dark:border-[#2a2a2a] rounded-xl p-5 bg-white dark:bg-[#141414] hover:border-indigo-200 dark:hover:border-indigo-700 hover:shadow-sm hover:-translate-y-px transition-all duration-150"

  if (to) {
    return <Link to={to} className={`block ${cls}`}>{inner}</Link>
  }

  return <div className={cls}>{inner}</div>
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

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    users: null, total: null, stories: null, carlopedia: null,
    categories: null, links: null, newUsersWeek: null, newEntriesWeek: null,
  })
  const [recent, setRecent] = useState(null)
  const [recentFilter, setRecentFilter] = useState('all')
  const [userMap, setUserMap] = useState({})
  const [monthlyData, setMonthlyData] = useState(null)
  const [activeBar, setActiveBar] = useState(null)
  const [chartYear, setChartYear] = useState(new Date().getFullYear())
  const [chartLoading, setChartLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [lastRefreshed, setLastRefreshed] = useState(null)

  async function loadStats() {
    setRefreshing(true)
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
    setLastRefreshed(new Date())
    setRefreshing(false)
  }

  useEffect(() => { loadStats() }, [])

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
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[22px] font-bold text-gray-900 dark:text-white">Overview</h1>
            <p className="mt-1 text-[13px] text-gray-500 dark:text-[#777]">Platform-wide stats across all users</p>
          </div>
          <div className="flex items-center gap-2 pt-1 shrink-0">
            {lastRefreshed && (
              <span className="text-[11px] text-gray-500 dark:text-[#777]">
                {lastRefreshed.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
              </span>
            )}
            <button
              onClick={loadStats}
              disabled={refreshing}
              title="Refresh stats"
              className="p-1.5 rounded-md text-gray-500 dark:text-[#777] hover:bg-[#f0f0f0] dark:hover:bg-[#222] hover:text-gray-900 dark:hover:text-white transition-colors disabled:opacity-40"
            >
              <svg
                width="14" height="14" viewBox="0 0 15 15" fill="none"
                className={refreshing ? 'animate-spin' : ''}
              >
                <path d="M13 7.5A5.5 5.5 0 0 1 2.5 11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                <path d="M2 7.5A5.5 5.5 0 0 1 12.5 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                <path d="M13.5 10.5L13 7.5l-3 .5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M1.5 4.5L2 7.5l3-.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          <StatCard label="Total Users" value={stats.users} to="/admin/users" />
          <StatCard label="New Users" value={stats.newUsersWeek} sub="this week" to="/admin/users" />
          <StatCard label="Total Entries" value={stats.total} to="/admin/entries" />
          <StatCard label="New Entries" value={stats.newEntriesWeek} sub="this week" to="/admin/entries" />
          <StatCard label="Stories" value={stats.stories} to="/admin/entries" />
          <StatCard label="Carlopedia Articles" value={stats.carlopedia} to="/admin/entries" />
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
          <div className="flex items-center justify-between mb-4 gap-4">
            <h2 className="text-[15px] font-semibold text-gray-900 dark:text-white shrink-0">Recent Activity</h2>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-[#f0f0f0] dark:bg-[#1a1a1a]">
                {[['all', 'All'], ['story', 'Stories'], ['carlopedia', 'Carlopedia']].map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => setRecentFilter(val)}
                    className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
                      recentFilter === val
                        ? 'bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-500 dark:text-[#666] hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <Link
                to="/admin/entries"
                className="text-[12px] font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors shrink-0"
              >
                View all →
              </Link>
            </div>
          </div>
          {(() => {
            const filteredRecent = recentFilter === 'all' ? recent : (recent ?? []).filter((e) => e.type === recentFilter)
            return (
              <div className="border border-[#e5e5e5] dark:border-[#2a2a2a] rounded-xl overflow-hidden">
                {recent === null ? (
                  <div className="px-6 py-10 text-center text-[13px] text-gray-500 dark:text-[#777]">Loading…</div>
                ) : filteredRecent.length === 0 ? (
                  <div className="px-6 py-10 text-center text-[13px] text-gray-500 dark:text-[#777]">
                    {recentFilter !== 'all' ? 'No recent activity for this type.' : 'No entries yet.'}
                  </div>
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
                      {filteredRecent.map((entry, i) => (
                        <tr key={entry.id} className={i < filteredRecent.length - 1 ? 'border-b border-[#f0f0f0] dark:border-[#1e1e1e]' : ''}>
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
            )
          })()}
        </div>
      </div>
    </AdminLayout>
  )
}
