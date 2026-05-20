import { useState, useEffect, useRef } from 'react'
import Layout from '../components/Layout'
import EntryCard from '../components/EntryCard'
import { supabase } from '../lib/supabase'

function ResultsSkeleton() {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3">
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
  const searchGen = useRef(0)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    const q = query.trim()
    const gen = ++searchGen.current

    if (!q) {
      setResults([])
      setHasSearched(false)
      setLoading(false)
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)

      const [{ data: pfRows }, { data: titleContent, error }] = await Promise.all([
        supabase.from('profile_fields').select('entry_id').ilike('field_value', `%${q}%`),
        supabase.from('entries').select('*, categories(name, color)')
          .or(`title.ilike.%${q}%,content.ilike.%${q}%`)
          .order('created_at', { ascending: false })
          .limit(50),
      ])

      const pfIds = [...new Set((pfRows ?? []).map((r) => r.entry_id))]
      let data = titleContent ?? []

      if (pfIds.length > 0) {
        const found = new Set(data.map((e) => e.id))
        const missing = pfIds.filter((id) => !found.has(id))
        if (missing.length > 0) {
          const { data: extra } = await supabase
            .from('entries').select('*, categories(name, color)').in('id', missing)
          data = [...data, ...(extra ?? [])]
        }
      }

      if (gen !== searchGen.current) return
      if (!error) setResults(data)
      setHasSearched(true)
      setLoading(false)
    }, 150)

    return () => clearTimeout(timer)
  }, [query])

  const trimmed = query.trim()

  return (
    <Layout>
      <div className="px-4 sm:px-6 py-5 sm:py-7">
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
            <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3">
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
