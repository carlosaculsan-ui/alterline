import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { supabase } from '../lib/supabase'
import { useWorld } from '../contexts/WorldContext'

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-0">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-3 py-3 border-b border-[#f0f0f0] dark:border-[#1e1e1e]">
          <div className="h-4 bg-[#f0f0f0] dark:bg-[#1e1e1e] rounded w-1/3" />
        </div>
      ))}
    </div>
  )
}

export default function CarlopediaPage() {
  const navigate = useNavigate()
  const { activeWorldId } = useWorld()
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [creating, setCreating] = useState(false)
  const newInputRef = useRef(null)

  useEffect(() => {
    if (!activeWorldId) return
    setLoading(true)
    async function load() {
      const [{ data: typed }, { data: wikiFields }] = await Promise.all([
        supabase.from('entries').select('id, title, updated_at').eq('type', 'carlopedia').eq('world_id', activeWorldId),
        supabase.from('profile_fields').select('entry_id').eq('field_key', 'carlopedia'),
      ])

      const fallbackIds = (wikiFields ?? []).map((r) => r.entry_id)
      let all = typed ?? []

      if (fallbackIds.length > 0) {
        const existing = new Set(all.map((e) => e.id))
        const missing = fallbackIds.filter((id) => !existing.has(id))
        if (missing.length > 0) {
          const { data: extras } = await supabase
            .from('entries').select('id, title, updated_at').eq('world_id', activeWorldId).in('id', missing)
          all = [...all, ...(extras ?? [])]
        }
      }

      all.sort((a, b) => a.title.localeCompare(b.title))
      setArticles(all)
      setLoading(false)
    }
    load()
  }, [activeWorldId])

  useEffect(() => {
    if (showNew) newInputRef.current?.focus()
  }, [showNew])

  async function handleCreate() {
    const title = newTitle.trim()
    if (!title || creating) return
    setCreating(true)
    const { data, error } = await supabase
      .from('entries')
      .insert({ title, type: 'carlopedia', category_id: null, world_id: activeWorldId })
      .select('id')
      .single()
    if (!error && data) {
      navigate(`/carlopedia/${data.id}`)
    } else {
      setCreating(false)
    }
  }

  const grouped = articles.reduce((acc, article) => {
    const letter = article.title[0]?.toUpperCase() ?? '#'
    if (!acc[letter]) acc[letter] = []
    acc[letter].push(article)
    return acc
  }, {})
  const letters = Object.keys(grouped).sort()

  return (
    <Layout>
      <div className="max-w-[720px] mx-auto px-4 py-6 sm:px-8 sm:py-10">

        {/* Header */}
        <div className="flex items-end justify-between mb-1">
          <h1 className="text-[28px] font-bold text-gray-900 dark:text-white leading-tight">Carlopedia</h1>
          <button
            onClick={() => { setShowNew(true); setNewTitle('') }}
            className="text-[13px] text-indigo-600 dark:text-indigo-400 hover:opacity-75 font-medium transition-opacity"
          >
            + New article
          </button>
        </div>
        <p className="text-[14px] text-gray-500 dark:text-gray-400 mb-6">Your personal encyclopedia.</p>

        {/* New article inline input */}
        {showNew && (
          <div className="mb-6 flex items-center gap-2 bg-[#f5f5f5] dark:bg-[#1c1c1c] border border-[#e5e5e5] dark:border-[#2a2a2a] rounded-lg px-4 py-2.5">
            <input
              ref={newInputRef}
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreate()
                if (e.key === 'Escape') { setShowNew(false); setNewTitle('') }
              }}
              placeholder="Article title…"
              className="flex-1 bg-transparent text-[14px] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-[#555] outline-none"
            />
            <button
              onClick={handleCreate}
              disabled={!newTitle.trim() || creating}
              className="text-[13px] font-medium text-indigo-600 dark:text-indigo-400 disabled:opacity-40 transition-opacity"
            >
              {creating ? 'Creating…' : 'Create'}
            </button>
            <button
              onClick={() => { setShowNew(false); setNewTitle('') }}
              className="text-[16px] leading-none text-gray-400 dark:text-[#555] hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              ×
            </button>
          </div>
        )}

        <div className="border-t border-[#e5e5e5] dark:border-[#2a2a2a]" />

        {loading ? (
          <div className="pt-6"><LoadingSkeleton /></div>
        ) : articles.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-[15px] text-gray-400 dark:text-[#555] mb-1">No articles yet</div>
            <div className="text-[13px] text-gray-300 dark:text-[#3a3a3a]">
              Select a word in any story and hit "Create Carlopedia", or use "+ New article" above
            </div>
          </div>
        ) : (
          <div className="pt-2">
            {letters.map((letter) => (
              <div key={letter} className="mt-5">
                <div className="text-[11px] font-semibold text-gray-400 dark:text-[#444] uppercase tracking-widest mb-1 select-none">
                  {letter}
                </div>
                {grouped[letter].map((article) => (
                  <button
                    key={article.id}
                    onClick={() => navigate(`/carlopedia/${article.id}`)}
                    className="w-full flex items-center justify-between py-2.5 border-b border-[#f0f0f0] dark:border-[#1e1e1e] group text-left hover:bg-[#f5f5f5] dark:hover:bg-[#161616] -mx-2 px-2 rounded transition-colors"
                  >
                    <span className="text-[15px] text-indigo-700 dark:text-indigo-400 group-hover:text-indigo-800 dark:group-hover:text-indigo-300 font-medium transition-colors">
                      {article.title}
                    </span>
                    <svg width="14" height="14" viewBox="0 0 15 15" fill="none" className="shrink-0 text-gray-300 dark:text-[#333] group-hover:text-gray-400 dark:group-hover:text-[#555] transition-colors">
                      <path d="M5.5 3.5L9.5 7.5L5.5 11.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
