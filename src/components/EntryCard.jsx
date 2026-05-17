import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

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

export default function EntryCard({ entry, onDelete, folders = [], onMoveToFolder }) {
  const navigate = useNavigate()
  const [showMenu, setShowMenu] = useState(false)
  const [showColors, setShowColors] = useState(false)
  const [showFolders, setShowFolders] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [cardColorId, setCardColorId] = useState(
    () => localStorage.getItem(`alterline-card-color-${entry.id}`) ?? 'default'
  )

  const date = new Date(entry.created_at).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
  const preview = stripHtml(entry.content)
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
    setConfirmDelete(false)
  }

  function handleDelete(e) {
    e.stopPropagation()
    if (!confirmDelete) { setConfirmDelete(true); return }
    closeMenu()
    onDelete?.(entry.id)
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
      className="relative group p-4 rounded-xl border border-[#e8e8e8] dark:border-[#1e1e1e] bg-white dark:bg-[#161616] hover:border-[#d0d0d0] dark:hover:border-[#2a2a2a] hover:shadow-sm dark:hover:shadow-none transition-all cursor-pointer overflow-hidden"
    >
      {/* Color overlay */}
      {cardColor.value && (
        <div
          className="absolute inset-0 dark:opacity-20 pointer-events-none"
          style={{ backgroundColor: cardColor.value }}
        />
      )}

      {/* Content */}
      <div className="relative">
        <div className="w-7 h-7 rounded-lg bg-[#f5f5f5] dark:bg-[#1e1e1e] flex items-center justify-center text-gray-900 dark:text-white mb-3">
          <IconNote />
        </div>
        <div className="text-[14px] font-medium text-gray-900 dark:text-white leading-snug mb-1.5 line-clamp-2">
          {entry.title}
        </div>
        {preview ? (
          <div className="text-[12px] text-gray-900 dark:text-white leading-snug mb-2 line-clamp-2 opacity-60">
            {preview}
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
          ) : (
            <span className="text-[12px] text-gray-900 dark:text-white opacity-30">No folder</span>
          )}
        </div>
        <div className="text-[12px] text-gray-900 dark:text-white opacity-50">{date}</div>
      </div>

      {/* 3-dot button */}
      {onDelete && (
        <button
          onClick={openMenu}
          className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-md opacity-0 group-hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10 transition-all text-gray-900 dark:text-white text-[16px] leading-none"
          aria-label="Options"
        >
          ···
        </button>
      )}

      {/* Menu */}
      {showMenu && (
        <>
          <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); closeMenu() }} />
          <div
            className="absolute top-8 right-2 z-20 bg-white dark:bg-[#1c1c1c] border border-[#e5e5e5] dark:border-[#2a2a2a] rounded-xl shadow-xl overflow-hidden min-w-[160px]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleDelete}
              className={`w-full px-3 py-2 text-left text-[13px] transition-colors ${
                confirmDelete
                  ? 'text-red-500 dark:text-red-400 font-medium bg-red-50 dark:bg-red-950/30'
                  : 'text-gray-900 dark:text-white hover:bg-[#f5f5f5] dark:hover:bg-[#222]'
              }`}
            >
              {confirmDelete ? 'Confirm delete?' : 'Delete'}
            </button>
            {onMoveToFolder && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); setShowFolders((p) => !p); setShowColors(false); setConfirmDelete(false) }}
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

            <button
              onClick={(e) => { e.stopPropagation(); setShowColors((p) => !p); setShowFolders(false); setConfirmDelete(false) }}
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
