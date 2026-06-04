import { useState, useRef } from 'react'

const SECTION = { marginBottom: 24 }
const H2 = { color: 'white', fontSize: 14, fontWeight: 600, margin: '0 0 8px' }
const P = { color: '#888', fontSize: 13, lineHeight: 1.75, margin: '0 0 10px' }
const UL = { color: '#888', fontSize: 13, lineHeight: 1.75, paddingLeft: 20, margin: '0 0 10px' }

export default function TermsModal({ onAgree, onClose }) {
  const [scrolledToBottom, setScrolledToBottom] = useState(false)
  const contentRef = useRef(null)

  function handleScroll() {
    const el = contentRef.current
    if (!el) return
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 32
    if (nearBottom) setScrolledToBottom(true)
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ width: '100%', maxWidth: 600, backgroundColor: '#141414', border: '1px solid #2a2a2a', borderRadius: 12, display: 'flex', flexDirection: 'column', maxHeight: '88vh', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px 18px', borderBottom: '1px solid #222', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 30, height: 30, backgroundColor: 'white', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path d="M4 21L10 3" stroke="#111" strokeWidth="2.5" strokeLinecap="round"/>
                <path d="M14 3L20 21" stroke="#111" strokeWidth="2.5" strokeLinecap="round"/>
                <path d="M7 13H17" stroke="#ec4899" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <p style={{ color: 'white', fontSize: 14, fontWeight: 600, margin: 0 }}>Terms of Service</p>
              <p style={{ color: '#555', fontSize: 12, margin: 0 }}>Last updated May 2026</p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', padding: 4, display: 'flex', borderRadius: 6 }}
            onMouseEnter={e => e.currentTarget.style.color = '#aaa'}
            onMouseLeave={e => e.currentTarget.style.color = '#555'}
            aria-label="Close"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Scroll hint */}
        {!scrolledToBottom && (
          <div style={{ backgroundColor: '#1a1a1a', borderBottom: '1px solid #222', padding: '8px 24px', flexShrink: 0 }}>
            <p style={{ color: '#aaa', fontSize: 12, margin: 0, textAlign: 'center' }}>Scroll to the bottom to accept</p>
          </div>
        )}

        {/* Scrollable content */}
        <div
          ref={contentRef}
          onScroll={handleScroll}
          style={{ overflowY: 'auto', padding: '28px 24px', flex: 1 }}
        >

          <div style={SECTION}>
            <h2 style={H2}>1. Acceptance of Terms</h2>
            <p style={P}>Welcome to Alterline. By creating an account, accessing, or using any part of the Alterline platform (the "Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to all of these Terms, you may not access or use the Service.</p>
            <p style={P}>These Terms constitute a legally binding agreement between you ("User," "you," or "your") and Alterline ("we," "us," or "our"). Your continued use of the Service following any update to these Terms constitutes your acceptance of the revised Terms.</p>
          </div>

          <div style={SECTION}>
            <h2 style={H2}>2. Description of Service</h2>
            <p style={P}>Alterline is a creative platform designed for worldbuilders, fiction writers, and storytellers. The Service allows users to:</p>
            <ul style={UL}>
              <li>Create and manage detailed story entries, characters, locations, and lore within personal worldbuilding projects</li>
              <li>Organize narrative content through categories and relationship structures</li>
              <li>Visualize connections between story elements using our relationship graph tools</li>
              <li>Access AI-assisted writing features powered by third-party language models</li>
              <li>Reference and explore curated content through the Carlopedia knowledge base</li>
              <li>Search, filter, and navigate their creative universe from any device</li>
            </ul>
            <p style={P}>We reserve the right to modify, suspend, or discontinue any aspect of the Service at any time, with or without notice. We shall not be liable to you or any third party for any such modification, suspension, or discontinuation.</p>
          </div>

          <div style={SECTION}>
            <h2 style={H2}>3. Eligibility</h2>
            <p style={P}>You must be at least 13 years of age to use Alterline. If you are under 18 years of age, you represent that your legal guardian has reviewed and agreed to these Terms on your behalf. By using the Service, you represent and warrant that you meet all eligibility requirements.</p>
            <p style={P}>If you are using the Service on behalf of a company, organization, or other legal entity, you represent that you have the authority to bind that entity to these Terms. In that case, "you" and "your" will refer to that entity.</p>
          </div>

          <div style={SECTION}>
            <h2 style={H2}>4. Account Registration and Security</h2>
            <p style={P}>To access most features of the Service, you must register for an account. When registering, you agree to provide accurate, current, and complete information. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.</p>
            <p style={P}>You agree to:</p>
            <ul style={UL}>
              <li>Immediately notify us of any unauthorized access to or use of your account</li>
              <li>Use a strong, unique password and not share it with any third party</li>
              <li>Not create more than one account per person without our explicit written permission</li>
              <li>Not use another user's account without permission</li>
              <li>Ensure that you log out at the end of each session if using a shared device</li>
            </ul>
            <p style={P}>We will not be liable for any loss or damage arising from your failure to comply with these security obligations. We reserve the right to disable any account, at any time, if in our reasonable opinion you have failed to comply with any of these Terms.</p>
          </div>

          <div style={SECTION}>
            <h2 style={H2}>5. User-Generated Content</h2>
            <p style={P}>Alterline allows you to create, upload, store, and share content including but not limited to story entries, world lore, character descriptions, narrative arcs, and any other creative material ("User Content"). You are solely responsible for all User Content that you submit, post, or display through the Service.</p>
            <p style={P}>By submitting User Content, you represent and warrant that:</p>
            <ul style={UL}>
              <li>You own or have the necessary rights, licenses, and permissions to submit and use such content</li>
              <li>Your content does not infringe any intellectual property rights, privacy rights, or other rights of any third party</li>
              <li>Your content does not violate any applicable law or regulation</li>
              <li>Your content does not contain any malicious code, viruses, or other harmful components</li>
            </ul>
            <p style={P}>We do not claim ownership over your User Content. However, by submitting content, you acknowledge that we may access it for the purpose of providing, maintaining, and improving the Service, including for troubleshooting, backup, and security purposes.</p>
          </div>

          <div style={SECTION}>
            <h2 style={H2}>6. License Grant</h2>
            <p style={P}>By submitting User Content to Alterline, you grant us a non-exclusive, worldwide, royalty-free, sublicensable, and transferable license to host, store, cache, display, and transmit your User Content solely for the purpose of operating, maintaining, and providing the Service to you.</p>
            <p style={P}>This license does not grant us the right to sell your content to third parties, use your content in advertising without your consent, or share your private content beyond what is required to operate the Service. You retain all intellectual property rights in and to your User Content.</p>
            <p style={P}>You may delete your content or your account at any time. Upon deletion, we will remove your content from our active systems within a reasonable period, though residual copies may remain in backups for a limited time pursuant to our data retention policies.</p>
          </div>

          <div style={SECTION}>
            <h2 style={H2}>7. Content Standards and Prohibited Conduct</h2>
            <p style={P}>You agree not to use the Service to create, store, or share content that:</p>
            <ul style={UL}>
              <li>Is unlawful, harmful, threatening, abusive, harassing, defamatory, or otherwise objectionable</li>
              <li>Depicts or promotes violence, hatred, or discrimination based on race, ethnicity, religion, gender, sexual orientation, disability, or any other protected characteristic</li>
              <li>Contains sexually explicit content involving minors or non-consensual scenarios</li>
              <li>Infringes any patent, trademark, trade secret, copyright, or other intellectual property rights of any party</li>
              <li>Contains private or personally identifying information of another person without their consent</li>
              <li>Constitutes unsolicited commercial communications or spam</li>
              <li>Attempts to impersonate any person, entity, or brand</li>
            </ul>
            <p style={P}>You further agree not to:</p>
            <ul style={UL}>
              <li>Attempt to gain unauthorized access to any part of the Service or its related systems</li>
              <li>Reverse engineer, decompile, or disassemble any part of the Service</li>
              <li>Use any automated tools, bots, or scrapers to access, index, or collect data from the Service without our prior written consent</li>
              <li>Interfere with or disrupt the integrity or performance of the Service</li>
              <li>Circumvent any technical measures we use to protect the Service</li>
              <li>Use the Service for any commercial purpose without our explicit written authorization</li>
            </ul>
            <p style={P}>We reserve the right to remove any content that violates these standards and to terminate accounts of users who engage in prohibited conduct, without prior notice and without liability to you.</p>
          </div>

          <div style={SECTION}>
            <h2 style={H2}>8. AI-Powered Features</h2>
            <p style={P}>Alterline offers AI-assisted writing features powered by third-party artificial intelligence providers. By using these features, you acknowledge and agree that:</p>
            <ul style={UL}>
              <li>AI-generated content is provided "as is" and may not always be accurate, appropriate, or complete</li>
              <li>You are solely responsible for reviewing, editing, and taking responsibility for any AI-generated content you use</li>
              <li>We do not guarantee that AI-generated content is free from errors, biases, or objectionable material</li>
              <li>Your prompts and interactions with AI features may be processed by third-party AI providers subject to their own terms and privacy policies</li>
              <li>We are not liable for any damages arising from your reliance on AI-generated content</li>
            </ul>
          </div>

          <div style={SECTION}>
            <h2 style={H2}>9. Privacy and Data Collection</h2>
            <p style={P}>Your privacy is important to us. Our collection, use, and sharing of your personal data is governed by our Privacy Policy, which is incorporated into these Terms by reference. By using the Service, you consent to the data practices described in our Privacy Policy.</p>
            <p style={P}>We collect information you provide directly (such as account registration data, story content, and communications with us), information collected automatically (such as usage data and device information), and information from third-party services when you authenticate via Google OAuth or similar providers.</p>
            <p style={P}>We use industry-standard security measures to protect your data, including encryption in transit and at rest. However, no method of transmission over the internet or method of electronic storage is 100% secure, and we cannot guarantee absolute security.</p>
          </div>

          <div style={SECTION}>
            <h2 style={H2}>10. Third-Party Services</h2>
            <p style={P}>The Service integrates with third-party services including but not limited to Supabase (database and authentication), Groq (AI language model inference), and Google (OAuth authentication). Your use of these third-party services is subject to their respective terms of service and privacy policies.</p>
            <p style={P}>We are not responsible for the practices of any third-party services linked to or integrated with Alterline. We encourage you to review the terms and privacy policies of any third-party services you interact with through our platform.</p>
          </div>

          <div style={SECTION}>
            <h2 style={H2}>11. Intellectual Property</h2>
            <p style={P}>The Service and its original content (excluding User Content), features, design, and functionality are and will remain the exclusive property of Alterline and its licensors. The Service is protected by copyright, trademark, and other laws. Our trademarks and trade dress may not be used in connection with any product or service without our prior written consent.</p>
            <p style={P}>You acknowledge that you have no right, title, or interest in or to the Service itself beyond the limited right to use it as set forth in these Terms.</p>
          </div>

          <div style={SECTION}>
            <h2 style={H2}>12. Service Availability and Modifications</h2>
            <p style={P}>We do not guarantee that the Service will be available at all times. The Service may be subject to interruptions, outages, or degraded performance due to maintenance, updates, or factors beyond our control. We will endeavor to provide advance notice of planned maintenance where practicable.</p>
            <p style={P}>We reserve the right to modify, add, or remove features of the Service at any time. We may also introduce new pricing tiers or change existing pricing with reasonable notice to existing users.</p>
          </div>

          <div style={SECTION}>
            <h2 style={H2}>13. Disclaimer of Warranties</h2>
            <p style={P}>THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT ANY WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, OR COURSE OF PERFORMANCE.</p>
            <p style={P}>We do not warrant that: (a) the Service will function uninterrupted, securely, or be available at any particular time or location; (b) any errors or defects will be corrected; (c) the Service is free of viruses or other harmful components; or (d) the results of using the Service will meet your requirements.</p>
          </div>

          <div style={SECTION}>
            <h2 style={H2}>14. Limitation of Liability</h2>
            <p style={P}>TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL ALTERLINE, ITS DIRECTORS, EMPLOYEES, PARTNERS, AGENTS, SUPPLIERS, OR AFFILIATES BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM:</p>
            <ul style={UL}>
              <li>Your access to or use of (or inability to access or use) the Service</li>
              <li>Any conduct or content of any third party on the Service</li>
              <li>Any content obtained from the Service, including AI-generated content</li>
              <li>Unauthorized access, use, or alteration of your transmissions or content</li>
            </ul>
            <p style={P}>In no event shall our aggregate liability to you for all claims arising out of or related to the Service exceed one hundred US dollars (US $100) or the amount you paid us in the past twelve months, whichever is greater.</p>
          </div>

          <div style={SECTION}>
            <h2 style={H2}>15. Indemnification</h2>
            <p style={P}>You agree to defend, indemnify, and hold harmless Alterline and its officers, directors, employees, and agents from and against any claims, liabilities, damages, judgments, awards, losses, costs, expenses, or fees (including reasonable attorneys' fees) arising out of or relating to your violation of these Terms or your use of the Service, including, but not limited to, your User Content, any use of the Service other than as expressly authorized in these Terms, or your use of any information obtained from the Service.</p>
          </div>

          <div style={SECTION}>
            <h2 style={H2}>16. Account Termination</h2>
            <p style={P}>You may delete your account at any time by using the account management features within the Service or by contacting us. Upon deletion, your User Content will be removed from our active systems, though we may retain anonymized or aggregated data derived from your use of the Service.</p>
            <p style={P}>We reserve the right to suspend or terminate your account, with or without notice, for any reason, including if we reasonably believe that you have violated these Terms. Upon termination, your right to access the Service will immediately cease. Provisions of these Terms that by their nature should survive termination shall survive, including ownership provisions, warranty disclaimers, indemnity, and limitations of liability.</p>
          </div>

          <div style={SECTION}>
            <h2 style={H2}>17. Changes to These Terms</h2>
            <p style={P}>We reserve the right to modify these Terms at any time. When we make material changes, we will notify you by updating the "Last updated" date at the top of these Terms and, where appropriate, by sending a notice to the email address associated with your account. Your continued use of the Service after the effective date of the revised Terms constitutes your acceptance of those changes.</p>
            <p style={P}>If you do not agree to the revised Terms, you must stop using the Service and delete your account.</p>
          </div>

          <div style={SECTION}>
            <h2 style={H2}>18. Governing Law and Dispute Resolution</h2>
            <p style={P}>These Terms shall be governed by and construed in accordance with applicable law, without regard to its conflict of law provisions. Any dispute arising from or relating to these Terms or the Service shall first be attempted to be resolved through good-faith negotiation between the parties.</p>
            <p style={P}>If a dispute cannot be resolved through negotiation within thirty (30) days, both parties agree to submit to binding arbitration conducted by a mutually agreed arbitration service. The arbitration shall be conducted in English. Nothing in this section shall prevent either party from seeking injunctive or other equitable relief from a court of competent jurisdiction.</p>
          </div>

          <div style={{ ...SECTION, marginBottom: 32 }}>
            <h2 style={H2}>19. Contact Information</h2>
            <p style={P}>If you have any questions, concerns, or requests regarding these Terms or the Service, please contact us at:</p>
            <p style={{ ...P, color: '#aaa' }}>
              Alterline<br />
              carlosaculsan123@gmail.com
            </p>
            <p style={P}>We will make every effort to respond to your inquiry within a reasonable time.</p>
          </div>

          {/* I Agree button — inside scroll so the user must reach the bottom */}
          <div style={{ borderTop: '1px solid #222', paddingTop: 24, display: 'flex', gap: 12 }}>
            <button
              onClick={onClose}
              style={{ flex: 1, height: 42, backgroundColor: 'transparent', border: '1px solid #2e2e2e', borderRadius: 8, fontSize: 14, color: '#888', cursor: 'pointer', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#444'; e.currentTarget.style.color = '#ccc' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#2e2e2e'; e.currentTarget.style.color = '#888' }}
            >
              Close
            </button>
            <button
              onClick={scrolledToBottom ? onAgree : undefined}
              disabled={!scrolledToBottom}
              title={scrolledToBottom ? '' : 'Scroll to the bottom to accept'}
              style={{ flex: 2, height: 42, backgroundColor: scrolledToBottom ? 'white' : '#252525', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, color: scrolledToBottom ? '#111' : '#444', cursor: scrolledToBottom ? 'pointer' : 'not-allowed', transition: 'all 0.2s' }}
              onMouseEnter={e => { if (scrolledToBottom) e.currentTarget.style.backgroundColor = '#e8e8e8' }}
              onMouseLeave={e => { if (scrolledToBottom) e.currentTarget.style.backgroundColor = 'white' }}
            >
              {scrolledToBottom ? 'I Agree' : 'Scroll down to agree ↓'}
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
