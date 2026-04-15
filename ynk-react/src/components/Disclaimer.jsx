import { useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext'

export default function Disclaimer() {
  const { t } = useLanguage()
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem('ynk-disclaimer-dismissed') === '1')

  if (dismissed) return null

  const handleDismiss = () => {
    sessionStorage.setItem('ynk-disclaimer-dismissed', '1')
    setDismissed(true)
  }

  return (
    <div className="disclaimer-banner">
      <div className="container disclaimer-inner">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" className="disclaimer-icon">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <p className="disclaimer-text">{t('disclaimer.text')}</p>
        <button className="disclaimer-dismiss" onClick={handleDismiss} aria-label="Dismiss">
          {t('disclaimer.dismiss')}
        </button>
      </div>
    </div>
  )
}
