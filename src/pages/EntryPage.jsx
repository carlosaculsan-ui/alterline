import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { supabase } from '../lib/supabase'

function Field({ label, value }) {
  if (!value) return null
  return (
    <div className="px-5 py-4 border-b border-[#f0f0f0] dark:border-[#1e1e1e] last:border-b-0">
      <div className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-[#444] mb-1.5">
        {label}
      </div>
      <div className="text-[13px] text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
        {value}
      </div>
    </div>
  )
}

function ProfileSection({ entry }) {
  const fields = [
    { label: 'Nationality', value: entry.nationality },
    { label: 'Role / Career', value: entry.role },
    { label: 'Organization', value: entry.organization },
    { label: 'Notes', value: entry.notes },
  ].filter((f) => f.value)

  if (fields.length === 0) {
    return (
      <p className="text-[13px] text-gray-300 dark:text-[#3a3a3a] italic">
        No details added yet.
      </p>
    )
  }

  return (
    <div className="border border-[#f0f0f0] dark:border-[#1e1e1e] rounded-xl overflow-hidden">
      {fields.map(({ label, value }) => (
        <Field key={label} label={label} value={value} />
      ))}
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-8 animate-pulse">
      <div className="flex justify-between mb-7">
        <div className="h-3.5 bg-[#f0f0f0] dark:bg-[#1e1e1e] rounded w-24" />
        <div className="h-3.5 bg-[#f0f0f0] dark:bg-[#1e1e1e] rounded w-20" />
      </div>
      <div className="h-7 bg-[#f0f0f0] dark:bg-[#1e1e1e] rounded w-2/3 mb-3" />
      <div className="h-3 bg-[#f0f0f0] dark:bg-[#1e1e1e] rounded w-28 mb-8" />
      <div className="border border-[#f0f0f0] dark:border-[#1e1e1e] rounded-xl overflow-hidden">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 bg-[#fafafa] dark:bg-[#161616] border-b border-[#f0f0f0] dark:border-[#1e1e1e] last:border-b-0" />
        ))}
      </div>
    </div>
  )
}

const INPUT = 'w-full bg-[#f5f5f5] dark:bg-[#1a1a1a] border border-[#e5e5e5] dark:border-[#2a2a2a] rounded-lg px-3 py-2 text-[13px] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-[#555] outline-none focus:border-indigo-500 transition-colors'
const LABEL = 'block text-[11px] uppercase tracking-wider text-gray-400 dark:text-[#555] mb-1.5'

export default function EntryPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [entry, setEntry] = useState(null)
  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState({ title: '', nationality: '', role: '', organization: '', notes: '' })
  const [saving, setSaving] = useState(false)
  const lastSaved = useRef('')
  const textareaRef = useRef(null)

  useEffect(() => {
    supabase
      .from('entries')
      .select('*, categories(name, color)')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (!error && data) {
          setEntry(data)
          const c = data.content ?? ''
          setContent(c)
          lastSaved.current = c
        }
        setLoading(false)
      })
  }, [id])

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [content])

  function handleEdit() {
    setDraft({
      title: entry.title ?? '',
      nationality: entry.nationality ?? '',
      role: entry.role ?? '',
      organization: entry.organization ?? '',
      notes: entry.notes ?? '',
    })
    setEditing(true)
  }

  async function handleSave() {
    if (!draft.title.trim() || saving) return
    setSaving(true)

    const profileFields = {
      nationality: draft.nationality.trim() || null,
      role: draft.role.trim() || null,
      organization: draft.organization.trim() || null,
      notes: draft.notes.trim() || null,
    }

    await supabase
      .from('entries')
      .update({ title: draft.title.trim(), ...profileFields })
      .eq('id', id)

    await supabase
      .from('profile_fields')
      .upsert({ entry_id: id, ...profileFields }, { onConflict: 'entry_id' })

    setEntry((prev) => ({ ...prev, title: draft.title.trim(), ...profileFields }))
    setEditing(false)
    setSaving(false)
  }

  async function handleContentBlur() {
    if (content === lastSaved.current) return
    await supabase.from('entries').update({ content }).eq('id', id)
    lastSaved.current = content
  }

  async function handleDelete() {
    if (!window.confirm('Delete this entry? This cannot be undone.')) return
    setDeleting(true)
    await supabase.from('entries').delete().eq('id', id)
    navigate('/')
  }

  return (
    <Layout>
      {loading ? (
        <LoadingSkeleton />
      ) : !entry ? (
        <div className="max-w-2xl mx-auto px-6 py-8">
          <button
            onClick={() => navigate('/')}
            className="text-[13px] text-gray-400 dark:text-[#555] hover:text-gray-700 dark:hover:text-gray-300 transition-colors mb-4 block"
          >
            ← Dashboard
          </button>
          <p className="text-[13px] text-gray-400 dark:text-[#555]">Entry not found.</p>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto px-6 py-8">
          {/* Action bar */}
          <div className="flex items-center justify-between mb-7">
            <button
              onClick={() => navigate('/')}
              className="text-[13px] text-gray-400 dark:text-[#555] hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              ← Dashboard
            </button>
            <div className="flex items-center gap-4">
              {editing ? (
                <>
                  <button
                    onClick={() => setEditing(false)}
                    className="text-[13px] text-gray-400 dark:text-[#555] hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={!draft.title.trim() || saving}
                    className="text-[13px] font-medium text-indigo-500 hover:text-indigo-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                </>
              ) : (
                <>
                  {entry.type === 'profile' && (
                    <button
                      onClick={handleEdit}
                      className="text-[13px] text-gray-400 dark:text-[#555] hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                    >
                      Edit
                    </button>
                  )}
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="text-[13px] text-red-400 hover:text-red-500 dark:text-[#5a3030] dark:hover:text-red-400 disabled:opacity-50 transition-colors"
                  >
                    {deleting ? 'Deleting…' : 'Delete'}
                  </button>
                </>
              )}
            </div>
          </div>

          {editing ? (
            <div className="space-y-4">
              <div>
                <label className={LABEL}>Title</label>
                <input
                  autoFocus
                  type="text"
                  value={draft.title}
                  onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                  placeholder="Full name…"
                  className={INPUT}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={LABEL}>Nationality</label>
                  <input
                    type="text"
                    value={draft.nationality}
                    onChange={(e) => setDraft((d) => ({ ...d, nationality: e.target.value }))}
                    placeholder="e.g. Japanese"
                    className={INPUT}
                  />
                </div>
                <div>
                  <label className={LABEL}>Role / Career</label>
                  <input
                    type="text"
                    value={draft.role}
                    onChange={(e) => setDraft((d) => ({ ...d, role: e.target.value }))}
                    placeholder="e.g. Detective"
                    className={INPUT}
                  />
                </div>
              </div>
              <div>
                <label className={LABEL}>Organization</label>
                <input
                  type="text"
                  value={draft.organization}
                  onChange={(e) => setDraft((d) => ({ ...d, organization: e.target.value }))}
                  placeholder="e.g. ACME Corp"
                  className={INPUT}
                />
              </div>
              <div>
                <label className={LABEL}>Notes</label>
                <textarea
                  value={draft.notes}
                  onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
                  placeholder="Any additional notes…"
                  className={`${INPUT} resize-none h-24`}
                />
              </div>
            </div>
          ) : (
            <>
              <h1 className="text-[22px] font-semibold text-gray-900 dark:text-white leading-tight mb-3">
                {entry.title}
              </h1>
              <div className="flex items-center gap-3 mb-7">
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#f0f0f0] dark:bg-[#1e1e1e] text-gray-400 dark:text-[#555]">
                  {entry.type === 'profile' ? 'Profile' : 'Story / Note'}
                </span>
                {entry.categories && (
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: entry.categories.color }}
                    />
                    <span className="text-[12px] text-gray-400 dark:text-[#555]">
                      {entry.categories.name}
                    </span>
                  </div>
                )}
              </div>
              {entry.type === 'profile' && <ProfileSection entry={entry} />}
              {entry.type === 'story' && (
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onBlur={handleContentBlur}
                  placeholder="Write something…"
                  className="w-full min-h-[260px] bg-transparent text-[14px] text-gray-700 dark:text-gray-300 placeholder-gray-300 dark:placeholder-[#333] outline-none resize-none leading-[1.75]"
                />
              )}
            </>
          )}
        </div>
      )}
    </Layout>
  )
}
