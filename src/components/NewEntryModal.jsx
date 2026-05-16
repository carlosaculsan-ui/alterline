import { useState, useEffect } from 'react'

const INPUT = 'w-full bg-[#f5f5f5] dark:bg-[#222] border border-[#e5e5e5] dark:border-[#333] rounded-lg px-3 py-2 text-[13px] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-[#555] outline-none focus:border-indigo-500 transition-colors'

export default function NewEntryModal({ onConfirm, onClose }) {
  const [title, setTitle] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function handleConfirm() {
    if (!title.trim() || saving) return
    setSaving(true)
    await onConfirm({ type: 'story', title: title.trim(), category_id: null }, [])
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-[#1c1c1c] border border-[#e5e5e5] dark:border-[#2a2a2a] rounded-xl shadow-2xl w-[520px] p-8">
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
            placeholder="Entry title…"
            className={INPUT}
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
