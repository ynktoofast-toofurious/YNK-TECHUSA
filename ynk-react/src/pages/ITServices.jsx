import { Link } from 'react-router-dom'
import QuoteForm from '../components/QuoteForm'
import { useLanguage } from '../i18n/LanguageContext'

const IT_SERVICES = [
  'Website & Web Application Development',
  'AI Enablement & Automation',
  'Data Engineering & Analytics',
  'Cloud & Infrastructure Setup',
  'Dashboard & BI Development',
  'Machine Learning & Predictive Models',
]

export default function ITServices() {
  const { t } = useLanguage()

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="section-tag">01</span>
          <h1 className="section-title">{t('itCard.title')}</h1>
          <p className="section-subtitle">{t('itPage.subtitle')}</p>
        </div>
      </section>

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
  )
}
