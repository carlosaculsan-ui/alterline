import { useState, useEffect, useRef } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import CharacterScene from '../components/CharacterScene'
import TermsModal from '../components/TermsModal'

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

function EmailIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="2" y="4" width="20" height="16" rx="2"/>
      <path d="M2 7l10 7 10-7"/>
    </svg>
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

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908C16.658 14.232 17.64 11.924 17.64 9.2z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
      <path d="M3.964 10.706A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}

function AnimatedPanel({ children }) {
  const [entered, setEntered] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const id2 = requestAnimationFrame(() => setEntered(true))
      return () => cancelAnimationFrame(id2)
    })
    return () => cancelAnimationFrame(id)
  }, [])
  return (
    <div style={{
      opacity: entered ? 1 : 0,
      transform: entered ? 'translateY(0)' : 'translateY(8px)',
      transition: entered ? 'opacity 220ms ease, transform 220ms ease' : 'none',
    }}>
      {children}
    </div>
  )
}

export default function LoginPage() {
  const user = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [signupStep, setSignupStep] = useState(1)
  const [remember, setRemember] = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [showTermsModal, setShowTermsModal] = useState(false)
  const [transitionKey, setTransitionKey] = useState(0)
  const [exiting, setExiting] = useState(false)
  const pendingFn = useRef(null)
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768)

  function doTransition(updateFn) {
    if (exiting) return
    pendingFn.current = updateFn
    setExiting(true)
    setTimeout(() => {
      pendingFn.current?.()
      setTransitionKey(k => k + 1)
      setExiting(false)
    }, 180)
  }

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  if (user) return <Navigate to="/" replace />

  function switchMode(next) {
    doTransition(() => {
      setMode(next)
      setError(null)
      setDone(false)
      setSignupStep(1)
      setDisplayName('')
      setConfirmPassword('')
      setTermsAccepted(false)
      setShowTermsModal(false)
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (!err) {
      if (remember) {
        localStorage.setItem('alterline_persist', '1')
        sessionStorage.removeItem('alterline_persist')
      } else {
        sessionStorage.setItem('alterline_persist', '1')
        localStorage.removeItem('alterline_persist')
      }
    }
    if (err) setError(err.message)
    setLoading(false)
  }

  function handleSignupStep1(e) {
    e.preventDefault()
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return }
    if (!termsAccepted) { setError('You must agree to the Terms of Service to continue.'); return }
    setError(null)
    doTransition(() => setSignupStep(2))
  }

  async function handleSignupStep2(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error: err } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: displayName.trim() || email.split('@')[0] } },
    })
    if (err) setError(err.message)
    else setDone(true)
    setLoading(false)
  }

  async function handleGoogle() {
    localStorage.setItem('alterline_persist', '1')
    sessionStorage.removeItem('alterline_persist')
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
  }

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>

      {/* Left panel — character scene */}
      <div style={{ width: '50%', backgroundColor: '#0b0b0b', position: 'relative', display: isMobile ? 'none' : 'flex', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
        <div style={{ position: 'absolute', top: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 15, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'white', fontWeight: 700, userSelect: 'none' }}>
            Alterline
          </span>
          <span style={{ fontSize: 13, color: '#ccc', fontWeight: 600, userSelect: 'none', textAlign: 'center', lineHeight: 1.5, maxWidth: 260 }}>
            Built for the worlds that only exist in your head.
          </span>
        </div>
        <CharacterScene passwordFocused={passwordFocused} />
      </div>

      {/* Right panel — login form */}
      <div style={{ width: isMobile ? '100%' : '50%', backgroundColor: '#141414', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflowY: 'auto' }}>
        <div style={{ width: '100%', maxWidth: 340, padding: isMobile ? '40px 24px' : '40px 0' }}>

          {/* Logo mark */}
          <div style={{ width: 44, height: 44, backgroundColor: 'white', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28, marginLeft: 'auto', marginRight: 'auto' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M4 21L10 3" stroke="#111" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M14 3L20 21" stroke="#111" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M7 13H17" stroke="#ec4899" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </div>

          <div style={{
            opacity: exiting ? 0 : 1,
            transform: exiting ? 'translateY(-8px)' : 'translateY(0)',
            transition: exiting ? 'opacity 180ms ease, transform 180ms ease' : 'none',
          }}>
          <AnimatedPanel key={transitionKey}>
          {mode === 'login' ? (
            <>
              <h1 style={{ color: 'white', fontSize: 24, fontWeight: 700, margin: '0 0 6px', textAlign: 'center' }}>Welcome back</h1>
              <p style={{ color: '#666', fontSize: 14, margin: '0 0 32px', textAlign: 'center' }}>Your world has been waiting.</p>

              {done ? null : (
                <form onSubmit={handleSubmit}>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#888', marginBottom: 6 }}>Email</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: email ? 'white' : '#555', display: 'flex', pointerEvents: 'none', transition: 'color 150ms' }}>
                        <EmailIcon />
                      </span>
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                        autoFocus
                        placeholder="you@example.com"
                        style={{ ...INPUT, paddingRight: 36 }}
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#888', marginBottom: 6 }}>Password</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        onFocus={() => setPasswordFocused(true)}
                        onBlur={() => setPasswordFocused(false)}
                        required
                        placeholder="••••••••"
                        style={{ ...INPUT, paddingRight: 42 }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(v => !v)}
                        style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: password ? 'white' : '#555', display: 'flex', padding: 0, transition: 'color 150ms' }}
                        onMouseEnter={e => e.currentTarget.style.color = '#aaa'}
                        onMouseLeave={e => e.currentTarget.style.color = password ? 'white' : '#555'}
                      >
                        {showPassword ? <EyeOpenIcon /> : <EyeClosedIcon />}
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}>
                      <input
                        type="checkbox"
                        checked={remember}
                        onChange={e => setRemember(e.target.checked)}
                        style={{ width: 14, height: 14, accentColor: 'white', cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: 13, color: '#777' }}>Remember me</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => navigate('/forgot-password')}
                      style={{ fontSize: 13, color: '#777', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                      onMouseEnter={e => e.currentTarget.style.color = '#aaa'}
                      onMouseLeave={e => e.currentTarget.style.color = '#777'}
                    >
                      Forgot password?
                    </button>
                  </div>

                  {error && <p style={{ fontSize: 13, color: '#f87171', margin: '0 0 16px' }}>{error}</p>}

                  <button
                    type="submit"
                    disabled={loading}
                    style={{ width: '100%', height: 42, backgroundColor: 'white', color: '#111', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1, marginBottom: 20, transition: 'opacity 0.15s' }}
                    onMouseEnter={e => { if (!loading) e.currentTarget.style.backgroundColor = '#e8e8e8' }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'white' }}
                  >
                    {loading ? '…' : 'Sign in'}
                  </button>
                </form>
              )}

              {!done && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                    <div style={{ flex: 1, height: 1, backgroundColor: '#272727' }} />
                    <span style={{ fontSize: 12, color: '#444' }}>or</span>
                    <div style={{ flex: 1, height: 1, backgroundColor: '#272727' }} />
                  </div>

                  <button
                    onClick={handleGoogle}
                    style={{ width: '100%', height: 42, backgroundColor: 'transparent', border: '1px solid #2e2e2e', borderRadius: 8, fontSize: 14, fontWeight: 500, color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 28 }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#444'; e.currentTarget.style.backgroundColor = '#1e1e1e' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#2e2e2e'; e.currentTarget.style.backgroundColor = 'transparent' }}
                  >
                    <GoogleIcon />
                    Continue with Google
                  </button>

                  <p style={{ textAlign: 'center', fontSize: 13, color: '#555', margin: 0 }}>
                    Don&apos;t have an account?{' '}
                    <button
                      onClick={() => switchMode('signup')}
                      style={{ color: 'white', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 13, fontWeight: 500 }}
                    >
                      Sign up
                    </button>
                  </p>
                </>
              )}

              {done && (
                <p style={{ fontSize: 14, color: '#aaa', lineHeight: 1.6 }}>
                  Check your email to confirm your account, then{' '}
                  <button onClick={() => switchMode('login')} style={{ color: 'white', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 14 }}>
                    sign in
                  </button>.
                </p>
              )}
            </>
          ) : signupStep === 1 ? (
            /* Signup step 1 — email + password + confirm + terms */
            <>
              <h1 style={{ color: 'white', fontSize: 24, fontWeight: 700, margin: '0 0 6px', textAlign: 'center' }}>Create account</h1>
              <p style={{ color: '#666', fontSize: 14, margin: '0 0 28px', textAlign: 'center' }}>Join your universe today</p>

              <form onSubmit={handleSignupStep1}>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#888', marginBottom: 6 }}>Email</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: email ? 'white' : '#555', display: 'flex', pointerEvents: 'none', transition: 'color 150ms' }}>
                      <EmailIcon />
                    </span>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoFocus placeholder="you@example.com" style={{ ...INPUT, paddingRight: 36 }} />
                  </div>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#888', marginBottom: 6 }}>Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      onFocus={() => setPasswordFocused(true)}
                      onBlur={() => setPasswordFocused(false)}
                      required
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

                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#888', marginBottom: 6 }}>Confirm Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      style={{ ...INPUT, paddingRight: 42 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(v => !v)}
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: confirmPassword ? 'white' : '#555', display: 'flex', padding: 0, transition: 'color 150ms' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#aaa'}
                      onMouseLeave={e => e.currentTarget.style.color = confirmPassword ? 'white' : '#555'}
                    >
                      {showConfirmPassword ? <EyeOpenIcon /> : <EyeClosedIcon />}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}>
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      readOnly
                      onClick={() => {
                        if (termsAccepted) setTermsAccepted(false)
                        else setShowTermsModal(true)
                      }}
                      style={{ width: 14, height: 14, accentColor: 'white', cursor: 'pointer', flexShrink: 0 }}
                    />
                    <span style={{ fontSize: 13, color: '#777' }}>
                      I agree to the{' '}
                      <button
                        type="button"
                        onClick={e => { e.stopPropagation(); setShowTermsModal(true) }}
                        style={{ color: 'white', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 13, fontWeight: 500, textDecoration: 'underline', textUnderlineOffset: 3 }}
                      >
                        Terms of Service
                      </button>
                    </span>
                  </label>
                </div>

                {error && <p style={{ fontSize: 13, color: '#f87171', margin: '0 0 16px' }}>{error}</p>}

                <button
                  type="submit"
                  style={{ width: '100%', height: 42, backgroundColor: 'white', color: '#111', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', marginBottom: 28 }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#e8e8e8'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'white'}
                >
                  Sign up
                </button>

                <p style={{ textAlign: 'center', fontSize: 13, color: '#555', margin: 0 }}>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    style={{ color: 'white', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 13, fontWeight: 500 }}
                  >
                    Sign in
                  </button>
                </p>
              </form>

              {showTermsModal && (
                <TermsModal
                  onAgree={() => { setTermsAccepted(true); setShowTermsModal(false) }}
                  onClose={() => setShowTermsModal(false)}
                />
              )}
            </>
          ) : done ? (
            /* Signup done */
            <>
              <h1 style={{ color: 'white', fontSize: 24, fontWeight: 700, margin: '0 0 6px', textAlign: 'center' }}>You're all set</h1>
              <p style={{ color: '#666', fontSize: 14, margin: '0 0 32px', textAlign: 'center' }}>Check your email to confirm your account</p>
              <p style={{ fontSize: 14, color: '#aaa', lineHeight: 1.6, textAlign: 'center' }}>
                Once confirmed,{' '}
                <button onClick={() => switchMode('login')} style={{ color: 'white', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 14 }}>
                  sign in
                </button>{' '}to start building your universe.
              </p>
            </>
          ) : (
            /* Signup step 2 — name */
            <>
              <h1 style={{ color: 'white', fontSize: 24, fontWeight: 700, margin: '0 0 6px', textAlign: 'center' }}>What should we call you?</h1>
              <p style={{ color: '#666', fontSize: 14, margin: '0 0 32px', textAlign: 'center' }}>This is how we'll greet you in Alterline</p>

              <form onSubmit={handleSignupStep2}>
                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#888', marginBottom: 6 }}>Your name</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    autoFocus
                    placeholder="e.g. Carlo"
                    style={INPUT}
                  />
                </div>

                {error && <p style={{ fontSize: 13, color: '#f87171', margin: '0 0 16px' }}>{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  style={{ width: '100%', height: 42, backgroundColor: 'white', color: '#111', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1, marginBottom: 16, transition: 'opacity 0.15s' }}
                  onMouseEnter={e => { if (!loading) e.currentTarget.style.backgroundColor = '#e8e8e8' }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'white' }}
                >
                  {loading ? '…' : 'Get started'}
                </button>

                <button
                  type="button"
                  onClick={() => doTransition(() => { setSignupStep(1); setError(null) })}
                  style={{ width: '100%', height: 36, background: 'none', border: 'none', color: '#555', fontSize: 13, cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#aaa'}
                  onMouseLeave={e => e.currentTarget.style.color = '#555'}
                >
                  ← Back
                </button>
              </form>
            </>
          )}
          </AnimatedPanel>
          </div>
        </div>
      </div>
    </div>
  )
}
