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
        const persist = localStorage.getItem('alterline_persist')
        // For email/password logins, enforce remember-me: no marker means
        // the user never logged in on this browser or already cleared it.
        if (provider === 'email' && !persist) {
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
        sessionStorage.removeItem('alterline-greeted')
      }
      setUser(session?.user ?? null)
    })

    // Clear non-persistent ("session") marker when the browser/tab closes
    function clearSessionMarker() {
      if (localStorage.getItem('alterline_persist') === 'session') {
        localStorage.removeItem('alterline_persist')
      }
    }
    window.addEventListener('beforeunload', clearSessionMarker)

    return () => {
      subscription.unsubscribe()
      window.removeEventListener('beforeunload', clearSessionMarker)
    }
  }, [])

  return <AuthContext.Provider value={user}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
