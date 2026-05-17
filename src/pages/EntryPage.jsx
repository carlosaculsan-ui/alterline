import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Navigate } from 'react-router-dom'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import { TextStyle, FontSize } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import { Mark, mergeAttributes } from '@tiptap/core'
import Layout from '../components/Layout'
import Toast from '../components/Toast'
import { supabase } from '../lib/supabase'
import { useWorld } from '../contexts/WorldContext'


const EntryLink = Mark.create({
  name: 'entryLink',
  priority: 1001,

  addAttributes() {
    return {
      entryId: {
        default: null,
        parseHTML: (el) => el.getAttribute('data-entry-id'),
        renderHTML: (attrs) => attrs.entryId ? { 'data-entry-id': attrs.entryId } : {},
      },
    }
  },

  parseHTML() {
    return [{ tag: 'a[data-entry-id]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['a', mergeAttributes({ class: 'entry-link' }, HTMLAttributes), 0]
  },
})

function EntryLinkBubble({ editor, range, onSaveAndNavigate, onError }) {
  const { activeWorldId } = useWorld()
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState('default') // 'default' | 'search'
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const searchInputRef = useRef(null)

  const isOnLink = editor.isActive('entryLink')
  const linkedEntryId = editor.getAttributes('entryLink').entryId

  useEffect(() => {
    if (mode === 'search') setTimeout(() => searchInputRef.current?.focus(), 0)
  }, [mode])

  useEffect(() => {
    if (mode !== 'search') return
    const q = searchQuery.trim()
    if (!q) { setSearchResults([]); return }

    const timer = setTimeout(async () => {
      setSearchLoading(true)
      const [{ data: typed }, { data: pfRows }] = await Promise.all([
        supabase.from('entries').select('id, title').eq('type', 'carlopedia').ilike('title', `%${q}%`).limit(6),
        supabase.from('profile_fields').select('entry_id').eq('field_key', 'carlopedia'),
      ])
      let results = typed ?? []
      const pfIds = (pfRows ?? []).map((r) => r.entry_id)
      if (pfIds.length > 0) {
        const { data: pfEntries } = await supabase
          .from('entries').select('id, title').in('id', pfIds).ilike('title', `%${q}%`).limit(6)
        const seen = new Set(results.map((e) => e.id))
        results = [...results, ...(pfEntries ?? []).filter((e) => !seen.has(e.id))]
      }
      setSearchResults(results.slice(0, 6))
      setSearchLoading(false)
    }, 200)

    return () => clearTimeout(timer)
  }, [searchQuery, mode])

  function linkExisting(article) {
    editor.chain()
      .setTextSelection({ from: range.from, to: range.to })
      .setMark('entryLink', { entryId: article.id })
      .run()
  }

  async function handleCreate(e) {
    e.preventDefault()
    if (!range || !range.text.trim()) return
    setLoading(true)

    let usedFallback = false
    let result = await supabase
      .from('entries')
      .insert({ title: range.text.trim(), type: 'carlopedia', category_id: null, world_id: activeWorldId })
      .select('id')
      .single()

    if (result.error) {
      usedFallback = true
      result = await supabase
        .from('entries')
        .insert({ title: range.text.trim(), type: 'story', category_id: null, world_id: activeWorldId })
        .select('id')
        .single()
    }

    const { data: created, error } = result

    if (!error && created) {
      if (usedFallback) {
        await supabase.from('profile_fields').insert({
          entry_id: created.id,
          field_key: 'carlopedia',
          field_value: 'true',
        })
      }
      editor.chain().setTextSelection({ from: range.from, to: range.to }).setMark('entryLink', { entryId: created.id }).run()
      onSaveAndNavigate(created.id, `/carlopedia/${created.id}`)
    } else {
      console.error('[Carlopedia] insert failed:', error)
      onError?.(`Could not create article: ${error?.message ?? 'unknown error'}`)
      setLoading(false)
    }
  }

  if (isOnLink && linkedEntryId) {
    return (
      <div className="flex items-center bg-white dark:bg-[#1c1c1c] border border-[#e5e5e5] dark:border-[#2a2a2a] rounded-lg shadow-xl overflow-hidden">
        <button
          onMouseDown={(e) => { e.preventDefault(); onSaveAndNavigate(linkedEntryId) }}
          className="px-3 py-2 text-[12px] font-medium text-indigo-600 dark:text-indigo-400 hover:bg-[#f5f5f5] dark:hover:bg-[#222] transition-colors whitespace-nowrap"
        >
          Open Carlopedia →
        </button>
        <div className="w-px h-4 bg-[#e5e5e5] dark:bg-[#2a2a2a] shrink-0" />
        <button
          onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().unsetMark('entryLink').run() }}
          className="px-3 py-2 text-[12px] font-medium text-gray-400 dark:text-[#555] hover:text-gray-700 dark:hover:text-gray-300 hover:bg-[#f5f5f5] dark:hover:bg-[#222] transition-colors whitespace-nowrap"
        >
          Unlink
        </button>
      </div>
    )
  }

  if (mode === 'search') {
    return (
      <div className="bg-white dark:bg-[#1c1c1c] border border-[#e5e5e5] dark:border-[#2a2a2a] rounded-lg shadow-xl overflow-hidden w-52">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-[#f0f0f0] dark:border-[#2a2a2a]">
          <input
            ref={searchInputRef}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') { setMode('default'); setSearchQuery('') }
            }}
            placeholder="Search Carlopedia…"
            className="flex-1 text-[12px] bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-[#555] outline-none"
          />
          <button
            onMouseDown={(e) => { e.preventDefault(); setMode('default'); setSearchQuery('') }}
            className="text-[15px] leading-none text-gray-400 dark:text-[#555] hover:text-gray-700 dark:hover:text-gray-300 transition-colors shrink-0"
          >
            ×
          </button>
        </div>
        {!searchQuery.trim() ? (
          <div className="px-3 py-2 text-[11px] text-gray-400 dark:text-[#555]">Type to search…</div>
        ) : searchLoading ? (
          <div className="px-3 py-2 text-[11px] text-gray-400 dark:text-[#555]">Searching…</div>
        ) : searchResults.length === 0 ? (
          <div className="px-3 py-2 text-[11px] text-gray-400 dark:text-[#555]">No articles found</div>
        ) : (
          searchResults.map((article) => (
            <button
              key={article.id}
              onMouseDown={(e) => { e.preventDefault(); linkExisting(article) }}
              className="w-full text-left px-3 py-2 text-[12px] text-gray-900 dark:text-white hover:bg-[#f5f5f5] dark:hover:bg-[#222] transition-colors truncate border-t border-[#f5f5f5] dark:border-[#222] first:border-t-0"
            >
              {article.title}
            </button>
          ))
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center bg-white dark:bg-[#1c1c1c] border border-[#e5e5e5] dark:border-[#2a2a2a] rounded-lg shadow-xl overflow-hidden">
      <button
        onMouseDown={handleCreate}
        disabled={loading}
        className="px-3 py-2 text-[12px] font-medium text-gray-900 dark:text-white hover:bg-[#f5f5f5] dark:hover:bg-[#222] disabled:opacity-50 transition-colors whitespace-nowrap"
      >
        {loading ? 'Creating…' : '+ Create Carlopedia'}
      </button>
      <div className="w-px h-4 bg-[#e5e5e5] dark:bg-[#2a2a2a] shrink-0" />
      <button
        onMouseDown={(e) => { e.preventDefault(); setMode('search') }}
        className="px-3 py-2 text-[12px] font-medium text-gray-400 dark:text-[#555] hover:text-gray-700 dark:hover:text-gray-300 hover:bg-[#f5f5f5] dark:hover:bg-[#222] transition-colors whitespace-nowrap"
      >
        Link existing
      </button>
    </div>
  )
}

function ToolBtn({ active, onAction, title, children }) {
  return (
    <button
      onMouseDown={(e) => { e.preventDefault(); onAction() }}
      title={title}
      className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${
        active
          ? 'bg-[#ebebeb] dark:bg-[#2a2a2a] text-gray-900 dark:text-white'
          : 'text-gray-900 dark:text-white hover:bg-[#f0f0f0] dark:hover:bg-[#222]'
      }`}
    >
      {children}
    </button>
  )
}

const FONT_SIZES = ['8','9','10','11','12','14','16','18','20','24','28','32','36','48','60','72']

function Toolbar({ editor, onBack, onDelete, confirmDelete, deleting }) {
  const [, forceUpdate] = useState(0)

  useEffect(() => {
    if (!editor) return
    const update = () => forceUpdate((n) => n + 1)
    editor.on('transaction', update)
    return () => editor.off('transaction', update)
  }, [editor])

  if (!editor) return null

  const editorSize = editor.getAttributes('textStyle').fontSize
  const currentSize = editorSize ? parseInt(editorSize).toString() : '14'

  return (
    <div className="sticky top-0 z-10 -mx-4 px-4 sm:-mx-8 sm:px-8 pt-3 bg-white dark:bg-[#111] flex items-center gap-0.5 mb-6 pb-3 border-b border-[#f0f0f0] dark:border-[#1e1e1e]">
      {onBack && (
        <>
          <button
            onClick={onBack}
            className="text-[14px] font-medium text-gray-900 dark:text-white hover:opacity-60 transition-opacity mr-4"
          >
            ← Back
          </button>
          <div className="w-px h-4 bg-[#e5e5e5] dark:bg-[#2a2a2a] mr-4 shrink-0" />
        </>
      )}
      <select
        value={currentSize}
        onChange={(e) => editor.chain().focus().setFontSize(`${e.target.value}px`).run()}
        className="w-16 text-[12px] text-center bg-white dark:bg-[#1c1c1c] text-gray-900 dark:text-white border border-[#e5e5e5] dark:border-[#2a2a2a] rounded px-1.5 py-1 outline-none cursor-pointer mr-1"
      >
        {FONT_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
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

      <label className="relative w-7 h-7 flex flex-col items-center justify-center rounded cursor-pointer hover:bg-[#f0f0f0] dark:hover:bg-[#222] transition-colors" title="Text color">
        <span className="text-[13px] font-bold text-gray-900 dark:text-white select-none leading-none">A</span>
        <span className="absolute bottom-1 left-1.5 right-1.5 h-[2.5px] rounded-full" style={{ backgroundColor: editor.getAttributes('textStyle').color ?? '#888888' }} />
        <input type="color" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onInput={(e) => editor.chain().focus().setColor(e.target.value).run()} />
      </label>

      <label className="relative w-7 h-7 flex items-center justify-center rounded cursor-pointer hover:bg-[#f0f0f0] dark:hover:bg-[#222] transition-colors" title="Highlight color">
        <svg width="14" height="14" viewBox="0 0 15 15" fill="none" className="text-gray-900 dark:text-white">
          <path d="M2 11.5h3.5L13 4 11 2 3.5 9.5 2 11.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
          <path d="M1 14h5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
        <input type="color" defaultValue="#fef08a" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onInput={(e) => editor.chain().focus().setHighlight({ color: e.target.value }).run()} />
      </label>

      <div className="flex-1" />

      <button
        onClick={onDelete}
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
    <div className="px-4 py-6 sm:px-8 sm:py-8 animate-pulse">
      <div className="h-px bg-[#f0f0f0] dark:bg-[#1e1e1e] mb-6" />
      <div className="h-8 bg-[#f0f0f0] dark:bg-[#1e1e1e] rounded w-2/3 mb-8" />
      <div className="space-y-2.5">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-4 bg-[#f0f0f0] dark:bg-[#1e1e1e] rounded" style={{ width: `${92 - i * 8}%` }} />
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
  const [isCarlopediaEntry, setIsCarlopediaEntry] = useState(false)
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

  const lastSaved = useRef('')
  const contentRef = useRef('')
  const titleInputRef = useRef(null)
  const linkInputRef = useRef(null)
  const cancelTitle = useRef(false)
  const contentInitialized = useRef(false)

  // @mention suggestion
  const { activeWorldId } = useWorld()
  const [mention, setMentionRaw] = useState(null)
  const [mentionResults, setMentionResultsRaw] = useState([])
  const [mentionIndex, setMentionIndexRaw] = useState(0)
  const mentionRef = useRef(null)
  const mentionResultsRef = useRef([])
  const mentionIndexRef = useRef(0)
  const doInsertMention = useRef(null)
  const checkMentionRef = useRef(null)
  function setMention(m) { mentionRef.current = m; setMentionRaw(m) }
  function setMentionResults(r) { mentionResultsRef.current = r; setMentionResultsRaw(r) }
  function setMentionIndex(i) { mentionIndexRef.current = i; setMentionIndexRaw(i) }

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ underline: false }),
      Underline,
      TextStyle,
      FontSize,
      Color,
      Highlight.configure({ multicolor: true }),
      EntryLink,
    ],
    editorProps: {
      attributes: {
        class: 'outline-none min-h-[calc(100vh-260px)] text-[14px] text-gray-900 dark:text-white leading-[1.75]',
      },
      handleClick(view, pos, event) {
        const target = event.target.closest('a[data-entry-id]')
        if (target) {
          event.preventDefault()
          const entryId = target.getAttribute('data-entry-id')
          if (entryId) navigate(`/entry/${entryId}`)
          return true
        }
        return false
      },
      handleKeyDown(view, event) {
        if (!mentionRef.current) return false
        const results = mentionResultsRef.current
        if (event.key === 'ArrowDown') {
          if (results.length === 0) return false
          const next = Math.min(mentionIndexRef.current + 1, results.length - 1)
          mentionIndexRef.current = next; setMentionIndexRaw(next)
          return true
        }
        if (event.key === 'ArrowUp') {
          if (results.length === 0) return false
          const next = Math.max(mentionIndexRef.current - 1, 0)
          mentionIndexRef.current = next; setMentionIndexRaw(next)
          return true
        }
        if (event.key === 'Enter' && results.length > 0) {
          doInsertMention.current?.(results[mentionIndexRef.current])
          return true
        }
        if (event.key === 'Escape' && mentionRef.current) {
          mentionRef.current = null; setMentionRaw(null)
          return true
        }
        return false
      },
    },
    onUpdate({ editor }) {
      contentRef.current = editor.getHTML()
      checkMentionRef.current?.(editor)
    },
    onSelectionUpdate({ editor }) {
      checkMentionRef.current?.(editor)
    },
    onBlur() {
      handleContentBlur()
      mentionRef.current = null; setMentionRaw(null)
    },
  })

  const [bubbleRect, setBubbleRect] = useState(null)
  const [bubbleRange, setBubbleRange] = useState(null)

  useEffect(() => {
    if (!editor) return
    const update = () => {
      const { from, to } = editor.state.selection
      if (from === to) { setBubbleRect(null); setBubbleRange(null); return }
      const domSel = window.getSelection()
      if (!domSel || domSel.rangeCount === 0) { setBubbleRect(null); return }
      const r = domSel.getRangeAt(0).getBoundingClientRect()
      if (r.width > 0) {
        setBubbleRect(r)
        setBubbleRange({ from, to, text: editor.state.doc.textBetween(from, to, '') })
      } else {
        setBubbleRect(null)
        setBubbleRange(null)
      }
    }
    const clear = () => { setBubbleRect(null); setBubbleRange(null) }
    editor.on('selectionUpdate', update)
    editor.on('blur', clear)
    return () => { editor.off('selectionUpdate', update); editor.off('blur', clear) }
  }, [editor])

  // @mention: detect trigger pattern and fetch suggestions
  checkMentionRef.current = function checkMentionTrigger(ed) {
    const { selection, doc } = ed.state
    if (!selection.empty) { setMention(null); return }
    const { $from } = selection
    const textBefore = doc.textBetween(Math.max(0, $from.pos - 60), $from.pos, '\n', '￼')
    const match = /@([^@\n]{0,40})$/.exec(textBefore)
    if (match) {
      const from = $from.pos - match[0].length
      const coords = ed.view.coordsAtPos($from.pos)
      setMention({ query: match[1], from, to: $from.pos, coords })
      setMentionIndex(0)
    } else {
      setMention(null)
    }
  }

  doInsertMention.current = function insertMention(entry) {
    const m = mentionRef.current
    if (!m || !editor) return
    const title = entry.title
    editor.chain()
      .focus()
      .deleteRange({ from: m.from, to: m.to })
      .insertContentAt(m.from, {
        type: 'text',
        text: title,
        marks: [{ type: 'entryLink', attrs: { entryId: entry.id } }],
      })
      .setTextSelection(m.from + title.length)
      .unsetMark('entryLink')
      .run()
    setMention(null)
    setMentionResults([])
  }

  useEffect(() => {
    if (!mention || !activeWorldId) { setMentionResults([]); return }
    const q = mention.query.trim()
    const timer = setTimeout(async () => {
      const [{ data: typed }, { data: pfRows }] = await Promise.all([
        (() => {
          let query = supabase.from('entries').select('id, title')
            .eq('world_id', activeWorldId).eq('type', 'carlopedia').limit(6)
          if (q) query = query.ilike('title', `%${q}%`)
          return query
        })(),
        supabase.from('profile_fields').select('entry_id').eq('field_key', 'carlopedia'),
      ])
      let results = typed ?? []
      const pfIds = (pfRows ?? []).map((r) => r.entry_id)
      if (pfIds.length > 0) {
        const seen = new Set(results.map((e) => e.id))
        const missing = pfIds.filter((id) => !seen.has(id))
        if (missing.length > 0) {
          let fbQuery = supabase.from('entries').select('id, title')
            .eq('world_id', activeWorldId).in('id', missing).limit(6)
          if (q) fbQuery = fbQuery.ilike('title', `%${q}%`)
          const { data: fb } = await fbQuery
          results = [...results, ...(fb ?? [])]
        }
      }
      results.sort((a, b) => a.title.localeCompare(b.title))
      setMentionResults(results.slice(0, 6))
    }, q ? 120 : 0)
    return () => clearTimeout(timer)
  }, [mention?.query, activeWorldId])

  useEffect(() => {
    Promise.all([
      supabase.from('entries').select('*, categories(name, color)').eq('id', id).single(),
      supabase.from('profile_fields').select('id').eq('entry_id', id).eq('field_key', 'carlopedia').maybeSingle(),
    ]).then(async ([{ data, error }, { data: carlopediaField }]) => {
      if (!error && data) {
        setEntry(data)
        if (carlopediaField) setIsCarlopediaEntry(true)
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
            .from('entries').select('id, title').in('id', linkedIds)
          setLinks(
            linkRows
              .map((row) => {
                const otherId = row.from_entry_id === id ? row.to_entry_id : row.from_entry_id
                return { linkId: row.id, entry: (linkedEntries ?? []).find((e) => e.id === otherId) }
              })
              .filter((l) => l.entry)
          )
        }
      }
      setLoading(false)
    })
  }, [id])

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
        .from('entries').select('id, title')
        .ilike('title', `%${q}%`).neq('id', id).limit(10)
      const alreadyLinked = new Set(links.map((l) => l.entry.id))
      setLinkResults((data ?? []).filter((e) => !alreadyLinked.has(e.id)).slice(0, 8))
    }, 300)
    return () => clearTimeout(timer)
  }, [linkQuery, id, links])

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

  function saveAndNavigate(targetId, path) {
    if (editor) contentRef.current = editor.getHTML()
    const destination = path ?? `/entry/${targetId}`
    const state = destination.startsWith('/carlopedia/') ? { from: `/entry/${id}` } : undefined
    navigate(destination, state ? { state } : undefined)
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

  async function addLink(targetEntry) {
    const { data: existing } = await supabase
      .from('entry_links').select('id')
      .or(`and(from_entry_id.eq.${id},to_entry_id.eq.${targetEntry.id}),and(from_entry_id.eq.${targetEntry.id},to_entry_id.eq.${id})`)
      .maybeSingle()
    if (existing) return
    const { data: row, error } = await supabase
      .from('entry_links').insert({ from_entry_id: id, to_entry_id: targetEntry.id })
      .select('id').single()
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

  if (!loading && (entry?.type === 'carlopedia' || isCarlopediaEntry)) {
    return <Navigate to={`/carlopedia/${id}`} replace />
  }

  return (
    <Layout>
      {loading ? (
        <LoadingSkeleton />
      ) : !entry ? (
        <div className="px-4 py-6 sm:px-8 sm:py-8">
          <button onClick={() => navigate(-1)} className="text-[13px] text-gray-400 dark:text-[#555] hover:text-gray-700 dark:hover:text-gray-300 transition-colors mb-4 block">
            ← Back
          </button>
          <p className="text-[13px] text-gray-400 dark:text-[#555]">Entry not found.</p>
        </div>
      ) : (
        <div className="px-4 py-6 sm:px-8 sm:py-8">
          <Toolbar editor={editor} onBack={() => navigate(-1)} onDelete={handleDelete} confirmDelete={confirmDelete} deleting={deleting} />

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

          <EditorContent editor={editor} />

          {/* Linked entries */}
          <div className="mt-10 pt-6 border-t border-[#f0f0f0] dark:border-[#1e1e1e]">
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
                    >×</button>
                  </div>
                ))}
              </div>
            )}

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

            {!showLinkInput && (
              <button
                onClick={() => { setShowLinkInput(true); setTimeout(() => linkInputRef.current?.focus(), 0) }}
                className="text-[12px] text-gray-400 dark:text-[#555] hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                + Link entry
              </button>
            )}
          </div>
        </div>
      )}

      {toastMsg && <Toast message={toastMsg} onDismiss={() => setToastMsg(null)} />}

      {mention && (
        <div
          className="fixed z-[60] bg-white dark:bg-[#1c1c1c] border border-[#e5e5e5] dark:border-[#2a2a2a] rounded-xl shadow-xl overflow-hidden w-56 py-1"
          style={{ left: mention.coords.left, top: mention.coords.bottom + 6 }}
        >
          {mentionResults.length === 0 ? (
            <div className="px-3 py-2 text-[12px] text-gray-400 dark:text-[#555]">
              {mention.query.trim() ? 'No articles found' : 'Type to search Carlopedia…'}
            </div>
          ) : (
            mentionResults.map((entry, i) => (
              <button
                key={entry.id}
                onMouseDown={(e) => { e.preventDefault(); doInsertMention.current?.(entry) }}
                className={`w-full text-left px-3 py-2 text-[13px] flex items-center gap-2 transition-colors ${
                  i === mentionIndex
                    ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
                    : 'text-gray-900 dark:text-white hover:bg-[#f5f5f5] dark:hover:bg-[#1a1a1a]'
                }`}
              >
                <span className="text-[10px] opacity-40 shrink-0">@</span>
                <span className="truncate">{entry.title}</span>
              </button>
            ))
          )}
        </div>
      )}

      {bubbleRect && editor && entry && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            left: bubbleRect.left + bubbleRect.width / 2,
            top: bubbleRect.top - 8,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div className="pointer-events-auto">
            <EntryLinkBubble editor={editor} range={bubbleRange} onSaveAndNavigate={saveAndNavigate} onError={setToastMsg} />
          </div>
        </div>
      )}
    </Layout>
  )
}
