import { useState } from 'react'
import { Link } from 'react-router-dom'
import QuoteForm from '../components/QuoteForm'
import { useLanguage } from '../i18n/LanguageContext'

const IT_PROJECTS = [
  {
    tag: 'Web Application',
    title: 'AI-Powered Client Portal',
    desc: 'Built a secure, multi-tenant SaaS portal with React and Node.js — featuring role-based access, real-time notifications, and an integrated AI assistant powered by OpenAI.',
    stack: ['React', 'Node.js', 'OpenAI', 'AWS'],
  },
  {
    tag: 'Data Engineering',
    title: 'Enterprise Analytics Pipeline',
    desc: 'Architected a cloud-native data pipeline on Snowflake and dbt handling 4B+ rows of transactional data, with Power BI Embedded for client-facing dashboards.',
    stack: ['Snowflake', 'dbt', 'Power BI', 'Python'],
  },
  {
    tag: 'Cloud Infrastructure',
    title: 'AWS Multi-Region Deployment',
    desc: 'Designed and deployed a high-availability infrastructure using S3, CloudFront, Lambda, and API Gateway — achieving 99.9% uptime with automated failover and CI/CD pipelines.',
    stack: ['AWS S3', 'CloudFront', 'Lambda', 'GitHub Actions'],
  },
  {
    tag: 'AI Automation',
    title: 'Intelligent Document Processor',
    desc: 'Developed an automated document ingestion and classification system using AWS Textract and custom ML models, reducing manual review time by 80% for a healthcare client.',
    stack: ['Python', 'AWS Textract', 'OpenAI', 'FastAPI'],
  },
  {
    tag: 'Dashboard',
    title: 'Executive BI Dashboard Suite',
    desc: 'Delivered a Power BI dashboard suite with dynamic RLS for 4,000+ clients — integrating Salesforce, NetSuite, and pharmacy claims data into a single executive reporting layer.',
    stack: ['Power BI', 'DAX', 'SQL', 'Salesforce'],
  },
  {
    tag: 'Machine Learning',
    title: 'Predictive Utilization Model',
    desc: 'Built and deployed ML models predicting drug utilization trends and formulary savings for a PBM client, surfaced directly in operational dashboards.',
    stack: ['Python', 'Scikit-learn', 'Snowflake', 'Power BI'],
  },
]

export default function ITServices() {
  const { t } = useLanguage()
  const IT_SERVICES = t('itServiceOptions') || []
  const [activeTab, setActiveTab] = useState('expertise')

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="section-tag">01</span>
          <h1 className="section-title">{t('itCard.title')}</h1>
          <p className="section-subtitle">{t('itPage.subtitle')}</p>
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
          {/* Section Definition */}
          <section className="section-definition" style={{ padding: '0 0 0' }}>
            <div className="container">
              <div className="section-def-card" data-aos="">
                <p className="section-def-lead">{t('itCard.desc')}</p>
                <ul className="section-def-list">
                  {(t('itCard.items') || []).map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
                <div className="section-def-meta">
                  <p dangerouslySetInnerHTML={{ __html: t('itCard.vision') }} />
                  <p dangerouslySetInnerHTML={{ __html: t('itCard.apart') }} />
                  <p dangerouslySetInnerHTML={{ __html: t('itCard.goal') }} />
                </div>
              </div>
            </div>
          </section>

          <section className="detail-section">
            <div className="container">
              <div className="detail-grid">
                <div className="detail-card" data-aos="">
                  <div className="detail-card-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                  </div>
                  <h3>{t('itPage.webTitle')}</h3>
                  <p>{t('itPage.webDesc')}</p>
                </div>
                <div className="detail-card" data-aos="">
                  <div className="detail-card-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  </div>
                  <h3>{t('itPage.aiTitle')}</h3>
                  <p>{t('itPage.aiDesc')}</p>
                </div>
                <div className="detail-card" data-aos="">
                  <div className="detail-card-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>
                  </div>
                  <h3>{t('itPage.dataTitle')}</h3>
                  <p>{t('itPage.dataDesc')}</p>
                </div>
                <div className="detail-card" data-aos="">
                  <div className="detail-card-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>
                  </div>
                  <h3>{t('itPage.mlTitle')}</h3>
                  <p>{t('itPage.mlDesc')}</p>
                </div>
              </div>
              <div className="detail-action">
                <p style={{ color: 'var(--color-text-secondary)', marginBottom: '20px', textAlign: 'center', maxWidth: '600px', margin: '0 auto 20px' }}>{t('itPage.tagline')}</p>
                <Link to="/" className="btn btn-secondary">{t('itPage.backHome')}</Link>
              </div>
            </div>
          </section>

          <section className="cta-section" id="quote">
            <div className="container">
              <div className="cta-content">
                <h2 className="cta-title">{t('itPage.quoteTitle')}</h2>
                <p className="cta-text">{t('itPage.quoteText')}</p>
              </div>
              <QuoteForm serviceOptions={IT_SERVICES} />
            </div>
          </section>
        </>
      )}

      {/* ── PROJECTS TAB ── */}
      {activeTab === 'projects' && (
        <section className="detail-section">
          <div className="container">
            <div className="projects-header">
              <h2 className="projects-title">Selected Work</h2>
              <p className="projects-sub">A snapshot of enterprise-scale projects delivered across data, cloud, and intelligent systems.</p>
            </div>
            <div className="projects-grid">
              {IT_PROJECTS.map((p, i) => (
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
              <Link to="/request-quote?category=it" className="btn btn-primary">Start a Project</Link>
              <Link to="/" className="btn btn-secondary" style={{ marginLeft: '12px' }}>{t('itPage.backHome')}</Link>
            </div>
          </div>
        </section>
      )}
    </>
  )
}
