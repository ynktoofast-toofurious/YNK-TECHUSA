import { useRef, useState } from 'react'
import emailjs from '@emailjs/browser'
import { useLanguage } from '../i18n/LanguageContext'
import communityCopy from '../i18n/communityCopy'
import { escapeHtml } from '../utils/escapeHtml'
import { ArrowRight } from './Icons'

const EMAILJS_SERVICE_ID = 'service_sw3zais'
const EMAILJS_TEMPLATE_ID = 'template_99cacr8'
const EMAILJS_PUBLIC_KEY = 'zG_jERVPbUUfiZ6IL'
const SENT_KEY = 'ynk-topic-request-sent'
const COOLDOWN_MS = 60 * 1000
const MAX_TOPICS = 3
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const EMPTY = { topics: [], custom: '', role: null, email: '' }

export default function TopicRequest() {
  const { t, language } = useLanguage()
  const c = t('topicRequest')
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)
  const honeypotRef = useRef(null)

  const toggleTopic = (i) => {
    setForm((f) => {
      if (f.topics.includes(i)) return { ...f, topics: f.topics.filter((x) => x !== i) }
      if (f.topics.length >= MAX_TOPICS) return f
      return { ...f, topics: [...f.topics, i] }
    })
    setError('')
  }

  const submit = async (e) => {
    e.preventDefault()
    if (form.topics.length === 0 && !form.custom.trim()) { setError('empty'); return }
    if (form.email.trim() && !EMAIL_RE.test(form.email.trim())) { setError('email'); return }
    if (honeypotRef.current?.value) { setDone(true); return }

    const lastSent = Number(localStorage.getItem(SENT_KEY) || 0)
    if (Date.now() - lastSent < COOLDOWN_MS) { setError('cooldown'); return }

    const en = communityCopy.en.topicRequest
    const picks = form.topics.map((i) => en.topics[i])
    const rows = [
      ['Selected topics', picks.join(', ') || 'None'],
      ['Custom topic', form.custom.trim() || 'None'],
      ['Audience', form.role !== null ? en.roles[form.role] : 'Not specified'],
      ['Notify email', form.email.trim() || 'Not provided'],
      ['Language', language],
      ['Page', window.location.pathname],
    ]

    setSending(true)
    try {
      emailjs.init(EMAILJS_PUBLIC_KEY)
      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
        to_email: 'yannicknkongolo7@gmail.com',
        heading: `Topic request: ${picks[0] || form.custom.trim().slice(0, 60)}`,
        content_html: `<p>A visitor requested a topic for an upcoming study.</p>
<div style="background-color:#f9f9f9;border:1px solid #eee;border-radius:4px;padding:14px;margin:16px 0">
${rows.map(([k, v]) => `<strong>${k}:</strong> ${escapeHtml(v)}<br/>`).join('\n')}
</div>`,
        footer_note: 'You received this email because a topic was requested on the YNK Tech USA website.',
      })
      localStorage.setItem(SENT_KEY, String(Date.now()))
      setDone(true)
    } catch (err) {
      console.error('EmailJS error:', err)
      setError('send')
    } finally {
      setSending(false)
    }
  }

  if (done) {
    return (
      <div className="tr-card tr-done" id="suggest">
        <span className="sp-check" aria-hidden="true">
          <svg viewBox="0 0 52 52" width="56" height="56"><circle cx="26" cy="26" r="24" /><path d="M15 27l7 7 15-15" /></svg>
        </span>
        <h3>{c.done}</h3>
        <p>{c.doneSub}</p>
        <button type="button" className="btn btn-ghost hub-btn-round" onClick={() => { setForm(EMPTY); setDone(false) }}>{c.another}</button>
      </div>
    )
  }

  return (
    <form className="tr-card" id="suggest" onSubmit={submit} noValidate>
      <span className="section-tag">{c.tag}</span>
      <h3 className="tr-title">{c.title}</h3>
      <p className="tr-sub">{c.sub}</p>

      <div className="tr-label-row">
        <span className="sp-label">{c.topicsLabel}</span>
        <span className="tr-count">{form.topics.length}/{MAX_TOPICS} · {c.maxHint}</span>
      </div>
      <div className="sp-choices tr-topics">
        {c.topics.map((topic, i) => {
          const on = form.topics.includes(i)
          const disabled = !on && form.topics.length >= MAX_TOPICS
          return (
            <button
              key={topic}
              type="button"
              aria-pressed={on}
              disabled={disabled}
              className={`sp-choice${on ? ' active' : ''}`}
              onClick={() => toggleTopic(i)}
            >
              {topic}
            </button>
          )
        })}
      </div>

      <label className="sp-field tr-field">
        <span className="sp-label">{c.customLabel}</span>
        <input
          className="sp-input"
          type="text"
          maxLength={200}
          value={form.custom}
          placeholder={c.customPlaceholder}
          onChange={(e) => { setForm((f) => ({ ...f, custom: e.target.value })); setError('') }}
        />
      </label>

      <span className="sp-label">{c.roleLabel}</span>
      <div className="sp-choices tr-roles" role="radiogroup" aria-label={c.roleLabel}>
        {c.roles.map((role, i) => (
          <button
            key={role}
            type="button"
            role="radio"
            aria-checked={form.role === i}
            className={`sp-choice${form.role === i ? ' active' : ''}`}
            onClick={() => setForm((f) => ({ ...f, role: f.role === i ? null : i }))}
          >
            {role}
          </button>
        ))}
      </div>

      <label className="sp-field tr-field">
        <span className="sp-label">{c.emailLabel}</span>
        <input
          className="sp-input"
          type="email"
          autoComplete="email"
          maxLength={120}
          value={form.email}
          onChange={(e) => { setForm((f) => ({ ...f, email: e.target.value })); setError('') }}
        />
        <small className="tr-hint">{c.emailHint}</small>
      </label>

      <input ref={honeypotRef} className="sp-hp" type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      {error && <p className="sp-error" role="alert">{c.errors[error]}</p>}

      <button type="submit" className="btn btn-primary hub-btn-round tr-submit" disabled={sending}>
        {sending ? c.sending : <>{c.submit} <ArrowRight /></>}
      </button>
      <p className="sp-privacy">{c.privacy}</p>
    </form>
  )
}
