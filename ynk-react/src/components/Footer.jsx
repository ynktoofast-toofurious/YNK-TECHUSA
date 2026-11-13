import { Link } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'
import { LANGUAGES } from '../i18n/languages'
import { ArrowRight, ArrowUp } from './Icons'

const CALENDLY = 'https://calendly.com/yannicknkongolo7/30min'

export default function Footer() {
  const { t, language, setLanguage } = useLanguage()
  const f = t('hubFooter')

  return (
    <footer className="ft">
      <div className="ft-glow" aria-hidden="true" />
      <div className="container">
        <div className="ft-top">
          <div className="ft-brand">
            <Link to="/" className="ft-logo" aria-label="YNK-Tech USA home">
              <img src="/Logo/YNK/1.png" alt="YNK-Tech USA" />
            </Link>
            <p className="ft-tagline">{f.tagline}</p>
            <p className="ft-about">{f.about}</p>
            <a href={CALENDLY} target="_blank" rel="noopener noreferrer" className="btn btn-primary hub-btn-round ft-cta">
              {f.links.book}
              <ArrowRight />
            </a>
          </div>

          <nav className="ft-col" aria-label={f.explore}>
            <h4>{f.explore}</h4>
            <Link to="/#intelligence">{f.links.desk}</Link>
            <Link to="/latest">{f.links.latest}</Link>
            <Link to="/#method">{f.links.method}</Link>
            <Link to="/vault">{f.links.vault}</Link>
            <Link to="/#community">{f.links.community}</Link>
          </nav>

          <nav className="ft-col" aria-label={f.solutions}>
            <h4>{f.solutions}</h4>
            <Link to="/it-services">{f.links.it}</Link>
            <Link to="/branding">{f.links.branding}</Link>
            <Link to="/start-project">{f.links.quote}</Link>
          </nav>

          <nav className="ft-col" aria-label={f.connect}>
            <h4>{f.connect}</h4>
            <a href={CALENDLY} target="_blank" rel="noopener noreferrer">{f.links.book}</a>
            <Link to="/consultants">{f.links.access}</Link>
            <a href="/Admin/">{f.links.login}</a>
          </nav>
        </div>

        <div className="ft-bottom">
          <div className="ft-legal">
            <p>{f.rights.replace('{year}', new Date().getFullYear())}</p>
            <span className="ft-signature">{f.signature}</span>
          </div>

          <div className="ft-lang" role="group" aria-label={t('hubNav.language')}>
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                type="button"
                className={`ft-lang-btn${language === lang.code ? ' active' : ''}`}
                aria-pressed={language === lang.code}
                onClick={() => setLanguage(lang.code)}
              >
                <lang.Flag />
                {lang.code.toUpperCase()}
              </button>
            ))}
          </div>

          <button type="button" className="ft-top-btn" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            {f.backTop}
            <ArrowUp />
          </button>
        </div>
      </div>
    </footer>
  )
}
