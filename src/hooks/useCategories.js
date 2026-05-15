import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useCategories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('categories')
      .select('*')
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (!error && data) setCategories(data)
        setLoading(false)
      })
  }, [])

  async function createCategory(name, color) {
    const { data, error } = await supabase
      .from('categories')
      .insert({ name, color })
      .select()
      .single()
    if (!error && data) setCategories((prev) => [...prev, data])
  }

  async function deleteCategory(id) {
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (!error) setCategories((prev) => prev.filter((c) => c.id !== id))
  }

  return { categories, loading, createCategory, deleteCategory }
}
