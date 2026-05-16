import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import { TextStyle, FontSize } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import Layout from '../components/Layout'
import Toast from '../components/Toast'
import { supabase } from '../lib/supabase'
import { useCategories } from '../hooks/useCategories'


function ToolBtn({ active, onAction, title, children }) {
  return (
    <button
      onMouseDown={(e) => { e.preventDefault(); onAction() }}
      title={title}
      className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${
        active
          ? 'bg-[#ebebeb] dark:bg-[#2a2a2a] text-gray-900 dark:text-white'
          : 'text-gray-500 dark:text-gray-400 hover:bg-[#f0f0f0] dark:hover:bg-[#222]'
      }`}
    >
      {children}
    </button>
  )
}

function Toolbar({ editor }) {
  if (!editor) return null
  const fontSize = editor.getAttributes('textStyle').fontSize ?? ''

  return (
    <div className="flex items-center gap-0.5 mb-4 pb-3 border-b border-[#f0f0f0] dark:border-[#1e1e1e] flex-wrap">
      <select
        value={fontSize}
        onChange={(e) => {
          const s = e.target.value
          if (s) editor.chain().focus().setFontSize(s).run()
          else editor.chain().focus().unsetFontSize().run()
        }}
        className="text-[12px] bg-transparent text-gray-600 dark:text-gray-400 border border-[#e5e5e5] dark:border-[#2a2a2a] rounded px-2 py-1 outline-none cursor-pointer mr-1"
      >
        <option value="12px">Small</option>
        <option value="">Normal</option>
        <option value="18px">Large</option>
        <option value="24px">Heading</option>
      </select>

      <div className="w-px h-4 bg-[#e5e5e5] dark:bg-[#2a2a2a] mx-1 shrink-0" />

      <ToolBtn active={editor.isActive('bold')} onAction={() => editor.chain().focus().toggleBold().run()} title="Bold">
        <span className="font-bold text-[13px]">B</span>
      </ToolBtn>
      <ToolBtn active={editor.isActive('italic')} onAction={() => editor.chain().focus().toggleItalic().run()} title="Italic">
        <span className="italic text-[13px]">I</span>
      </ToolBtn>
      <ToolBtn active={editor.isActive('underline')} onAction={() => editor.chain().focus().toggleUnderline().run()} title="Underline">
        <span className="underline text-[13px]">U</span>
      </ToolBtn>

      <div className="w-px h-4 bg-[#e5e5e5] dark:bg-[#2a2a2a] mx-1 shrink-0" />

      {/* Text color */}
      <label
        className="relative w-7 h-7 flex flex-col items-center justify-center rounded cursor-pointer hover:bg-[#f0f0f0] dark:hover:bg-[#222] transition-colors"
        title="Text color"
      >
        <span className="text-[13px] font-bold text-gray-600 dark:text-gray-400 select-none leading-none">A</span>
        <span
          className="absolute bottom-1 left-1.5 right-1.5 h-[2.5px] rounded-full"
          style={{ backgroundColor: editor.getAttributes('textStyle').color ?? '#888888' }}
        />
        <input
          type="color"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onInput={(e) => editor.chain().focus().setColor(e.target.value).run()}
        />
      </label>

      {/* Highlight color */}
      <label
        className="relative w-7 h-7 flex items-center justify-center rounded cursor-pointer hover:bg-[#f0f0f0] dark:hover:bg-[#222] transition-colors"
        title="Highlight color"
      >
        <svg width="14" height="14" viewBox="0 0 15 15" fill="none" className="text-gray-600 dark:text-gray-400">
          <path d="M2 11.5h3.5L13 4 11 2 3.5 9.5 2 11.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
          <path d="M1 14h5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
        <input
          type="color"
          defaultValue="#fef08a"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onInput={(e) => editor.chain().focus().setHighlight({ color: e.target.value }).run()}
        />
      </label>
    </div>
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

function LoadingSkeleton() {
  return (
    <div className="px-8 py-8 animate-pulse">
      <div className="flex justify-between mb-7">
        <div className="h-3.5 bg-[#f0f0f0] dark:bg-[#1e1e1e] rounded w-24" />
        <div className="h-3.5 bg-[#f0f0f0] dark:bg-[#1e1e1e] rounded w-20" />
      </div>
      <div className="h-7 bg-[#f0f0f0] dark:bg-[#1e1e1e] rounded w-2/3 mb-6" />
      <div className="h-px bg-[#f0f0f0] dark:bg-[#1e1e1e] mb-6" />
      <div className="space-y-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-4 bg-[#f0f0f0] dark:bg-[#1e1e1e] rounded" style={{ width: `${85 - i * 10}%` }} />
        ))}
      </div>
    </div>
  )
}

export default function EntryPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [entry, setEntry] = useState(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [toastMsg, setToastMsg] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const confirmDeleteTimer = useRef(null)
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState('')

  const [links, setLinks] = useState([])
  const [linkQuery, setLinkQuery] = useState('')
  const [linkResults, setLinkResults] = useState([])
  const [showLinkResults, setShowLinkResults] = useState(false)
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [showActionMenu, setShowActionMenu] = useState(false)
  const [showCategoryPicker, setShowCategoryPicker] = useState(false)

  const { categories } = useCategories()

  const lastSaved = useRef('')
  const contentRef = useRef('')
  const titleInputRef = useRef(null)
  const linkInputRef = useRef(null)
  const categorySelectRef = useRef(null)
  const cancelTitle = useRef(false)
  const contentInitialized = useRef(false)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      FontSize,
      Color,
      Highlight.configure({ multicolor: true }),
    ],
    editorProps: {
      attributes: {
        class: 'outline-none min-h-[calc(100vh-260px)] text-[14px] text-gray-700 dark:text-gray-300 leading-[1.75]',
      },
    },
    onUpdate({ editor }) {
      const html = editor.getHTML()
      contentRef.current = html
    },
    onBlur() {
      handleContentBlur()
    },
  })

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
          lastSaved.current = c
          contentRef.current = c

          const { data: linkRows } = await supabase
            .from('entry_links')
            .select('id, from_entry_id, to_entry_id')
            .or(`from_entry_id.eq.${id},to_entry_id.eq.${id}`)

          if (linkRows?.length > 0) {
            const linkedIds = linkRows.map((row) =>
              row.from_entry_id === id ? row.to_entry_id : row.from_entry_id
            )
            const { data: linkedEntries } = await supabase
              .from('entries')
              .select('id, title')
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

  // Set editor content once entry loads
  useEffect(() => {
    if (editor && entry && !contentInitialized.current) {
      contentInitialized.current = true
      editor.commands.setContent(entry.content ?? '')
    }
  }, [editor, entry])

  useEffect(() => {
    if (editingTitle) titleInputRef.current?.focus()
  }, [editingTitle])

  useEffect(() => {
    const q = linkQuery.trim()
    if (!q) { setLinkResults([]); return }
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from('entries')
        .select('id, title')
        .ilike('title', `%${q}%`)
        .neq('id', id)
        .limit(10)
      const alreadyLinked = new Set(links.map((l) => l.entry.id))
      setLinkResults((data ?? []).filter((e) => !alreadyLinked.has(e.id)).slice(0, 8))
    }, 300)
    return () => clearTimeout(timer)
  }, [linkQuery, id, links])

  // Auto-save every 60s of inactivity
  useEffect(() => {
    if (!entry) return
    const timer = setTimeout(async () => {
      const html = contentRef.current
      if (html === lastSaved.current) return
      const { error } = await supabase.from('entries').update({ content: html, updated_at: new Date().toISOString() }).eq('id', id)
      if (!error) lastSaved.current = html
      else setToastMsg('Auto-save failed. Try again.')
    }, 60000)
    return () => clearTimeout(timer)
  }, [entry])

  // Save on unmount
  useEffect(() => {
    return () => {
      if (contentRef.current !== lastSaved.current) {
        supabase.from('entries').update({ content: contentRef.current, updated_at: new Date().toISOString() }).eq('id', id)
      }
    }
  }, [id])

  async function handleContentBlur() {
    const html = contentRef.current
    if (html === lastSaved.current) return
    const { error } = await supabase.from('entries').update({ content: html, updated_at: new Date().toISOString() }).eq('id', id)
    if (error) { setToastMsg('Save failed. Try again.'); return }
    lastSaved.current = html
  }

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
    setShowCategoryPicker(false)
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
      setShowLinkInput(false)
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
        <div className="px-8 py-8">
          <button
            onClick={() => navigate(-1)}
            className="text-[13px] text-gray-400 dark:text-[#555] hover:text-gray-700 dark:hover:text-gray-300 transition-colors mb-4 block"
          >
            ← Back
          </button>
          <p className="text-[13px] text-gray-400 dark:text-[#555]">Entry not found.</p>
        </div>
      ) : (
        <div className="px-8 py-8">
          {/* Action bar */}
          <div className="flex items-center justify-between mb-7">
            <button
              onClick={() => navigate(-1)}
              className="text-[13px] text-gray-400 dark:text-[#555] hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              ← Back
            </button>
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
          </div>

          {/* Title */}
          {editingTitle ? (
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
              className="text-[22px] font-semibold text-gray-900 dark:text-white leading-tight mb-6 w-full bg-transparent outline-none border-b border-[#e5e5e5] dark:border-[#2a2a2a] focus:border-indigo-500 transition-colors"
            />
          ) : (
            <h1
              onClick={() => { setTitleDraft(entry.title); setEditingTitle(true) }}
              className="text-[22px] font-semibold text-gray-900 dark:text-white leading-tight mb-6 cursor-text"
            >
              {entry.title}
            </h1>
          )}

          {/* Toolbar */}
          <Toolbar editor={editor} />

          {/* Editor */}
          <EditorContent editor={editor} />

          {/* Bottom action area */}
          <div className="mt-10 pt-6 border-t border-[#f0f0f0] dark:border-[#1e1e1e]">

            {/* Category chip */}
            {entry.categories && (
              <div className="flex items-center gap-1.5 mb-3">
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: entry.categories.color }} />
                <span className="text-[12px] text-gray-400 dark:text-[#555]">{entry.categories.name}</span>
                <button
                  onClick={() => saveCategoryEdit(null)}
                  className="text-[14px] leading-none text-gray-300 dark:text-[#444] hover:text-gray-500 dark:hover:text-[#666] transition-colors ml-0.5"
                  aria-label="Remove category"
                >×</button>
              </div>
            )}

            {/* Linked entries list */}
            {links.length > 0 && (
              <div className="mb-3 space-y-0.5">
                {links.map(({ linkId, entry: linked }) => (
                  <div key={linkId} className="flex items-center gap-2 group/link rounded-md px-2 py-1.5 hover:bg-[#f5f5f5] dark:hover:bg-[#161616] transition-colors">
                    <span className="text-gray-400 dark:text-[#3a3a3a] shrink-0"><IconNoteSm /></span>
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
                    >×</button>
                  </div>
                ))}
              </div>
            )}

            {/* Link search input */}
            {showLinkInput && (
              <div className="relative mb-4">
                <input
                  ref={linkInputRef}
                  type="text"
                  value={linkQuery}
                  onChange={(e) => setLinkQuery(e.target.value)}
                  onFocus={() => setShowLinkResults(true)}
                  onBlur={() => setTimeout(() => {
                    setShowLinkResults(false)
                    if (!linkQuery.trim()) setShowLinkInput(false)
                  }, 150)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') { setLinkQuery(''); setShowLinkResults(false); setShowLinkInput(false) }
                  }}
                  placeholder="Search entries to link…"
                  className="w-full bg-transparent text-[13px] text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-[#3a3a3a] outline-none border-b border-indigo-400 dark:border-indigo-500/60 py-1.5"
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
                        <span className="text-gray-400 dark:text-[#444] shrink-0"><IconNoteSm /></span>
                        <span className="text-[13px] text-gray-700 dark:text-gray-300 truncate">{result.title}</span>
                      </button>
                    ))}
                  </div>
                )}
                {showLinkResults && linkQuery.trim() && linkResults.length === 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 z-10 px-3 py-2 text-[12px] text-gray-500 dark:text-[#444] bg-white dark:bg-[#1c1c1c] border border-[#e5e5e5] dark:border-[#2a2a2a] rounded-lg">
                    No entries found
                  </div>
                )}
              </div>
            )}

            {/* Category picker */}
            {showCategoryPicker && (
              <div className="mb-4">
                <select
                  ref={categorySelectRef}
                  autoFocus
                  defaultValue={entry.category_id ?? ''}
                  onChange={(e) => saveCategoryEdit(e.target.value)}
                  onBlur={() => setShowCategoryPicker(false)}
                  className="text-[13px] bg-[#f5f5f5] dark:bg-[#1a1a1a] border border-[#e5e5e5] dark:border-[#2a2a2a] rounded-lg px-3 py-1.5 text-gray-700 dark:text-gray-300 outline-none cursor-pointer"
                >
                  <option value="">No category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* + action button */}
            <div className="relative w-fit">
              {showActionMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowActionMenu(false)} />
                  <div className="absolute bottom-full left-0 mb-2 z-20 bg-white dark:bg-[#1c1c1c] border border-[#e5e5e5] dark:border-[#2a2a2a] rounded-xl shadow-xl py-1 min-w-[160px] overflow-hidden">
                    <button
                      onClick={() => { setShowLinkInput(true); setShowActionMenu(false); setTimeout(() => linkInputRef.current?.focus(), 0) }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-[13px] text-gray-700 dark:text-gray-300 hover:bg-[#f5f5f5] dark:hover:bg-[#222] transition-colors"
                    >
                      <IconNoteSm />
                      Link Entry
                    </button>
                    <button
                      onClick={() => { setShowCategoryPicker(true); setShowActionMenu(false); setTimeout(() => categorySelectRef.current?.focus(), 0) }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-[13px] text-gray-700 dark:text-gray-300 hover:bg-[#f5f5f5] dark:hover:bg-[#222] transition-colors"
                    >
                      <svg width="12" height="12" viewBox="0 0 15 15" fill="none" className="shrink-0">
                        <circle cx="7.5" cy="7.5" r="5.5" stroke="currentColor" strokeWidth="1.5" />
                        <circle cx="7.5" cy="7.5" r="2" fill="currentColor" />
                      </svg>
                      Add to Category
                    </button>
                  </div>
                </>
              )}
              <button
                onClick={() => setShowActionMenu((p) => !p)}
                className={`w-7 h-7 rounded-full border flex items-center justify-center text-[18px] leading-none transition-colors ${
                  showActionMenu
                    ? 'border-indigo-400 text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40'
                    : 'border-[#e5e5e5] dark:border-[#2a2a2a] text-gray-400 dark:text-[#555] hover:border-[#ccc] dark:hover:border-[#444] hover:text-gray-600 dark:hover:text-gray-300'
                }`}
                aria-label="Add"
              >
                +
              </button>
            </div>
          </div>
        </div>
      )}
      {toastMsg && <Toast message={toastMsg} onDismiss={() => setToastMsg(null)} />}
    </Layout>
  )
}
