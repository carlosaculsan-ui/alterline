import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useWorld } from '../contexts/WorldContext'

export function useCategories() {
  const { activeWorldId, loading: worldLoading } = useWorld()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!activeWorldId || worldLoading) return
    setLoading(true)
    supabase
      .from('categories')
      .select('*')
      .eq('world_id', activeWorldId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (!error && data) setCategories(data)
        setLoading(false)
      })
  }, [activeWorldId, worldLoading])

  async function createCategory(name, color) {
    const { data, error } = await supabase
      .from('categories')
      .insert({ name, color, world_id: activeWorldId })
      .select()
      .single()
    if (!error && data) setCategories((prev) => [...prev, data])
  }

  async function updateCategory(id, name, color) {
    const { error } = await supabase.from('categories').update({ name, color }).eq('id', id)
    if (!error) setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, name, color } : c)))
  }

  async function deleteCategory(id) {
    const { error } = await supabase.from('categories').update({ deleted_at: new Date().toISOString() }).eq('id', id)
    if (!error) setCategories((prev) => prev.filter((c) => c.id !== id))
  }

  return { categories, loading, createCategory, updateCategory, deleteCategory }
}
