import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const PAGE_SIZE = 50

export function useEntries() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)

  useEffect(() => {
    supabase
      .from('entries')
      .select('*, categories(name, color)')
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE)
      .then(({ data, error }) => {
        if (!error && data) {
          setEntries(data)
          setHasMore(data.length === PAGE_SIZE)
        }
        setLoading(false)
      })
  }, [])

  async function loadMore() {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    const { data, error } = await supabase
      .from('entries')
      .select('*, categories(name, color)')
      .order('created_at', { ascending: false })
      .range(entries.length, entries.length + PAGE_SIZE - 1)
    if (!error && data) {
      setEntries((prev) => [...prev, ...data])
      setHasMore(data.length === PAGE_SIZE)
    }
    setLoadingMore(false)
  }

  async function createEntry(data, fields = []) {
    const { data: created, error } = await supabase
      .from('entries')
      .insert(data)
      .select('*, categories(name, color)')
      .single()
    if (!error && created) {
      if (fields.length > 0) {
        await supabase.from('profile_fields').insert(
          fields.map(({ key, value }) => ({
            entry_id: created.id,
            field_key: key,
            field_value: value,
          }))
        )
      }
      setEntries((prev) => [created, ...prev])
    }
  }

  async function deleteEntry(id) {
    const { error } = await supabase.from('entries').delete().eq('id', id)
    if (!error) setEntries((prev) => prev.filter((e) => e.id !== id))
  }

  return { entries, loading, hasMore, loadingMore, loadMore, createEntry, deleteEntry }
}
