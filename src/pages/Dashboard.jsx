import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { useEntries } from '../hooks/useEntries'

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

export default function Dashboard() {
  const { entries, loading, hasMore, loadingMore, loadMore } = useEntries()

  return (
    <Layout>
      {loading ? (
        <LoadingSkeleton />
      ) : entries.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="p-6">
          <div className="grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-3">
            {entries.map((entry) => (
              <EntryCard key={entry.id} entry={entry} />
            ))}
          </div>
          {hasMore && (
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
        </div>
      )}
    </Layout>
  )
}
