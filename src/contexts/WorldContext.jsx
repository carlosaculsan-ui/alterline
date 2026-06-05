import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

const WorldContext = createContext(undefined)

export function WorldProvider({ children }) {
  const user = useAuth()
  const [worlds, setWorlds] = useState([])
  const [activeWorldId, setActiveWorldIdState] = useState(
    () => localStorage.getItem('alterline-world') ?? null
  )
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { setLoading(false); return }
    loadWorlds()
  }, [user])

  async function loadWorlds() {
    setLoading(true)
    const { data, error } = await supabase.from('worlds').select('*').order('created_at', { ascending: true })

    if (error) {
      console.error('worlds fetch error:', error)
      setLoading(false)
      return
    }

    let list = data ?? []

    if (list.length === 0) {
      const { data: newWorld, error: insertErr } = await supabase
        .from('worlds')
        .insert({ name: 'My World', color: '#6366f1', user_id: user.id })
        .select()
        .single()

      if (insertErr) {
        // Insert may have lost a race or hit a duplicate — attempt a read recovery
        const { data: existing } = await supabase
          .from('worlds')
          .select('*')
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle()
        if (existing) {
          list = [existing]
        } else {
          console.error('worlds insert error:', insertErr)
          setLoading(false)
          return
        }
      } else if (newWorld) {
        list = [newWorld]
      }
    }

    if (list.length > 0) {
      // Migrate any orphaned rows — idempotent, safe to run every load
      const anchor = list[0].id
      await Promise.all([
        supabase.from('entries').update({ world_id: anchor }).is('world_id', null),
        supabase.from('categories').update({ world_id: anchor }).is('world_id', null),
      ])
    }

    setWorlds(list)
    const stored = localStorage.getItem('alterline-world')
    if (!stored || !list.find((w) => w.id === stored)) {
      persistActiveWorldId(list[0].id)
    }
    setLoading(false)
  }

  function persistActiveWorldId(id) {
    setActiveWorldIdState(id)
    localStorage.setItem('alterline-world', id)
  }

  function setActiveWorldId(id) {
    persistActiveWorldId(id)
  }

  async function createWorld(name, color) {
    const { data, error } = await supabase
      .from('worlds')
      .insert({ name, color, user_id: user.id })
      .select()
      .single()
    if (!error && data) {
      setWorlds((prev) => [...prev, data])
      return data
    }
    return null
  }

  async function updateWorld(id, name, color) {
    const { error } = await supabase.from('worlds').update({ name, color }).eq('id', id)
    if (!error) setWorlds((prev) => prev.map((w) => (w.id === id ? { ...w, name, color } : w)))
  }

  async function deleteWorld(id) {
    const { data: entryRows } = await supabase.from('entries').select('id').eq('world_id', id)
    const entryIds = (entryRows ?? []).map((r) => r.id)
    if (entryIds.length > 0) {
      await supabase.from('profile_fields').delete().in('entry_id', entryIds)
    }
    await supabase.from('entries').delete().eq('world_id', id)
    await supabase.from('categories').delete().eq('world_id', id)
    const { error } = await supabase.from('worlds').delete().eq('id', id)
    if (!error) {
      const remaining = worlds.filter((w) => w.id !== id)
      setWorlds(remaining)
      if (activeWorldId === id && remaining.length > 0) persistActiveWorldId(remaining[0].id)
    }
    return !error
  }

  const activeWorld = worlds.find((w) => w.id === activeWorldId) ?? worlds[0] ?? null

  return (
    <WorldContext.Provider value={{ worlds, activeWorld, activeWorldId, setActiveWorldId, createWorld, updateWorld, deleteWorld, loading }}>
      {children}
    </WorldContext.Provider>
  )
}

export function useWorld() {
  return useContext(WorldContext)
}
