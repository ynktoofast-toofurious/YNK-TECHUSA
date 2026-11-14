import { useEffect, useRef, useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext'
import { checkBuildPass, generatePrototype, intakeEnabled, requestBuildPass, submitIdeaTicket } from '../utils/intake'
import { ArrowRight } from './Icons'

const SESSION_KEY = 'ynk-idea-studio'
const TRIAL_KEY = 'ynk-studio-trial'
const PASS_KEY = 'ynk-build-pass'
const FREE_RUNS = 3
const CALENDLY = 'https://calendly.com/yannicknkongolo7/30min'
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const PASS_RE = /^YNK-PASS-[A-Z0-9]{4}-[A-Z0-9]{4}$/
const PASS_ERRORS = ['pass_invalid', 'pass_expired', 'pass_spent']

// The idea and prototype live only in this browser session unless the visitor saves a ticket.
function readSession() {
  try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null') } catch { return null }
}
function writeSession(value) {
  try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(value)) } catch { /* storage unavailable */ }
}
// The free-try token and a Build Pass survive the session; the server keeps the real counts.
function readLocal(key) {
  try { return JSON.parse(localStorage.getItem(key) || 'null') } catch { return null }
}
function writeLocal(key, value) {
  try {
    if (value) localStorage.setItem(key, JSON.stringify(value))
    else localStorage.removeItem(key)
  } catch { /* storage unavailable */ }
}
const safeHttps = (url) => {
  try { return new URL(url).protocol === 'https:' ? url : '' } catch { return '' }
}
const passFromHash = () => {
  const m = window.location.hash.match(/pass=([A-Za-z0-9-]{18,24})/)
  const code = m ? decodeURIComponent(m[1]).toUpperCase() : ''
  return PASS_RE.test(code) ? code : ''
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
  const [lastTicket, setLastTicket] = useState(saved?.lastTicket || null)
  const [trial, setTrial] = useState(() => readLocal(TRIAL_KEY))
  const [pass, setPass] = useState(() => readLocal(PASS_KEY))
  const [paywall, setPaywall] = useState(false)
  const [passForm, setPassForm] = useState({ code: '', checking: false, error: '' })
  const [buy, setBuy] = useState({ sending: false, done: false, error: '', payUrl: '' })
  const honeypotRef = useRef(null)
  const frameRef = useRef(null)
  const wrapRef = useRef(null)

  const freeLeft = trial ? trial.left : FREE_RUNS
  const locked = !pass && freeLeft <= 0

  const saveTrial = (value) => { setTrial(value); writeLocal(TRIAL_KEY, value) }
  const savePass = (value) => { setPass(value); writeLocal(PASS_KEY, value) }

  const redeem = async (code) => {
    const value = code.trim().toUpperCase()
    if (!PASS_RE.test(value)) { setPassForm((f) => ({ ...f, error: c.errors.pass_invalid })); return }
    setPassForm((f) => ({ ...f, checking: true, error: '' }))
    try {
      const res = await checkBuildPass(value)
      if (!res.ok) throw new Error(res.error || 'failed')
      if (!res.valid) { setPassForm({ code: value, checking: false, error: c.errors[res.reason] || c.errors.pass_invalid }); return }
      savePass({ code: value, left: res.left, expires: res.expires })
      setPassForm({ code: '', checking: false, error: '' })
      setPaywall(false)
      setError('')
    } catch (err) {
      setPassForm((f) => ({ ...f, checking: false, error: c.errors[err.message] || c.errors.failed }))
    }
  }

  // Pass links in the email carry the code in the URL fragment, which never reaches a server.
  useEffect(() => {
    const code = passFromHash()
    if (!code || !intakeEnabled) return
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#studio`)
    redeem(code).then(() => wrapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!intakeEnabled) return null

  const generate = async (change) => {
    if (status === 'working') return
    if (idea.trim().length < 10) { setError(c.errors.short); return }
    if (locked) { setPaywall(true); return }
    setError('')
    setStatus('working')
    try {
      const res = await generatePrototype({
        idea: idea.trim(),
        language,
        ...(pass ? { pass: pass.code } : { trial: trial?.token || '' }),
        ...(change && proto ? { refine: change, html: proto.html } : {}),
      })
      if (res.trial) saveTrial(res.trial)
      if (res.pass) savePass({ ...pass, ...res.pass })
      if (!res.ok) {
        if (res.error === 'trial_used' || res.error === 'trial_busy') {
          setPaywall(true)
          if (res.error === 'trial_busy') setError(c.errors.trial_busy)
          return
        }
        if (PASS_ERRORS.includes(res.error)) {
          savePass(null)
          setPaywall(true)
        }
        throw new Error(res.error || 'failed')
      }
      const next = { html: res.html, title: res.title, version: (proto?.version || 0) + 1 }
      setProto(next)
      setTicket((tk) => ({ ...tk, id: '', error: '' }))
      setRefine('')
      writeSession({ ...readSession(), idea: idea.trim(), html: next.html, title: next.title, version: next.version })
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
      const last = { id: res.id, email }
      setLastTicket(last)
      writeSession({ ...readSession(), ticketId: res.id, ticketFor: proto.version, lastTicket: last })
    } catch (err) {
      setTicket((tk) => ({ ...tk, sending: false, error: c.errors[err.message] || c.errors.ticket }))
    }
  }

  const askForPass = async () => {
    if (!lastTicket || buy.sending) return
    setBuy({ sending: true, done: false, error: '', payUrl: '' })
    try {
      const res = await requestBuildPass({ ticket: lastTicket.id, email: lastTicket.email, language })
      if (!res.ok) throw new Error(res.error || 'failed')
      setBuy({ sending: false, done: true, error: '', payUrl: safeHttps(res.payUrl || '') })
    } catch (err) {
      setBuy({ sending: false, done: false, error: c.errors[err.message] || c.errors.pass_request, payUrl: '' })
    }
  }

  const meter = pass
    ? c.passLeft.replace('{n}', pass.left).replace('{date}', pass.expires || '')
    : c.freeLeft.replace('{n}', Math.max(0, freeLeft)).replace('{total}', FREE_RUNS)

  const paywallCard = (
    <div className="is-paywall" role="region" aria-labelledby="is-pay-title">
      <h3 id="is-pay-title">{c.pay.title}</h3>
      <p>{c.pay.text}</p>
      <ul className="is-pay-list">{c.pay.points.map((p) => <li key={p}>{p}</li>)}</ul>
      {buy.done ? (
        <div className="is-pay-done" role="status">
          <p>{buy.payUrl ? c.pay.opened : c.pay.requested}</p>
          {buy.payUrl && <a className="btn btn-primary hub-btn-round" href={buy.payUrl} target="_blank" rel="noopener noreferrer">{c.pay.pay} <ArrowRight /></a>}
        </div>
      ) : lastTicket ? (
        <button type="button" className="btn btn-primary hub-btn-round" onClick={askForPass} disabled={buy.sending}>
          {buy.sending ? c.pay.checking : <>{c.pay.cta} <ArrowRight /></>}
        </button>
      ) : (
        <p className="is-pay-need">{proto ? c.pay.needTicket : c.pay.needPrototype}</p>
      )}
      {buy.error && <p className="sp-error" role="alert">{buy.error}</p>}
      <form className="is-pass" onSubmit={(e) => { e.preventDefault(); redeem(passForm.code) }}>
        <label className="sp-field">
          <span className="sp-label">{c.pay.have}</span>
          <input className="sp-input" type="text" autoComplete="off" spellCheck={false} maxLength={24} placeholder="YNK-PASS-XXXX-XXXX"
            value={passForm.code} onChange={(e) => setPassForm({ code: e.target.value, checking: false, error: '' })} />
        </label>
        <button type="submit" className="btn btn-ghost hub-btn-round" disabled={passForm.checking || !passForm.code.trim()}>{passForm.checking ? c.pay.checking : c.pay.apply}</button>
      </form>
      {passForm.error && <p className="sp-error" role="alert">{passForm.error}</p>}
      <a href={CALENDLY} target="_blank" rel="noopener noreferrer" className="hub-link">{c.pay.talk} <ArrowRight /></a>
    </div>
  )

  return (
    <section className="is-wrap" id="studio" ref={wrapRef} aria-labelledby="is-title">
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
        <p className={`is-meter${pass ? ' is-meter--pass' : locked ? ' is-meter--out' : ''}`}>{meter}</p>
        {error && <p className="sp-error" role="alert">{error}</p>}
      </div>

      {status === 'working' && <p className="is-working" role="status">{c.workingLong}</p>}

      {paywall && !pass && paywallCard}

      {proto && (
        <div className="is-result" ref={frameRef}>
          <div className="is-bar">
            <strong>{proto.title || c.untitled}</strong>
            <span className="is-version">v{proto.version}</span>
            <button type="button" className="is-toggle" onClick={() => setFull((f) => !f)}>{full ? c.smaller : c.larger}</button>
          </div>
          <iframe className={`is-frame${full ? ' is-frame--full' : ''}`} sandbox="" srcDoc={proto.html} title={proto.title || c.untitled} />
          <p className="is-note">{c.disclaimer}</p>

          {locked ? (
            <div className="is-refine is-refine--locked">
              <p>{c.refineLocked}</p>
              <button type="button" className="btn btn-ghost hub-btn-round" onClick={() => { setPaywall(true); wrapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }}>{c.unlock}</button>
            </div>
          ) : (
            <form className="is-refine" onSubmit={(e) => { e.preventDefault(); if (refine.trim()) generate(refine.trim()) }}>
              <input className="sp-input" type="text" maxLength={pass ? 1500 : 600} value={refine} onChange={(e) => setRefine(e.target.value)} placeholder={c.refinePlaceholder} aria-label={c.refinePlaceholder} />
              <button type="submit" className="btn btn-ghost hub-btn-round" disabled={!refine.trim() || status === 'working'}>{status === 'working' ? c.working : c.refine}</button>
            </form>
          )}

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
