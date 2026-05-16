import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

const PAGE_SIZE = 50

async function getCarlopediaIds() {
  const { data } = await supabase
    .from('profile_fields')
    .select('entry_id')
    .eq('field_key', 'carlopedia')
  return (data ?? []).map((r) => r.entry_id)
}

function buildEntriesQuery(excludeIds) {
  let q = supabase
    .from('entries')
    .select('*, categories(name, color)')
    .neq('type', 'carlopedia')
    .order('created_at', { ascending: false })
  if (excludeIds.length > 0) {
    q = q.not('id', 'in', `(${excludeIds.join(',')})`)
  }
  return q
}

export function useEntries() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const wikiIds = useRef([])

  useEffect(() => {
    async function load() {
      wikiIds.current = await getCarlopediaIds()
      const { data, error } = await buildEntriesQuery(wikiIds.current).limit(PAGE_SIZE)
      if (!error && data) {
        setEntries(data)
        setHasMore(data.length === PAGE_SIZE)
      }
      setLoading(false)
    }
    load()
  }, [])

  async function loadMore() {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    const { data, error } = await buildEntriesQuery(wikiIds.current)
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
    await supabase.from('profile_fields').delete().eq('entry_id', id)
    const { error } = await supabase.from('entries').delete().eq('id', id)
    if (!error) setEntries((prev) => prev.filter((e) => e.id !== id))
  }

  return { entries, loading, hasMore, loadingMore, loadMore, createEntry, deleteEntry }
}
