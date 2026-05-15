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

function FieldLabel({ children }) {
  return (
    <label className="block text-[11px] uppercase tracking-wider text-gray-400 dark:text-[#555] mb-1.5">
      {children}
    </label>
  )
}

function TextInput({ value, onChange, placeholder, autoFocus, onKeyDown }) {
  return (
    <input
      autoFocus={autoFocus}
      type="text"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      onKeyDown={onKeyDown}
      className="w-full bg-[#f5f5f5] dark:bg-[#222] border border-[#e5e5e5] dark:border-[#333] rounded-lg px-3 py-2 text-[13px] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-[#555] outline-none focus:border-indigo-500 transition-colors"
    />
  )
}

const TYPE_CARDS = [
  { t: 'profile', icon: <IconPerson />, label: 'Profile', sub: 'person or org' },
  { t: 'story', icon: <IconNote />, label: 'Story / Note', sub: 'free writing' },
]

export default function NewEntryModal({ categories, onConfirm, onClose }) {
  const [step, setStep] = useState(1)
  const [type, setType] = useState(null)
  const [title, setTitle] = useState('')
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '')
  const [nationality, setNationality] = useState('')
  const [role, setRole] = useState('')
  const [organization, setOrganization] = useState('')
  const [notes, setNotes] = useState('')
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

  async function handleConfirm() {
    if (!title.trim() || saving) return
    setSaving(true)
    const data = {
      type,
      title: title.trim(),
      category_id: categoryId || null,
    }
    if (type === 'profile') {
      if (nationality.trim()) data.nationality = nationality.trim()
      if (role.trim()) data.role = role.trim()
      if (organization.trim()) data.organization = organization.trim()
      if (notes.trim()) data.notes = notes.trim()
    }
    await onConfirm(data)
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
                <FieldLabel>Category</FieldLabel>
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
                <FieldLabel>Title</FieldLabel>
                <TextInput
                  autoFocus
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={type === 'profile' ? 'Full name…' : 'Entry title…'}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && type === 'story') handleConfirm()
                  }}
                />
              </div>

              {type === 'profile' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <FieldLabel>Nationality</FieldLabel>
                      <TextInput
                        value={nationality}
                        onChange={(e) => setNationality(e.target.value)}
                        placeholder="e.g. Japanese"
                      />
                    </div>
                    <div>
                      <FieldLabel>Role / Career</FieldLabel>
                      <TextInput
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        placeholder="e.g. Detective"
                      />
                    </div>
                  </div>
                  <div>
                    <FieldLabel>Organization</FieldLabel>
                    <TextInput
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      placeholder="e.g. ACME Corp"
                    />
                  </div>
                  <div>
                    <FieldLabel>Notes</FieldLabel>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Any additional notes…"
                      className="w-full bg-[#f5f5f5] dark:bg-[#222] border border-[#e5e5e5] dark:border-[#333] rounded-lg px-3 py-2 text-[13px] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-[#555] outline-none focus:border-indigo-500 transition-colors resize-none h-20"
                    />
                  </div>
                </>
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
