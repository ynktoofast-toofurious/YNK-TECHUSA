import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMenuOpen(false)
  }, [location])

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
              <a href="#thumbnails" className="nav-link" onClick={(e) => handleAnchor(e, 'thumbnails')}>Services</a>
            ) : (
              <Link to="/#thumbnails" className="nav-link">Services</Link>
            )}
          </li>
          <li><Link to="/portfolio" className="nav-link">Portfolio</Link></li>
          <li><Link to="/request-quote" className="nav-link">Request Free Quote</Link></li>
          <li>
            {location.pathname === '/' ? (
              <a href="#contact" className="nav-link" onClick={(e) => handleAnchor(e, 'contact')}>Contact</a>
            ) : (
              <Link to="/#contact" className="nav-link">Contact</Link>
            )}
          </li>
          <li>
            <a
              href="https://calendly.com/yannicknkongolo7/30min"
              target="_blank"
              rel="noopener noreferrer"
              className="nav-link nav-cta"
            >
              Book a Consultation
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
      </div>
    </nav>
  )
}
