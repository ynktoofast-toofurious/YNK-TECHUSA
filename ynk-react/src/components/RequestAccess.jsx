import { useRef, useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext'
import { intakeEnabled, isBusy, submitFullAccessRequest } from '../utils/intake'
import { ArrowRight } from './Icons'

const COOLDOWN_MS = 60 * 1000
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const EMPTY = { name: '', email: '', organization: '', purpose: '' }

// item: { type: 'article' | 'study' | 'dataset' | 'prototype', id, title, path }. compact: name and email only (chat).
export default function RequestAccess({ item, compact = false }) {
  const { t, language } = useLanguage()
  const a = t('accessUi')
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)
  const honeypotRef = useRef(null)
  const sentKey = `ynk-full-request:${item.id}`

  const set = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }))
    setError('')
  }

  const submit = async (e) => {
    e.preventDefault()
    const data = { name: form.name.trim(), email: form.email.trim(), organization: form.organization.trim(), purpose: form.purpose.trim() }
    if (!data.name) { setError('name'); return }
    if (!EMAIL_RE.test(data.email)) { setError('email'); return }
    if (honeypotRef.current?.value) { setDone(true); return }
    if (Date.now() - Number(localStorage.getItem(sentKey) || 0) < COOLDOWN_MS) { setError('cooldown'); return }

    setSending(true)
    try {
      if (!intakeEnabled) throw new Error('send')
      const res = await submitFullAccessRequest({ type: item.type, item: item.id, title: item.title, path: item.path, language, ...data })
      if (!res.ok) throw new Error(res.error || 'send')
      localStorage.setItem(sentKey, String(Date.now()))
      setDone(true)
    } catch (err) {
      console.error('Full access request failed:', err)
      setError(isBusy(err) ? 'busy' : 'send')
    } finally {
      setSending(false)
    }
  }

  if (done) {
    return (
      <div className="ra-done" role="status">
        <span className="sp-check" aria-hidden="true">
          <svg viewBox="0 0 52 52" width="52" height="52"><circle cx="26" cy="26" r="24" /><path d="M15 27l7 7 15-15" /></svg>
        </span>
        <h3>{a.doneTitle}</h3>
        <p>{a.doneText}</p>
      </div>
    )
  }

  return (
    <form className={`ra-form${compact ? ' ra-form--compact' : ''}`} onSubmit={submit} noValidate>
      <div className="ra-row">
        <label className="sp-field">
          <span className="sp-label">{a.name}</span>
          <input className="sp-input" type="text" autoComplete="name" maxLength={100} value={form.name} onChange={(e) => set('name', e.target.value)} />
        </label>
        <label className="sp-field">
          <span className="sp-label">{a.email}</span>
          <input className="sp-input" type="email" autoComplete="email" maxLength={200} value={form.email} onChange={(e) => set('email', e.target.value)} />
        </label>
      </div>
      {!compact && (
        <>
          <label className="sp-field">
            <span className="sp-label">{a.organization}</span>
            <input className="sp-input" type="text" autoComplete="organization" maxLength={120} value={form.organization} onChange={(e) => set('organization', e.target.value)} />
          </label>
          <label className="sp-field">
            <span className="sp-label">{a.purpose}</span>
            <textarea className="sp-input ra-purpose" rows={3} maxLength={500} placeholder={a.purposePlaceholder} value={form.purpose} onChange={(e) => set('purpose', e.target.value)} />
          </label>
        </>
      )}
      <input ref={honeypotRef} className="sp-hp" type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      {error && <p className="sp-error" role="alert">{error === 'busy' ? t('serviceBanner.short') : a.errors[error]}</p>}
      <button type="submit" className="btn btn-primary hub-btn-round ra-submit" disabled={sending}>
        {sending ? a.sending : <>{a.submit} <ArrowRight /></>}
      </button>
      <p className="sp-privacy">{a.privacy}</p>
    </form>
  )
}
