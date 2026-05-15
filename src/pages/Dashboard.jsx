import { useState } from 'react'
import Layout from '../components/Layout'
import EntryCard from '../components/EntryCard'
import { useEntries } from '../hooks/useEntries'

function LoadingSkeleton() {
  return (
    <div className="p-6 grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="p-4 rounded-xl border border-[#e8e8e8] dark:border-[#1e1e1e] animate-pulse"
        >
          <div className="w-7 h-7 rounded-lg bg-[#f0f0f0] dark:bg-[#1e1e1e] mb-3" />
          <div className="h-3 bg-[#f0f0f0] dark:bg-[#1e1e1e] rounded mb-2 w-4/5" />
          <div className="h-3 bg-[#f0f0f0] dark:bg-[#1e1e1e] rounded mb-3 w-3/5" />
          <div className="h-2.5 bg-[#f0f0f0] dark:bg-[#1e1e1e] rounded w-2/5" />
        </div>
      ))}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] h-full text-center p-12">
      <div className="text-[36px] text-gray-200 dark:text-[#2a2a2a] mb-3 select-none">✦</div>
      <div className="text-[14px] font-medium text-gray-400 dark:text-[#444] mb-1">
        No entries yet
      </div>
      <div className="text-[12px] text-gray-300 dark:text-[#333]">
        Hit "New Entry" to start building your universe
      </div>
    </div>
  )
}

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'profile', label: 'Profiles' },
  { key: 'story', label: 'Stories' },
]

export default function Dashboard() {
  const { entries, loading, hasMore, loadingMore, loadMore } = useEntries()
  const [filter, setFilter] = useState('all')

  const visible = filter === 'all' ? entries : entries.filter((e) => e.type === filter)

  return (
    <Layout>
      {loading ? (
        <LoadingSkeleton />
      ) : entries.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="p-6">
          <div className="flex items-center gap-1 mb-5">
            {FILTERS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-3 py-1 rounded-full text-[12px] transition-colors ${
                  filter === key
                    ? 'bg-[#ebebeb] dark:bg-[#222] text-gray-900 dark:text-white'
                    : 'text-gray-400 dark:text-[#555] hover:bg-[#f0f0f0] dark:hover:bg-[#1c1c1c] hover:text-gray-700 dark:hover:text-gray-400'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {visible.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
              <div className="text-[13px] text-gray-300 dark:text-[#333]">
                No {filter === 'profile' ? 'profiles' : 'stories'} yet
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-3">
                {visible.map((entry) => (
                  <EntryCard key={entry.id} entry={entry} />
                ))}
              </div>
              {hasMore && filter === 'all' && (
                <div className="mt-6 flex justify-center">
                  <button
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="px-4 py-2 rounded-md text-[13px] text-gray-400 dark:text-[#555] border border-[#e5e5e5] dark:border-[#2a2a2a] hover:border-[#d0d0d0] dark:hover:border-[#333] hover:text-gray-600 dark:hover:text-gray-400 transition-colors disabled:opacity-40"
                  >
                    {loadingMore ? 'Loading…' : 'Load more'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </Layout>
  )
}
