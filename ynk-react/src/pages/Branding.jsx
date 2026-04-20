import { useState } from 'react'
import { Link } from 'react-router-dom'
import QuoteForm from '../components/QuoteForm'
import { useLanguage } from '../i18n/LanguageContext'

const BRANDING_PROJECTS = [
  {
    tag: 'Event Branding',
    title: 'Corporate Gala: Full Visual Identity',
    desc: 'Designed and executed the complete visual experience for a 500-person corporate gala, from stage lighting design and branded step-and-repeat banners to digital slide decks and on-site signage.',
    stack: ['Stage Lighting', 'Print Design', 'Décor'],
  },
  {
    tag: 'Brand Identity',
    title: 'Tech Startup Brand Launch',
    desc: 'Developed a full brand identity for an emerging tech startup, including logo system, color palette, typography guidelines, business cards, and a pitch deck aligned with investor expectations.',
    stack: ['Logo Design', 'Brand Strategy', 'Print'],
  },
  {
    tag: 'Custom Apparel',
    title: 'Team Uniform Campaign',
    desc: 'Produced 300+ custom-printed team uniforms and promotional merchandise for a regional sports association, managing design-to-delivery in under two weeks.',
    stack: ['T-Shirt Printing', 'Merchandise', 'Logistics'],
  },
  {
    tag: 'Visual Storytelling',
    title: 'Product Launch Content Package',
    desc: 'Created a multi-format visual content package for a product launch, including social media assets, promotional banners, and brand story visuals designed for maximum digital engagement.',
    stack: ['Social Assets', 'Visual Content', 'Photography'],
  },
  {
    tag: 'Stage Lighting',
    title: 'Concert & Live Event Production',
    desc: 'Provided full lighting and AV equipment rental and operation for a multi-artist concert, delivering a dynamic stage experience for an audience of 1,200+.',
    stack: ['Stage Lighting', 'AV Equipment', 'Live Events'],
  },
  {
    tag: 'Brand Strategy',
    title: 'Nonprofit Rebrand & Campaign',
    desc: 'Led a full rebrand for a nonprofit organization, refreshing their identity, producing donor campaign collateral, and building a cohesive visual language across print and digital channels.',
    stack: ['Rebrand', 'Print Collateral', 'Campaign Design'],
  },
]

export default function Branding() {
  const { t } = useLanguage()
  const BRANDING_SERVICES = t('brandingServiceOptions') || []
  const [activeTab, setActiveTab] = useState('expertise')

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="section-tag">02</span>
          <h1 className="section-title">{t('brandingCard.title')}</h1>
          <p className="section-subtitle">{t('brandingPage.subtitle')}</p>
        </div>
      </section>

      <div className="page-tabs-bar">
        <div className="container">
          <div className="page-tabs">
            <button
              className={`page-tab${activeTab === 'expertise' ? ' active' : ''}`}
              onClick={() => setActiveTab('expertise')}
              type="button"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
              Expertise
            </button>
            <button
              className={`page-tab${activeTab === 'projects' ? ' active' : ''}`}
              onClick={() => setActiveTab('projects')}
              type="button"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
              Projects
            </button>
          </div>
        </div>
      </div>

      {/* ── EXPERTISE TAB ── */}
      {activeTab === 'expertise' && (
        <>
          <section className="detail-section">
            <div className="container">
              <div className="detail-grid detail-grid--3">
                <div className="detail-card" data-aos="">
                  <div className="detail-card-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  </div>
                  <h3>{t('brandingPage.eventTitle')}</h3>
                  <p>{t('brandingPage.eventDesc')}</p>
                </div>
                <div className="detail-card" data-aos="">
                  <div className="detail-card-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                  </div>
                  <h3>{t('brandingPage.lightingTitle')}</h3>
                  <p>{t('brandingPage.lightingDesc')}</p>
                </div>
                <div className="detail-card" data-aos="">
                  <div className="detail-card-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                  </div>
                  <h3>{t('brandingPage.printTitle')}</h3>
                  <p>{t('brandingPage.printDesc')}</p>
                </div>
              </div>
              <div className="detail-action">
                <p style={{ color: 'var(--color-text-secondary)', marginBottom: '20px', textAlign: 'center', maxWidth: '600px', margin: '0 auto 20px' }}>{t('brandingPage.tagline')}</p>
                <Link to="/" className="btn btn-secondary">{t('brandingPage.backHome')}</Link>
              </div>
            </div>
          </section>

          <section className="cta-section" id="quote">
            <div className="container">
              <div className="cta-content">
                <h2 className="cta-title">{t('brandingPage.quoteTitle')}</h2>
                <p className="cta-text">{t('brandingPage.quoteText')}</p>
              </div>
              <QuoteForm serviceOptions={BRANDING_SERVICES} />
            </div>
          </section>
        </>
      )}

      {/* ── PROJECTS TAB ── */}
      {activeTab === 'projects' && (
        <section className="detail-section">
          <div className="container">
            <div className="projects-header">
              <h2 className="projects-title">Creative Portfolio</h2>
              <p className="projects-sub">From stage lighting to brand strategy: a showcase of impactful creative work across events, print, and identity.</p>
            </div>
            <div className="projects-grid">
              {BRANDING_PROJECTS.map((p, i) => (
                <div className="project-card" key={i}>
                  <span className="project-tag">{p.tag}</span>
                  <h3 className="project-card-title">{p.title}</h3>
                  <p className="project-card-desc">{p.desc}</p>
                  <div className="project-stack">
                    {p.stack.map((s, j) => <span key={j} className="project-stack-tag">{s}</span>)}
                  </div>
                </div>
              ))}
            </div>
            <div className="detail-action" style={{ marginTop: '48px' }}>
              <Link to="/request-quote?category=branding" className="btn btn-primary">Start a Project</Link>
              <Link to="/" className="btn btn-secondary" style={{ marginLeft: '12px' }}>{t('brandingPage.backHome')}</Link>
            </div>
          </div>
        </section>
      )}
    </>
  )
}
