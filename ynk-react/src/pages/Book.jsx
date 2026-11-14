import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'
import { ArrowRight } from '../components/Icons'
import { bookMeeting, bookingSlots, intakeEnabled, isBusy } from '../utils/intake'

const FOUNDER_PHOTO = '/assets/team/yannick-nkongolo.jpg'
const LOCALES = { en: 'en-US', fr: 'fr-FR', es: 'es-ES' }
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const TOPICS = ['data', 'ai', 'web', 'brand', 'studio', 'other']

function visitorTz() {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC' } catch { return 'UTC' }
}

export default function Book() {
  const { t, language } = useLanguage()
  const b = t('book')
  const [params] = useSearchParams()
  const [slots, setSlots] = useState(intakeEnabled ? null : [])
  const [loadError, setLoadError] = useState('')
  const [day, setDay] = useState('')
  const [slot, setSlot] = useState('')
  const [form, setForm] = useState(() => ({
    name: '', email: '', company: '', notes: '',
    topic: TOPICS.includes(params.get('topic')) ? params.get('topic') : '',
  }))
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(null)
  const honeypotRef = useRef(null)
  const tz = useMemo(visitorTz, [])
  const locale = LOCALES[language] || 'en-US'

  const fetchSlots = () => bookingSlots()
    .then((res) => {
      if (!res.ok) throw new Error(res.error || 'send')
      setSlots(res.slots || [])
      setLoadError('')
    })
    .catch((err) => {
      setSlots([])
      setLoadError(isBusy(err) ? t('serviceBanner.short') : b.errors.send)
    })

  useEffect(() => {
    if (intakeEnabled) fetchSlots()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const byDay = useMemo(() => {
    const map = {}
    ;(slots || []).forEach((iso) => {
      const key = new Date(iso).toLocaleDateString('en-CA', { timeZone: tz })
      ;(map[key] = map[key] || []).push(iso)
    })
    return map
  }, [slots, tz])
  const days = Object.keys(byDay).sort()
  const activeDay = byDay[day] ? day : days[0] || ''

  const fmt = (iso, opts) => new Date(iso).toLocaleString(locale, { timeZone: tz, ...opts })
  const fullLabel = (iso) => fmt(iso, { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' })
  const update = (key, value) => { setForm((f) => ({ ...f, [key]: value })); setError('') }

  const submit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) { setError(b.errors.name); return }
    if (!EMAIL_RE.test(form.email.trim())) { setError(b.errors.email); return }
    if (!form.topic) { setError(b.errors.topic); return }
    setSending(true)
    setError('')
    try {
      const res = await bookMeeting({
        start: slot, name: form.name.trim(), email: form.email.trim(), company: form.company.trim(), topic: form.topic,
        notes: form.notes.trim(), language, tz, website: honeypotRef.current?.value || '',
      })
      if (!res.ok) throw new Error(res.error || 'send')
      setDone({ id: res.id, start: slot, name: form.name.trim(), email: form.email.trim() })
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      if (err.message === 'taken') {
        setSlot('')
        fetchSlots()
      }
      setError(isBusy(err) ? t('serviceBanner.short') : b.errors[err.message] || b.errors.send)
    } finally {
      setSending(false)
    }
  }

  const picker = () => {
    if (slots === null) {
      return (
        <div className="bk-loading" role="status">
          <span className="bk-spinner" aria-hidden="true" /> {b.loading}
        </div>
      )
    }
    if (loadError) return <p className="sp-error" role="alert">{loadError}</p>
    if (!days.length) return <p className="bk-none">{b.none} <Link to="/start-project" className="hub-link">{b.noneCta} <ArrowRight /></Link></p>
    return (
      <>
        <h3 className="bk-step"><span>1</span>{b.steps[0]}</h3>
        <div className="bk-days">
          {days.map((key) => {
            const first = byDay[key][0]
            return (
              <button key={key} type="button" className={`bk-day${key === activeDay ? ' is-on' : ''}`} onClick={() => setDay(key)} aria-pressed={key === activeDay}>
                <small>{fmt(first, { weekday: 'short' })}</small>
                <strong>{fmt(first, { day: 'numeric' })}</strong>
                <small>{fmt(first, { month: 'short' })}</small>
              </button>
            )
          })}
        </div>
        <h3 className="bk-step"><span>2</span>{b.steps[1]}</h3>
        <p className="bk-tz">{b.timesIn.replace('{tz}', tz)}</p>
        <div className="bk-times">
          {(byDay[activeDay] || []).map((iso) => (
            <button key={iso} type="button" className="bk-time" onClick={() => { setSlot(iso); setError('') }}>
              {fmt(iso, { hour: 'numeric', minute: '2-digit' })}
            </button>
          ))}
        </div>
        {error && <p className="sp-error" role="alert">{error}</p>}
      </>
    )
  }

  return (
    <div className="hub bk-page">
      <div className="hub-bg" aria-hidden="true">
        <div className="hub-glow hub-glow-a" />
        <div className="hub-glow hub-glow-b" />
        <div className="hub-grid" />
      </div>

      <section className="bk-section">
        <div className="container bk-grid">
          <aside className="bk-bio hx-in" style={{ '--d': 2 }}>
            <figure className="bk-photo">
              <img src={FOUNDER_PHOTO} alt={b.bio.name} width="640" height="800" loading="eager" decoding="async" />
            </figure>
            <span className="section-tag">{b.bio.tag}</span>
            <h2 className="bk-name">{b.bio.name}</h2>
            <p className="bk-role">{b.bio.role}</p>
            <p className="bk-bio-text">{b.bio.text}</p>
            <ul className="bk-points">{b.bio.points.map((p) => <li key={p}>{p}</li>)}</ul>
            <blockquote className="bk-quote">{b.bio.quote}</blockquote>
            <Link to="/about" className="hub-link">{b.bio.about} <ArrowRight /></Link>
          </aside>

          <div className="bk-main">
            {done ? (
              <div className="bk-card bk-done hx-in" role="status">
                <span className="sp-check" aria-hidden="true"><svg viewBox="0 0 52 52" width="56" height="56"><circle cx="26" cy="26" r="24" /><path d="M15 27l7 7 15-15" /></svg></span>
                <span className="section-tag">{b.done.tag}</span>
                <h1 className="hub-title bk-title">{b.done.title.replace('{name}', done.name)}</h1>
                <dl className="bk-summary">
                  <div><dt>{b.done.when}</dt><dd>{fullLabel(done.start)} ({tz})</dd></div>
                  <div><dt>{b.done.ref}</dt><dd>{done.id}</dd></div>
                </dl>
                <p className="hub-sub">{b.done.text.replace('{email}', done.email)}</p>
                <div className="bk-actions">
                  <Link to="/" className="btn btn-primary hub-btn-round">{b.done.home} <ArrowRight /></Link>
                  <Link to="/latest" className="btn btn-ghost hub-btn-round">{b.done.latest}</Link>
                </div>
              </div>
            ) : (
              <>
                <span className="section-tag hx-in" style={{ '--d': 0 }}>{b.tag}</span>
                <h1 className="hub-title bk-title hx-in" style={{ '--d': 1 }}>{b.title}</h1>
                <p className="hub-sub bk-sub hx-in" style={{ '--d': 2 }}>{b.sub}</p>
                <ul className="bk-meta hx-in" style={{ '--d': 3 }}>{b.meta.map((m) => <li key={m}>{m}</li>)}</ul>

                <div className="bk-card hx-in" style={{ '--d': 4 }}>
                  {!slot ? picker() : (
                    <form onSubmit={submit} noValidate>
                      <div className="bk-chosen">
                        <div>
                          <small>{b.done.when}</small>
                          <strong>{fullLabel(slot)}</strong>
                        </div>
                        <button type="button" className="btn btn-ghost hub-btn-round" onClick={() => setSlot('')}>{b.change}</button>
                      </div>
                      <h3 className="bk-step"><span>3</span>{b.steps[2]}</h3>
                      <div className="ra-row">
                        <label className="sp-field">
                          <span className="sp-label">{b.name}</span>
                          <input className="sp-input" type="text" autoComplete="name" maxLength={100} value={form.name} onChange={(e) => update('name', e.target.value)} />
                        </label>
                        <label className="sp-field">
                          <span className="sp-label">{b.email}</span>
                          <input className="sp-input" type="email" autoComplete="email" maxLength={200} value={form.email} onChange={(e) => update('email', e.target.value)} />
                        </label>
                      </div>
                      <label className="sp-field">
                        <span className="sp-label">{b.company}</span>
                        <input className="sp-input" type="text" autoComplete="organization" maxLength={120} value={form.company} onChange={(e) => update('company', e.target.value)} />
                      </label>
                      <fieldset className="bk-topics">
                        <legend className="sp-label">{b.topic}</legend>
                        {TOPICS.map((key) => (
                          <button key={key} type="button" className={`bk-chip${form.topic === key ? ' is-on' : ''}`} aria-pressed={form.topic === key} onClick={() => update('topic', key)}>
                            {b.topics[key]}
                          </button>
                        ))}
                      </fieldset>
                      <label className="sp-field">
                        <span className="sp-label">{b.notes}</span>
                        <textarea className="sp-input" rows={3} maxLength={1500} value={form.notes} placeholder={b.notesPlaceholder} onChange={(e) => update('notes', e.target.value)} />
                      </label>
                      <input ref={honeypotRef} className="sp-hp" type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
                      {error && <p className="sp-error" role="alert">{error}</p>}
                      <button type="submit" className="btn btn-primary hub-btn-round bk-submit" disabled={sending}>
                        {sending ? b.sending : <>{b.confirm} <ArrowRight /></>}
                      </button>
                      <p className="sp-privacy">{b.privacy}</p>
                    </form>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
