import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(undefined)

export function AuthProvider({ children }) {
  // undefined = loading, null = logged out, object = logged in
  const [user, setUser] = useState(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const provider = session.user?.app_metadata?.provider
        const persistent = localStorage.getItem('alterline_persist')
        const temporary = sessionStorage.getItem('alterline_persist')
        // For email/password logins, enforce remember-me: if the browser was
        // closed without "remember me", neither marker survives → sign out.
        if (provider === 'email' && !persistent && !temporary) {
          await supabase.auth.signOut()
          setUser(null)
          return
        }
      }
      setUser(session?.user ?? null)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (_event === 'SIGNED_OUT') {
        localStorage.removeItem('alterline_persist')
        sessionStorage.removeItem('alterline_persist')
        sessionStorage.removeItem('alterline-greeted')
      }
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  return <AuthContext.Provider value={user}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
