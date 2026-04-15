import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import translations from './translations'

const LanguageContext = createContext()

const STORAGE_KEY = 'ynk-lang'

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved && translations[saved] ? saved : 'en'
  })

  const [hasChosen, setHasChosen] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) !== null
  })

  const setLanguage = useCallback((lang) => {
    if (translations[lang]) {
      setLanguageState(lang)
      localStorage.setItem(STORAGE_KEY, lang)
      setHasChosen(true)
    }
  }, [])

  const t = useCallback((key) => {
    const keys = key.split('.')
    let value = translations[language]
    for (const k of keys) {
      if (value == null) return key
      value = value[k]
    }
    return value ?? key
  }, [language])

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, hasChosen }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) throw new Error('useLanguage must be used within LanguageProvider')
  return context
}
