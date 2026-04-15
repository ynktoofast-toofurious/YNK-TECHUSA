import { useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext'

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
]

export default function LanguagePopup() {
  const { hasChosen, setLanguage, t } = useLanguage()
  const [selected, setSelected] = useState('en')
  const [visible, setVisible] = useState(!hasChosen)

  if (!visible) return null

  const handleConfirm = () => {
    setLanguage(selected)
    setVisible(false)
  }

  return (
    <div className="lang-overlay">
      <div className="lang-popup">
          <img src="/Logo/YNK/1.png" alt="YNK-Tech USA" className="lang-popup-logo" />
        <h2 className="lang-popup-title">{t('langPopup.title')}</h2>
        <p className="lang-popup-subtitle">{t('langPopup.subtitle')}</p>
        <div className="lang-options">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              className={`lang-option${selected === lang.code ? ' lang-option--active' : ''}`}
              onClick={() => setSelected(lang.code)}
              type="button"
            >
              <span className="lang-flag">{lang.flag}</span>
              <span className="lang-label">{lang.label}</span>
              {selected === lang.code && (
                <svg className="lang-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
          ))}
        </div>
        <button className="btn btn-primary btn-lg lang-confirm" onClick={handleConfirm}>
          {t('langPopup.confirm')}
        </button>
      </div>
    </div>
  )
}
