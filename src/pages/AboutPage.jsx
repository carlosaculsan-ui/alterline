export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div className="max-w-[680px] mx-auto px-8 py-16">

        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-14">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M4 21L10 3" stroke="#111" strokeWidth="2" strokeLinecap="round" />
            <path d="M14 3L20 21" stroke="#111" strokeWidth="2" strokeLinecap="round" />
            <path d="M7 13H17" stroke="#ec4899" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span style={{ fontFamily: "'Space Grotesk', Inter, system-ui, sans-serif", fontSize: '15px', fontWeight: 700, letterSpacing: '0.1em', color: '#111' }}>
            Alterline
          </span>
        </div>

        <h1 style={{ fontSize: '32px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '12px', color: '#111' }}>
          About Alterline
        </h1>
        <p style={{ fontSize: '16px', color: '#888', marginBottom: '48px' }}>Built for the worlds that only exist in your head.</p>

        <div style={{ fontSize: '16px', lineHeight: '1.8', color: '#333' }} className="space-y-6">
          <p>
            Alterline started as a personal project by <strong style={{ color: '#111' }}>Carlo Saculsan</strong> — a writer and world-builder who needed a better way to keep track of everything living inside his head.
          </p>
          <p>
            The problem was simple: world-building generates a lot of material. Characters, locations, timelines, factions, lore, contradictions, half-formed ideas. Notebooks get lost. Docs sprawl. Nothing talks to each other.
          </p>
          <p>
            Alterline was built to fix that. It's a private notebook where entries can link to each other — a story can reference a character, a character can link to their home city, a city can link to the faction that controls it. Everything stays connected.
          </p>
          <p>
            <strong style={{ color: '#111' }}>Carlopedia</strong> — the encyclopedia built into Alterline — takes this further. Each subject in your world gets its own article: a name, a photo, a structured infobox, and as much prose as you need. It looks and feels like Wikipedia, but it's entirely yours.
          </p>
          <p>
            What started as a tool for one person's fiction projects turned into something more general: a personal knowledge base that works the way a writer thinks. No folders, no tags, no friction — just entries, links, and ideas.
          </p>
        </div>

        <div style={{ marginTop: '64px', paddingTop: '32px', borderTop: '1px solid #f0f0f0' }}>
          <p style={{ fontSize: '14px', color: '#aaa' }}>
            Built by Carlo Saculsan &nbsp;·&nbsp; {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  )
}
