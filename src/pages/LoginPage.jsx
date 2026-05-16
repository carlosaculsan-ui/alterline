import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export default function LoginPage() {
  const user = useAuth()
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  if (user) return <Navigate to="/" replace />

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
      else setDone(true)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#111] flex items-center justify-center px-4">
      <div className="w-full max-w-[360px]">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-8 justify-center">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="shrink-0 text-gray-900 dark:text-white">
            <path d="M4 21L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M14 3L20 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M7 13H17" stroke="#ec4899" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span
            className="text-gray-900 dark:text-white"
            style={{ fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif", fontSize: '16px', fontWeight: 700, letterSpacing: '0.1em' }}
          >
            Alterline
          </span>
        </div>

        <div className="border border-[#e5e5e5] dark:border-[#2a2a2a] rounded-xl p-6">
          <h1 className="text-[18px] font-semibold text-gray-900 dark:text-white mb-5">
            {mode === 'login' ? 'Welcome back' : 'Create account'}
          </h1>

          {done ? (
            <div className="text-[14px] text-gray-900 dark:text-white">
              Check your email to confirm your account, then come back to log in.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-[12px] font-medium text-gray-900 dark:text-white mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  placeholder="you@example.com"
                  className="w-full px-3 py-2 text-[14px] bg-white dark:bg-[#1a1a1a] border border-[#e5e5e5] dark:border-[#2a2a2a] rounded-lg text-gray-900 dark:text-white placeholder-[#aaa] dark:placeholder-[#555] outline-none focus:border-indigo-400 dark:focus:border-indigo-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-gray-900 dark:text-white mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-3 py-2 text-[14px] bg-white dark:bg-[#1a1a1a] border border-[#e5e5e5] dark:border-[#2a2a2a] rounded-lg text-gray-900 dark:text-white placeholder-[#aaa] dark:placeholder-[#555] outline-none focus:border-indigo-400 dark:focus:border-indigo-500 transition-colors"
                />
              </div>

              {error && (
                <div className="text-[13px] text-red-500 dark:text-red-400">{error}</div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 rounded-lg text-[14px] font-medium bg-indigo-600 hover:bg-indigo-700 text-white transition-colors disabled:opacity-50 mt-1"
              >
                {loading ? '…' : mode === 'login' ? 'Log in' : 'Sign up'}
              </button>
            </form>
          )}

          {!done && (
            <div className="mt-4 text-center text-[13px] text-gray-900 dark:text-white">
              {mode === 'login' ? (
                <>No account?{' '}
                  <button onClick={() => { setMode('signup'); setError(null) }} className="text-indigo-600 dark:text-indigo-400 hover:opacity-75 transition-opacity">
                    Sign up
                  </button>
                </>
              ) : (
                <>Already have one?{' '}
                  <button onClick={() => { setMode('login'); setError(null); setDone(false) }} className="text-indigo-600 dark:text-indigo-400 hover:opacity-75 transition-opacity">
                    Log in
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
