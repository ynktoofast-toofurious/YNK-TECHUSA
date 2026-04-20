import { Link } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'
import AIBall3D from '../components/AIBall3D'
import DemoChat from '../components/DemoChat'

export default function Home() {
  const { t } = useLanguage()

  return (
    <>
      {/* HERO - single viewport */}
      <section className="hero hero-full" id="hero">
        <div className="hero-split">
          {/* LEFT - 3D Ball + Demo Chat */}
          <div className="hero-ball-col">
            <div className="hero-ball-wrap">
              <AIBall3D />
            </div>
            <DemoChat />
          </div>

          {/* RIGHT - Who We Are */}
          <div className="hero-text-col">
            <div className="hero-who">
              <span className="hero-who-tag">{t('intro.tag')}</span>

              <h1 className="hero-who-headline">
                Technology,<br />
                <span className="text-gradient">Creativity &amp; Data</span>
              </h1>

              <p className="hero-who-lead">{t('intro.lead')}</p>

              <ul className="hero-bullets">
                <li>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect width="14" height="14" rx="2" fill="#29B5E8" opacity=".18"/><path d="M3 7l3 3 5-6" stroke="#29B5E8" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  Website, AI &amp; Cloud Solutions
                </li>
                <li>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect width="14" height="14" rx="2" fill="#29B5E8" opacity=".18"/><path d="M3 7l3 3 5-6" stroke="#29B5E8" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  Brand Strategy &amp; Creative Services
                </li>
                <li>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect width="14" height="14" rx="2" fill="#29B5E8" opacity=".18"/><path d="M3 7l3 3 5-6" stroke="#29B5E8" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  Secure Consultants Portal with industry resumes
                </li>
                <li>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect width="14" height="14" rx="2" fill="#29B5E8" opacity=".18"/><path d="M3 7l3 3 5-6" stroke="#29B5E8" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  High-impact delivery: solutions live within 24 hours
                </li>
              </ul>

              <div className="hero-ctas">
                <Link to="/it-services" className="btn btn-primary btn-lg">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                  Enter Access Code
                </Link>
                <Link to="/request-quote" className="btn btn-secondary btn-lg">
                  Request Access
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
