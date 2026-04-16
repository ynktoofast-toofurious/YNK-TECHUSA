import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'

export default function Home() {
  const { t } = useLanguage()
  useEffect(() => {
    // Scroll reveal
    const elements = document.querySelectorAll('[data-aos]')
    if (!elements.length) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('aos-visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    )
    elements.forEach((el, i) => {
      el.style.transitionDelay = `${(i % 4) * 0.1}s`
      observer.observe(el)
    })
    return () => observer.disconnect()
  }, [])

  return (
    <>
      {/* HERO */}
      <section className="hero" id="hero">
        <div className="hero-content">
          <h1 className="hero-headline">
            <span className="hero-line">{t('hero.line1')}</span>
            <span className="hero-line">{t('hero.line2')}</span>
            <span className="hero-line"><span className="text-gradient">{t('hero.line3')}</span></span>
          </h1>
          <p className="hero-subtext">{t('hero.subtext')}</p>
          <div className="hero-scroll-cue">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7 13l5 5 5-5M7 6l5 5 5-5" />
            </svg>
          </div>
        </div>
      </section>

      {/* WHO WE ARE */}
      <section className="intro-section" id="intro">
        <div className="container">
          <div className="intro-header" data-aos="">
            <span className="section-tag">{t('intro.tag')}</span>
            <h2 className="section-title">{t('intro.title')}</h2>
            <p className="intro-lead">{t('intro.lead')}</p>
            <p className="intro-text" dangerouslySetInnerHTML={{ __html: t('intro.text') }} />
            <p className="intro-text" style={{ marginTop: '12px' }} dangerouslySetInnerHTML={{ __html: t('intro.mission') }} />
          </div>

          <div className="intro-grid">
            <div className="intro-card" data-aos="">
              <div className="intro-card-number">01</div>
              <h3>{t('itCard.title')}</h3>
              <p>{t('itCard.desc')}</p>
              <ul className="intro-list">
                {(t('itCard.items') || []).map((item, i) => <li key={i}>{item}</li>)}
              </ul>
              <p className="intro-card-note" dangerouslySetInnerHTML={{ __html: t('itCard.vision') }} />
              <p className="intro-card-note" dangerouslySetInnerHTML={{ __html: t('itCard.apart') }} />
              <p className="intro-card-note" dangerouslySetInnerHTML={{ __html: t('itCard.goal') }} />
            </div>

            <div className="intro-card" data-aos="">
              <div className="intro-card-number">02</div>
              <h3>{t('brandingCard.title')}</h3>
              <p>{t('brandingCard.desc')}</p>
              <ul className="intro-list">
                {(t('brandingCard.items') || []).map((item, i) => <li key={i}>{item}</li>)}
              </ul>
              <p className="intro-card-note" dangerouslySetInnerHTML={{ __html: t('brandingCard.vision') }} />
              <p className="intro-card-note" dangerouslySetInnerHTML={{ __html: t('brandingCard.apart') }} />
              <p className="intro-card-note" dangerouslySetInnerHTML={{ __html: t('brandingCard.goal') }} />
            </div>

            <div className="intro-card" data-aos="">
              <div className="intro-card-number">03</div>
              <h3>{t('consultantsCard.title')}</h3>
              <p>{t('consultantsCard.desc')}</p>
              <p className="intro-card-note" dangerouslySetInnerHTML={{ __html: t('consultantsCard.vision') }} />
              <p className="intro-card-note" dangerouslySetInnerHTML={{ __html: t('consultantsCard.apart') }} />
              <p className="intro-card-note" dangerouslySetInnerHTML={{ __html: t('consultantsCard.goal') }} />
            </div>
          </div>

          {/* Why This Platform */}
          <div className="intro-why" data-aos="">
            <h3 className="intro-why-title">{t('why.title')}</h3>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '24px', textAlign: 'center' }}>{t('why.subtitle')}</p>
            <div className="intro-why-grid">
              <div className="intro-why-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="28" height="28"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                <div>
                  <strong>{(t('why.items') || [])[0]?.strong}</strong>
                  <p>{(t('why.items') || [])[0]?.desc}</p>
                </div>
              </div>
              <div className="intro-why-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="28" height="28"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <div>
                  <strong>{(t('why.items') || [])[1]?.strong}</strong>
                  <p>{(t('why.items') || [])[1]?.desc}</p>
                </div>
              </div>
              <div className="intro-why-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="28" height="28"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                <div>
                  <strong>{(t('why.items') || [])[2]?.strong}</strong>
                  <p>{(t('why.items') || [])[2]?.desc}</p>
                </div>
              </div>
            </div>
            <p style={{ color: 'var(--color-text-secondary)', marginTop: '24px', textAlign: 'center' }}>{t('why.conclusion')}</p>
          </div>

          {/* Mission */}
          <div className="intro-mission" data-aos="">
            <h3>{t('missionSection.title')}</h3>
            <p>{t('missionSection.text')}</p>
          </div>

          {/* Clients Section */}
          <div className="clients-section" data-aos="">
            <h3 className="clients-title">{t('clients.title')}</h3>
            <div className="clients-grid">
              <div className="client-logo">
                <img src="/Logo/clients/uhg.svg" alt="UnitedHealth Group" />
              </div>
              <div className="client-logo">
                <img src="/Logo/clients/optumrx.svg" alt="OptumRx" />
              </div>
              <div className="client-logo">
                <img src="/Logo/clients/lockton.svg" alt="Lockton" />
              </div>
              <div className="client-logo">
                <img src="/Logo/clients/rnb-events.svg" alt="RNB Events" />
              </div>
              <div className="client-logo">
                <img src="/Logo/clients/groupo.svg" alt="GroupO" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* THREE THUMBNAILS */}
      <section className="thumbnails" id="thumbnails">
        <div className="thumbnails-grid">
          <Link to="/it-services" className="thumb-card">
            <div className="thumb-overlay"></div>
            <div className="thumb-icon">
              <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="8" y="8" width="48" height="36" rx="4" />
                <path d="M24 52h16M32 44v8" />
                <path d="M20 24l6 6-6 6M30 34h14" />
              </svg>
            </div>
            <div className="thumb-content">
              <span className="thumb-number">01</span>
              <h2 className="thumb-title">{t('thumbs.it.title')}</h2>
              <p className="thumb-desc">{t('thumbs.it.desc')}</p>
              <span className="thumb-cta">{t('thumbs.it.cta')} <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg></span>
            </div>
          </Link>

          <Link to="/branding" className="thumb-card">
            <div className="thumb-overlay"></div>
            <div className="thumb-icon">
              <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="32" cy="28" r="16" />
                <path d="M24 28l5 5 10-10" />
                <path d="M16 52h32M20 48h24" />
              </svg>
            </div>
            <div className="thumb-content">
              <span className="thumb-number">02</span>
              <h2 className="thumb-title">{t('thumbs.branding.title')}</h2>
              <p className="thumb-desc">{t('thumbs.branding.desc')}</p>
              <span className="thumb-cta">{t('thumbs.branding.cta')} <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg></span>
            </div>
          </Link>

          <Link to="/consultants" className="thumb-card">
            <div className="thumb-overlay"></div>
            <div className="thumb-icon">
              <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="22" cy="20" r="8" />
                <path d="M14 36c0-4.418 3.582-8 8-8s8 3.582 8 8" />
                <circle cx="42" cy="20" r="8" />
                <path d="M34 36c0-4.418 3.582-8 8-8s8 3.582 8 8" />
                <rect x="16" y="42" width="32" height="6" rx="3" />
                <path d="M28 24h8" />
              </svg>
            </div>
            <div className="thumb-content">
              <span className="thumb-number">03</span>
              <h2 className="thumb-title">{t('thumbs.consultants.title')}</h2>
              <p className="thumb-desc">{t('thumbs.consultants.desc')}</p>
              <span className="thumb-cta">{t('thumbs.consultants.cta')} <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg></span>
            </div>
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section" id="contact">
        <div className="container">
          <div className="cta-content">
            <h2 className="cta-title">{t('cta.title')}</h2>
            <p className="cta-text">{t('cta.text')}</p>
            <div className="cta-buttons" style={{ marginTop: '32px' }}>
              <Link to="/it-services" className="btn btn-primary btn-lg">{t('cta.itBtn')}</Link>
              <Link to="/branding" className="btn btn-secondary btn-lg">{t('cta.brandingBtn')}</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
