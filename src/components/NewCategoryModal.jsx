import { useState, useEffect } from 'react'

const COLORS = [
  '#5DCAA5', '#85B7EB', '#F0997B', '#ED93B1',
  '#AFA9EC', '#FAC775', '#E24B4A', '#888780',
]

export default function NewCategoryModal({ onConfirm, onClose }) {
  const [name, setName] = useState('')
  const [color, setColor] = useState(COLORS[0])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function handleConfirm() {
    if (!name.trim() || saving) return
    setSaving(true)
    await onConfirm(name.trim(), color)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-md"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white/95 dark:bg-[#1c1c1c]/95 border border-black/[0.08] dark:border-white/10 rounded-xl shadow-2xl w-full max-w-[300px] mx-4 p-5">
        <div className="text-[14px] font-semibold text-gray-900 dark:text-white mb-4">
          New folder
        </div>

        <label className="block text-[11px] uppercase tracking-wider text-gray-400 dark:text-[#555] mb-1.5">
          Name
        </label>
        <input
          autoFocus
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
          placeholder="e.g. Chapter 1"
          className="w-full bg-[#f5f5f5] dark:bg-[#222] border border-[#e5e5e5] dark:border-[#333] rounded-lg px-3 py-2 text-[13px] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-[#555] outline-none focus:border-indigo-500 transition-colors mb-4"
        />

        <label className="block text-[11px] uppercase tracking-wider text-gray-400 dark:text-[#555] mb-2">
          Color
        </label>
        <div className="flex gap-2 mb-5 flex-wrap">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className="w-6 h-6 rounded-full transition-transform hover:scale-110"
              style={{
                backgroundColor: c,
                outline: color === c ? `2px solid ${c}` : 'none',
                outlineOffset: '2px',
                transform: color === c ? 'scale(1.15)' : undefined,
              }}
            />
          ))}
        </div>

        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-[13px] text-gray-500 dark:text-[#666] hover:bg-[#f0f0f0] dark:hover:bg-[#252525] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!name.trim() || saving}
            className="px-3 py-1.5 rounded-lg text-[13px] bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium transition-colors"
          >
            {saving ? 'Creating…' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  )
}
