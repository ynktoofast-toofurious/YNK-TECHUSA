import { useState, useEffect } from 'react'
import { trackCookieConsent } from '../utils/tracking'

const CONSENT_KEY = 'ynk_cookie_consent'

export default function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CONSENT_KEY)
      if (!stored) setVisible(true)
    } catch (e) {
      setVisible(true)
    }
  }, [])

  const handleChoice = async (choice) => {
    try {
      localStorage.setItem(
        CONSENT_KEY,
        JSON.stringify({ choice, timestamp: new Date().toISOString() })
      )
    } catch (e) { /* silent */ }
    setVisible(false)
    trackCookieConsent(choice) // fire-and-forget
  }

  if (!visible) return null

  return (
    <div className="cookie-banner" role="dialog" aria-label="Cookie consent">
      <div className="cookie-banner-inner">
        <div className="cookie-info">
          <div className="cookie-icon">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5" />
              <path d="M8.5 8.5v.01" />
              <path d="M16 15.5v.01" />
              <path d="M12 12v.01" />
              <path d="M11 17v.01" />
              <path d="M7 14v.01" />
            </svg>
          </div>
          <div className="cookie-text">
            <strong className="cookie-title">Cookie Notice</strong>
            <p className="cookie-desc">
              We use cookies to enhance your experience, analyze traffic, and understand how you interact with our site.
              Choose your preference below.
            </p>
          </div>
        </div>
        <div className="cookie-actions">
          <button
            className="cookie-btn cookie-btn--reject"
            onClick={() => handleChoice('reject')}
            type="button"
          >
            Reject All
          </button>
          <button
            className="cookie-btn cookie-btn--essential"
            onClick={() => handleChoice('essential')}
            type="button"
          >
            Essential Only
          </button>
          <button
            className="cookie-btn cookie-btn--accept"
            onClick={() => handleChoice('all')}
            type="button"
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  )
}
