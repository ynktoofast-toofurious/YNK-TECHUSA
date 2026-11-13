import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'
import { ArrowRight, CloseIcon } from './Icons'

export default function ServiceNotice() {
  const { t } = useLanguage()
  const [context, setContext] = useState(null)
  const closeRef = useRef(null)

  useEffect(() => {
    const onNotice = (e) => setContext(e.detail?.context || 'default')
    window.addEventListener('ynk:service-notice', onNotice)
    return () => window.removeEventListener('ynk:service-notice', onNotice)
  }, [])

  useEffect(() => {
    if (!context) return
    closeRef.current?.focus()
    const onKey = (e) => e.key === 'Escape' && setContext(null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [context])

  if (!context) return null
  const n = t('serviceNotice')

  return (
    <div className="sn-overlay" onClick={() => setContext(null)}>
      <div className="sn-card" role="alertdialog" aria-modal="true" aria-labelledby="sn-title" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="sn-close" onClick={() => setContext(null)} aria-label={n.close}><CloseIcon /></button>
        <span className="sn-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" /></svg>
        </span>
        <h2 id="sn-title">{n.title}</h2>
        <p>{n.text}</p>
        {n.contexts[context] && <p className="sn-context">{n.contexts[context]}</p>}
        <div className="sn-actions">
          <button ref={closeRef} type="button" className="btn btn-ghost hub-btn-round" onClick={() => setContext(null)}>{n.ok}</button>
          <Link to="/start-project" className="btn btn-primary hub-btn-round" onClick={() => setContext(null)}>{n.cta} <ArrowRight /></Link>
        </div>
      </div>
    </div>
  )
}
