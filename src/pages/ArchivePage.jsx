import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Layout from '../components/Layout'
import { supabase } from '../lib/supabase'
import { useWorld } from '../contexts/WorldContext'

function daysLeft(deletedAt) {
  const expiry = new Date(deletedAt).getTime() + 30 * 24 * 3600000
  return Math.max(0, Math.ceil((expiry - Date.now()) / 86400000))
}

export default function ArchivePage() {
  const { activeWorldId } = useWorld()
  const [entries, setEntries] = useState(null)
  const [categories, setCategories] = useState(null)
  const [permanentTarget, setPermanentTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!activeWorldId) return
    Promise.all([
      supabase.from('entries')
        .select('id, title, type, deleted_at')
        .eq('world_id', activeWorldId)
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false }),
      supabase.from('categories')
        .select('id, name, color, deleted_at')
        .eq('world_id', activeWorldId)
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false }),
    ]).then(([{ data: ents }, { data: cats }]) => {
      setEntries(ents ?? [])
      setCategories(cats ?? [])
    })
  }, [activeWorldId])

  async function restore(type, id) {
    const table = type === 'entry' ? 'entries' : 'categories'
    const { error } = await supabase.from(table).update({ deleted_at: null }).eq('id', id)
    if (!error) {
      if (type === 'entry') setEntries((prev) => prev.filter((e) => e.id !== id))
      else setCategories((prev) => prev.filter((c) => c.id !== id))
    }
  }

  async function permanentDelete() {
    if (!permanentTarget || deleting) return
    setDeleting(true)
    const { type, id } = permanentTarget
    if (type === 'entry') {
      await supabase.from('profile_fields').delete().eq('entry_id', id)
      await supabase.from('entry_links').delete().or(`from_entry_id.eq.${id},to_entry_id.eq.${id}`)
      await supabase.from('entries').delete().eq('id', id)
      setEntries((prev) => prev.filter((e) => e.id !== id))
    } else {
      await supabase.from('categories').delete().eq('id', id)
      setCategories((prev) => prev.filter((c) => c.id !== id))
    }
    setDeleting(false)
    setPermanentTarget(null)
  }

  const loading = entries === null || categories === null
  const isEmpty = !loading && entries.length === 0 && categories.length === 0

  return (
    <Layout>
      <div className="px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-8">
          <h1 className="text-[22px] font-bold text-gray-900 dark:text-white">Archive</h1>
          <p className="mt-1 text-[13px] text-gray-900 dark:text-white opacity-50">
            Deleted items are permanently removed after 30 days.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-[13px] text-gray-900 dark:text-white opacity-40">
            Loading…
          </div>
        ) : isEmpty ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-[36px] text-gray-200 dark:text-[#2a2a2a] mb-3 select-none">✦</div>
            <div className="text-[14px] font-medium text-gray-900 dark:text-white mb-1">Nothing here</div>
            <div className="text-[13px] text-gray-900 dark:text-white opacity-50">
              Items you delete will appear here.
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {entries.length > 0 && (
              <section>
                <h2 className="text-[11px] uppercase tracking-widest font-medium text-gray-900 dark:text-white opacity-40 mb-3">
                  Entries
                </h2>
                <div className="border border-[#e5e5e5] dark:border-[#2a2a2a] rounded-xl overflow-hidden">
                  {entries.map((entry, i) => {
                    const days = daysLeft(entry.deleted_at)
                    return (
                      <div
                        key={entry.id}
                        className={`flex items-center gap-3 px-4 py-3 ${i < entries.length - 1 ? 'border-b border-[#f0f0f0] dark:border-[#1e1e1e]' : ''}`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-[14px] font-medium text-gray-900 dark:text-white truncate">
                            {entry.title || <span className="italic opacity-40">Untitled</span>}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded-full ${
                              entry.type === 'carlopedia'
                                ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                                : 'bg-[#f0f0f0] dark:bg-[#222] text-gray-900 dark:text-white'
                            }`}>
                              {entry.type === 'carlopedia' ? 'Carlopedia' : 'Story'}
                            </span>
                            <span className={`text-[11px] ${days <= 7 ? 'text-red-500 dark:text-red-400 font-medium' : 'text-gray-900 dark:text-white opacity-40'}`}>
                              Deletes in {days} day{days !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => restore('entry', entry.id)}
                            className="px-3 py-1.5 rounded-lg text-[12px] font-medium border border-[#e5e5e5] dark:border-[#2a2a2a] text-gray-900 dark:text-white hover:bg-[#f5f5f5] dark:hover:bg-[#222] transition-colors"
                          >
                            Restore
                          </button>
                          <button
                            onClick={() => setPermanentTarget({ type: 'entry', id: entry.id, name: entry.title || 'Untitled' })}
                            className="px-3 py-1.5 rounded-lg text-[12px] font-medium text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                          >
                            Delete forever
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {categories.length > 0 && (
              <section>
                <h2 className="text-[11px] uppercase tracking-widest font-medium text-gray-900 dark:text-white opacity-40 mb-3">
                  Folders
                </h2>
                <div className="border border-[#e5e5e5] dark:border-[#2a2a2a] rounded-xl overflow-hidden">
                  {categories.map((cat, i) => {
                    const days = daysLeft(cat.deleted_at)
                    return (
                      <div
                        key={cat.id}
                        className={`flex items-center gap-3 px-4 py-3 ${i < categories.length - 1 ? 'border-b border-[#f0f0f0] dark:border-[#1e1e1e]' : ''}`}
                      >
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                        <div className="flex-1 min-w-0">
                          <div className="text-[14px] font-medium text-gray-900 dark:text-white truncate">{cat.name}</div>
                          <div className="mt-0.5">
                            <span className={`text-[11px] ${days <= 7 ? 'text-red-500 dark:text-red-400 font-medium' : 'text-gray-900 dark:text-white opacity-40'}`}>
                              Deletes in {days} day{days !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => restore('category', cat.id)}
                            className="px-3 py-1.5 rounded-lg text-[12px] font-medium border border-[#e5e5e5] dark:border-[#2a2a2a] text-gray-900 dark:text-white hover:bg-[#f5f5f5] dark:hover:bg-[#222] transition-colors"
                          >
                            Restore
                          </button>
                          <button
                            onClick={() => setPermanentTarget({ type: 'category', id: cat.id, name: cat.name })}
                            className="px-3 py-1.5 rounded-lg text-[12px] font-medium text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                          >
                            Delete forever
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}
          </div>
        )}
      </div>

      {permanentTarget && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-md"
          onClick={(e) => { if (e.target === e.currentTarget && !deleting) setPermanentTarget(null) }}
        >
          <div className="bg-white/95 dark:bg-[#1c1c1c]/95 rounded-2xl shadow-2xl border border-black/[0.08] dark:border-white/10 w-full max-w-[380px] p-6">
            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/40 flex items-center justify-center mb-4">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" className="text-red-500">
                <path d="M8 1h4a1 1 0 0 1 1 1H7a1 1 0 0 1 1-1Z" fill="currentColor" />
                <path d="M3 4h14v1.5H3V4Z" fill="currentColor" />
                <path d="M5 7h10l-1 11H6L5 7Z" fill="currentColor" />
              </svg>
            </div>
            <h3 className="text-[16px] font-semibold text-gray-900 dark:text-white mb-1">Delete permanently?</h3>
            <p className="text-[13px] text-gray-600 dark:text-gray-300 mb-6">
              <span className="font-medium text-gray-900 dark:text-white">"{permanentTarget.name}"</span> will be permanently deleted and cannot be recovered.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPermanentTarget(null)}
                disabled={deleting}
                className="flex-1 px-4 py-2 rounded-lg text-[13px] font-medium border border-[#e5e5e5] dark:border-[#2a2a2a] text-gray-900 dark:text-white hover:bg-[#f5f5f5] dark:hover:bg-[#222] transition-colors disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                onClick={permanentDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2 rounded-lg text-[13px] font-medium bg-red-500 hover:bg-red-600 text-white transition-colors disabled:opacity-40"
              >
                {deleting ? 'Deleting…' : 'Delete forever'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </Layout>
  )
}
