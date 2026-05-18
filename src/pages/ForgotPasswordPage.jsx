import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import CharacterScene from '../components/CharacterScene'

const INPUT = {
  width: '100%',
  height: 42,
  backgroundColor: '#1c1c1c',
  border: '1px solid #2e2e2e',
  borderRadius: 8,
  padding: '0 12px',
  fontSize: 14,
  color: 'white',
  outline: 'none',
  boxSizing: 'border-box',
}

function Logo() {
  return (
    <div style={{ width: 44, height: 44, backgroundColor: 'white', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28, marginLeft: 'auto', marginRight: 'auto' }}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M4 21L10 3" stroke="#111" strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M14 3L20 21" stroke="#111" strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M7 13H17" stroke="#ec4899" strokeWidth="2.5" strokeLinecap="round"/>
      </svg>
    </div>
  )
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState(null)
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768)

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (err) setError(err.message)
    else setDone(true)
    setLoading(false)
  }

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>

      <div style={{ width: '50%', backgroundColor: '#0b0b0b', position: 'relative', display: isMobile ? 'none' : 'flex', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
        <div style={{ position: 'absolute', top: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 15, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'white', fontWeight: 700, userSelect: 'none' }}>
            Alterline
          </span>
          <span style={{ fontSize: 13, color: '#ccc', fontWeight: 600, userSelect: 'none', textAlign: 'center', lineHeight: 1.5, maxWidth: 260 }}>
            Built for the worlds that only exist in your head.
          </span>
        </div>
        <CharacterScene />
      </div>

      <div style={{ width: isMobile ? '100%' : '50%', backgroundColor: '#141414', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflowY: 'auto' }}>
        <div style={{ width: '100%', maxWidth: 340, padding: isMobile ? '40px 24px' : '40px 0' }}>
          <Logo />

          {done ? (
            <>
              <h1 style={{ color: 'white', fontSize: 24, fontWeight: 700, margin: '0 0 6px', textAlign: 'center' }}>Check your inbox</h1>
              <p style={{ color: '#666', fontSize: 14, margin: '0 0 8px', textAlign: 'center', lineHeight: 1.6 }}>
                We sent a reset link to
              </p>
              <p style={{ color: '#aaa', fontSize: 14, fontWeight: 500, margin: '0 0 32px', textAlign: 'center' }}>
                {email}
              </p>
              <p style={{ color: '#555', fontSize: 13, margin: '0 0 32px', textAlign: 'center', lineHeight: 1.6 }}>
                Click the link in that email to set a new password. It may take a minute to arrive.
              </p>
              <Link
                to="/login"
                style={{ display: 'block', textAlign: 'center', fontSize: 13, color: '#666', textDecoration: 'none' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#aaa' }}
                onMouseLeave={e => { e.currentTarget.style.color = '#666' }}
              >
                ← Back to sign in
              </Link>
            </>
          ) : (
            <>
              <h1 style={{ color: 'white', fontSize: 24, fontWeight: 700, margin: '0 0 6px', textAlign: 'center' }}>Forgot password?</h1>
              <p style={{ color: '#666', fontSize: 14, margin: '0 0 32px', textAlign: 'center' }}>
                Enter your email and we'll send you a reset link.
              </p>

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#888', marginBottom: 6 }}>Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoFocus
                    placeholder="you@example.com"
                    style={INPUT}
                  />
                </div>

                {error && <p style={{ fontSize: 13, color: '#f87171', margin: '0 0 16px' }}>{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  style={{ width: '100%', height: 42, backgroundColor: 'white', color: '#111', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1, marginBottom: 20, transition: 'opacity 0.15s' }}
                  onMouseEnter={e => { if (!loading) e.currentTarget.style.backgroundColor = '#e8e8e8' }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'white' }}
                >
                  {loading ? '…' : 'Send reset link'}
                </button>
              </form>

              <p style={{ textAlign: 'center', margin: 0 }}>
                <Link
                  to="/login"
                  style={{ fontSize: 13, color: '#666', textDecoration: 'none' }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#aaa' }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#666' }}
                >
                  ← Back to sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
