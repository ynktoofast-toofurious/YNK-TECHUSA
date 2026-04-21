import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'
import { useAccess } from '../context/AccessContext'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [quoteDropdown, setQuoteDropdown] = useState(false)
  const quoteRef = useRef(null)
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

  // Close quote dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (quoteRef.current && !quoteRef.current.contains(e.target)) {
        setQuoteDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleAnchor = (e, id) => {
    if (location.pathname === '/') {
      e.preventDefault()
      const el = document.getElementById(id)
      if (el) {
        const offset = 140
        const pos = el.getBoundingClientRect().top + window.scrollY - offset
        window.scrollTo({ top: pos, behavior: 'smooth' })
      }
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
          <li>
            {location.pathname === '/' ? (
              <a href="#thumbnails" className="nav-link" onClick={(e) => handleAnchor(e, 'thumbnails')}>{t('nav.services')}</a>
            ) : (
              <Link to="/#thumbnails" className="nav-link">{t('nav.services')}</Link>
            )}
          </li>
          <li><Link to="/consultants" className="nav-link">{t('nav.consultants')}</Link></li>
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
            <a href="/Admin/" className="nav-link nav-login-link">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:'4px',verticalAlign:'middle'}}>
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                <polyline points="10 17 15 12 10 7"/>
                <line x1="15" y1="12" x2="3" y2="12"/>
              </svg>
              Log In
            </a>
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
        <button
          className={`nav-toggle${menuOpen ? ' active' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
        <button
          className="nav-lang-btn"
          onClick={() => {
            const langs = ['en', 'fr', 'es']
            const next = langs[(langs.indexOf(language) + 1) % langs.length]
            setLanguage(next)
          }}
          aria-label="Change language"
          title={language.toUpperCase()}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>
          <span>{language.toUpperCase()}</span>
        </button>
        {isUnlocked && (
          <button
            className="nav-signout-btn"
            onClick={() => { lock(); window.location.href = '/' }}
            title="Sign out of protected portal"
            type="button"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            <span>Sign Out</span>
          </button>
        )}
      </div>
    </nav>
  )
}
