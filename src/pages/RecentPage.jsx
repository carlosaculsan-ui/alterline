import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { supabase } from '../lib/supabase'

function IconPerson() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" className="shrink-0">
      <circle cx="10" cy="7" r="3.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M3 18c0-3.866 3.134-7 7-7s7 3.134 7 7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  )
}

function IconNote() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" className="shrink-0">
      <rect x="3.5" y="2.5" width="13" height="15" rx="1.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M7 7h6M7 10h6M7 13h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  )
}

function EntryCard({ entry }) {
  const navigate = useNavigate()
  const date = new Date(entry.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div
      onClick={() => navigate(`/entry/${entry.id}`)}
      className="p-4 rounded-xl border border-[#e8e8e8] dark:border-[#1e1e1e] bg-white dark:bg-[#161616] hover:border-[#d0d0d0] dark:hover:border-[#2a2a2a] hover:shadow-sm dark:hover:shadow-none transition-all cursor-pointer"
    >
      <div className="w-7 h-7 rounded-lg bg-[#f5f5f5] dark:bg-[#1e1e1e] flex items-center justify-center text-gray-400 dark:text-[#4a4a4a] mb-3">
        {entry.type === 'profile' ? <IconPerson /> : <IconNote />}
      </div>
      <div className="text-[13px] font-medium text-gray-900 dark:text-gray-100 leading-snug mb-2.5 line-clamp-2">
        {entry.title}
      </div>
      <div className="flex items-center gap-1.5 mb-1">
        {entry.categories ? (
          <>
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ backgroundColor: entry.categories.color }}
            />
            <span className="text-[11px] text-gray-400 dark:text-[#555] truncate">
              {entry.categories.name}
            </span>
          </>
        ) : (
          <span className="text-[11px] text-gray-300 dark:text-[#3a3a3a]">—</span>
        )}
      </div>
      <div className="text-[11px] text-gray-300 dark:text-[#3a3a3a]">{date}</div>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="px-6 py-8 animate-pulse">
      {[3, 2].map((count, i) => (
        <div key={i} className="mb-8">
          <div className="h-3 bg-[#f0f0f0] dark:bg-[#1e1e1e] rounded w-16 mb-4" />
          <div className="grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-3">
            {Array.from({ length: count }).map((_, j) => (
              <div
                key={j}
                className="p-4 rounded-xl border border-[#e8e8e8] dark:border-[#1e1e1e]"
              >
                <div className="w-7 h-7 rounded-lg bg-[#f0f0f0] dark:bg-[#1e1e1e] mb-3" />
                <div className="h-3 bg-[#f0f0f0] dark:bg-[#1e1e1e] rounded mb-2 w-4/5" />
                <div className="h-3 bg-[#f0f0f0] dark:bg-[#1e1e1e] rounded mb-3 w-3/5" />
                <div className="h-2.5 bg-[#f0f0f0] dark:bg-[#1e1e1e] rounded w-2/5" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-12">
      <div className="text-[36px] text-gray-200 dark:text-[#2a2a2a] mb-3 select-none">✦</div>
      <div className="text-[14px] font-medium text-gray-400 dark:text-[#444] mb-1">
        Nothing here yet
      </div>
      <div className="text-[12px] text-gray-300 dark:text-[#333]">
        Your recent entries will appear here
      </div>
    </div>
  )
}

function groupByDate(entries) {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const yesterdayStart = todayStart - 86_400_000

  const groups = new Map()

  for (const entry of entries) {
    const d = new Date(entry.created_at)
    const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()

    let label
    if (dayStart === todayStart) {
      label = 'Today'
    } else if (dayStart === yesterdayStart) {
      label = 'Yesterday'
    } else {
      label = new Date(dayStart).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    }

    if (!groups.has(label)) groups.set(label, [])
    groups.get(label).push(entry)
  }

  return [...groups.entries()]
}

export default function RecentPage() {
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('entries')
      .select('*, categories(name, color)')
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data, error }) => {
        if (!error && data) setGroups(groupByDate(data))
        setLoading(false)
      })
  }, [])

  return (
    <Layout>
      {loading ? (
        <LoadingSkeleton />
      ) : groups.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="px-6 py-8">
          {groups.map(([label, entries]) => (
            <div key={label} className="mb-8 last:mb-0">
              <div className="text-[11px] uppercase tracking-widest text-gray-400 dark:text-[#444] font-medium mb-3 select-none">
                {label}
              </div>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-3">
                {entries.map((entry) => (
                  <EntryCard key={entry.id} entry={entry} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  )
}
