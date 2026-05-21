import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const INPUT = 'w-full bg-[#f5f5f5] dark:bg-[#222] border border-[#e5e5e5] dark:border-[#333] rounded-lg px-3 py-2 text-[13px] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-[#555] outline-none focus:border-indigo-500 transition-colors'

async function nextUntitledTitle(worldId) {
  const { data } = await supabase
    .from('entries')
    .select('title')
    .eq('world_id', worldId)
    .ilike('title', 'Untitled%')
  const existing = new Set((data ?? []).map((e) => e.title.trim()))
  if (!existing.has('Untitled')) return 'Untitled'
  let n = 2
  while (existing.has(`Untitled ${n}`)) n++
  return `Untitled ${n}`
}

export default function NewEntryModal({ onConfirm, onClose, worldId }) {
  const [title, setTitle] = useState('')
  const [saving, setSaving] = useState(false)
  const [shake, setShake] = useState(false)

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    if (!worldId) return
    nextUntitledTitle(worldId).then(setTitle)
  }, [worldId])

  function triggerShake() {
    setShake(false)
    requestAnimationFrame(() => setShake(true))
  }

  async function handleConfirm() {
    if (!title.trim()) { triggerShake(); return }
    if (saving) return
    setSaving(true)
    await onConfirm({ type: 'story', title: title.trim(), category_id: null }, [])
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-md"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white/95 dark:bg-[#1c1c1c]/95 border border-black/[0.08] dark:border-white/10 rounded-xl shadow-2xl w-full max-w-[520px] mx-4 p-6 sm:p-8">
        <div className="text-[15px] font-semibold text-gray-900 dark:text-white mb-6">New Entry</div>
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-gray-400 dark:text-[#555] mb-2">
            Title
          </label>
          <input
            autoFocus
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
            onAnimationEnd={() => setShake(false)}
            placeholder="Entry title…"
            className={`${INPUT}${shake ? ' shake border-red-400 dark:border-red-500' : ''}`}
          />
        </div>
        <div className="flex gap-2 justify-end mt-5">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-[13px] text-gray-500 dark:text-[#666] hover:bg-[#f0f0f0] dark:hover:bg-[#252525] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!title.trim() || saving}
            className="px-3 py-1.5 rounded-lg text-[13px] bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium transition-colors"
          >
            {saving ? 'Creating…' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  )
}
