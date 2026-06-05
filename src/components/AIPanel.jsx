import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

const MODEL = 'llama-3.3-70b-versatile'

function stripHtml(html) {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

const MODES = [
  { key: 'continue', label: 'Continue', prompt: 'Continue this scene from where it left off. Write the next 2–3 paragraphs in the same style and voice.' },
  { key: 'dialogue', label: 'Dialogue', prompt: "Suggest natural dialogue for this scene. Stay true to each character's established voice and personality." },
  { key: 'check', label: 'Consistency', prompt: 'Review this story for consistency issues against the world lore. Flag anything that contradicts established facts, character traits, or world rules.' },
  { key: 'chat', label: 'Chat', prompt: null },
]

export default function AIPanel({ worldId, worldName, entryTitle, getContent, onClose }) {
  const [mode, setMode] = useState('continue')
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [lore, setLore] = useState([])
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (!worldId) return
    async function fetchLore() {
      const [{ data: typed }, { data: pfRows }] = await Promise.all([
        supabase.from('entries').select('id, title, content').eq('world_id', worldId).eq('type', 'carlopedia').is('deleted_at', null).limit(30),
        supabase.from('profile_fields').select('entry_id').eq('field_key', 'carlopedia'),
      ])
      let results = typed ?? []
      const pfIds = (pfRows ?? []).map((r) => r.entry_id)
      if (pfIds.length > 0) {
        const seen = new Set(results.map((e) => e.id))
        const missing = pfIds.filter((pid) => !seen.has(pid))
        if (missing.length > 0) {
          const { data: fb } = await supabase.from('entries').select('id, title, content').in('id', missing).is('deleted_at', null).limit(30)
          results = [...results, ...(fb ?? [])]
        }
      }
      setLore(results)
    }
    fetchLore()
  }, [worldId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function buildSystemPrompt() {
    const loreText = lore
      .map((e) => {
        const body = stripHtml(e.content ?? '').slice(0, 600)
        return `### ${e.title}${body ? '\n' + body : ''}`
      })
      .join('\n\n')

    const storyContent = stripHtml(getContent()).slice(0, 3000)

    return `You are a creative writing assistant for a fictional world called "${worldName || 'this world'}".

Help the writer continue scenes, suggest dialogue, and check consistency — always staying true to established lore, characters, and tone. Be concise and match the writer's existing style.

${loreText ? `## World Lore (Carlopedia)\n${loreText}\n\n` : ''}## Current Story: "${entryTitle || 'Untitled'}"
${storyContent || '(empty)'}`
  }

  async function send(userText) {
    if (!userText.trim() || loading) return
    setLoading(true)

    const userMsg = { role: 'user', content: userText.trim() }
    const history = [...messages, userMsg]
    setMessages(history)
    setInput('')

    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [{ role: 'system', content: buildSystemPrompt() }, ...history],
          temperature: 0.8,
          max_tokens: 1024,
        }),
      })
      const data = await res.json()
      const reply = data.choices?.[0]?.message?.content ?? 'No response.'
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }])
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Could not reach Groq. Check your API key in .env.' }])
    }
    setLoading(false)
  }

  const currentMode = MODES.find((m) => m.key === mode)
  const showRunButton = mode !== 'chat' && messages.length === 0

  return (
    <div className="fixed right-0 bottom-14 lg:bottom-0 top-14 lg:top-0 w-full sm:w-[340px] z-40 flex flex-col bg-white dark:bg-[#111] border-l border-[#e5e5e5] dark:border-[#1e1e1e] shadow-2xl">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[#f0f0f0] dark:border-[#1e1e1e] shrink-0">
        <span className="text-[13px] font-semibold text-gray-900 dark:text-white flex-1">✦ AI Assistant</span>
        <button
          onClick={onClose}
          className="w-6 h-6 flex items-center justify-center rounded text-[16px] leading-none text-gray-400 dark:text-[#555] hover:text-gray-700 dark:hover:text-gray-300 hover:bg-[#f0f0f0] dark:hover:bg-[#1c1c1c] transition-colors"
        >
          ×
        </button>
      </div>

      {/* Mode tabs */}
      <div className="flex gap-1 px-3 py-2 border-b border-[#f0f0f0] dark:border-[#1e1e1e] shrink-0">
        {MODES.map((m) => (
          <button
            key={m.key}
            onClick={() => { setMode(m.key); setMessages([]) }}
            className={`flex-1 py-1 rounded text-[11px] font-medium transition-colors ${
              mode === m.key
                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                : 'text-gray-900 dark:text-[#555] hover:bg-[#f0f0f0] dark:hover:bg-[#1c1c1c]'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
        {messages.length === 0 && (
          <p className="text-center text-[12px] text-gray-400 dark:text-[#444] leading-relaxed pt-6">
            {mode === 'chat'
              ? 'Ask anything about your world or story.'
              : `Click Run to ${mode === 'continue' ? 'continue the scene' : mode === 'dialogue' ? 'get dialogue suggestions' : 'check for consistency issues'}.`}
          </p>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[92%] rounded-xl px-3 py-2 text-[13px] leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-[#f5f5f5] dark:bg-[#1c1c1c] text-gray-900 dark:text-white'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-[#f5f5f5] dark:bg-[#1c1c1c] rounded-xl px-3 py-2">
              <span className="text-[13px] text-gray-400 dark:text-[#555] animate-pulse">Thinking…</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="shrink-0 border-t border-[#f0f0f0] dark:border-[#1e1e1e] px-3 py-3">
        {showRunButton ? (
          <button
            onClick={() => send(currentMode.prompt)}
            disabled={loading}
            className="w-full py-2 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[13px] font-medium disabled:opacity-50 hover:opacity-80 transition-opacity"
          >
            {loading ? 'Running…' : 'Run'}
          </button>
        ) : (
          <div className="flex gap-2 items-end">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input) }
              }}
              placeholder="Ask anything… (Shift+Enter for newline)"
              rows={2}
              className="flex-1 resize-none text-[13px] bg-[#f5f5f5] dark:bg-[#1c1c1c] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-[#444] rounded-lg px-3 py-2 outline-none border border-transparent focus:border-indigo-400 dark:focus:border-indigo-500/60 transition-colors"
            />
            <button
              onClick={() => send(input)}
              disabled={loading || !input.trim()}
              className="px-3 py-2 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[13px] font-medium disabled:opacity-40 hover:opacity-80 transition-opacity shrink-0"
            >
              →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
