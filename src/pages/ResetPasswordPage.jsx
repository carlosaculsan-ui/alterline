import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
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

function EyeOpenIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  )
}

function EyeClosedIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  )
}

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState(null)
  const [ready, setReady] = useState(false)
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768)

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  useEffect(() => {
    // Check if the URL hash has a recovery token (covers the case where Supabase
    // already processed it before this component mounted)
    if (window.location.hash.includes('type=recovery')) {
      setReady(true)
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match.'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    setError(null)
    setLoading(true)
    const { error: err } = await supabase.auth.updateUser({ password })
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
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                <CheckIcon />
              </div>
              <h1 style={{ color: 'white', fontSize: 24, fontWeight: 700, margin: '0 0 6px', textAlign: 'center' }}>Password updated</h1>
              <p style={{ color: '#666', fontSize: 14, margin: '0 0 32px', textAlign: 'center', lineHeight: 1.6 }}>
                Your password has been changed successfully.
              </p>
              <button
                onClick={() => navigate('/login')}
                style={{ width: '100%', height: 42, backgroundColor: 'white', color: '#111', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'opacity 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#e8e8e8' }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'white' }}
              >
                Sign in
              </button>
            </>
          ) : !ready ? (
            <>
              <h1 style={{ color: 'white', fontSize: 24, fontWeight: 700, margin: '0 0 6px', textAlign: 'center' }}>Link expired</h1>
              <p style={{ color: '#666', fontSize: 14, margin: '0 0 32px', textAlign: 'center', lineHeight: 1.6 }}>
                This reset link is invalid or has expired. Request a new one.
              </p>
              <Link
                to="/forgot-password"
                style={{ display: 'block', width: '100%', height: 42, backgroundColor: 'white', color: '#111', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#e8e8e8' }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'white' }}
              >
                Request new link
              </Link>
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
          ) : (
            <>
              <h1 style={{ color: 'white', fontSize: 24, fontWeight: 700, margin: '0 0 6px', textAlign: 'center' }}>Set new password</h1>
              <p style={{ color: '#666', fontSize: 14, margin: '0 0 32px', textAlign: 'center' }}>
                Choose a strong password for your account.
              </p>

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#888', marginBottom: 6 }}>New password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      autoFocus
                      placeholder="••••••••"
                      style={{ ...INPUT, paddingRight: 42 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#555', display: 'flex', padding: 0 }}
                      onMouseEnter={e => e.currentTarget.style.color = '#aaa'}
                      onMouseLeave={e => e.currentTarget.style.color = '#555'}
                    >
                      {showPassword ? <EyeOpenIcon /> : <EyeClosedIcon />}
                    </button>
                  </div>
                </div>

                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#888', marginBottom: 6 }}>Confirm password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      required
                      placeholder="••••••••"
                      style={{ ...INPUT, paddingRight: 42 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(v => !v)}
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#555', display: 'flex', padding: 0 }}
                      onMouseEnter={e => e.currentTarget.style.color = '#aaa'}
                      onMouseLeave={e => e.currentTarget.style.color = '#555'}
                    >
                      {showConfirm ? <EyeOpenIcon /> : <EyeClosedIcon />}
                    </button>
                  </div>
                </div>

                {error && <p style={{ fontSize: 13, color: '#f87171', margin: '0 0 16px' }}>{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  style={{ width: '100%', height: 42, backgroundColor: 'white', color: '#111', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1, marginBottom: 20, transition: 'opacity 0.15s' }}
                  onMouseEnter={e => { if (!loading) e.currentTarget.style.backgroundColor = '#e8e8e8' }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'white' }}
                >
                  {loading ? '…' : 'Update password'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
