import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import Toast from '../components/Toast'
import { supabase } from '../lib/supabase'
import { useCategories } from '../hooks/useCategories'

function IconPersonSm() {
  return (
    <svg width="12" height="12" viewBox="0 0 20 20" fill="none" className="shrink-0">
      <circle cx="10" cy="7" r="3.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M3 18c0-3.866 3.134-7 7-7s7 3.134 7 7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  )
}

function IconNoteSm() {
  return (
    <svg width="12" height="12" viewBox="0 0 20 20" fill="none" className="shrink-0">
      <rect x="3.5" y="2.5" width="13" height="15" rx="1.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M7 7h6M7 10h6M7 13h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  )
}

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

function ProfileSection({ fields }) {
  if (fields.length === 0) {
    return (
      <p className="text-[13px] text-gray-300 dark:text-[#3a3a3a] italic">
        No details added yet.
      </p>
    )
  }
  return (
    <div className="border border-[#f0f0f0] dark:border-[#1e1e1e] rounded-xl overflow-hidden">
      {fields.map(({ id, key, value }) => (
        <Field key={id} label={key} value={value} />
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
  const { categories } = useCategories()

  const [entry, setEntry] = useState(null)
  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [toastMsg, setToastMsg] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const confirmDeleteTimer = useRef(null)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState({ title: '' })
  const [profileFields, setProfileFields] = useState([])
  const [draftFields, setDraftFields] = useState([])
  const [saving, setSaving] = useState(false)
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState('')
  const [editingCategory, setEditingCategory] = useState(false)

  const [links, setLinks] = useState([])
  const [linkQuery, setLinkQuery] = useState('')
  const [linkResults, setLinkResults] = useState([])
  const [showLinkResults, setShowLinkResults] = useState(false)

  const lastSaved = useRef('')
  const textareaRef = useRef(null)
  const titleInputRef = useRef(null)
  const nextFieldId = useRef(0)
  const cancelTitle = useRef(false)

  useEffect(() => {
    supabase
      .from('entries')
      .select('*, categories(name, color)')
      .eq('id', id)
      .single()
      .then(async ({ data, error }) => {
        if (!error && data) {
          setEntry(data)
          const c = data.content ?? ''
          setContent(c)
          lastSaved.current = c

          const [pfResult, linkRowsResult] = await Promise.all([
            data.type === 'profile'
              ? supabase.from('profile_fields').select('field_key, field_value').eq('entry_id', id)
              : Promise.resolve({ data: null }),
            supabase
              .from('entry_links')
              .select('id, from_entry_id, to_entry_id')
              .or(`from_entry_id.eq.${id},to_entry_id.eq.${id}`),
          ])

          if (pfResult.data) {
            setProfileFields(
              pfResult.data.map((row) => ({
                id: nextFieldId.current++,
                key: row.field_key,
                value: row.field_value,
              }))
            )
          }

          const linkRows = linkRowsResult.data ?? []
          if (linkRows.length > 0) {
            const linkedIds = linkRows.map((row) =>
              row.from_entry_id === id ? row.to_entry_id : row.from_entry_id
            )
            const { data: linkedEntries } = await supabase
              .from('entries')
              .select('id, title, type')
              .in('id', linkedIds)
            setLinks(
              linkRows
                .map((row) => {
                  const otherId = row.from_entry_id === id ? row.to_entry_id : row.from_entry_id
                  return {
                    linkId: row.id,
                    entry: (linkedEntries ?? []).find((e) => e.id === otherId),
                  }
                })
                .filter((l) => l.entry)
            )
          }
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

  useEffect(() => {
    if (editingTitle) titleInputRef.current?.focus()
  }, [editingTitle])

  useEffect(() => {
    const q = linkQuery.trim()
    if (!q) { setLinkResults([]); return }
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from('entries')
        .select('id, title, type')
        .ilike('title', `%${q}%`)
        .neq('id', id)
        .limit(10)
      const alreadyLinked = new Set(links.map((l) => l.entry.id))
      setLinkResults((data ?? []).filter((e) => !alreadyLinked.has(e.id)).slice(0, 8))
    }, 300)
    return () => clearTimeout(timer)
  }, [linkQuery, id, links])

  function handleEdit() {
    setDraft({ title: entry.title ?? '' })
    setDraftFields(profileFields.map((f) => ({ ...f })))
    setEditing(true)
  }

  async function handleSave() {
    if (!draft.title.trim() || saving) return
    setSaving(true)

    const { error } = await supabase.from('entries').update({ title: draft.title.trim(), updated_at: new Date().toISOString() }).eq('id', id)
    if (error) { setToastMsg('Save failed. Try again.'); setSaving(false); return }

    await supabase.from('profile_fields').delete().eq('entry_id', id)

    const toInsert = draftFields
      .filter((f) => f.key.trim() && f.value.trim())
      .map((f) => ({ entry_id: id, field_key: f.key.trim(), field_value: f.value.trim() }))

    if (toInsert.length > 0) {
      await supabase.from('profile_fields').insert(toInsert)
    }

    const savedFields = draftFields
      .filter((f) => f.key.trim() && f.value.trim())
      .map((f) => ({ id: nextFieldId.current++, key: f.key.trim(), value: f.value.trim() }))

    setEntry((prev) => ({ ...prev, title: draft.title.trim() }))
    setProfileFields(savedFields)
    setEditing(false)
    setSaving(false)
  }

  async function handleContentBlur() {
    if (content === lastSaved.current) return
    const { error } = await supabase.from('entries').update({ content, updated_at: new Date().toISOString() }).eq('id', id)
    if (error) { setToastMsg('Save failed. Try again.'); return }
    lastSaved.current = content
  }

  useEffect(() => {
    if (!entry || entry.type !== 'story' || content === lastSaved.current) return
    const timer = setTimeout(async () => {
      const { error } = await supabase.from('entries').update({ content, updated_at: new Date().toISOString() }).eq('id', id)
      if (!error) lastSaved.current = content
      else setToastMsg('Auto-save failed. Try again.')
    }, 2000)
    return () => clearTimeout(timer)
  }, [content])

  function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true)
      clearTimeout(confirmDeleteTimer.current)
      confirmDeleteTimer.current = setTimeout(() => setConfirmDelete(false), 3000)
      return
    }
    clearTimeout(confirmDeleteTimer.current)
    setDeleting(true)
    supabase.from('entries').delete().eq('id', id).then(() => navigate(-1))
  }

  async function saveTitleEdit() {
    if (cancelTitle.current) {
      cancelTitle.current = false
      setEditingTitle(false)
      return
    }
    const trimmed = titleDraft.trim()
    setEditingTitle(false)
    if (!trimmed || trimmed === entry.title) return
    setEntry((prev) => ({ ...prev, title: trimmed }))
    const { error } = await supabase.from('entries').update({ title: trimmed, updated_at: new Date().toISOString() }).eq('id', id)
    if (error) { setToastMsg('Save failed. Try again.'); setEntry((prev) => ({ ...prev, title: entry.title })) }
  }

  async function saveCategoryEdit(categoryId) {
    setEditingCategory(false)
    const newCatId = categoryId || null
    if (newCatId === entry.category_id) return
    const cat = newCatId ? (categories.find((c) => c.id === newCatId) ?? null) : null
    setEntry((prev) => ({
      ...prev,
      category_id: newCatId,
      categories: cat ? { name: cat.name, color: cat.color } : null,
    }))
    const { error } = await supabase.from('entries').update({ category_id: newCatId, updated_at: new Date().toISOString() }).eq('id', id)
    if (error) setToastMsg('Save failed. Try again.')
  }

  async function addLink(targetEntry) {
    const { data: existing } = await supabase
      .from('entry_links')
      .select('id')
      .or(`and(from_entry_id.eq.${id},to_entry_id.eq.${targetEntry.id}),and(from_entry_id.eq.${targetEntry.id},to_entry_id.eq.${id})`)
      .maybeSingle()
    if (existing) return
    const { data: row, error } = await supabase
      .from('entry_links')
      .insert({ from_entry_id: id, to_entry_id: targetEntry.id })
      .select('id')
      .single()
    if (!error && row) {
      setLinks((prev) => [...prev, { linkId: row.id, entry: targetEntry }])
      setLinkQuery('')
      setLinkResults([])
    }
  }

  async function removeLink(linkId) {
    await supabase.from('entry_links').delete().eq('id', linkId)
    setLinks((prev) => prev.filter((l) => l.linkId !== linkId))
  }

  return (
    <Layout>
      {loading ? (
        <LoadingSkeleton />
      ) : !entry ? (
        <div className="max-w-2xl mx-auto px-6 py-8">
          <button
            onClick={() => navigate(-1)}
            className="text-[13px] text-gray-400 dark:text-[#555] hover:text-gray-700 dark:hover:text-gray-300 transition-colors mb-4 block"
          >
            ← Back
          </button>
          <p className="text-[13px] text-gray-400 dark:text-[#555]">Entry not found.</p>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto px-6 py-8">
          {/* Action bar */}
          <div className="flex items-center justify-between mb-7">
            <button
              onClick={() => navigate(-1)}
              className="text-[13px] text-gray-400 dark:text-[#555] hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              ← Back
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
                    className={`text-[13px] disabled:opacity-50 transition-colors ${
                      confirmDelete
                        ? 'text-red-500 dark:text-red-400 font-medium'
                        : 'text-gray-400 dark:text-[#555] hover:text-red-400 dark:hover:text-red-400'
                    }`}
                  >
                    {deleting ? 'Deleting…' : confirmDelete ? 'Confirm?' : 'Delete'}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Main content */}
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
              <div className="space-y-2">
                {draftFields.map((field) => (
                  <div key={field.id} className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={field.key}
                      onChange={(e) =>
                        setDraftFields((fs) =>
                          fs.map((f) => (f.id === field.id ? { ...f, key: e.target.value } : f))
                        )
                      }
                      placeholder="Label"
                      className={`w-2/5 ${INPUT}`}
                    />
                    <input
                      type="text"
                      value={field.value}
                      onChange={(e) =>
                        setDraftFields((fs) =>
                          fs.map((f) => (f.id === field.id ? { ...f, value: e.target.value } : f))
                        )
                      }
                      placeholder="Value"
                      className={`flex-1 ${INPUT}`}
                    />
                    <button
                      onClick={() => setDraftFields((fs) => fs.filter((f) => f.id !== field.id))}
                      className="shrink-0 w-6 h-6 flex items-center justify-center rounded text-[15px] leading-none text-gray-400 dark:text-[#555] hover:text-gray-700 dark:hover:text-gray-300 hover:bg-[#f0f0f0] dark:hover:bg-[#1e1e1e] transition-all"
                      aria-label="Remove field"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  onClick={() =>
                    setDraftFields((fs) => [
                      ...fs,
                      { id: nextFieldId.current++, key: '', value: '' },
                    ])
                  }
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-[12px] text-gray-400 dark:text-[#555] hover:text-gray-600 dark:hover:text-gray-400 hover:bg-[#f5f5f5] dark:hover:bg-[#1a1a1a] transition-colors"
                >
                  <span className="text-[14px] leading-none">+</span>
                  Add field
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Title */}
              {entry.type === 'story' && editingTitle ? (
                <input
                  ref={titleInputRef}
                  type="text"
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  onBlur={saveTitleEdit}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); titleInputRef.current?.blur() }
                    if (e.key === 'Escape') { cancelTitle.current = true; titleInputRef.current?.blur() }
                  }}
                  className="text-[22px] font-semibold text-gray-900 dark:text-white leading-tight mb-3 w-full bg-transparent outline-none border-b border-[#e5e5e5] dark:border-[#2a2a2a] focus:border-indigo-500 transition-colors"
                />
              ) : (
                <h1
                  onClick={
                    entry.type === 'story'
                      ? () => { setTitleDraft(entry.title); setEditingTitle(true) }
                      : undefined
                  }
                  className={`text-[22px] font-semibold text-gray-900 dark:text-white leading-tight mb-3 ${entry.type === 'story' ? 'cursor-text' : ''}`}
                >
                  {entry.title}
                </h1>
              )}

              {/* Type badge + category */}
              <div className="flex items-center gap-3 mb-7">
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#f0f0f0] dark:bg-[#1e1e1e] text-gray-400 dark:text-[#555]">
                  {entry.type === 'profile' ? 'Profile' : 'Story / Note'}
                </span>

                {entry.type === 'story' && editingCategory ? (
                  <select
                    autoFocus
                    defaultValue={entry.category_id ?? ''}
                    onChange={(e) => saveCategoryEdit(e.target.value)}
                    onBlur={() => setEditingCategory(false)}
                    className="text-[12px] bg-[#f5f5f5] dark:bg-[#1a1a1a] border border-indigo-500 rounded-md px-2 py-0.5 text-gray-700 dark:text-gray-300 outline-none cursor-pointer"
                  >
                    <option value="">No category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                ) : entry.type === 'story' ? (
                  <div
                    onClick={() => setEditingCategory(true)}
                    className="flex items-center gap-1.5 cursor-pointer group"
                  >
                    {entry.categories ? (
                      <>
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: entry.categories.color }}
                        />
                        <span className="text-[12px] text-gray-400 dark:text-[#555] group-hover:text-gray-600 dark:group-hover:text-gray-400 transition-colors">
                          {entry.categories.name}
                        </span>
                      </>
                    ) : (
                      <span className="text-[12px] text-gray-300 dark:text-[#3a3a3a] group-hover:text-gray-500 dark:group-hover:text-[#555] transition-colors">
                        Add category…
                      </span>
                    )}
                  </div>
                ) : (
                  entry.categories && (
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: entry.categories.color }}
                      />
                      <span className="text-[12px] text-gray-400 dark:text-[#555]">
                        {entry.categories.name}
                      </span>
                    </div>
                  )
                )}
              </div>

              {entry.type === 'profile' && <ProfileSection fields={profileFields} />}
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

          {/* Linked entries — always visible, independent of edit mode */}
          <div className="mt-10 pt-7 border-t border-[#f0f0f0] dark:border-[#1e1e1e]">
            <div className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-[#444] font-medium mb-3 select-none">
              Linked Entries
            </div>

            {links.length > 0 && (
              <div className="mb-3 space-y-0.5">
                {links.map(({ linkId, entry: linked }) => (
                  <div key={linkId} className="flex items-center gap-2 group/link rounded-md px-2 py-1.5 hover:bg-[#f5f5f5] dark:hover:bg-[#161616] transition-colors">
                    <span className="text-gray-300 dark:text-[#3a3a3a] shrink-0">
                      {linked.type === 'profile' ? <IconPersonSm /> : <IconNoteSm />}
                    </span>
                    <button
                      onClick={() => navigate(`/entry/${linked.id}`)}
                      className="flex-1 text-left text-[13px] text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white truncate transition-colors"
                    >
                      {linked.title}
                    </button>
                    <button
                      onClick={() => removeLink(linkId)}
                      className="opacity-0 group-hover/link:opacity-100 w-5 h-5 flex items-center justify-center rounded text-[14px] leading-none text-gray-400 dark:text-[#555] hover:text-gray-700 dark:hover:text-gray-300 hover:bg-[#e5e5e5] dark:hover:bg-[#2a2a2a] transition-all shrink-0"
                      aria-label="Remove link"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Link search */}
            <div className="relative">
              <input
                type="text"
                value={linkQuery}
                onChange={(e) => setLinkQuery(e.target.value)}
                onFocus={() => setShowLinkResults(true)}
                onBlur={() => setTimeout(() => setShowLinkResults(false), 150)}
                onKeyDown={(e) => { if (e.key === 'Escape') { setLinkQuery(''); setShowLinkResults(false) } }}
                placeholder="Link an entry…"
                className="w-full bg-transparent text-[13px] text-gray-700 dark:text-gray-300 placeholder-gray-300 dark:placeholder-[#3a3a3a] outline-none border-b border-[#f0f0f0] dark:border-[#1e1e1e] focus:border-indigo-400 dark:focus:border-indigo-500/60 transition-colors py-1.5"
              />
              {showLinkResults && linkResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 z-10 bg-white dark:bg-[#1c1c1c] border border-[#e5e5e5] dark:border-[#2a2a2a] rounded-lg overflow-hidden shadow-lg">
                  {linkResults.map((result) => (
                    <button
                      key={result.id}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => addLink(result)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-[#f5f5f5] dark:hover:bg-[#222] transition-colors"
                    >
                      <span className="text-gray-300 dark:text-[#444] shrink-0">
                        {result.type === 'profile' ? <IconPersonSm /> : <IconNoteSm />}
                      </span>
                      <span className="text-[13px] text-gray-700 dark:text-gray-300 truncate flex-1">
                        {result.title}
                      </span>
                      <span className="text-[11px] text-gray-300 dark:text-[#444] shrink-0">
                        {result.type === 'profile' ? 'Profile' : 'Story'}
                      </span>
                    </button>
                  ))}
                </div>
              )}
              {showLinkResults && linkQuery.trim() && linkResults.length === 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 z-10 px-3 py-2 text-[12px] text-gray-300 dark:text-[#444] bg-white dark:bg-[#1c1c1c] border border-[#e5e5e5] dark:border-[#2a2a2a] rounded-lg">
                  No entries found
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {toastMsg && <Toast message={toastMsg} onDismiss={() => setToastMsg(null)} />}
    </Layout>
  )
}
