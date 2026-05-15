import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useEntries() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('entries')
      .select('*, categories(name, color)')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) setEntries(data)
        setLoading(false)
      })
  }, [])

  async function createEntry(data) {
    const { data: created, error } = await supabase
      .from('entries')
      .insert(data)
      .select('*, categories(name, color)')
      .single()
    if (!error && created) setEntries((prev) => [created, ...prev])
  }

  async function deleteEntry(id) {
    const { error } = await supabase.from('entries').delete().eq('id', id)
    if (!error) setEntries((prev) => prev.filter((e) => e.id !== id))
  }

  return { entries, loading, createEntry, deleteEntry }
}
