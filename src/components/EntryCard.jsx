import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createPortal } from 'react-dom'

function IconNote() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" className="shrink-0">
      <rect x="3.5" y="2.5" width="13" height="15" rx="1.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M7 7h6M7 10h6M7 13h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  )
}

const CARD_COLORS = [
  { id: 'default', value: null,      swatch: null },
  { id: 'rose',    value: '#fee2e2', swatch: '#f87171' },
  { id: 'amber',   value: '#fef3c7', swatch: '#fbbf24' },
  { id: 'lime',    value: '#dcfce7', swatch: '#4ade80' },
  { id: 'teal',    value: '#ccfbf1', swatch: '#2dd4bf' },
  { id: 'blue',    value: '#dbeafe', swatch: '#60a5fa' },
  { id: 'violet',  value: '#ede9fe', swatch: '#a78bfa' },
  { id: 'pink',    value: '#fce7f3', swatch: '#e879f9' },
]

function stripHtml(html) {
  if (!html) return ''
  const doc = new DOMParser().parseFromString(html, 'text/html')
  return doc.body.textContent?.trim() ?? ''
}

function getSnippet(text, query) {
  if (!query || !text) return text.slice(0, 150)
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return text.slice(0, 150)
  const start = Math.max(0, idx - 40)
  const end = Math.min(text.length, idx + query.length + 100)
  return (start > 0 ? '…' : '') + text.slice(start, end) + (end < text.length ? '…' : '')
}

function Highlighted({ text, query }) {
  if (!query || !text) return <>{text}</>
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return <>{text}</>
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-yellow-200/80 dark:bg-yellow-500/30 text-inherit rounded-sm">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  )
}

export default function EntryCard({ entry, displayDate, searchQuery, onDelete, onDuplicate, folders = [], onMoveToFolder }) {
  const navigate = useNavigate()
  const [showMenu, setShowMenu] = useState(false)
  const [showColors, setShowColors] = useState(false)
  const [showFolders, setShowFolders] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [cardColorId, setCardColorId] = useState(
    () => localStorage.getItem(`alterline-card-color-${entry.id}`) ?? 'default'
  )

  const date = new Date(displayDate ?? entry.created_at).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
  const rawPreview = stripHtml(entry.content)
  const preview = searchQuery ? getSnippet(rawPreview, searchQuery) : rawPreview
  const cardColor = CARD_COLORS.find((c) => c.id === cardColorId) ?? CARD_COLORS[0]

  function openMenu(e) {
    e.stopPropagation()
    setShowMenu(true)
    setShowColors(false)
    setConfirmDelete(false)
  }

  function closeMenu() {
    setShowMenu(false)
    setShowColors(false)
    setShowFolders(false)
  }

  function handleColorPick(e, color) {
    e.stopPropagation()
    if (color.id === 'default') {
      localStorage.removeItem(`alterline-card-color-${entry.id}`)
    } else {
      localStorage.setItem(`alterline-card-color-${entry.id}`, color.id)
    }
    setCardColorId(color.id)
    closeMenu()
  }

  return (
    <div
      onClick={() => navigate(`/entry/${entry.id}`)}
      className="relative group p-4 rounded-xl border border-[#e8e8e8] dark:border-[#1e1e1e] bg-white dark:bg-[#161616] hover:border-[#d0d0d0] dark:hover:border-[#2a2a2a] hover:shadow-sm dark:hover:shadow-none transition-all cursor-pointer"
    >
      {/* Color overlay */}
      {cardColor.value && (
        <div
          className="absolute inset-0 rounded-xl dark:opacity-20 pointer-events-none"
          style={{ backgroundColor: cardColor.value }}
        />
      )}

      {/* Content */}
      <div className="relative">
        <div className="w-7 h-7 rounded-lg bg-[#f5f5f5] dark:bg-[#1e1e1e] flex items-center justify-center text-gray-900 dark:text-white mb-3">
          <IconNote />
        </div>
        <div className="text-[14px] font-medium text-gray-900 dark:text-white leading-snug mb-1.5 line-clamp-2">
          <Highlighted text={entry.title} query={searchQuery} />
        </div>
        {preview ? (
          <div className="text-[12px] text-gray-900 dark:text-white leading-snug mb-2 line-clamp-2 opacity-60">
            <Highlighted text={preview} query={searchQuery} />
          </div>
        ) : (
          <div className="mb-2" />
        )}
        <div className="flex items-center gap-1.5 mb-1">
          {entry.categories ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: entry.categories.color }} />
              <span className="text-[12px] text-gray-900 dark:text-white truncate">{entry.categories.name}</span>
            </>
          ) : null}
        </div>
        <div className="text-[12px] text-gray-900 dark:text-white opacity-50 mt-1">{date}</div>
      </div>

      {/* Hover action buttons */}
      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
        {/* Trash */}
        {onDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); setShowDeleteModal(true) }}
            className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-red-100 dark:hover:bg-red-950/40 transition-colors text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400"
            aria-label="Delete entry"
            title="Delete entry"
          >
            <svg width="12" height="12" viewBox="0 0 20 20" fill="none">
              <path d="M8 1h4a1 1 0 0 1 1 1H7a1 1 0 0 1 1-1Z" fill="currentColor" />
              <path d="M3 4h14v1.5H3V4Z" fill="currentColor" />
              <path d="M5 7h10l-1 11H6L5 7Z" fill="currentColor" />
            </svg>
          </button>
        )}
        {/* 3-dot */}
        <button
          onClick={openMenu}
          className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-black/10 dark:hover:bg-white/10 transition-all text-gray-900 dark:text-white text-[16px] leading-none"
          aria-label="Options"
        >
          ···
        </button>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteModal && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-md"
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            className="bg-white/95 dark:bg-[#1c1c1c]/95 rounded-2xl shadow-2xl border border-black/[0.08] dark:border-white/10 w-full max-w-[380px] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/40 flex items-center justify-center mb-4">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" className="text-red-500">
                <path d="M8 1h4a1 1 0 0 1 1 1H7a1 1 0 0 1 1-1Z" fill="currentColor" />
                <path d="M3 4h14v1.5H3V4Z" fill="currentColor" />
                <path d="M5 7h10l-1 11H6L5 7Z" fill="currentColor" />
              </svg>
            </div>
            <h3 className="text-[16px] font-semibold text-gray-900 dark:text-white mb-1">Delete entry?</h3>
            <p className="text-[13px] text-gray-600 dark:text-gray-300 mb-6">
              <span className="font-medium text-gray-900 dark:text-white">"{entry.title}"</span> will be permanently deleted and cannot be recovered.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 rounded-lg text-[13px] font-medium border border-[#e5e5e5] dark:border-[#2a2a2a] text-gray-900 dark:text-white hover:bg-[#f5f5f5] dark:hover:bg-[#222] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => { setShowDeleteModal(false); onDelete?.(entry.id) }}
                className="flex-1 px-4 py-2 rounded-lg text-[13px] font-medium bg-red-500 hover:bg-red-600 text-white transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Menu */}
      {showMenu && (
        <>
          <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); closeMenu() }} />
          <div
            className="absolute top-8 right-2 z-20 bg-white dark:bg-[#1c1c1c] border border-[#e5e5e5] dark:border-[#2a2a2a] rounded-xl shadow-xl overflow-hidden min-w-[160px]"
            onClick={(e) => e.stopPropagation()}
          >
            {onMoveToFolder && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); setShowFolders((p) => !p); setShowColors(false) }}
                  className="w-full px-3 py-2 text-left text-[13px] text-gray-900 dark:text-white hover:bg-[#f5f5f5] dark:hover:bg-[#222] transition-colors"
                >
                  Move to folder
                </button>
                {showFolders && (
                  <div className="border-t border-[#f0f0f0] dark:border-[#2a2a2a]">
                    <button
                      onClick={(e) => { e.stopPropagation(); onMoveToFolder(entry.id, null); closeMenu() }}
                      className={`w-full px-3 py-2 text-left text-[13px] flex items-center gap-2 transition-colors ${
                        !entry.category_id
                          ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20'
                          : 'text-gray-900 dark:text-white hover:bg-[#f5f5f5] dark:hover:bg-[#222]'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-[#555] shrink-0" />
                      No folder
                    </button>
                    {folders.map((folder) => (
                      <button
                        key={folder.id}
                        onClick={(e) => { e.stopPropagation(); onMoveToFolder(entry.id, folder.id, folder); closeMenu() }}
                        className={`w-full px-3 py-2 text-left text-[13px] flex items-center gap-2 transition-colors ${
                          entry.category_id === folder.id
                            ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20'
                            : 'text-gray-900 dark:text-white hover:bg-[#f5f5f5] dark:hover:bg-[#222]'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: folder.color }} />
                        {folder.name}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}

            {onDuplicate && (
              <button
                onClick={(e) => { e.stopPropagation(); onDuplicate(entry); closeMenu() }}
                className="w-full px-3 py-2 text-left text-[13px] text-gray-900 dark:text-white hover:bg-[#f5f5f5] dark:hover:bg-[#222] transition-colors"
              >
                Duplicate
              </button>
            )}

            <button
              onClick={(e) => { e.stopPropagation(); setShowColors((p) => !p); setShowFolders(false) }}
              className="w-full px-3 py-2 text-left text-[13px] text-gray-900 dark:text-white hover:bg-[#f5f5f5] dark:hover:bg-[#222] transition-colors"
            >
              Change color
            </button>

            {showColors && (
              <div className="px-3 pb-3 pt-1 flex flex-wrap gap-2 border-t border-[#f0f0f0] dark:border-[#2a2a2a]">
                {CARD_COLORS.map((color) => (
                  <button
                    key={color.id}
                    onClick={(e) => handleColorPick(e, color)}
                    title={color.id === 'default' ? 'Default' : color.id}
                    className={`w-5 h-5 rounded-full border-2 transition-transform hover:scale-110 ${
                      cardColorId === color.id
                        ? 'border-indigo-500'
                        : 'border-transparent'
                    }`}
                    style={{
                      backgroundColor: color.swatch ?? '#e5e5e5',
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
