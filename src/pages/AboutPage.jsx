import { useNavigate } from 'react-router-dom'
import mePng from '../assets/Me.png'

export default function AboutPage() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-white text-gray-900" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div className="max-w-[680px] mx-auto px-8 py-16">

        {/* Header */}
        <div className="flex items-center justify-between mb-14">
          <button
            onClick={() => navigate(-1)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: '#888', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back
          </button>
          <div className="flex items-center gap-2.5">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M4 21L10 3" stroke="#111" strokeWidth="2" strokeLinecap="round" />
              <path d="M14 3L20 21" stroke="#111" strokeWidth="2" strokeLinecap="round" />
              <path d="M7 13H17" stroke="#ec4899" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span style={{ fontFamily: "'Space Grotesk', Inter, system-ui, sans-serif", fontSize: '15px', fontWeight: 700, letterSpacing: '0.1em', color: '#111' }}>
              Alterline
            </span>
          </div>
        </div>

        <h1 style={{ fontSize: '32px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '12px', color: '#111' }}>
          About Alterline
        </h1>
        <p style={{ fontSize: '16px', color: '#444', marginBottom: '48px' }}>Built for the worlds that only exist in your head.</p>

        <div style={{ fontSize: '16px', lineHeight: '1.8', color: '#333' }} className="space-y-6">
          <p>
            Alterline started as a personal project by <strong style={{ color: '#111' }}>Carlo Saculsan</strong> — a writer and world-builder who needed a better way to keep track of everything living inside his head.
          </p>
          <p>
            The problem was simple: world-building generates a lot of material. Characters, locations, timelines, factions, lore, contradictions, half-formed ideas. Notebooks get lost. Docs sprawl. Nothing talks to each other.
          </p>
          <p>
            Alterline was built to fix that. It's a private notebook where entries can link to each other — a story can reference a character, a character can link to their home city, a city can link to the faction that controls it. Everything stays connected. The <strong style={{ color: '#111' }}>Relationship Graph</strong> makes those connections visible: a live, force-directed map of every link in your world, so you can see the shape of your fiction at a glance.
          </p>
          <p>
            <strong style={{ color: '#111' }}>Carlopedia</strong> — the encyclopedia built into Alterline — takes this further. Each subject in your world gets its own article: a name, a photo, a structured infobox, and as much prose as you need. It looks and feels like Wikipedia, but it's entirely yours. Type <strong style={{ color: '#111' }}>@</strong> anywhere in the story editor to mention a Carlopedia article inline — the link is created automatically.
          </p>
          <p>
            The <strong style={{ color: '#111' }}>Backlinks panel</strong> shows every entry that references the one you're currently reading. So when you open a character's article, you immediately see every story, location, or faction that mentions them — without having to search.
          </p>
          <p>
            When the words don't come, the <strong style={{ color: '#111' }}>AI writing assistant</strong> can help. It's built directly into the editor and knows your world — the entries you've written, the details you've established — so suggestions stay consistent with what already exists. It's not there to write for you. It's there to help you get unstuck.
          </p>
          <p>
            Deleted entries don't disappear instantly — they go to the <strong style={{ color: '#111' }}>Archive</strong>, where they sit for 30 days. Restore anything with one click, or let it expire. Nothing is lost by accident.
          </p>
          <p>
            What started as a tool for one person's fiction projects turned into something more general: a personal knowledge base that works the way a writer thinks. No friction — just entries, links, and ideas. It works on any device, desktop or mobile, so your world is always within reach.
          </p>
        </div>

        {/* Creator card */}
        <div style={{ marginTop: '64px', paddingTop: '48px', borderTop: '1px solid #f0f0f0' }}>
          <p style={{ fontSize: '12px', fontWeight: 600, color: '#555', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '20px' }}>
            Creator
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <img
              src={mePng}
              alt="Carlo Saculsan"
              style={{ width: '162px', height: '162px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid #f0f0f0' }}
            />
            <div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#111', marginBottom: '4px' }}>Carlo Saculsan</div>
              <div style={{ fontSize: '14px', color: '#333', lineHeight: '1.6' }}>Writer, world-builder, and the person responsible for this whole thing.</div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: '40px' }}>
          <p style={{ fontSize: '14px', color: '#555' }}>
            {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  )
}
