import { useRef, useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext'
import { generatePrototype, intakeEnabled, submitIdeaTicket } from '../utils/intake'
import { ArrowRight } from './Icons'

const SESSION_KEY = 'ynk-idea-studio'
const CALENDLY = 'https://calendly.com/yannicknkongolo7/30min'
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

// The idea and prototype live only in this browser session unless the visitor saves a ticket.
function readSession() {
  try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null') } catch { return null }
}
function writeSession(value) {
  try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(value)) } catch { /* storage unavailable */ }
}

export default function IdeaStudio({ initialIdea = '', onBrief }) {
  const { t, language } = useLanguage()
  const c = t('project.studio')
  const saved = readSession()
  const [idea, setIdea] = useState(initialIdea || saved?.idea || '')
  const [proto, setProto] = useState(saved?.html ? { html: saved.html, title: saved.title, version: saved.version || 1 } : null)
  const [refine, setRefine] = useState('')
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [full, setFull] = useState(false)
  const [ticket, setTicket] = useState({ name: '', email: '', sending: false, error: '', id: saved?.ticketFor === saved?.version ? saved?.ticketId : '' })
  const honeypotRef = useRef(null)
  const frameRef = useRef(null)

  if (!intakeEnabled) return null

  const generate = async (change) => {
    if (status === 'working') return
    if (idea.trim().length < 10) { setError(c.errors.short); return }
    setError('')
    setStatus('working')
    try {
      const res = await generatePrototype({ idea: idea.trim(), language, ...(change && proto ? { refine: change, html: proto.html } : {}) })
      if (!res.ok) throw new Error(res.error || 'failed')
      const next = { html: res.html, title: res.title, version: (proto?.version || 0) + 1 }
      setProto(next)
      setTicket((tk) => ({ ...tk, id: '', error: '' }))
      setRefine('')
      writeSession({ idea: idea.trim(), html: next.html, title: next.title, version: next.version })
      setTimeout(() => frameRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80)
    } catch (err) {
      setError(c.errors[err.message] || c.errors.failed)
    } finally {
      setStatus('')
    }
  }

  const saveTicket = async (e) => {
    e.preventDefault()
    const name = ticket.name.trim()
    const email = ticket.email.trim()
    if (!name) { setTicket((tk) => ({ ...tk, error: c.errors.name })); return }
    if (!EMAIL_RE.test(email)) { setTicket((tk) => ({ ...tk, error: c.errors.email })); return }
    setTicket((tk) => ({ ...tk, sending: true, error: '' }))
    try {
      const res = await submitIdeaTicket({ name, email, idea: idea.trim(), html: proto.html, title: proto.title, language, website: honeypotRef.current?.value || '' })
      if (!res.ok) throw new Error(res.error || 'failed')
      setTicket((tk) => ({ ...tk, sending: false, id: res.id }))
      writeSession({ ...readSession(), ticketId: res.id, ticketFor: proto.version })
    } catch (err) {
      setTicket((tk) => ({ ...tk, sending: false, error: c.errors[err.message] || c.errors.ticket }))
    }
  }

  return (
    <section className="is-wrap" id="studio" aria-labelledby="is-title">
      <div className="is-head">
        <span className="section-tag">{c.tag}</span>
        <h2 id="is-title" className="hub-title">{c.title}</h2>
        <p className="hub-sub">{c.sub}</p>
      </div>

      <div className="is-input">
        <textarea
          className="sp-input is-idea"
          rows={4}
          maxLength={2000}
          value={idea}
          onChange={(e) => { setIdea(e.target.value); setError('') }}
          placeholder={c.placeholder}
          aria-label={c.title}
        />
        <div className="is-input-row">
          <span className="is-session">{c.session}</span>
          <button type="button" className="btn btn-primary hub-btn-round" onClick={() => generate()} disabled={status === 'working'}>
            {status === 'working' && !proto ? c.working : <>{proto ? c.again : c.generate} <ArrowRight /></>}
          </button>
        </div>
        {error && <p className="sp-error" role="alert">{error}</p>}
      </div>

      {status === 'working' && <p className="is-working" role="status">{c.workingLong}</p>}

      {proto && (
        <div className="is-result" ref={frameRef}>
          <div className="is-bar">
            <strong>{proto.title || c.untitled}</strong>
            <span className="is-version">v{proto.version}</span>
            <button type="button" className="is-toggle" onClick={() => setFull((f) => !f)}>{full ? c.smaller : c.larger}</button>
          </div>
          <iframe className={`is-frame${full ? ' is-frame--full' : ''}`} sandbox="" srcDoc={proto.html} title={proto.title || c.untitled} />
          <p className="is-note">{c.disclaimer}</p>

          <form className="is-refine" onSubmit={(e) => { e.preventDefault(); if (refine.trim()) generate(refine.trim()) }}>
            <input className="sp-input" type="text" maxLength={600} value={refine} onChange={(e) => setRefine(e.target.value)} placeholder={c.refinePlaceholder} aria-label={c.refinePlaceholder} />
            <button type="submit" className="btn btn-ghost hub-btn-round" disabled={!refine.trim() || status === 'working'}>{status === 'working' ? c.working : c.refine}</button>
          </form>

          <div className="is-ticket">
            {ticket.id ? (
              <div className="is-ticket-done" role="status">
                <span className="sp-check" aria-hidden="true"><svg viewBox="0 0 52 52" width="44" height="44"><circle cx="26" cy="26" r="24" /><path d="M15 27l7 7 15-15" /></svg></span>
                <div>
                  <h3>{c.ticketDone.replace('{id}', ticket.id)}</h3>
                  <p>{c.ticketDoneText}</p>
                </div>
              </div>
            ) : (
              <form onSubmit={saveTicket} noValidate>
                <h3>{c.ticketTitle}</h3>
                <p>{c.ticketText}</p>
                <div className="ra-row">
                  <label className="sp-field">
                    <span className="sp-label">{c.name}</span>
                    <input className="sp-input" type="text" autoComplete="name" maxLength={100} value={ticket.name} onChange={(e) => setTicket((tk) => ({ ...tk, name: e.target.value, error: '' }))} />
                  </label>
                  <label className="sp-field">
                    <span className="sp-label">{c.email}</span>
                    <input className="sp-input" type="email" autoComplete="email" maxLength={200} value={ticket.email} onChange={(e) => setTicket((tk) => ({ ...tk, email: e.target.value, error: '' }))} />
                  </label>
                </div>
                <input ref={honeypotRef} className="sp-hp" type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
                {ticket.error && <p className="sp-error" role="alert">{ticket.error}</p>}
                <button type="submit" className="btn btn-primary hub-btn-round" disabled={ticket.sending}>{ticket.sending ? c.ticketSending : <>{c.ticketCta} <ArrowRight /></>}</button>
                <p className="sp-privacy">{c.ticketPrivacy}</p>
              </form>
            )}
          </div>

          <div className="is-next">
            <div>
              <h3>{c.nextTitle}</h3>
              <p>{c.nextText}</p>
            </div>
            <div className="is-next-actions">
              <a href={CALENDLY} target="_blank" rel="noopener noreferrer" className="btn btn-primary hub-btn-round">{c.book} <ArrowRight /></a>
              {onBrief && <button type="button" className="btn btn-ghost hub-btn-round" onClick={() => onBrief(idea.trim())}>{c.brief}</button>}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
