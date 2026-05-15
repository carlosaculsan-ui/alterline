import { useNavigate } from 'react-router-dom'

function IconPerson() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" className="shrink-0">
      <circle cx="10" cy="7" r="3.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M3 18c0-3.866 3.134-7 7-7s7 3.134 7 7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  )
}

function IconNote() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" className="shrink-0">
      <rect x="3.5" y="2.5" width="13" height="15" rx="1.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M7 7h6M7 10h6M7 13h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  )
}

export default function EntryCard({ entry }) {
  const navigate = useNavigate()
  const date = new Date(entry.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div
      onClick={() => navigate(`/entry/${entry.id}`)}
      className="p-4 rounded-xl border border-[#e8e8e8] dark:border-[#1e1e1e] bg-white dark:bg-[#161616] hover:border-[#d0d0d0] dark:hover:border-[#2a2a2a] hover:shadow-sm dark:hover:shadow-none transition-all cursor-pointer"
    >
      <div className="w-7 h-7 rounded-lg bg-[#f5f5f5] dark:bg-[#1e1e1e] flex items-center justify-center text-gray-400 dark:text-[#4a4a4a] mb-3">
        {entry.type === 'profile' ? <IconPerson /> : <IconNote />}
      </div>
      <div className="text-[14px] font-medium text-gray-900 dark:text-gray-100 leading-snug mb-1.5 line-clamp-2">
        {entry.title}
      </div>
      {entry.content ? (
        <div className="text-[12px] text-gray-400 dark:text-[#444] leading-snug mb-2 line-clamp-2">
          {entry.content}
        </div>
      ) : (
        <div className="mb-2" />
      )}
      <div className="flex items-center gap-1.5 mb-1">
        {entry.categories ? (
          <>
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ backgroundColor: entry.categories.color }}
            />
            <span className="text-[12px] text-gray-400 dark:text-[#555] truncate">
              {entry.categories.name}
            </span>
          </>
        ) : (
          <span className="text-[12px] text-gray-300 dark:text-[#3a3a3a]">—</span>
        )}
      </div>
      <div className="text-[12px] text-gray-300 dark:text-[#3a3a3a]">{date}</div>
    </div>
  )
}
