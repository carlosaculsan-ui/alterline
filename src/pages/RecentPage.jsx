import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import EntryCard from '../components/EntryCard'
import { supabase } from '../lib/supabase'

function LoadingSkeleton() {
  return (
    <div className="px-6 py-8 animate-pulse">
      <div>
        <div className="h-3 bg-[#f0f0f0] dark:bg-[#1e1e1e] rounded w-16 mb-4" />
        <div className="grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
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
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-12">
      <div className="text-[36px] text-gray-200 dark:text-[#2a2a2a] mb-3 select-none">✦</div>
      <div className="text-[14px] font-medium text-gray-900 dark:text-white mb-1">
        Nothing here yet
      </div>
      <div className="text-[12px] text-gray-600 dark:text-gray-300">
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
    const d = new Date(entry.updated_at ?? entry.created_at)
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
    Promise.all([
      supabase.from('entries').select('*, categories(name, color)')
        .neq('type', 'carlopedia')
        .order('updated_at', { ascending: false })
        .limit(50),
      supabase.from('profile_fields').select('entry_id').eq('field_key', 'carlopedia'),
    ]).then(([{ data, error }, { data: wikiFields }]) => {
      if (!error && data) {
        const wikiIds = new Set((wikiFields ?? []).map((r) => r.entry_id))
        setGroups(groupByDate(data.filter((e) => !wikiIds.has(e.id))))
      }
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
        <div className="px-4 py-6 sm:px-6 sm:py-8">
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
