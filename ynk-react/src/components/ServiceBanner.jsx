import { useEffect, useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext'
import { CloseIcon } from './Icons'

const QUIET_MS = 90 * 1000
const SHOW_MS = 14 * 1000

// A small, non-blocking note shown when a feature is paused or at capacity, so visitors know it is temporary.
export default function ServiceBanner() {
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    let last = 0
    let timer
    const onBusy = () => {
      if (Date.now() - last < QUIET_MS) return
      last = Date.now()
      setOpen(true)
      clearTimeout(timer)
      timer = setTimeout(() => setOpen(false), SHOW_MS)
    }
    window.addEventListener('ynk:busy', onBusy)
    return () => {
      window.removeEventListener('ynk:busy', onBusy)
      clearTimeout(timer)
    }
  }, [])

  if (!open) return null
  const b = t('serviceBanner')
  return (
    <div className="sb-banner" role="status" aria-live="polite">
      <span className="sb-pulse" aria-hidden="true" />
      <div>
        <strong>{b.title}</strong>
        <p>{b.text}</p>
      </div>
      <button type="button" className="sb-close" onClick={() => setOpen(false)} aria-label={b.close}><CloseIcon /></button>
    </div>
  )
}
