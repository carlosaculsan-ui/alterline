import { useState, useEffect, useRef } from 'react'
import Layout from '../components/Layout'
import EntryCard from '../components/EntryCard'
import { useEntries } from '../hooks/useEntries'
import { useCategories } from '../hooks/useCategories'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useWorld } from '../contexts/WorldContext'

function getDisplayName(user) {
  if (!user) return ''
  return user.user_metadata?.full_name || user.email?.split('@')[0] || ''
}

function LoadingSkeleton() {
  return (
    <div className="p-4 sm:p-6 grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-3">
      {Array.from({ length: 8 }).map((_, i) => (
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

function SearchSkeleton() {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-3">
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

function TypewriterGreeting({ text, onDone }) {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)
  const onDoneRef = useRef(onDone)
  useEffect(() => { onDoneRef.current = onDone })

  useEffect(() => {
    let i = 0
    setDisplayed('')
    setDone(false)
    const id = setInterval(() => {
      i++
      setDisplayed(text.slice(0, i))
      if (i >= text.length) {
        clearInterval(id)
        setDone(true)
        onDoneRef.current?.()
      }
    }, 35)
    return () => clearInterval(id)
  }, [text])

  return (
    <>
      {displayed}
      {!done && (
        <span className="inline-block w-[2px] h-[0.85em] bg-current align-middle ml-0.5 opacity-70 animate-pulse" />
      )}
    </>
  )
}

function EmptyState({ worldName }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-12">
      <div className="text-[36px] text-gray-200 dark:text-[#2a2a2a] mb-3 select-none">✦</div>
      <div className="text-[15px] font-medium text-gray-900 dark:text-white mb-1">
        Nothing in {worldName} yet
      </div>
      <div className="text-[13px] text-gray-600 dark:text-gray-300">
        Hit "New Entry" to start building your universe
      </div>
    </div>
  )
}

export default function Dashboard() {
  const user = useAuth()
  const name = getDisplayName(user)
  const { activeWorldId, activeWorld } = useWorld()
  const SORT_OPTIONS = [
    { label: 'Newest',          column: 'created_at',  ascending: false },
    { label: 'Oldest',          column: 'created_at',  ascending: true  },
    { label: 'A–Z',             column: 'title',       ascending: true  },
    { label: 'Recently edited', column: 'updated_at',  ascending: false },
  ]
  const [sortIndex, setSortIndex] = useState(0)
  const sort = SORT_OPTIONS[sortIndex]
  const [showSortMenu, setShowSortMenu] = useState(false)
  const sortRef = useRef(null)

  useEffect(() => {
    if (!showSortMenu) return
    function handleClick(e) {
      if (!sortRef.current?.contains(e.target)) setShowSortMenu(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showSortMenu])

  const { entries, loading, hasMore, loadingMore, loadMore, duplicateEntry, deleteEntry, updateEntryFolder } = useEntries(sort)
  const { categories: folders } = useCategories()

  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const searchGen = useRef(0)
  const [greetingVisible, setGreetingVisible] = useState(
    () => !sessionStorage.getItem('alterline-greeted')
  )
  const [typingDone, setTypingDone] = useState(false)

  useEffect(() => {
    if (!typingDone) return
    const timer = setTimeout(() => {
      setGreetingVisible(false)
      sessionStorage.setItem('alterline-greeted', '1')
    }, 2500)
    return () => clearTimeout(timer)
  }, [typingDone])

  useEffect(() => {
    const q = query.trim().toLowerCase()
    const gen = ++searchGen.current

    if (!q) {
      setSearchResults([])
      setSearchLoading(false)
      return
    }

    const timer = setTimeout(async () => {
      setSearchLoading(true)

      const [{ data: pfRows }, { data: titleContent, error }, { data: wikiFields }] = await Promise.all([
        supabase.from('profile_fields').select('entry_id').ilike('field_value', `%${q}%`),
        supabase.from('entries').select('*, categories(name, color)')
          .eq('world_id', activeWorldId)
          .or(`title.ilike.%${q}%,content.ilike.%${q}%`)
          .neq('type', 'carlopedia')
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .limit(50),
        supabase.from('profile_fields').select('entry_id').eq('field_key', 'carlopedia'),
      ])

      const wikiIds = new Set((wikiFields ?? []).map((r) => r.entry_id))
      const pfIds = [...new Set((pfRows ?? []).map((r) => r.entry_id).filter((id) => !wikiIds.has(id)))]
      let data = (titleContent ?? []).filter((e) => !wikiIds.has(e.id))

      if (pfIds.length > 0) {
        const found = new Set(data.map((e) => e.id))
        const missing = pfIds.filter((id) => !found.has(id))
        if (missing.length > 0) {
          const { data: extra } = await supabase
            .from('entries').select('*, categories(name, color)').eq('world_id', activeWorldId).in('id', missing).neq('type', 'carlopedia').is('deleted_at', null)
          data = [...data, ...(extra ?? []).filter((e) => !wikiIds.has(e.id))]
        }
      }

      if (gen !== searchGen.current) return
      if (!error) setSearchResults(data)
      setSearchLoading(false)
    }, 150)

    return () => clearTimeout(timer)
  }, [query, activeWorldId])

  const trimmed = query.trim()
  const isSearching = !!trimmed
  const visible = isSearching ? searchResults : entries

  if (loading) return <Layout><LoadingSkeleton /></Layout>

  const entryNoun = (!hasMore && entries.length === 1) ? 'entry' : 'entries'
  const countStr = hasMore ? `${entries.length}+` : String(entries.length)
  const greetingText = name
    ? entries.length > 0
      ? `Welcome back, ${name}. Your universe has ${countStr} ${entryNoun}.`
      : `Welcome back, ${name}.`
    : ''

  if (entries.length === 0) return (
    <Layout>
      <div className="p-4 sm:p-6">
        {greetingText && (
          <div
            style={{
              overflow: 'hidden',
              maxHeight: greetingVisible ? '100px' : '0px',
              opacity: greetingVisible ? 1 : 0,
              marginBottom: greetingVisible ? '24px' : '0px',
              transition: 'opacity 600ms ease, max-height 600ms ease, margin-bottom 600ms ease',
            }}
          >
            <h2 className="text-[25px] font-bold text-gray-900 dark:text-white text-center">
              <TypewriterGreeting text={greetingText} onDone={() => setTypingDone(true)} />
            </h2>
          </div>
        )}
        <EmptyState worldName={activeWorld?.name ?? 'this world'} />
      </div>
    </Layout>
  )

  return (
    <Layout>
      <div className="p-4 sm:p-6">
        {/* Welcome message */}
        {!isSearching && greetingText && (
          <div
            style={{
              overflow: 'hidden',
              maxHeight: greetingVisible ? '100px' : '0px',
              opacity: greetingVisible ? 1 : 0,
              marginBottom: greetingVisible ? '24px' : '0px',
              transition: 'opacity 600ms ease, max-height 600ms ease, margin-bottom 600ms ease',
            }}
          >
            <h2 className="text-[25px] font-bold text-gray-900 dark:text-white text-center">
              <TypewriterGreeting text={greetingText} onDone={() => setTypingDone(true)} />
            </h2>
          </div>
        )}

        {/* Search input */}
        <div className="flex items-center gap-3 mb-6 pb-5 border-b border-[#f0f0f0] dark:border-[#1e1e1e]">
          <svg width="16" height="16" viewBox="0 0 15 15" fill="none" className="shrink-0 text-gray-500 dark:text-gray-400">
            <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.4" />
            <path d="M10 10L13 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your universe…"
            className="flex-1 text-[15px] bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-[18px] leading-none text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              ×
            </button>
          )}
          {!query && (
            <div className="relative shrink-0" ref={sortRef}>
              <button
                onClick={() => setShowSortMenu((v) => !v)}
                className="flex items-center gap-1 text-[12px] text-gray-900 dark:text-white opacity-40 hover:opacity-100 transition-opacity"
              >
                {SORT_OPTIONS[sortIndex].label}
                <svg width="10" height="10" viewBox="0 0 15 15" fill="none">
                  <path d="M3.5 5.5L7.5 9.5L11.5 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              {showSortMenu && (
                <div className="absolute right-0 top-full mt-1.5 z-30 bg-white dark:bg-[#1c1c1c] border border-[#e5e5e5] dark:border-[#2a2a2a] rounded-xl shadow-xl overflow-hidden min-w-[140px]">
                  {SORT_OPTIONS.map((o, i) => (
                    <button
                      key={o.label}
                      onClick={() => { setSortIndex(i); setShowSortMenu(false) }}
                      className={`w-full px-3 py-2 text-left text-[13px] flex items-center justify-between gap-3 transition-colors ${
                        i === sortIndex
                          ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20'
                          : 'text-gray-900 dark:text-white hover:bg-[#f5f5f5] dark:hover:bg-[#252525]'
                      }`}
                    >
                      {o.label}
                      {i === sortIndex && (
                        <svg width="11" height="11" viewBox="0 0 15 15" fill="none">
                          <path d="M2 7.5L6 11.5L13 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Result count — only when searching */}
        {isSearching && !searchLoading && (
          <div className="text-[12px] text-gray-600 dark:text-gray-300 mb-4">
            {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
          </div>
        )}

        {/* Grid */}
        {isSearching && searchLoading ? (
          <SearchSkeleton />
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
            <div className="text-[14px] text-gray-700 dark:text-gray-200">
              {isSearching
                ? <>No results for <span className="text-gray-900 dark:text-white font-medium">"{query}"</span></>
                : 'No stories yet'}
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-3">
              {visible.map((entry) => (
                <EntryCard
                  key={entry.id}
                  entry={entry}
                  searchQuery={isSearching ? trimmed : undefined}
                  onDelete={deleteEntry}
                  onDuplicate={duplicateEntry}
                  folders={folders}
                  onMoveToFolder={updateEntryFolder}
                />
              ))}
            </div>
            {!isSearching && hasMore && (
              <div className="mt-6 flex justify-center">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="px-4 py-2 rounded-md text-[14px] text-gray-700 dark:text-gray-200 border border-[#e5e5e5] dark:border-[#2a2a2a] hover:border-[#d0d0d0] dark:hover:border-[#333] transition-colors disabled:opacity-40"
                >
                  {loadingMore ? 'Loading…' : 'Load more'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  )
}
