import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import emailjs from '@emailjs/browser'
import { useLanguage } from '../i18n/LanguageContext'
import projectCopy from '../i18n/projectCopy'
import { ArrowLeft, ArrowRight } from '../components/Icons'
import { escapeHtml } from '../utils/escapeHtml'

const EMAILJS_SERVICE_ID = 'service_sw3zais'
const EMAILJS_TEMPLATE_ID = 'template_99cacr8'
const EMAILJS_PUBLIC_KEY = 'zG_jERVPbUUfiZ6IL'
const CALENDLY = 'https://calendly.com/yannicknkongolo7/30min'
const DRAFT_KEY = 'ynk-project-brief'
const SENT_KEY = 'ynk-project-brief-sent'
const COOLDOWN_MS = 60 * 1000
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const EMPTY = { tracks: [], stage: '', outcome: '', timeline: '', budget: '', name: '', email: '', company: '', contact: 'email' }
const PREFILL = { it: ['web', 'data'], branding: ['brand'] }

const ic = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true, viewBox: '0 0 24 24', width: 24, height: 24 }
const TRACKS = [
  ['data', <svg key="d" {...ic}><ellipse cx="12" cy="5" rx="8" ry="3" /><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5" /><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" /></svg>],
  ['ai', <svg key="a" {...ic}><rect x="5" y="7" width="14" height="12" rx="3" /><line x1="12" y1="3" x2="12" y2="7" /><circle cx="9.5" cy="13" r="1.2" /><circle cx="14.5" cy="13" r="1.2" /><line x1="2" y1="12" x2="5" y2="12" /><line x1="19" y1="12" x2="22" y2="12" /></svg>],
  ['web', <svg key="w" {...ic}><rect x="2" y="4" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><path d="M7 13l3-3 3 3 4-4" /></svg>],
  ['brand', <svg key="b" {...ic}><path d="M12 2l2.6 6.3L21 9l-5 4.4L17.5 20 12 16.7 6.5 20 8 13.4 3 9l6.4-.7z" /></svg>],
  ['events', <svg key="e" {...ic}><path d="M3 21h18" /><path d="M6 21V10l6-6 6 6v11" /><circle cx="12" cy="13" r="2.5" /><line x1="12" y1="2" x2="12" y2="4" /></svg>],
  ['print', <svg key="p" {...ic}><path d="M8 3l-5 3 2 5 3-1v11h8V10l3 1 2-5-5-3a4 4 0 01-8 0z" /></svg>],
  ['other', <svg key="o" {...ic}><circle cx="12" cy="12" r="9" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></svg>],
]

function loadDraft() {
  try {
    const saved = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null')
    if (saved && typeof saved === 'object') return { ...EMPTY, ...saved, tracks: Array.isArray(saved.tracks) ? saved.tracks : [] }
  } catch { /* corrupt draft */ }
  return null
}

function stepError(step, d) {
  if (step === 0 && d.tracks.length === 0) return 'tracks'
  if (step === 1 && !d.stage) return 'stage'
  if (step === 1 && d.outcome.trim().length < 20) return 'outcome'
  if (step === 2 && !d.timeline) return 'timeline'
  if (step === 2 && !d.budget) return 'budget'
  if (step === 3 && !d.name.trim()) return 'name'
  if (step === 3 && !EMAIL_RE.test(d.email.trim())) return 'email'
  return ''
}

function buildAdminHtml(d, ref) {
  const en = projectCopy.en.project
  const rows = [
    ['Reference', ref],
    ['Name', d.name],
    ['Email', d.email],
    ['Company', d.company || 'N/A'],
    ['Follow-up', en.contacts[d.contact]],
    ['Focus', d.tracks.map((k) => en.tracks[k].t).join(', ')],
    ['Stage', en.stages[d.stage]],
    ['Timeline', en.timelines[d.timeline]],
    ['Budget', en.budgets[d.budget]],
  ]
  return `<p>A new project brief was submitted on the YNK Tech USA website.</p>
<div style="background-color:#f9f9f9;border:1px solid #eee;border-radius:4px;padding:14px;margin:16px 0">
${rows.map(([k, v]) => `<strong>${k}:</strong> ${escapeHtml(v)}<br/>`).join('\n')}
</div>
<p><strong>Desired outcome:</strong><br/>${escapeHtml(d.outcome).replace(/\n/g, '<br/>')}</p>`
}

export default function StartProject() {
  const { t } = useLanguage()
  const p = t('project')
  const [searchParams] = useSearchParams()

  const [restored] = useState(() => loadDraft() !== null)
  const [data, setData] = useState(() => {
    const draft = loadDraft()
    if (draft) return draft
    const prefill = PREFILL[searchParams.get('category')]
    return prefill ? { ...EMPTY, tracks: prefill } : EMPTY
  })
  const [step, setStep] = useState(0)
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(null)
  const [showRestored, setShowRestored] = useState(restored)
  const honeypotRef = useRef(null)
  const headingRef = useRef(null)
  const wizardRef = useRef(null)
  const firstRender = useRef(true)

  useEffect(() => {
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(data)) } catch { /* storage unavailable */ }
  }, [data])

  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return }
    headingRef.current?.focus({ preventScroll: true })
    const top = wizardRef.current?.getBoundingClientRect().top ?? 0
    if (top < 90) window.scrollBy({ top: top - 110, behavior: 'smooth' })
  }, [step])

  const set = (key, value) => {
    setData((d) => ({ ...d, [key]: value }))
    setError('')
  }

  const toggleTrack = (key) => {
    setData((d) => ({ ...d, tracks: d.tracks.includes(key) ? d.tracks.filter((k) => k !== key) : [...d.tracks, key] }))
    setError('')
  }

  const addChip = (chip) => {
    setData((d) => ({ ...d, outcome: d.outcome.trim() ? `${d.outcome.trim()} ${chip}.` : `${chip}.` }))
    setError('')
  }

  const goTo = (target) => {
    for (let s = 0; s < target; s++) {
      const err = stepError(s, data)
      if (err) { setStep(s); setError(err); return }
    }
    setError('')
    setStep(target)
  }

  const next = () => {
    const err = stepError(step, data)
    if (err) { setError(err); return }
    setStep((s) => Math.min(s + 1, 3))
  }

  const reset = () => {
    setData(EMPTY)
    setStep(0)
    setError('')
    setShowRestored(false)
  }

  const submit = async (e) => {
    e.preventDefault()
    if (step < 3) { next(); return }
    const err = stepError(3, data)
    if (err) { setError(err); return }

    const ref = `YNK-${Date.now().toString(36).toUpperCase().slice(-6)}`
    if (honeypotRef.current?.value) { setDone({ ref, name: data.name }); return }

    const lastSent = Number(localStorage.getItem(SENT_KEY) || 0)
    if (Date.now() - lastSent < COOLDOWN_MS) { setError('cooldown'); return }

    setSending(true)
    setError('')
    try {
      emailjs.init(EMAILJS_PUBLIC_KEY)
      await Promise.all([
        emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
          to_email: 'yannicknkongolo7@gmail.com',
          heading: `New Project Brief ${ref}: ${data.tracks.map((k) => projectCopy.en.project.tracks[k].t).join(', ')}`,
          content_html: buildAdminHtml(data, ref),
          footer_note: 'You received this email because a project brief was submitted on the YNK Tech USA website.',
        }),
        emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
          to_email: data.email.trim(),
          heading: p.success.tag,
          content_html: `<p>${escapeHtml(p.success.title.replace('{name}', data.name.trim()))}</p>
<p>${escapeHtml(p.success.text)}</p>
<p><strong>${escapeHtml(p.success.ref)}:</strong> ${ref}</p>`,
          footer_note: 'YNK Tech USA',
        }),
      ])
      localStorage.setItem(SENT_KEY, String(Date.now()))
      localStorage.removeItem(DRAFT_KEY)
      setDone({ ref, name: data.name.trim() })
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err2) {
      console.error('EmailJS error:', err2)
      setError('send')
    } finally {
      setSending(false)
    }
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'BUTTON' && step < 3) {
      e.preventDefault()
      next()
    }
  }

  const required = [data.tracks.length > 0, !!data.stage, data.outcome.trim().length >= 20, !!data.timeline, !!data.budget, !!data.name.trim(), EMAIL_RE.test(data.email.trim())]
  const completion = Math.round((required.filter(Boolean).length / required.length) * 100)

  if (done) {
    return (
      <div className="hub sp-page">
        <div className="hub-bg" aria-hidden="true"><div className="hub-glow hub-glow-a" /><div className="hub-grid" /></div>
        <section className="sp-success-wrap">
          <div className="container">
            <div className="sp-success hx-in">
              <span className="sp-check" aria-hidden="true">
                <svg viewBox="0 0 52 52" width="64" height="64"><circle cx="26" cy="26" r="24" /><path d="M15 27l7 7 15-15" /></svg>
              </span>
              <span className="section-tag">{p.success.tag}</span>
              <h1 className="hub-title">{p.success.title.replace('{name}', done.name)}</h1>
              <p className="hub-sub">{p.success.text}</p>
              <p className="sp-ref">{p.success.ref}: <strong>{done.ref}</strong></p>
              <ol className="sp-next">
                {p.success.steps.map((s, i) => (
                  <li key={i} style={{ '--d': i }}><span>0{i + 1}</span>{s}</li>
                ))}
              </ol>
              <div className="hx-ctas sp-success-ctas">
                <a href={CALENDLY} target="_blank" rel="noopener noreferrer" className="btn btn-primary hub-btn-round">{p.success.book} <ArrowRight /></a>
                <Link to="/latest" className="btn btn-ghost hub-btn-round">{p.success.explore}</Link>
                <button type="button" className="btn btn-ghost hub-btn-round" onClick={() => { setDone(null); reset() }}>{p.success.another}</button>
              </div>
            </div>
          </div>
        </section>
      </div>
    )
  }

  const choice = (key, value, label) => (
    <button
      key={value}
      type="button"
      role="radio"
      aria-checked={data[key] === value}
      className={`sp-choice${data[key] === value ? ' active' : ''}`}
      onClick={() => set(key, value)}
    >
      {label}
    </button>
  )

  return (
    <div className="hub sp-page">
      <div className="hub-bg" aria-hidden="true">
        <div className="hub-glow hub-glow-a" />
        <div className="hub-grid" />
      </div>

      <section className="sp-hero">
        <div className="container">
          <span className="section-tag hx-in" style={{ '--d': 0 }}>{p.tag}</span>
          <h1 className="hub-title hx-in" style={{ '--d': 1 }}>{p.title1} <span className="text-gradient">{p.title2}</span></h1>
          <p className="hub-sub hx-in" style={{ '--d': 2 }}>{p.sub}</p>
        </div>
      </section>

      <section className="sp-body">
        <div className="container sp-layout">
          <form ref={wizardRef} className="sp-wizard hx-in" style={{ '--d': 3 }} onSubmit={submit} onKeyDown={onKeyDown} noValidate>
            <ol className="sp-steps">
              {p.steps.map((label, i) => (
                <li key={label}>
                  <button
                    type="button"
                    className={`sp-step${i === step ? ' current' : ''}${i < step ? ' done' : ''}`}
                    onClick={() => goTo(i)}
                    aria-current={i === step ? 'step' : undefined}
                  >
                    <span className="sp-step-dot">{i < step
                      ? <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
                      : i + 1}</span>
                    <span className="sp-step-label">{label}</span>
                  </button>
                </li>
              ))}
            </ol>
            <div className="sp-progress" aria-hidden="true"><span style={{ transform: `scaleX(${step / 3})` }} /></div>

            {showRestored && (
              <div className="sp-restored">
                <span>{p.brief.restored}</span>
                <button type="button" onClick={reset}>{p.brief.reset}</button>
              </div>
            )}

            <div className="sp-panel" key={step}>
              <h2 className="sp-title" ref={headingRef} tabIndex={-1}>{p.stepTitles[step]}</h2>
              <p className="sp-hint">{p.stepHints[step]}</p>

              {step === 0 && (
                <div className="sp-tracks" role="group" aria-label={p.steps[0]}>
                  {TRACKS.map(([key, svg], i) => {
                    const on = data.tracks.includes(key)
                    return (
                      <button
                        key={key}
                        type="button"
                        aria-pressed={on}
                        className={`sp-track${on ? ' active' : ''}`}
                        style={{ '--d': i }}
                        onClick={() => toggleTrack(key)}
                      >
                        <span className="sp-track-icon">{svg}</span>
                        <span className="sp-track-text">
                          <strong>{p.tracks[key].t}</strong>
                          <small>{p.tracks[key].d}</small>
                        </span>
                        <span className="sp-track-check" aria-hidden="true">
                          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}

              {step === 1 && (
                <>
                  <span className="sp-label">{p.stageLabel}</span>
                  <div className="sp-choices" role="radiogroup" aria-label={p.stageLabel}>
                    {Object.entries(p.stages).map(([k, label]) => choice('stage', k, label))}
                  </div>
                  <label className="sp-label" htmlFor="sp-outcome">{p.outcomeLabel}</label>
                  <textarea
                    id="sp-outcome"
                    className="sp-input sp-textarea"
                    rows={4}
                    maxLength={1500}
                    value={data.outcome}
                    placeholder={p.outcomePlaceholder}
                    onChange={(e) => set('outcome', e.target.value)}
                  />
                  <div className="sp-chips">
                    {p.outcomeChips.map((chip) => (
                      <button key={chip} type="button" className="sp-chip" onClick={() => addChip(chip)}>+ {chip}</button>
                    ))}
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <span className="sp-label">{p.timelineLabel}</span>
                  <div className="sp-choices" role="radiogroup" aria-label={p.timelineLabel}>
                    {Object.entries(p.timelines).map(([k, label]) => choice('timeline', k, label))}
                  </div>
                  <span className="sp-label">{p.budgetLabel}</span>
                  <div className="sp-choices" role="radiogroup" aria-label={p.budgetLabel}>
                    {Object.entries(p.budgets).map(([k, label]) => choice('budget', k, label))}
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <div className="sp-fields">
                    <label className="sp-field">
                      <span className="sp-label">{p.name}</span>
                      <input className="sp-input" type="text" autoComplete="name" maxLength={100} value={data.name} onChange={(e) => set('name', e.target.value)} />
                    </label>
                    <label className="sp-field">
                      <span className="sp-label">{p.email}</span>
                      <input className="sp-input" type="email" autoComplete="email" maxLength={120} value={data.email} onChange={(e) => set('email', e.target.value)} />
                    </label>
                    <label className="sp-field sp-field--full">
                      <span className="sp-label">{p.company}</span>
                      <input className="sp-input" type="text" autoComplete="organization" maxLength={120} value={data.company} onChange={(e) => set('company', e.target.value)} />
                    </label>
                  </div>
                  <span className="sp-label">{p.contactLabel}</span>
                  <div className="sp-choices" role="radiogroup" aria-label={p.contactLabel}>
                    {Object.entries(p.contacts).map(([k, label]) => choice('contact', k, label))}
                  </div>
                  <input ref={honeypotRef} className="sp-hp" type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
                  <p className="sp-privacy">{p.privacy}</p>
                </>
              )}
            </div>

            {error && <p className="sp-error" role="alert">{p.errors[error]}</p>}

            <div className="sp-actions">
              {step > 0 ? (
                <button type="button" className="btn btn-ghost hub-btn-round" onClick={() => { setError(''); setStep(step - 1) }}>
                  <ArrowLeft />{p.back}
                </button>
              ) : <span />}
              <button type="submit" className="btn btn-primary hub-btn-round" disabled={sending}>
                {sending ? p.sending : step < 3 ? <>{p.next} <ArrowRight /></> : <>{p.submit} <ArrowRight /></>}
              </button>
            </div>
          </form>

          <aside className="sp-brief hx-in" style={{ '--d': 4 }} aria-live="polite">
            <div className="sp-brief-head">
              <span>{p.brief.title}</span>
              <span className="sp-meter" style={{ '--p': completion }}><b>{completion}%</b> {p.brief.complete}</span>
            </div>
            <div className="sp-meter-bar" aria-hidden="true"><span style={{ transform: `scaleX(${completion / 100})` }} /></div>

            {completion === 0 && !data.tracks.length ? (
              <p className="sp-brief-empty">{p.brief.empty}</p>
            ) : (
              <dl className="sp-brief-list">
                {data.tracks.length > 0 && (
                  <div><dt>{p.brief.focus}</dt><dd className="sp-brief-tags">{data.tracks.map((k) => <span key={k}>{p.tracks[k].t}</span>)}</dd></div>
                )}
                {data.stage && <div><dt>{p.brief.stage}</dt><dd>{p.stages[data.stage]}</dd></div>}
                {data.outcome.trim() && <div><dt>{p.brief.outcome}</dt><dd className="sp-brief-outcome">{data.outcome.trim()}</dd></div>}
                {data.timeline && <div><dt>{p.brief.timeline}</dt><dd>{p.timelines[data.timeline]}</dd></div>}
                {data.budget && <div><dt>{p.brief.budget}</dt><dd>{p.budgets[data.budget]}</dd></div>}
                {(data.name.trim() || data.email.trim()) && (
                  <div><dt>{p.brief.contact}</dt><dd>{[data.name.trim(), data.email.trim()].filter(Boolean).join(' · ')}</dd></div>
                )}
              </dl>
            )}

            <ul className="sp-assurances">
              <li><span className="hx-pulse" aria-hidden="true" />{p.brief.reply}</li>
              <li><span className="sp-saved-dot" aria-hidden="true" />{p.brief.saved}</li>
            </ul>

            <div className="sp-talk">
              <strong>{p.talk.title}</strong>
              <p>{p.talk.text}</p>
              <a href={CALENDLY} target="_blank" rel="noopener noreferrer" className="hub-link">{p.talk.cta} <ArrowRight /></a>
            </div>
          </aside>
        </div>
      </section>
    </div>
  )
}
