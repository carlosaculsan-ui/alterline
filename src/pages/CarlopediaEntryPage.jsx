import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
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
  parseHTML() { return [{ tag: 'a[data-entry-id]' }] },
  renderHTML({ HTMLAttributes }) {
    return ['a', mergeAttributes({ class: 'entry-link' }, HTMLAttributes), 0]
  },
})

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
  const currentSize = editorSize ? parseInt(editorSize).toString() : '15'

  return (
    <div className="sticky top-0 z-10 bg-white dark:bg-[#111] border-b border-[#f0f0f0] dark:border-[#1e1e1e] px-8 py-2.5 flex items-center gap-0.5">
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

async function compressImage(file) {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const maxW = 1600
      const scale = Math.min(1, maxW / img.width)
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.82))
    }
    img.src = url
  })
}

function LoadingSkeleton() {
  return (
    <>
      <div className="w-full h-[200px] bg-[#f0f0f0] dark:bg-[#1c1c1c] animate-pulse" />
      <div className="bg-white px-8 py-8 animate-pulse max-w-[720px] mx-auto">
        <div className="h-9 bg-[#f0f0f0] rounded w-2/3 mb-4" />
        <div className="h-px bg-[#f0f0f0] mb-6" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-4 bg-[#f0f0f0] rounded" style={{ width: `${90 - i * 8}%` }} />
          ))}
        </div>
      </div>
    </>
  )
}

export default function CarlopediaEntryPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [entry, setEntry] = useState(null)
  const [loading, setLoading] = useState(true)
  const [coverImage, setCoverImage] = useState(null)
  const [coverFieldId, setCoverFieldId] = useState(null)
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [toastMsg, setToastMsg] = useState(null)

  const contentRef = useRef('')
  const lastSaved = useRef('')
  const contentInitialized = useRef(false)
  const cancelTitle = useRef(false)
  const titleInputRef = useRef(null)
  const confirmDeleteTimer = useRef(null)
  const imageInputRef = useRef(null)

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
        class: 'outline-none min-h-[400px] text-[15px] text-gray-800 leading-[1.75]',
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
    },
    onUpdate({ editor }) {
      contentRef.current = editor.getHTML()
    },
    onBlur() {
      handleContentBlur()
    },
  })

  useEffect(() => {
    supabase
      .from('entries')
      .select('*')
      .eq('id', id)
      .single()
      .then(async ({ data, error }) => {
        if (!error && data) {
          setEntry(data)
          lastSaved.current = data.content ?? ''
          contentRef.current = data.content ?? ''

          const { data: field } = await supabase
            .from('profile_fields')
            .select('id, field_value')
            .eq('entry_id', id)
            .eq('field_key', 'cover_image')
            .maybeSingle()

          if (field) {
            setCoverImage(field.field_value)
            setCoverFieldId(field.id)
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
    if (!entry) return
    const timer = setTimeout(async () => {
      const html = contentRef.current
      if (html === lastSaved.current) return
      const { error } = await supabase.from('entries').update({ content: html, updated_at: new Date().toISOString() }).eq('id', id)
      if (!error) lastSaved.current = html
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
    if (!error) lastSaved.current = html
  }

  async function handleImageUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    e.target.value = ''
    const compressed = await compressImage(file)
    setCoverImage(compressed)
    if (coverFieldId) {
      await supabase.from('profile_fields').update({ field_value: compressed }).eq('id', coverFieldId)
    } else {
      const { data } = await supabase.from('profile_fields').insert({
        entry_id: id,
        field_key: 'cover_image',
        field_value: compressed,
      }).select('id').single()
      if (data) setCoverFieldId(data.id)
    }
  }

  async function removeImage() {
    if (!coverFieldId) return
    await supabase.from('profile_fields').delete().eq('id', coverFieldId)
    setCoverImage(null)
    setCoverFieldId(null)
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
    supabase.from('profile_fields').delete().eq('entry_id', id).then(() =>
      supabase.from('entries').delete().eq('id', id).then(() => navigate('/carlopedia'))
    )
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
    if (error) { setToastMsg('Save failed.'); setEntry((prev) => ({ ...prev, title: entry.title })) }
  }

  if (loading) return <Layout wide><LoadingSkeleton /></Layout>
  if (!entry) return (
    <Layout wide>
      <div className="px-8 py-8">
        <button onClick={() => navigate('/carlopedia')} className="text-[13px] text-gray-400 dark:text-[#555] hover:text-gray-600 dark:hover:text-gray-300 transition-colors mb-4 block">← Carlopedia</button>
        <p className="text-[13px] text-gray-400 dark:text-[#555]">Article not found.</p>
      </div>
    </Layout>
  )

  return (
    <Layout wide>
      {/* Toolbar — follows dark mode */}
      <Toolbar editor={editor} onBack={() => navigate('/carlopedia')} onDelete={handleDelete} confirmDelete={confirmDelete} deleting={deleting} />

      {/* Cover image — placeholder follows dark mode, actual photo is always full color */}
      <div
        className="relative group w-full overflow-hidden cursor-pointer bg-[#f0f0f0] dark:bg-[#1a1a1a]"
        style={{ height: coverImage ? '280px' : '140px' }}
        onClick={() => imageInputRef.current?.click()}
      >
        {coverImage ? (
          <img src={coverImage} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 select-none">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" className="text-gray-300 dark:text-[#333]">
              <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="8.5" cy="10" r="1.5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M3 16l5-4 4 3 3-2.5 6 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>
            <span className="text-[12px] text-gray-400 dark:text-[#444]">Add cover image</span>
          </div>
        )}

        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-end p-3 gap-2 bg-black/10">
          <span className="bg-white/90 text-[12px] text-gray-800 px-3 py-1.5 rounded-full font-medium shadow-sm">
            {coverImage ? 'Change photo' : 'Add photo'}
          </span>
          {coverImage && (
            <button
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); removeImage() }}
              className="bg-white/90 text-[12px] text-red-500 px-3 py-1.5 rounded-full font-medium shadow-sm hover:bg-white transition-colors"
            >
              Remove
            </button>
          )}
        </div>

        <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
      </div>

      {/* White article canvas — ALWAYS white regardless of dark mode */}
      <div className="bg-white" style={{ minHeight: 'calc(100vh - 200px)' }}>
        <div className="max-w-[720px] mx-auto px-8 py-8">
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
              className="text-[32px] font-bold text-gray-900 leading-tight mb-4 w-full bg-transparent outline-none border-b-2 border-indigo-400"
            />
          ) : (
            <h1
              onClick={() => { setTitleDraft(entry.title); setEditingTitle(true) }}
              className="text-[32px] font-bold text-gray-900 leading-tight mb-4 cursor-text"
            >
              {entry.title}
            </h1>
          )}

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-[10px] uppercase tracking-widest text-gray-300 font-medium select-none">Article</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <EditorContent editor={editor} />
        </div>
      </div>

      {toastMsg && <Toast message={toastMsg} onDismiss={() => setToastMsg(null)} />}
    </Layout>
  )
}
