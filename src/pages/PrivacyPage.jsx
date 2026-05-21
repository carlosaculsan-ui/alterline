import { useNavigate } from 'react-router-dom'

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: '40px' }}>
      <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#111', marginBottom: '12px' }}>{title}</h2>
      <div style={{ fontSize: '15px', lineHeight: '1.8', color: '#444' }} className="space-y-3">
        {children}
      </div>
    </div>
  )
}

export default function PrivacyPage() {
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
          Privacy Policy
        </h1>
        <p style={{ fontSize: '15px', color: '#888', marginBottom: '48px' }}>
          Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>

        <Section title="Overview">
          <p>
            Alterline is a personal knowledge base and world-building tool. This policy explains what information we collect, how we use it, and what rights you have over it. We keep things simple — you own your data, and we don't sell it.
          </p>
        </Section>

        <Section title="Information We Collect">
          <p><strong style={{ color: '#111' }}>Account information.</strong> When you create an account, we collect your email address and a hashed version of your password. We do not store your password in plain text.</p>
          <p><strong style={{ color: '#111' }}>Your content.</strong> Everything you create inside Alterline — entries, stories, Carlopedia articles, categories, and any associated metadata — is stored on your behalf in our database.</p>
          <p><strong style={{ color: '#111' }}>Usage data.</strong> We do not currently collect analytics, telemetry, or usage tracking of any kind.</p>
        </Section>

        <Section title="How We Use Your Information">
          <p>Your email is used solely to authenticate your account. We do not use it for marketing, and we do not share it with third parties.</p>
          <p>Your content is used only to provide the service — to display, store, and retrieve your entries when you use Alterline. We do not read, analyze, or use your content for any other purpose.</p>
        </Section>

        <Section title="Data Storage and Security">
          <p>
            Alterline stores your data on <strong style={{ color: '#111' }}>Supabase</strong>, a managed database platform. Your data is protected by row-level security — each user can only access their own content. Data is encrypted in transit using HTTPS.
          </p>
          <p>
            No system is perfectly secure. While we take reasonable steps to protect your data, we cannot guarantee absolute security.
          </p>
        </Section>

        <Section title="Data Retention and Deletion">
          <p>
            Your data is retained for as long as your account exists. When you delete an entry or folder inside the app, it is moved to the Archive and held for 30 days before being permanently removed — giving you a window to restore anything deleted by mistake.
          </p>
          <p>
            If you wish to delete your account and all associated data, contact us at the address below and we will process your request promptly.
          </p>
        </Section>

        <Section title="Your Rights">
          <p>You have the right to access, correct, or delete the data we hold about you. Since Alterline is a personal tool, all of your content is already directly accessible and editable through the app.</p>
          <p>You may request full deletion of your account and data at any time.</p>
        </Section>

        <Section title="Changes to This Policy">
          <p>
            We may update this policy occasionally. If we make significant changes, we'll update the date at the top of this page.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            If you have any questions or requests related to your privacy, reach out to the creator directly at <strong style={{ color: '#111' }}>carlosaculsan123@gmail.com</strong>.
          </p>
        </Section>

        <div style={{ marginTop: '48px', paddingTop: '32px', borderTop: '1px solid #f0f0f0' }}>
          <p style={{ fontSize: '14px', color: '#aaa' }}>
            Alterline &nbsp;·&nbsp; Built by Carlo Saculsan
          </p>
        </div>
      </div>
    </div>
  )
}
