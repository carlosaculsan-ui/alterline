import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useParams, useNavigate, Navigate, useSearchParams } from 'react-router-dom'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import { TextStyle, FontSize } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import { Mark, mergeAttributes } from '@tiptap/core'
import Link from '@tiptap/extension-link'
import Layout from '../components/Layout'
import Toast from '../components/Toast'
import AIPanel from '../components/AIPanel'
import { supabase } from '../lib/supabase'
import { useWorld } from '../contexts/WorldContext'
import { exportAsMarkdown, exportAsHTML, exportAsPDF } from '../utils/exportEntry'


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
        supabase.from('entries').select('id, title').eq('type', 'carlopedia').ilike('title', `%${q}%`).is('deleted_at', null).limit(6),
        supabase.from('profile_fields').select('entry_id').eq('field_key', 'carlopedia'),
      ])
      let results = typed ?? []
      const pfIds = (pfRows ?? []).map((r) => r.entry_id)
      if (pfIds.length > 0) {
        const { data: pfEntries } = await supabase
          .from('entries').select('id, title').in('id', pfIds).ilike('title', `%${q}%`).is('deleted_at', null).limit(6)
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

function ToolBtn({ active, onAction, title, children, disabled }) {
  return (
    <button
      onMouseDown={(e) => { e.preventDefault(); if (!disabled) onAction() }}
      title={title}
      disabled={disabled}
      className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${
        disabled
          ? 'text-gray-900 dark:text-white opacity-25 cursor-default'
          : active
            ? 'bg-[#ebebeb] dark:bg-[#2a2a2a] text-gray-900 dark:text-white'
            : 'text-gray-900 dark:text-white hover:bg-[#f0f0f0] dark:hover:bg-[#222]'
      }`}
    >
      {children}
    </button>
  )
}

const FONT_SIZES = ['8','9','10','11','12','14','16','18','20','24','28','32','36','48','60','72']

function useScrollProgress() {
  const [progress, setProgress] = useState(0)
  useEffect(() => {
    const el = document.getElementById('main-scroll')
    if (!el) return
    function update() {
      const { scrollTop, scrollHeight, clientHeight } = el
      const max = scrollHeight - clientHeight
      setProgress(max > 0 ? (scrollTop / max) * 100 : 0)
    }
    el.addEventListener('scroll', update, { passive: true })
    return () => el.removeEventListener('scroll', update)
  }, [])
  return progress
}

function WordCountBar({ editor }) {
  const [, tick] = useState(0)
  useEffect(() => {
    if (!editor) return
    const update = () => tick(n => n + 1)
    editor.on('update', update)
    return () => editor.off('update', update)
  }, [editor])
  if (!editor) return null
  const t = editor.getText()
  const words = t.trim() ? t.trim().split(/\s+/).length : 0
  const chars = t.length
  const mins = Math.max(1, Math.ceil(words / 200))
  return (
    <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-[#444] mt-4 mb-2 select-none">
      <span>{words.toLocaleString()} words</span>
      <span>·</span>
      <span>{chars.toLocaleString()} characters</span>
      <span>·</span>
      <span>~{mins} min read</span>
    </div>
  )
}

function Toolbar({ editor, onBack, onAIToggle, aiActive, title, focusMode, onFocusToggle, saveStatus }) {
  const [, forceUpdate] = useState(0)
  const [showExport, setShowExport] = useState(false)
  const [showSaved, setShowSaved] = useState(false)
  useEffect(() => {
    if (saveStatus !== 'saved') return
    setShowSaved(true)
    const t = setTimeout(() => setShowSaved(false), 2500)
    return () => clearTimeout(t)
  }, [saveStatus])
  const exportRef = useRef(null)
  const exportDropdownRef = useRef(null)
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [linkDraft, setLinkDraft] = useState('')
  const linkBtnRef = useRef(null)
  const linkInputRef = useRef(null)
  const linkPortalRef = useRef(null)

  useEffect(() => {
    if (!editor) return
    const update = () => forceUpdate((n) => n + 1)
    editor.on('transaction', update)
    return () => editor.off('transaction', update)
  }, [editor])

  useEffect(() => {
    if (!showExport) return
    const onMouse = (e) => {
      const inButton = exportRef.current?.contains(e.target)
      const inDropdown = exportDropdownRef.current?.contains(e.target)
      if (!inButton && !inDropdown) setShowExport(false)
    }
    const onKey = (e) => { if (e.key === 'Escape') setShowExport(false) }
    document.addEventListener('mousedown', onMouse)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onMouse); document.removeEventListener('keydown', onKey) }
  }, [showExport])

  useEffect(() => {
    if (!showLinkInput) return
    linkInputRef.current?.focus()
    const onMouse = (e) => {
      const inBtn = linkBtnRef.current?.contains(e.target)
      const inPortal = linkPortalRef.current?.contains(e.target)
      if (!inBtn && !inPortal) setShowLinkInput(false)
    }
    const onKey = (e) => { if (e.key === 'Escape') setShowLinkInput(false) }
    document.addEventListener('mousedown', onMouse)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onMouse); document.removeEventListener('keydown', onKey) }
  }, [showLinkInput])

  if (!editor) return null
  if (focusMode) return null

  const editorSize = editor.getAttributes('textStyle').fontSize
  const currentSize = editorSize ? parseInt(editorSize).toString() : '14'

  function handleExport(format) {
    const html = editor.getHTML()
    const t = title || 'Untitled'
    if (format === 'Markdown') exportAsMarkdown(t, html)
    else if (format === 'HTML') exportAsHTML(t, html)
    else if (format === 'PDF') exportAsPDF(t, html)
  }

  function openLinkInput() {
    const existing = editor.getAttributes('link').href ?? ''
    setLinkDraft(existing)
    setShowLinkInput(true)
  }

  function applyLink() {
    const url = linkDraft.trim()
    if (!url) {
      editor.chain().focus().unsetLink().run()
    } else {
      const href = url.match(/^https?:\/\//) ? url : `https://${url}`
      editor.chain().focus().setLink({ href }).run()
    }
    setShowLinkInput(false)
    setLinkDraft('')
  }

  return (
    <div className="sticky top-0 z-10 -mx-4 sm:-mx-8 bg-white dark:bg-[#111] mb-6 border-b border-[#f0f0f0] dark:border-[#1e1e1e] relative">
      <div className="px-4 sm:px-8 pt-3 pb-3 flex items-center gap-0.5 overflow-x-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
      {onBack && (
        <>
          <button
            onClick={onBack}
            className="text-[14px] font-medium text-gray-900 dark:text-white hover:opacity-60 transition-opacity mr-4 shrink-0"
          >
            ← Back
          </button>
          <div className="w-px h-4 bg-[#e5e5e5] dark:bg-[#2a2a2a] mr-4 shrink-0" />
        </>
      )}
      <ToolBtn onAction={() => editor.chain().focus().undo().run()} title="Undo" disabled={!editor.can().undo()}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 7v6h6" /><path d="M3 13C5 7 10 4 16 6c3 1 5 3 6 6" />
        </svg>
      </ToolBtn>
      <ToolBtn onAction={() => editor.chain().focus().redo().run()} title="Redo" disabled={!editor.can().redo()}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 7v6h-6" /><path d="M21 13C19 7 14 4 8 6c-3 1-5 3-6 6" />
        </svg>
      </ToolBtn>

      <div className="w-px h-4 bg-[#e5e5e5] dark:bg-[#2a2a2a] mx-1 shrink-0" />

      <select
        value={currentSize}
        onChange={(e) => editor.chain().focus().setFontSize(`${e.target.value}px`).run()}
        className="w-16 text-[12px] text-center bg-white dark:bg-[#1c1c1c] text-gray-900 dark:text-white border border-[#e5e5e5] dark:border-[#2a2a2a] rounded px-1.5 py-1 outline-none cursor-pointer mr-1 shrink-0"
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
      <div className="relative shrink-0">
        <button
          ref={linkBtnRef}
          onMouseDown={(e) => { e.preventDefault(); if (editor.isActive('link')) { editor.chain().focus().unsetLink().run() } else { openLinkInput() } }}
          title={editor.isActive('link') ? 'Remove link' : 'Add link'}
          className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${editor.isActive('link') ? 'bg-[#ebebeb] dark:bg-[#2a2a2a] text-gray-900 dark:text-white' : 'text-gray-900 dark:text-white hover:bg-[#f0f0f0] dark:hover:bg-[#222]'}`}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
        </button>
        {showLinkInput && linkBtnRef.current && createPortal(
          <div
            ref={linkPortalRef}
            style={{
              position: 'fixed',
              top: linkBtnRef.current.getBoundingClientRect().bottom + 6,
              left: linkBtnRef.current.getBoundingClientRect().left,
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-[#1c1c1c] border border-[#e5e5e5] dark:border-[#2a2a2a] shadow-xl z-[9999]"
          >
            <input
              ref={linkInputRef}
              type="url"
              value={linkDraft}
              onChange={(e) => setLinkDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); applyLink() } }}
              placeholder="https://..."
              className="w-56 text-[13px] bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-[#555] outline-none"
            />
            <button
              onMouseDown={(e) => { e.preventDefault(); applyLink() }}
              className="text-[12px] font-medium text-indigo-600 dark:text-indigo-400 hover:opacity-70 transition-opacity shrink-0"
            >
              Apply
            </button>
          </div>,
          document.body
        )}
      </div>

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

      <div className="w-px h-4 bg-[#e5e5e5] dark:bg-[#2a2a2a] mx-1 shrink-0" />

      <ToolBtn active={editor.isActive('heading', { level: 1 })} onAction={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} title="Heading 1">
        <span className="text-[11px] font-bold">H1</span>
      </ToolBtn>
      <ToolBtn active={editor.isActive('heading', { level: 2 })} onAction={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Heading 2">
        <span className="text-[11px] font-bold">H2</span>
      </ToolBtn>
      <ToolBtn active={editor.isActive('heading', { level: 3 })} onAction={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="Heading 3">
        <span className="text-[11px] font-bold">H3</span>
      </ToolBtn>

      <div className="w-px h-4 bg-[#e5e5e5] dark:bg-[#2a2a2a] mx-1 shrink-0" />

      <ToolBtn active={editor.isActive('bulletList')} onAction={() => editor.chain().focus().toggleBulletList().run()} title="Bullet list">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="4" cy="6" r="1.5" fill="currentColor" stroke="none" />
          <circle cx="4" cy="12" r="1.5" fill="currentColor" stroke="none" />
          <circle cx="4" cy="18" r="1.5" fill="currentColor" stroke="none" />
          <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
        </svg>
      </ToolBtn>
      <ToolBtn active={editor.isActive('orderedList')} onAction={() => editor.chain().focus().toggleOrderedList().run()} title="Numbered list">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="10" y1="6" x2="21" y2="6" /><line x1="10" y1="12" x2="21" y2="12" /><line x1="10" y1="18" x2="21" y2="18" />
          <text x="2" y="8" fontSize="7" fontWeight="bold" fill="currentColor" stroke="none">1</text>
          <text x="2" y="14" fontSize="7" fontWeight="bold" fill="currentColor" stroke="none">2</text>
          <text x="2" y="20" fontSize="7" fontWeight="bold" fill="currentColor" stroke="none">3</text>
        </svg>
      </ToolBtn>

      <div className="flex-1" />

      {saveStatus === 'dirty' && (
        <span className="text-[11px] text-amber-500 dark:text-amber-400 mr-2 shrink-0 select-none" title="Unsaved changes">●</span>
      )}
      {saveStatus === 'saving' && (
        <span className="text-[11px] text-gray-600 dark:text-gray-400 mr-2 shrink-0 select-none">Saving…</span>
      )}
      {showSaved && saveStatus !== 'dirty' && (
        <span className="text-[11px] text-gray-600 dark:text-gray-400 mr-2 shrink-0 select-none">Saved ✓</span>
      )}

      <div className="relative shrink-0 mr-1">
        <button
          ref={exportRef}
          onClick={() => setShowExport(v => !v)}
          title="Export entry"
          className={`w-7 h-7 flex items-center justify-center rounded transition-colors text-gray-900 dark:text-white ${showExport ? 'bg-[#ebebeb] dark:bg-[#2a2a2a]' : 'hover:bg-[#f0f0f0] dark:hover:bg-[#222]'}`}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </button>
        {showExport && exportRef.current && createPortal(
          <div
            ref={exportDropdownRef}
            style={{
              position: 'fixed',
              top: exportRef.current.getBoundingClientRect().bottom + 6,
              right: window.innerWidth - exportRef.current.getBoundingClientRect().right,
            }}
            className="w-44 rounded-xl bg-white dark:bg-[#1c1c1c] border border-[#e5e5e5] dark:border-[#2a2a2a] shadow-xl z-[9999] py-1 overflow-hidden"
          >
            {['Markdown', 'HTML', 'PDF'].map(fmt => (
              <button
                key={fmt}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { handleExport(fmt); setShowExport(false) }}
                className="w-full text-left px-4 py-2 text-[13px] text-gray-900 dark:text-white hover:bg-[#f5f5f5] dark:hover:bg-[#252525] transition-colors"
              >
                Export as {fmt}
              </button>
            ))}
          </div>,
          document.body
        )}
      </div>

      <button
        onClick={onAIToggle}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px] font-semibold mr-3 shrink-0 transition-all ${
          aiActive
            ? 'bg-pink-500 text-white shadow-sm'
            : 'bg-pink-50 dark:bg-pink-950/50 text-pink-500 dark:text-pink-400 hover:bg-pink-100 dark:hover:bg-pink-900/60'
        }`}
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L13.8 8.2L20 10L13.8 11.8L12 18L10.2 11.8L4 10L10.2 8.2L12 2Z" />
          <path d="M19 16L19.9 18.1L22 19L19.9 19.9L19 22L18.1 19.9L16 19L18.1 18.1L19 16Z" opacity="0.7" />
        </svg>
        AI
      </button>

      <button
        onClick={onFocusToggle}
        title="Focus mode"
        className="w-7 h-7 flex items-center justify-center rounded transition-colors text-gray-900 dark:text-white hover:bg-[#f0f0f0] dark:hover:bg-[#222] shrink-0"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 3 21 3 21 9" />
          <polyline points="9 21 3 21 3 15" />
          <line x1="21" y1="3" x2="14" y2="10" />
          <line x1="3" y1="21" x2="10" y2="14" />
        </svg>
      </button>

      </div>
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white dark:from-[#111] to-transparent sm:hidden" aria-hidden="true" />
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
  const scrollProgress = useScrollProgress()
  const [focusMode, setFocusMode] = useState(false)
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
  const [saveStatus, setSaveStatus] = useState('saved')

  const lastSaved = useRef('')
  const contentRef = useRef('')
  const titleInputRef = useRef(null)
  const linkInputRef = useRef(null)
  const cancelTitle = useRef(false)
  const contentInitialized = useRef(false)
  const autoSaveTimer = useRef(null)

  const [searchParams] = useSearchParams()
  const [showAI, setShowAI] = useState(() => searchParams.get('ai') === '1')

  // @mention suggestion
  const { activeWorldId, activeWorld } = useWorld()
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
      StarterKit.configure({ underline: false, link: false }),
      Underline,
      TextStyle,
      FontSize,
      Color,
      Highlight.configure({ multicolor: true }),
      EntryLink,
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'external-link', target: '_blank', rel: 'noopener noreferrer' } }),
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
      setSaveStatus('dirty')
      clearTimeout(autoSaveTimer.current)
      autoSaveTimer.current = setTimeout(async () => {
        const html = contentRef.current
        if (html === lastSaved.current) { setSaveStatus('saved'); return }
        setSaveStatus('saving')
        const { error } = await supabase.from('entries').update({ content: html, updated_at: new Date().toISOString() }).eq('id', id)
        if (!error) { lastSaved.current = html; setSaveStatus('saved') }
        else { setToastMsg('Auto-save failed. Try again.'); setSaveStatus('dirty') }
      }, 3000)
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
    // Persist @mention as a graph edge (fire-and-forget, mirrors addLink duplicate-check)
    supabase.from('entry_links').select('id')
      .or(`and(from_entry_id.eq.${id},to_entry_id.eq.${entry.id}),and(from_entry_id.eq.${entry.id},to_entry_id.eq.${id})`)
      .maybeSingle()
      .then(({ data: existing }) => {
        if (!existing) supabase.from('entry_links').insert({ from_entry_id: id, to_entry_id: entry.id }).then(() => {})
      })
  }

  useEffect(() => {
    if (!mention || !activeWorldId) { setMentionResults([]); return }
    const q = mention.query.trim()
    const timer = setTimeout(async () => {
      const [{ data: typed }, { data: pfRows }] = await Promise.all([
        (() => {
          let query = supabase.from('entries').select('id, title')
            .eq('world_id', activeWorldId).eq('type', 'carlopedia').is('deleted_at', null).limit(6)
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
            .eq('world_id', activeWorldId).in('id', missing).is('deleted_at', null).limit(6)
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
    const q = linkQuery.trim().toLowerCase()
    if (!q) { setLinkResults([]); return }
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from('entries').select('id, title')
        .ilike('title', `%${q}%`).neq('id', id).is('deleted_at', null).limit(10)
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
      setSaveStatus('saving')
      const { error } = await supabase.from('entries').update({ content: html, updated_at: new Date().toISOString() }).eq('id', id)
      if (!error) { lastSaved.current = html; setSaveStatus('saved') }
      else { setToastMsg('Auto-save failed. Try again.'); setSaveStatus('dirty') }
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

  useEffect(() => {
    if (!focusMode) return
    function onKey(e) { if (e.key === 'Escape') setFocusMode(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [focusMode])

  async function handleContentBlur() {
    clearTimeout(autoSaveTimer.current)
    const html = contentRef.current
    if (html === lastSaved.current) { setSaveStatus('saved'); return }
    setSaveStatus('saving')
    const { error } = await supabase.from('entries').update({ content: html, updated_at: new Date().toISOString() }).eq('id', id)
    if (error) { setToastMsg('Save failed. Try again.'); setSaveStatus('dirty'); return }
    lastSaved.current = html
    setSaveStatus('saved')
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
    supabase.from('entries').update({ deleted_at: new Date().toISOString() }).eq('id', id).then(() => navigate('/'))
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
    <Layout focusMode={focusMode}>
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          height: '2px',
          width: `${scrollProgress}%`,
          background: '#6366f1',
          zIndex: 9999,
          transition: 'width 80ms linear',
          pointerEvents: 'none',
        }}
      />
      {focusMode && (
        <button
          onClick={() => setFocusMode(false)}
          title="Exit focus mode (Esc)"
          className="fixed top-4 right-5 z-[9999] w-8 h-8 flex items-center justify-center rounded-lg text-gray-900 dark:text-white hover:bg-[#f0f0f0] dark:hover:bg-[#222] transition-all opacity-60 hover:opacity-100"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="4 14 4 20 10 20" />
            <polyline points="20 10 20 4 14 4" />
            <line x1="14" y1="10" x2="20" y2="4" />
            <line x1="4" y1="20" x2="10" y2="14" />
          </svg>
        </button>
      )}
      {loading ? (
        <LoadingSkeleton />
      ) : !entry ? (
        <div className="px-4 py-6 sm:px-8 sm:py-8">
          <button onClick={() => navigate('/')} className="text-[13px] text-gray-400 dark:text-[#555] hover:text-gray-700 dark:hover:text-gray-300 transition-colors mb-4 block">
            ← Back
          </button>
          <p className="text-[13px] text-gray-400 dark:text-[#555]">Entry not found.</p>
        </div>
      ) : (
        <div className="px-4 py-6 sm:px-8 sm:py-8">
          <Toolbar editor={editor} onBack={() => navigate('/')} onAIToggle={() => setShowAI((v) => !v)} aiActive={showAI} title={entry?.title} focusMode={focusMode} onFocusToggle={() => setFocusMode(true)} saveStatus={saveStatus} />

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
          <WordCountBar editor={editor} />

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

      {showAI && (
        <AIPanel
          worldId={activeWorldId}
          worldName={activeWorld?.name}
          entryTitle={entry?.title}
          getContent={() => contentRef.current}
          onClose={() => setShowAI(false)}
        />
      )}

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
