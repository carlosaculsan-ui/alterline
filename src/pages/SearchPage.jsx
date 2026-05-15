import { useState, useEffect, useRef } from 'react'
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

function ResultsSkeleton() {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="p-4 rounded-xl border border-[#e8e8e8] dark:border-[#1e1e1e] animate-pulse">
          <div className="w-7 h-7 rounded-lg bg-[#f0f0f0] dark:bg-[#1e1e1e] mb-3" />
          <div className="h-3 bg-[#f0f0f0] dark:bg-[#1e1e1e] rounded mb-2 w-4/5" />
          <div className="h-3 bg-[#f0f0f0] dark:bg-[#1e1e1e] rounded mb-3 w-3/5" />
          <div className="h-2.5 bg-[#f0f0f0] dark:bg-[#1e1e1e] rounded w-2/5" />
        </div>
      ))}
    </div>
  )
}

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    const q = query.trim()

    if (!q) {
      setResults([])
      setHasSearched(false)
      setLoading(false)
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      // Search title + all profile field columns + story content
      const { data, error } = await supabase
        .from('entries')
        .select('*, categories(name, color)')
        .or(
          [
            `title.ilike.%${q}%`,
            `nationality.ilike.%${q}%`,
            `role.ilike.%${q}%`,
            `organization.ilike.%${q}%`,
            `notes.ilike.%${q}%`,
            `content.ilike.%${q}%`,
          ].join(',')
        )
        .order('created_at', { ascending: false })
        .limit(50)

      if (!error && data) setResults(data)
      setHasSearched(true)
      setLoading(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  const trimmed = query.trim()

  return (
    <Layout>
      <div className="px-6 py-7">
        {/* Large search input */}
        <div className="flex items-center gap-3 mb-6 pb-5 border-b border-[#f0f0f0] dark:border-[#1e1e1e]">
          <svg
            width="20"
            height="20"
            viewBox="0 0 15 15"
            fill="none"
            className="shrink-0 text-gray-300 dark:text-[#333]"
          >
            <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.4" />
            <path d="M10 10L13 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your universe…"
            className="flex-1 text-[20px] bg-transparent text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-[#2e2e2e] outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-[18px] leading-none text-gray-300 dark:text-[#444] hover:text-gray-500 dark:hover:text-gray-400 transition-colors"
            >
              ×
            </button>
          )}
        </div>

        {/* States */}
        {!trimmed ? (
          <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
            <div className="text-[13px] text-gray-300 dark:text-[#333]">
              Start typing to search your universe
            </div>
          </div>
        ) : loading ? (
          <ResultsSkeleton />
        ) : !hasSearched ? null : results.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
            <div className="text-[13px] text-gray-400 dark:text-[#444]">
              No results for{' '}
              <span className="text-gray-700 dark:text-gray-300">"{query}"</span>
            </div>
          </div>
        ) : (
          <>
            <div className="text-[11px] text-gray-300 dark:text-[#3a3a3a] mb-4">
              {results.length} result{results.length !== 1 ? 's' : ''}
            </div>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-3">
              {results.map((entry) => (
                <EntryCard key={entry.id} entry={entry} />
              ))}
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}
