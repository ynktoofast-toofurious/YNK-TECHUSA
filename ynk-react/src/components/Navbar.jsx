import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'
import { useAccess } from '../context/AccessContext'
import { LANGUAGES } from '../i18n/languages'
import { ChevronDown, Globe } from './Icons'

const HUB_LINKS = ['intelligence', 'method', 'vault', 'solutions']

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [quoteDropdown, setQuoteDropdown] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const quoteRef = useRef(null)
  const langRef = useRef(null)
  const location = useLocation()
  const { t, language, setLanguage } = useLanguage()
  const { isUnlocked, lock } = useAccess()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMenuOpen(false)
    setQuoteDropdown(false)
  }, [location])

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (quoteRef.current && !quoteRef.current.contains(e.target)) {
        setQuoteDropdown(false)
      }
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
              {location.pathname === '/' ? (
                <a href={`#${id}`} className="nav-link" onClick={(e) => handleAnchor(e, id)}>{t(`hubNav.${id}`)}</a>
              ) : (
                <Link to={`/#${id}`} className="nav-link">{t(`hubNav.${id}`)}</Link>
              )}
            </li>
          ))}
          <li className="nav-dropdown" ref={quoteRef}>
            <button
              className="nav-link nav-dropdown-toggle"
              onClick={() => setQuoteDropdown(!quoteDropdown)}
              type="button"
            >
              {t('nav.requestQuote')}
              <svg className={`nav-dropdown-arrow${quoteDropdown ? ' open' : ''}`} width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M2 4l3 3 3-3" />
              </svg>
            </button>
            {quoteDropdown && (
              <div className="nav-dropdown-menu">
                <Link to="/request-quote?category=it" className="nav-dropdown-item" onClick={() => setQuoteDropdown(false)}>
                  <span className="nav-dropdown-icon"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg></span>
                  <div>
                    <strong>{t('nav.itDropdown')}</strong>
                    <small>{t('nav.itDropdownSub')}</small>
                  </div>
                </Link>
                <Link to="/request-quote?category=branding" className="nav-dropdown-item" onClick={() => setQuoteDropdown(false)}>
                  <span className="nav-dropdown-icon"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 011.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg></span>
                  <div>
                    <strong>{t('nav.brandingDropdown')}</strong>
                    <small>{t('nav.brandingDropdownSub')}</small>
                  </div>
                </Link>
              </div>
            )}
          </li>
          <li>
            <a
              href="https://calendly.com/yannicknkongolo7/30min"
              target="_blank"
              rel="noopener noreferrer"
              className="nav-link nav-cta"
            >
              {t('nav.bookCall')}
            </a>
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
