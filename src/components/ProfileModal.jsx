import { useState } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../lib/supabase'

export default function ProfileModal({ user, onClose }) {
  const currentName = user?.user_metadata?.full_name || ''
  const [name, setName] = useState(currentName)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [trailEnabled, setTrailEnabled] = useState(
    () => localStorage.getItem('alterline-cursor-trail') === '1'
  )

  function toggleTrail() {
    const next = !trailEnabled
    setTrailEnabled(next)
    localStorage.setItem('alterline-cursor-trail', next ? '1' : '0')
    window.dispatchEvent(new Event('alterline-trail-toggle'))
  }

  async function handleSave() {
    setError('')
    setSuccess('')

    if (password && password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (password && password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setSaving(true)
    const updates = {}
    if (name.trim() !== currentName) updates.data = { full_name: name.trim() }
    if (password) updates.password = password

    if (Object.keys(updates).length === 0) {
      setSaving(false)
      onClose()
      return
    }

    const { error: err } = await supabase.auth.updateUser(updates)
    setSaving(false)
    if (err) {
      setError(err.message)
    } else {
      setSuccess('Saved.')
      setPassword('')
      setConfirmPassword('')
      setTimeout(onClose, 800)
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#1c1c1c] rounded-2xl shadow-2xl w-full max-w-[420px] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[16px] font-semibold text-gray-900 dark:text-white">Profile & settings</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 dark:text-[#555] hover:bg-[#f0f0f0] dark:hover:bg-[#252525] transition-colors text-[18px] leading-none"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          {/* Email (read-only) */}
          <div>
            <label className="block text-[11px] font-medium text-gray-500 dark:text-[#666] uppercase tracking-wide mb-1.5">Email</label>
            <div className="w-full px-3 py-2 text-[13px] text-gray-400 dark:text-[#555] bg-[#f5f5f5] dark:bg-[#161616] rounded-lg">
              {user?.email}
            </div>
          </div>

          {/* Display name */}
          <div>
            <label className="block text-[11px] font-medium text-gray-500 dark:text-[#666] uppercase tracking-wide mb-1.5">Display name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSave() }}
              placeholder="Your name"
              className="w-full px-3 py-2 text-[13px] text-gray-900 dark:text-white bg-transparent border border-[#e5e5e5] dark:border-[#2a2a2a] rounded-lg outline-none focus:border-indigo-400 dark:focus:border-indigo-500 transition-colors placeholder-gray-300 dark:placeholder-[#444]"
            />
          </div>

          <div className="border-t border-[#f0f0f0] dark:border-[#2a2a2a] pt-4">
            <label className="block text-[11px] font-medium text-gray-500 dark:text-[#666] uppercase tracking-wide mb-1.5">New password <span className="normal-case text-gray-400 dark:text-[#555]">(leave blank to keep current)</span></label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password"
              className="w-full px-3 py-2 text-[13px] text-gray-900 dark:text-white bg-transparent border border-[#e5e5e5] dark:border-[#2a2a2a] rounded-lg outline-none focus:border-indigo-400 dark:focus:border-indigo-500 transition-colors placeholder-gray-300 dark:placeholder-[#444] mb-2"
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSave() }}
              placeholder="Confirm new password"
              className="w-full px-3 py-2 text-[13px] text-gray-900 dark:text-white bg-transparent border border-[#e5e5e5] dark:border-[#2a2a2a] rounded-lg outline-none focus:border-indigo-400 dark:focus:border-indigo-500 transition-colors placeholder-gray-300 dark:placeholder-[#444]"
            />
          </div>
        </div>

          <div className="border-t border-[#f0f0f0] dark:border-[#2a2a2a] pt-4 flex items-center justify-between gap-4">
            <div>
              <div className="text-[11px] font-medium text-gray-500 dark:text-[#666] uppercase tracking-wide">Cursor trail</div>
              <div className="text-[11px] text-gray-400 dark:text-[#555] mt-0.5">Ink particles that follow your cursor</div>
            </div>
            <button
              onClick={toggleTrail}
              className={`relative shrink-0 w-9 h-5 rounded-full transition-colors ${trailEnabled ? 'bg-indigo-500' : 'bg-[#e0e0e0] dark:bg-[#333]'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${trailEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
            </button>
          </div>

        {error && <p className="mt-3 text-[12px] text-red-500">{error}</p>}
        {success && <p className="mt-3 text-[12px] text-indigo-500">{success}</p>}

        <div className="flex gap-2 mt-5">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg text-[13px] font-medium border border-[#e5e5e5] dark:border-[#2a2a2a] text-gray-900 dark:text-white hover:bg-[#f5f5f5] dark:hover:bg-[#222] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-4 py-2 rounded-lg text-[13px] font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:opacity-80 transition-opacity disabled:opacity-40"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
