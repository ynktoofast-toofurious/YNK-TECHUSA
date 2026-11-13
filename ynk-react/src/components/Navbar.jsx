import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'
import { useAccess } from '../context/AccessContext'
import { LANGUAGES } from '../i18n/languages'
import { hasUnseenLatest } from '../content/latest'
import { ArrowRight, ChevronDown, Globe } from './Icons'

const HUB_LINKS = ['intelligence', 'latest', 'method', 'vault', 'solutions', 'about']
const ROUTE_LINKS = { latest: '/latest', vault: '/vault', about: '/about' }

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const langRef = useRef(null)
  const location = useLocation()
  const { t, language, setLanguage } = useLanguage()
  const { isUnlocked, lock } = useAccess()
  const showLatestDot = location.pathname !== '/latest' && hasUnseenLatest()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMenuOpen(false)
    setLangOpen(false)
  }, [location])

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (langRef.current && !langRef.current.contains(e.target)) {
        setLangOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleAnchor = (e, id) => {
    if (location.pathname === '/') {
      e.preventDefault()
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setMenuOpen(false)
    }
  }

  return (
    <nav className={`navbar${scrolled ? ' scrolled' : ''}`} id="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          <img src="/Logo/YNK/1.png" alt="YNK-Tech USA" />
        </Link>
        <ul className={`nav-menu${menuOpen ? ' active' : ''}`} id="navMenu">
          {HUB_LINKS.map((id) => (
            <li key={id}>
              {ROUTE_LINKS[id] ? (
                <Link to={ROUTE_LINKS[id]} className={`nav-link${location.pathname.startsWith(ROUTE_LINKS[id]) ? ' nav-link--current' : ''}`}>
                  {t(`hubNav.${id}`)}
                  {id === 'latest' && showLatestDot && <span className="nav-new-dot" aria-label={t('latestUi.newBadge')} />}
                </Link>
              ) : location.pathname === '/' ? (
                <a href={`#${id}`} className="nav-link" onClick={(e) => handleAnchor(e, id)}>{t(`hubNav.${id}`)}</a>
              ) : (
                <Link to={`/#${id}`} className="nav-link">{t(`hubNav.${id}`)}</Link>
              )}
            </li>
          ))}
          <li>
            <Link to="/start-project" className="nav-link nav-cta">
              {t('hubNav.startProject')}
              <ArrowRight size={13} />
            </Link>
          </li>
        </ul>

        <div className="nav-actions">
          <div className="nav-lang" ref={langRef}>
            <button
              type="button"
              className="nav-lang-btn"
              onClick={() => setLangOpen(!langOpen)}
              aria-haspopup="listbox"
              aria-expanded={langOpen}
              aria-label={t('hubNav.language')}
            >
              <Globe />
              <span>{language.toUpperCase()}</span>
              <ChevronDown className={`icon-inline nav-lang-chevron${langOpen ? ' open' : ''}`} />
            </button>
            {langOpen && (
              <ul className="nav-lang-menu" role="listbox" aria-label={t('hubNav.language')}>
                {LANGUAGES.map((lang) => (
                  <li key={lang.code}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={language === lang.code}
                      className={`nav-lang-option${language === lang.code ? ' active' : ''}`}
                      onClick={() => { setLanguage(lang.code); setLangOpen(false) }}
                    >
                      <lang.Flag />
                      <span>{lang.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {isUnlocked && (
            <button
              className="nav-signout-btn"
              onClick={() => { lock(); window.location.href = '/' }}
              title={t('hubNav.signOut')}
              type="button"
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              <span>{t('hubNav.signOut')}</span>
            </button>
          )}

          <button
            className={`nav-toggle${menuOpen ? ' active' : ''}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={t('hubNav.menu')}
            aria-expanded={menuOpen}
            aria-controls="navMenu"
            type="button"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>
    </nav>
  )
}
