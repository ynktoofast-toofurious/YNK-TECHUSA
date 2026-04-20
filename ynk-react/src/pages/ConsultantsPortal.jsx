import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import emailjs from '@emailjs/browser'
import { saveAccessRequest, getDynamicCodes, trackAccessCodeUsage } from '../utils/tracking'
import { useLanguage } from '../i18n/LanguageContext'
import ResumeCard from '../components/ResumeCard'

emailjs.init('zG_jERVPbUUfiZ6IL')

const INDUSTRY_ICONS = {
  Healthcare: <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/><path d="M9 9v.01"/><path d="M9 12v.01"/><path d="M9 15v.01"/><path d="M9 18v.01"/></svg>,
  Finance: <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
  Education: <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 3 3 6 3s6-1 6-3v-5"/></svg>,
  Technology: <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>,
  Government: <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18"/><path d="M5 21V8l7-5 7 5v13"/><path d="M9 21v-6h6v6"/><path d="M3 8h18"/></svg>,
  Retail: <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>,
  'Data Engineering': <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>,
}

const RESUME_MAP = [
  { hash: 'd949343d40287395916ef061561782c1a506cdaca890a92f8c12d1faa4b65def', industry: 'Healthcare', file: 'Admin/resumes/healthcare.pdf' },
  { hash: 'f9f5f3d76bbd21f24148fbf487ace9328f8a51367e014bfcf4fd06e156ba568c', industry: 'Finance', file: 'Admin/resumes/finance.pdf' },
  { hash: '0384cec16354f94cab65c250d3d94693ec774796f9e50b2213c2663fd45240ea', industry: 'Education', file: 'Admin/resumes/education.pdf' },
  { hash: '336fb457589f78fc54e4f24215c4133dbf85a74a30904eb774a0272bb7c6428d', industry: 'Technology', file: 'Admin/resumes/technology.pdf' },
  { hash: '23040e83f99dd6e07994719e499ed59f460562441bdb6a50ac9b5ccdf921dc30', industry: 'Government', file: 'Admin/resumes/government.pdf' },
  { hash: '78c1cb1cc907f88da58c31075e2829a32b5965583e680fe2bffeba95296e35b8', industry: 'Retail', file: 'Admin/resumes/retail.pdf' },
  { hash: 'c2b47a63731365f265c92278923d928edcf08000696775cde4ba4ba2b8ccd70e', industry: 'Data Engineering', file: 'Admin/resumes/data-engineering.html' },
  // Viewer-only access (view resume, no download) — code: MOISEVIEW2026
  { hash: 'f4681ba3df0fc625a9ef41924fd878a3b23ef5229abbd65463ec67045e71d2b2', industry: 'Data Engineering', file: 'Admin/resumes/data-engineering.html', viewOnly: true, viewer: 'moise' },
]

async function sha256(text) {
  const enc = new TextEncoder().encode(text)
  const buf = await crypto.subtle.digest('SHA-256', enc)
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export default function ConsultantsPortal() {
  const [unlocked, setUnlocked] = useState(false)
  const [match, setMatch] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showRequest, setShowRequest] = useState(false)
  const [requestSent, setRequestSent] = useState(false)
  const [requestSending, setRequestSending] = useState(false)
  const [requestError, setRequestError] = useState('')
  const [activeTab, setActiveTab] = useState('expertise')
  const [showCode, setShowCode] = useState(false)
  const codeRef = useRef()
  const requestFormRef = useRef()
  const { t } = useLanguage()

  const handleAccess = async () => {
    const raw = codeRef.current.value.trim()
    if (!raw) {
      setError(t('consultantsPage.enterCode'))
      return
    }
    // Normalize: uppercase, strip whitespace, replace any fancy dashes/quotes with ASCII equivalents
    const code = raw
      .toUpperCase()
      .replace(/\s+/g, '')
      .replace(/[\u2010\u2011\u2012\u2013\u2014\u2015\u2212\uFE58\uFE63\uFF0D]/g, '-')
    try {
      const hash = await sha256(code)

      // Check static codes
      let found = RESUME_MAP.find((r) => r.hash === hash)

      // Check dynamic codes from API/localStorage (admin-approved)
      if (!found) {
        const dynamicCodes = await getDynamicCodes()
        found = dynamicCodes.find((r) => r.hash === hash)
      }

      if (found) {
        setMatch(found)
        setUnlocked(true)
        setLoading(true)
        setError('')
        trackAccessCodeUsage(found.industry, found.viewOnly ? 'view-only' : 'view')
      } else {
        setError(t('consultantsPage.invalidCode'))
        codeRef.current.value = ''
        codeRef.current.focus()
      }
    } catch (err) {
      console.error('Access code error:', err)
      setError(t('consultantsPage.invalidCode'))
    }
  }

  const handleExit = () => {
    setUnlocked(false)
    setMatch(null)
    setLoading(false)
    if (codeRef.current) codeRef.current.value = ''
  }

  const handleDownload = () => {
    if (!match) return
    const a = document.createElement('a')
    a.href = match.file
    a.download = ''
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const handleRequestSubmit = async (e) => {
    e.preventDefault()
    setRequestSending(true)
    setRequestError('')

    const formData = new FormData(requestFormRef.current)
    const requestData = {
      name: formData.get('req_name'),
      email: formData.get('req_email'),
      company: formData.get('req_company') || 'N/A',
      industry: formData.get('req_industry'),
      reason: formData.get('req_reason'),
    }

    try {
      // Send notification email to admin
      await emailjs.send('service_sw3zais', 'template_99cacr8', {
        to_email: 'yannicknkongolo7@gmail.com',
        heading: 'New Access Code Request',
        content_html: `<p>A visitor has requested access to the <strong>Consultants Portal</strong>.</p>
<div style="background-color:#f9f9f9;border:1px solid #eee;border-radius:4px;padding:14px;margin:16px 0">
<strong>Name:</strong> ${requestData.name}<br/>
<strong>Email:</strong> ${requestData.email}<br/>
<strong>Company:</strong> ${requestData.company}<br/>
<strong>Industry:</strong> ${requestData.industry}<br/>
<strong>Reason:</strong> ${requestData.reason}
</div>
<p><a href="https://ynk-techusa.com/Admin/" style="display:inline-block;background-color:#29B5E8;color:#fff;text-decoration:none;padding:10px 24px;border-radius:4px;font-weight:600">Review Request</a></p>`,
        footer_note: 'You received this email because you are an administrator of YNK-Tech USA',
      })

      // Save to cloud/localStorage for admin portal
      await saveAccessRequest(requestData)
      setRequestSent(true)
    } catch (err) {
      console.error('EmailJS error:', err)
      setRequestError(
        `Failed to send: ${err?.text || err?.message || 'Unknown error'}. Please email yannicknkongolo7@gmail.com directly.`
      )
    } finally {
      setRequestSending(false)
    }
  }

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="section-tag">03</span>
          <h1 className="section-title">{t('consultantsCard.title')}</h1>
          <p className="section-subtitle">{t('consultantsPage.subtitle')}</p>
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

      {/* ── PROJECTS TAB (no gate required) ── */}
      {activeTab === 'projects' && (
        <section className="detail-section">
          <div className="container">
            <div className="projects-header">
              <h2 className="projects-title">Consulting Engagements</h2>
              <p className="projects-sub">Select consulting and data engineering engagements across healthcare, manufacturing, and enterprise analytics.</p>
            </div>
            <div className="projects-grid">
              {[
                { tag: 'Snowflake', title: 'Data Engineering using Snowflake', desc: 'Engineered a Snowflake reporting layer processing over 4 billion rows of pharmacy claims. Designed schemas, implemented clustering keys, and enabled real-time analytics for 4,000+ health plan clients.', stack: ['Snowflake', 'SQL', 'Power BI', 'Python'], status: 'Soon Available' },
                { tag: 'Power BI', title: 'Data Engineering using Power BI', desc: 'Led full Power BI Service deployment: workspace governance, deployment pipelines, 40+ executive dashboards, multi-layer RLS protecting PHI/PII, and enterprise dataflow automation.', stack: ['Power BI', 'DAX', 'DirectQuery', 'RLS'], status: 'Soon Available' },
                { tag: 'Git & VS Code', title: 'Data Engineering using Git and VS Code', desc: 'Managed full CI/CD pipelines via GitHub Actions, version-controlled all dbt and SQL assets, and used VS Code as the core engineering workbench with dbt Power User and SQLTools extensions.', stack: ['Git', 'GitHub Actions', 'VS Code', 'CI/CD'], status: 'Soon Available' },
                { tag: 'dbt', title: 'Data Engineering engaging dbt', desc: 'Architected modular dbt project with staging, intermediate, and mart layers. Built full lineage documentation, incremental models, snapshot tables, and reusable macros reducing duplication by 70%.', stack: ['dbt', 'Snowflake', 'Jinja', 'SQL'], status: 'Soon Available' },
                { tag: 'Prompt & LLMs', title: 'Data Engineering using Prompt and LLMs', desc: 'Leveraged GPT-4 and Claude as engineering co-pilots for SQL generation, dbt scaffolding, and documentation automation. Designed AI Concierge chatbot and researched LLM-based pipeline anomaly detection.', stack: ['GPT-4', 'Claude', 'Prompt Engineering', 'Python'], status: 'Soon Available' },
              ].map((p, i) => (
                <div className="project-card" key={i}>
                  <div className="project-card-top">
                    <span className="project-tag">{p.tag}</span>
                    {p.status && <span className="project-status-badge">{p.status}</span>}
                  </div>
                  <h3 className="project-card-title">{p.title}</h3>
                  <p className="project-card-desc">{p.desc}</p>
                  <div className="project-stack">
                    {p.stack.map((s, j) => <span key={j} className="project-stack-tag">{s}</span>)}
                  </div>
                </div>
              ))}
            </div>
            <div className="detail-action" style={{ marginTop: '48px' }}>
              <Link to="/request-quote" className="btn btn-primary">Work With Us</Link>
              <Link to="/" className="btn btn-secondary" style={{ marginLeft: '12px' }}>{t('consultantsPage.backHome')}</Link>
            </div>
          </div>
        </section>
      )}

      {/* ── EXPERTISE TAB (gated portal) ── */}
      {activeTab === 'expertise' && (
      <section className="portfolio-section">
        <div className="container">
          {!unlocked ? (
            <>
              <div className="portfolio-gate" id="portfolioGate">
                <div className="gate-card">
                  <div className="gate-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="3" y="11" width="18" height="11" rx="2" />
                      <path d="M7 11V7a5 5 0 0110 0v4" />
                    </svg>
                  </div>
                  <h3>{t('consultantsPage.gateTitle')}</h3>
                  <p>{t('consultantsPage.gateDesc')}</p>
                  <div className="gate-form">
                    <div className="gate-input-wrap">
                      <input
                        type={showCode ? 'text' : 'password'}
                        ref={codeRef}
                        placeholder={t('consultantsPage.placeholder')}
                        maxLength="30"
                        autoComplete="off"
                        onKeyDown={(e) => e.key === 'Enter' && handleAccess()}
                      />
                      <button
                        type="button"
                        className="gate-eye-btn"
                        onClick={() => setShowCode(v => !v)}
                        aria-label={showCode ? 'Hide code' : 'Show code'}
                      >
                        {showCode ? (
                          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                            <line x1="1" y1="1" x2="23" y2="23" />
                          </svg>
                        ) : (
                          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        )}
                      </button>
                    </div>
                    <button className="btn btn-primary" onClick={handleAccess}>
                      {t('consultantsPage.accessBtn')}
                    </button>
                  </div>
                  <div className="gate-error">{error}</div>
                  <div className="gate-divider">
                    <span>{t('consultantsPage.or')}</span>
                  </div>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setShowRequest(!showRequest)}
                  >
                    {showRequest ? t('consultantsPage.haveCode') : t('consultantsPage.requestBtn')}
                  </button>
                </div>
              </div>

              {showRequest && !requestSent && (
                <div className="access-request-section">
                  <div className="quote-layout" style={{ marginTop: '40px' }}>
                    <form ref={requestFormRef} className="quote-form" onSubmit={handleRequestSubmit}>
                      <h3 style={{ marginBottom: '8px', color: 'var(--color-text)' }}>
                        {t('consultantsPage.requestTitle')}
                      </h3>
                      <p
                        style={{
                          marginBottom: '24px',
                          color: 'var(--color-text-secondary)',
                          fontSize: '0.9rem',
                        }}
                      >
                        {t('consultantsPage.requestDesc')}
                      </p>
                      <div
                        style={{
                          background: 'rgba(245, 158, 11, 0.1)',
                          borderLeft: '4px solid #f59e0b',
                          padding: '12px 16px',
                          borderRadius: '4px',
                          marginBottom: '24px',
                          color: '#f59e0b',
                          fontSize: '0.85rem',
                        }}
                      >
                        <strong><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" style={{verticalAlign: 'middle', marginRight: '4px'}}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> {t('consultantsPage.pleaseNote')}</strong> <span dangerouslySetInnerHTML={{ __html: t('consultantsPage.expiryNote') }} />
                      </div>
                      <div className="quote-form-grid">
                        <div className="form-group">
                          <label htmlFor="req_name">
                            {t('consultantsPage.fullName')} <span className="required">*</span>
                          </label>
                          <input
                            type="text"
                            id="req_name"
                            name="req_name"
                            required
                            placeholder="John Doe"
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor="req_email">
                            {t('consultantsPage.email')} <span className="required">*</span>
                          </label>
                          <input
                            type="email"
                            id="req_email"
                            name="req_email"
                            required
                            placeholder="john@example.com"
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor="req_company">{t('consultantsPage.company')}</label>
                          <input
                            type="text"
                            id="req_company"
                            name="req_company"
                            placeholder="Acme Inc."
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor="req_industry">
                            {t('consultantsPage.industry')} <span className="required">*</span>
                          </label>
                          <select id="req_industry" name="req_industry" required defaultValue="">
                            <option value="" disabled>
                              {t('consultantsPage.selectIndustry')}
                            </option>
                            <option value="Healthcare">Healthcare</option>
                            <option value="Finance">Finance</option>
                            <option value="Education">Education</option>
                            <option value="Technology">Technology</option>
                            <option value="Government">Government</option>
                            <option value="Retail">Retail</option>
                            <option value="Data Engineering">Data Engineering</option>
                          </select>
                        </div>
                        <div className="form-group form-group--full">
                          <label htmlFor="req_reason">
                            {t('consultantsPage.reason')} <span className="required">*</span>
                          </label>
                          <textarea
                            id="req_reason"
                            name="req_reason"
                            required
                            rows="4"
                            placeholder={t('consultantsPage.reasonPlaceholder')}
                          ></textarea>
                        </div>
                      </div>

                      {requestError && <div className="quote-error">{requestError}</div>}

                      <button
                        type="submit"
                        className="btn btn-primary btn-lg"
                        disabled={requestSending}
                        style={{ width: '100%', marginTop: '8px' }}
                      >
                        {requestSending ? (
                          <>
                            <span className="btn-spinner"></span> {t('consultantsPage.sending')}
                          </>
                        ) : (
                          t('consultantsPage.submitRequest')
                        )}
                      </button>
                    </form>

                    <div className="quote-sidebar">
                      <div className="quote-info-card">
                        <h3>{t('consultantsPage.howItWorks')}</h3>
                        <div className="quote-steps">
                          <div className="quote-step">
                            <div className="quote-step-num">1</div>
                            <div>
                              <strong>{t('consultantsPage.step1Title')}</strong>
                              <p>{t('consultantsPage.step1Desc')}</p>
                            </div>
                          </div>
                          <div className="quote-step">
                            <div className="quote-step-num">2</div>
                            <div>
                              <strong>{t('consultantsPage.step2Title')}</strong>
                              <p>{t('consultantsPage.step2Desc')}</p>
                            </div>
                          </div>
                          <div className="quote-step">
                            <div className="quote-step-num">3</div>
                            <div>
                              <strong>{t('consultantsPage.step3Title')}</strong>
                              <p>
                                {t('consultantsPage.step3Desc')}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="quote-info-card">
                        <h3>{t('consultantsPage.directContact')}</h3>
                        <p className="quote-contact-email">
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            width="18"
                            height="18"
                          >
                            <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <a href="mailto:yannicknkongolo7@gmail.com">
                            yannicknkongolo7@gmail.com
                          </a>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {requestSent && (
                <div className="quote-success" style={{ marginTop: '40px' }}>
                  <div className="quote-success-icon">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      width="64"
                      height="64"
                    >
                      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                  </div>
                  <h2>{t('consultantsPage.successTitle')}</h2>
                  <p>
                    {t('consultantsPage.successDesc')}
                  </p>
                  <p
                    style={{
                      marginTop: '12px',
                      color: '#f59e0b',
                      fontSize: '0.85rem',
                    }}
                  >
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" style={{verticalAlign: 'middle', marginRight: '4px'}}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> {t('consultantsPage.successNote')}
                  </p>
                  <div className="cta-buttons" style={{ marginTop: '24px' }}>
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        setRequestSent(false)
                        setShowRequest(false)
                      }}
                    >
                      {t('consultantsPage.backToPortal')}
                    </button>
                  </div>
                </div>
              )}

              {!showRequest && !requestSent && (
                <div className="detail-action">
                  <Link to="/" className="btn btn-secondary">
                    {t('consultantsPage.backHome')}
                  </Link>
                </div>
              )}
            </>
          ) : (
            <div className="portfolio-content">
              <div className="resume-viewer-bar">
                <span className="industry-badge-inline">
                  {INDUSTRY_ICONS[match.industry] || null} {match.industry} {t('consultantsPage.resume')}
                </span>
                <div className="resume-viewer-actions">
                  {!match.viewOnly && (
                  <button className="btn btn-primary btn-sm" onClick={handleDownload}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    {t('consultantsPage.download')} PDF
                  </button>
                  )}
                  <button className="btn btn-secondary btn-sm" onClick={handleExit}>
                    {t('consultantsPage.exitPortal')}
                  </button>
                </div>
              </div>
              <div className="resume-viewer-content">
                <ResumeCard industry={match.industry} />
              </div>
            </div>
          )}
        </div>
      </section>
      )}
    </>
  )
}
