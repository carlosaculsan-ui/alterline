import { useState, useEffect } from 'react'

function IconPerson() {
  return (
    <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="7" r="3.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M3 18c0-3.866 3.134-7 7-7s7 3.134 7 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

function IconNote() {
  return (
    <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
      <rect x="3.5" y="2.5" width="13" height="15" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M7 7h6M7 10h6M7 13h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

const INPUT = 'w-full bg-[#f5f5f5] dark:bg-[#222] border border-[#e5e5e5] dark:border-[#333] rounded-lg px-3 py-2 text-[13px] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-[#555] outline-none focus:border-indigo-500 transition-colors'

const TYPE_CARDS = [
  { t: 'profile', icon: <IconPerson />, label: 'Profile', sub: 'person or org' },
  { t: 'story', icon: <IconNote />, label: 'Story / Note', sub: 'free writing' },
]

const DEFAULT_FIELDS = [
  { id: 0, key: 'Nationality', value: '' },
  { id: 1, key: 'Role / Career', value: '' },
  { id: 2, key: 'Organization', value: '' },
  { id: 3, key: 'Notes', value: '' },
]

export default function NewEntryModal({ categories, onConfirm, onClose }) {
  const [step, setStep] = useState(1)
  const [type, setType] = useState(null)
  const [title, setTitle] = useState('')
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '')
  const [fields, setFields] = useState(DEFAULT_FIELDS)
  const [nextId, setNextId] = useState(DEFAULT_FIELDS.length)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function selectType(t) {
    setType(t)
    setStep(2)
  }

  function addField() {
    setFields((f) => [...f, { id: nextId, key: '', value: '' }])
    setNextId((n) => n + 1)
  }

  function removeField(id) {
    setFields((f) => f.filter((field) => field.id !== id))
  }

  function updateField(id, prop, val) {
    setFields((f) => f.map((field) => (field.id === id ? { ...field, [prop]: val } : field)))
  }

  async function handleConfirm() {
    if (!title.trim() || saving) return
    setSaving(true)
    const data = {
      type,
      title: title.trim(),
      category_id: categoryId || null,
    }
    const nonEmptyFields =
      type === 'profile'
        ? fields
            .filter((f) => f.key.trim() && f.value.trim())
            .map((f) => ({ key: f.key.trim(), value: f.value.trim() }))
        : []
    await onConfirm(data, nonEmptyFields)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-[#1c1c1c] border border-[#e5e5e5] dark:border-[#2a2a2a] rounded-xl shadow-2xl w-[440px] p-6">
        {step === 1 ? (
          <>
            <div className="text-[14px] font-semibold text-gray-900 dark:text-white mb-5">
              What are you adding?
            </div>
            <div className="grid grid-cols-2 gap-3 mb-5">
              {TYPE_CARDS.map(({ t, icon, label, sub }) => (
                <button
                  key={t}
                  onClick={() => selectType(t)}
                  className="flex flex-col items-start gap-3 p-4 rounded-xl border border-[#e5e5e5] dark:border-[#333] hover:border-indigo-400 dark:hover:border-indigo-500/60 hover:bg-indigo-50/60 dark:hover:bg-[#1a1a2e] text-left transition-all"
                >
                  <span className="text-gray-400 dark:text-[#666]">{icon}</span>
                  <div>
                    <div className="text-[13px] font-medium text-gray-900 dark:text-white">{label}</div>
                    <div className="text-[12px] text-gray-400 dark:text-[#555] mt-0.5">{sub}</div>
                  </div>
                </button>
              ))}
            </div>
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="px-3 py-1.5 rounded-lg text-[13px] text-gray-500 dark:text-[#666] hover:bg-[#f0f0f0] dark:hover:bg-[#252525] transition-colors"
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-5">
              <button
                onClick={() => setStep(1)}
                className="text-[13px] text-gray-400 dark:text-[#555] hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                ← Back
              </button>
              <div className="text-[14px] font-semibold text-gray-900 dark:text-white">
                New {type === 'profile' ? 'Profile' : 'Story / Note'}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-gray-400 dark:text-[#555] mb-1.5">
                  Category
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full bg-[#f5f5f5] dark:bg-[#222] border border-[#e5e5e5] dark:border-[#333] rounded-lg px-3 py-2 text-[13px] text-gray-900 dark:text-white outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                >
                  <option value="">No category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-gray-400 dark:text-[#555] mb-1.5">
                  Title
                </label>
                <input
                  autoFocus
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={type === 'profile' ? 'Full name…' : 'Entry title…'}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && type === 'story') handleConfirm()
                  }}
                  className={INPUT}
                />
              </div>

              {type === 'profile' && (
                <div className="space-y-2">
                  {fields.map((field) => (
                    <div key={field.id} className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={field.key}
                        onChange={(e) => updateField(field.id, 'key', e.target.value)}
                        placeholder="Label"
                        className={`w-2/5 ${INPUT}`}
                      />
                      <input
                        type="text"
                        value={field.value}
                        onChange={(e) => updateField(field.id, 'value', e.target.value)}
                        placeholder="Value"
                        className={`flex-1 ${INPUT}`}
                      />
                      <button
                        onClick={() => removeField(field.id)}
                        className="shrink-0 w-6 h-6 flex items-center justify-center rounded text-[15px] leading-none text-gray-400 dark:text-[#555] hover:text-gray-700 dark:hover:text-gray-300 hover:bg-[#f0f0f0] dark:hover:bg-[#333] transition-all"
                        aria-label="Remove field"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={addField}
                    className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-[12px] text-gray-400 dark:text-[#555] hover:text-gray-600 dark:hover:text-gray-400 hover:bg-[#f5f5f5] dark:hover:bg-[#252525] transition-colors"
                  >
                    <span className="text-[14px] leading-none">+</span>
                    Add field
                  </button>
                </div>
              )}
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
          </>
        )}
      </div>
    </div>
  )
}
