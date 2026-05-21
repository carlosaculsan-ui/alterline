import { useNavigate } from 'react-router-dom'

function Step({ n, text }) {
  return (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '10px' }}>
      <span style={{ minWidth: '22px', height: '22px', borderRadius: '50%', background: '#f0f0f0', color: '#555', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '1px' }}>{n}</span>
      <p style={{ fontSize: '15px', color: '#444', lineHeight: '1.7', margin: 0 }}>{text}</p>
    </div>
  )
}

function Section({ title, subtitle, children }) {
  return (
    <div style={{ marginBottom: '52px' }}>
      <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#111', marginBottom: '4px' }}>{title}</h2>
      {subtitle && <p style={{ fontSize: '14px', color: '#999', marginBottom: '20px' }}>{subtitle}</p>}
      {!subtitle && <div style={{ marginBottom: '20px' }} />}
      {children}
    </div>
  )
}

function Tip({ children }) {
  return (
    <div style={{ background: '#f9f9f9', border: '1px solid #ececec', borderRadius: '8px', padding: '12px 16px', fontSize: '14px', color: '#555', lineHeight: '1.6', marginTop: '12px' }}>
      <strong style={{ color: '#111' }}>Tip: </strong>{children}
    </div>
  )
}

function Tag({ children }) {
  return (
    <code style={{ background: '#f0f0f0', color: '#333', padding: '1px 7px', borderRadius: '4px', fontSize: '13px', fontFamily: 'monospace' }}>{children}</code>
  )
}

export default function TutorialsPage() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div className="max-w-[720px] mx-auto px-8 py-16">

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
          Tutorials
        </h1>
        <p style={{ fontSize: '16px', color: '#888', marginBottom: '56px', lineHeight: '1.6' }}>
          Everything you need to know to get the most out of Alterline.
        </p>

        {/* TOC */}
        <div style={{ background: '#fafafa', border: '1px solid #ececec', borderRadius: '10px', padding: '20px 24px', marginBottom: '56px' }}>
          <p style={{ fontSize: '12px', fontWeight: 600, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>Contents</p>
          {[
            '1. Creating your first entry',
            '2. Organizing with categories',
            '3. The rich text editor',
            '4. Linking entries with @mentions',
            '5. Carlopedia — your personal encyclopedia',
            '6. Relationship graph',
            '7. Backlinks',
            '8. AI writing assistant',
            '9. Archive',
            '10. Dark mode',
          ].map((item) => (
            <p key={item} style={{ fontSize: '14px', color: '#555', marginBottom: '6px' }}>{item}</p>
          ))}
        </div>

        <Section title="1. Creating your first entry" subtitle="Entries are the core unit of Alterline — a story, a character, a note, anything.">
          <Step n="1" text='Click "New Entry" in the left sidebar.' />
          <Step n="2" text="Give your entry a title. You can optionally assign it a category and add custom fields (like a character's age or a location's region)." />
          <Step n="3" text="Click Create. You'll land directly in the entry editor, ready to write." />
          <Tip>Entries support full rich text — bold, italic, colors, highlights, and more. See section 3 for the full editor breakdown.</Tip>
        </Section>

        <Section title="2. Organizing with categories" subtitle="Categories let you group entries by type — Characters, Locations, Factions, etc.">
          <Step n="1" text='Click "New category" at the bottom of the sidebar.' />
          <Step n="2" text="Give it a name and pick a color dot." />
          <Step n="3" text="Assign entries to a category when creating them, or leave them uncategorized — both work fine." />
          <Step n="4" text="Click a category in the sidebar to filter the dashboard to only those entries." />
          <Tip>You can rename or delete a category by hovering over it in the sidebar — the edit and delete icons appear on the right.</Tip>
        </Section>

        <Section title="3. The rich text editor" subtitle="The editor supports a full formatting toolbar at the top of every entry.">
          <div style={{ fontSize: '15px', color: '#444', lineHeight: '1.8' }} className="space-y-2">
            <p><strong style={{ color: '#111' }}>Font size</strong> — Select text, then choose a size from the dropdown on the left of the toolbar.</p>
            <p><strong style={{ color: '#111' }}>Bold, Italic, Underline</strong> — Standard formatting. Works on selected text.</p>
            <p><strong style={{ color: '#111' }}>Text color</strong> — The <Tag>A</Tag> button opens a color picker for the selected text.</p>
            <p><strong style={{ color: '#111' }}>Highlight</strong> — The marker button highlights selected text with a background color.</p>
            <p><strong style={{ color: '#111' }}>Headings</strong> — Use <Tag>H1</Tag> / <Tag>H2</Tag> / <Tag>H3</Tag> to structure long entries.</p>
            <p><strong style={{ color: '#111' }}>Lists</strong> — Bullet and numbered lists for quick notes or structured content.</p>
          </div>
          <Tip>All formatting is saved automatically as you type. There's no manual save button.</Tip>
        </Section>

        <Section title="4. Linking entries with @mentions" subtitle="Connect your entries to Carlopedia articles inline as you write.">
          <Step n="1" text='Type @ anywhere in the story editor. A dropdown appears listing your Carlopedia articles.' />
          <Step n="2" text="Start typing the article name to filter the list, then press Enter or click to insert the mention." />
          <Step n="3" text="The mention appears as a highlighted link inside your entry. Click it to jump to that Carlopedia article." />
          <Step n="4" text="Alternatively, select any word or phrase and use the bubble menu to link it to an existing entry or create a new Carlopedia article in one step." />
          <Tip>Every @mention automatically creates an edge in the Relationship Graph — no extra steps needed.</Tip>
        </Section>

        <Section title="5. Carlopedia — your personal encyclopedia" subtitle="A Wikipedia-style article for every person, place, or thing in your world.">
          <Step n="1" text='Navigate to "Carlopedia" in the sidebar.' />
          <Step n="2" text='Click "+ New article" to create a blank article, or create one directly from a story by selecting text.' />
          <Step n="3" text="Each article has a title, a body (full rich text), and an infobox on the right — similar to Wikipedia's sidebar cards." />
          <Step n="4" text="The infobox supports a photo, a caption, and editable rows: Born, Died, Nationality, Occupation, and Known for. Click any field to edit it inline." />
          <Step n="5" text="To upload a photo, click the photo area inside the infobox." />
          <Tip>Carlopedia articles are separate from regular entries and won't appear in the main Dashboard grid — they live in their own section.</Tip>
        </Section>

        <Section title="6. Relationship graph" subtitle="A live map of every connection in your world.">
          <Step n="1" text='Click "Graph" in the sidebar to open the Relationship Graph.' />
          <Step n="2" text="Each node is a Carlopedia article. Each edge is an @mention link between entries." />
          <Step n="3" text="Drag nodes to rearrange the layout. The graph uses a force-directed simulation, so nodes naturally repel each other and edges pull connected ones together." />
          <Step n="4" text="Click any node to open that Carlopedia article." />
          <Tip>The more @mentions you add in your stories, the richer the graph becomes. It's the fastest way to see which characters and places are most central to your world.</Tip>
        </Section>

        <Section title="7. Backlinks" subtitle="See every entry that references the one you're reading.">
          <p style={{ fontSize: '15px', color: '#444', lineHeight: '1.7', marginBottom: '12px' }}>
            Open any Carlopedia article and look for the <strong style={{ color: '#111' }}>Backlinks</strong> panel. It lists every story entry or article that mentions the current article via an @mention link.
          </p>
          <p style={{ fontSize: '15px', color: '#444', lineHeight: '1.7' }}>
            This means you never have to search for "who mentions this character?" — the answer is always one click away. Click any backlink to jump directly to that entry.
          </p>
          <Tip>Backlinks update automatically whenever you add or remove an @mention anywhere in your world.</Tip>
        </Section>

        <Section title="8. AI writing assistant" subtitle="Context-aware suggestions that know your world.">
          <Step n="1" text='Open any story entry and click the AI assistant button in the editor toolbar (the sparkle icon).' />
          <Step n="2" text="Type a prompt — ask it to continue a scene, suggest dialogue, describe a location, or brainstorm ideas." />
          <Step n="3" text="The assistant has access to your world context: the entries and Carlopedia articles you've written. Suggestions stay consistent with what you've already established." />
          <Step n="4" text="Accept the suggestion to insert it at the cursor, or dismiss it and keep writing." />
          <Tip>The AI assistant works best when your Carlopedia articles are detailed. The more context your world has, the more grounded the suggestions will be.</Tip>
        </Section>

        <Section title="9. Archive" subtitle="Deleted entries and folders aren't gone immediately — they go to the Archive first.">
          <Step n="1" text='Click your account button at the bottom of the sidebar, then choose "Archive" from the menu.' />
          <Step n="2" text="The Archive lists everything you've deleted — entries and folders — along with how many days remain before permanent deletion." />
          <Step n="3" text='Click "Restore" on any item to bring it back exactly as it was. Click "Delete forever" to permanently remove it right away.' />
          <Tip>Items in the Archive are automatically hard-deleted after 30 days. The countdown turns red when fewer than 7 days remain.</Tip>
        </Section>

        <Section title="10. Dark mode" subtitle="Alterline supports light and dark mode, saved to your browser.">
          <p style={{ fontSize: '15px', color: '#444', lineHeight: '1.7' }}>
            Click your account button at the bottom of the sidebar, then choose <strong style={{ color: '#111' }}>Light mode</strong> or <strong style={{ color: '#111' }}>Dark mode</strong> to toggle. Your preference is saved locally and persists across sessions.
          </p>
        </Section>

        <div style={{ marginTop: '32px', paddingTop: '32px', borderTop: '1px solid #f0f0f0' }}>
          <p style={{ fontSize: '14px', color: '#aaa' }}>
            Alterline &nbsp;·&nbsp; Built by Carlo Saculsan
          </p>
        </div>
      </div>
    </div>
  )
}
