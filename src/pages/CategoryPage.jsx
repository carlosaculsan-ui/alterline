import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import Layout from '../components/Layout'
import EntryCard from '../components/EntryCard'
import { supabase } from '../lib/supabase'

function LoadingSkeleton() {
  return (
    <div className="px-6 py-8 animate-pulse">
      <div className="flex items-center gap-2.5 mb-8">
        <div className="w-3 h-3 rounded-full bg-[#f0f0f0] dark:bg-[#1e1e1e]" />
        <div className="h-6 bg-[#f0f0f0] dark:bg-[#1e1e1e] rounded w-36" />
        <div className="h-4 bg-[#f0f0f0] dark:bg-[#1e1e1e] rounded w-16 ml-1" />
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="p-4 rounded-xl border border-[#e8e8e8] dark:border-[#1e1e1e]">
            <div className="w-7 h-7 rounded-lg bg-[#f0f0f0] dark:bg-[#1e1e1e] mb-3" />
            <div className="h-3 bg-[#f0f0f0] dark:bg-[#1e1e1e] rounded mb-2 w-4/5" />
            <div className="h-3 bg-[#f0f0f0] dark:bg-[#1e1e1e] rounded mb-3 w-3/5" />
            <div className="h-2.5 bg-[#f0f0f0] dark:bg-[#1e1e1e] rounded w-2/5" />
          </div>
        ))}
      </div>
    </div>
  )
}

function EmptyState({ name }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] text-center p-12">
      <div className="text-[36px] text-gray-200 dark:text-[#2a2a2a] mb-3 select-none">✦</div>
      <div className="text-[14px] font-medium text-gray-900 dark:text-white mb-1">
        No entries in {name}
      </div>
      <div className="text-[12px] text-gray-600 dark:text-gray-300">
        Hit "New Entry" to add the first one
      </div>
    </div>
  )
}

export default function CategoryPage() {
  const { id } = useParams()
  const [category, setCategory] = useState(null)
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      supabase.from('categories').select('*').eq('id', id).single(),
      supabase
        .from('entries')
        .select('*, categories(name, color)')
        .eq('category_id', id)
        .order('created_at', { ascending: false }),
    ]).then(([{ data: cat }, { data: ents }]) => {
      if (cat) setCategory(cat)
      if (ents) setEntries(ents)
      setLoading(false)
    })
  }, [id])

  return (
    <Layout>
      {loading ? (
        <LoadingSkeleton />
      ) : !category ? (
        <div className="px-4 py-6 sm:px-6 sm:py-8">
          <p className="text-[13px] text-gray-400 dark:text-[#555]">Category not found.</p>
        </div>
      ) : (
        <div className="px-4 py-6 sm:px-6 sm:py-8">
          {/* Heading */}
          <div className="flex items-center gap-2.5 mb-7">
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: category.color }}
            />
            <h1 className="text-[22px] font-semibold text-gray-900 dark:text-white leading-none">
              {category.name}
            </h1>
            <span className="text-[13px] text-gray-400 dark:text-[#555] ml-0.5">
              {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
            </span>
          </div>

          {entries.length === 0 ? (
            <EmptyState name={category.name} />
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-3">
              {entries.map((entry) => (
                <EntryCard key={entry.id} entry={entry} />
              ))}
            </div>
          )}
        </div>
      )}
    </Layout>
  )
}
