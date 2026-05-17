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

    const list = data ?? []

    if (list.length === 0) {
      // First ever load — create default world and migrate existing data
      const { data: newWorld, error: insertErr } = await supabase
        .from('worlds')
        .insert({ name: 'My World', color: '#6366f1', user_id: user.id })
        .select()
        .single()

      if (insertErr) {
        console.error('worlds insert error:', insertErr)
        setLoading(false)
        return
      }

      if (newWorld) {
        await Promise.all([
          supabase.from('entries').update({ world_id: newWorld.id }).is('world_id', null),
          supabase.from('categories').update({ world_id: newWorld.id }).is('world_id', null),
        ])
        setWorlds([newWorld])
        persistActiveWorldId(newWorld.id)
      }
    } else {
      setWorlds(list)
      const stored = localStorage.getItem('alterline-world')
      if (!stored || !list.find((w) => w.id === stored)) {
        persistActiveWorldId(list[0].id)
      }
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

  const activeWorld = worlds.find((w) => w.id === activeWorldId) ?? worlds[0] ?? null

  return (
    <WorldContext.Provider value={{ worlds, activeWorld, activeWorldId, setActiveWorldId, createWorld, loading }}>
      {children}
    </WorldContext.Provider>
  )
}

export function useWorld() {
  return useContext(WorldContext)
}
