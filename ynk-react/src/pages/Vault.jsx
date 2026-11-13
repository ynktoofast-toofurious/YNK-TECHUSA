import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import emailjs from '@emailjs/browser'
import { useLanguage } from '../i18n/LanguageContext'
import { ArrowRight } from '../components/Icons'
import useReveal from '../hooks/useReveal'
import { STUDIES, clearMember, getMember, saveMember } from '../content/vault'
import { escapeHtml } from '../utils/escapeHtml'

const EMAILJS_SERVICE_ID = 'service_sw3zais'
const EMAILJS_TEMPLATE_ID = 'template_99cacr8'
const EMAILJS_PUBLIC_KEY = 'zG_jERVPbUUfiZ6IL'
const SENT_KEY = 'ynk-vault-enroll-sent'
const COOLDOWN_MS = 60 * 1000
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const ic = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true, viewBox: '0 0 24 24' }
const Check = () => <svg {...ic} width="14" height="14"><polyline points="20 6 9 17 4 12" /></svg>
const Lock = () => <svg {...ic} width="14" height="14"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>

const TIER_ICONS = {
  explorer: <svg {...ic} strokeWidth={1.6} width="22" height="22"><circle cx="12" cy="12" r="10" /><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" /></svg>,
  insider: <svg {...ic} strokeWidth={1.6} width="22" height="22"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></svg>,
  founding: <svg {...ic} strokeWidth={1.6} width="22" height="22"><path d="M12 2l3 6.5 7 .9-5.1 4.8 1.3 7L12 17.8 5.8 21.2l1.3-7L2 9.4l7-.9z" /></svg>,
}

export default function Vault() {
  const { t, language } = useLanguage()
  const v = t('vaultUi')
  const location = useLocation()
  const [member, setMember] = useState(getMember)
  const [form, setForm] = useState({ name: '', email: '', interests: [], briefing: true, founding: false })
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const [justJoined, setJustJoined] = useState(false)
  const honeypotRef = useRef(null)
  const enrollRef = useRef(null)
  const revealRef = useReveal([language, !!member])

  useEffect(() => {
    if (location.hash === '#enroll') {
      const timer = setTimeout(() => enrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150)
      return () => clearTimeout(timer)
    }
  }, [location.hash])

  const goEnroll = (founding = false) => {
    if (founding) setForm((f) => ({ ...f, founding: true }))
    enrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const set = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }))
    setError('')
  }

  const toggleInterest = (i) => {
    setForm((f) => ({ ...f, interests: f.interests.includes(i) ? f.interests.filter((x) => x !== i) : [...f.interests, i] }))
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) { setError('name'); return }
    if (!EMAIL_RE.test(form.email.trim())) { setError('email'); return }

    const record = { name: form.name.trim(), tier: 'insider', founding: form.founding, since: new Date().toISOString().slice(0, 10) }
    if (honeypotRef.current?.value) { saveMember(record); setMember(record); setJustJoined(true); return }

    const lastSent = Number(localStorage.getItem(SENT_KEY) || 0)
    if (Date.now() - lastSent < COOLDOWN_MS) { setError('cooldown'); return }

    setSending(true)
    try {
      emailjs.init(EMAILJS_PUBLIC_KEY)
      const interests = form.interests.join(', ') || 'Not specified'
      await Promise.all([
        emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
          to_email: 'yannicknkongolo7@gmail.com',
          heading: `New Vault enrollment${form.founding ? ' + Founding list' : ''}`,
          content_html: `<p>A visitor enrolled in the YNK Insider Vault.</p>
<div style="background-color:#f9f9f9;border:1px solid #eee;border-radius:4px;padding:14px;margin:16px 0">
<strong>Name:</strong> ${escapeHtml(record.name)}<br/>
<strong>Email:</strong> ${escapeHtml(form.email.trim())}<br/>
<strong>Interests:</strong> ${escapeHtml(interests)}<br/>
<strong>Monthly briefing:</strong> ${form.briefing ? 'Yes' : 'No'}<br/>
<strong>Founding list:</strong> ${form.founding ? 'Yes' : 'No'}<br/>
<strong>Language:</strong> ${escapeHtml(language)}
</div>`,
          footer_note: 'You received this email because someone enrolled in the YNK Insider Vault.',
        }),
        emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
          to_email: form.email.trim(),
          heading: v.tag,
          content_html: `<p>${escapeHtml(v.welcome.replace('{name}', record.name))}</p>
<p>${escapeHtml(v.enroll.done)}</p>
<p><a href="https://ynk-techusa.com/vault" style="display:inline-block;background-color:#29B5E8;color:#fff;text-decoration:none;padding:10px 24px;border-radius:999px;font-weight:600">${escapeHtml(v.tag)}</a></p>`,
          footer_note: 'YNK Tech USA',
        }),
      ])
      localStorage.setItem(SENT_KEY, String(Date.now()))
      saveMember(record)
      setMember(record)
      setJustJoined(true)
    } catch (err) {
      console.error('EmailJS error:', err)
      setError('send')
    } finally {
      setSending(false)
    }
  }

  const signOut = () => {
    clearMember()
    setMember(null)
    setJustJoined(false)
  }

  return (
    <div className="hub vault-page" ref={revealRef}>
      <div className="hub-bg" aria-hidden="true">
        <div className="hub-glow hub-glow-a" />
        <div className="hub-glow hub-glow-b" />
        <div className="hub-grid" />
      </div>

      <section className="vp-hero">
        <div className="container">
          <span className="section-tag hx-in" style={{ '--d': 0 }}>{v.tag}</span>
          <h1 className="hub-title vp-title hx-in" style={{ '--d': 1 }}>{v.title1} <span className="text-gradient">{v.title2}</span></h1>
          <p className="hub-sub hx-in" style={{ '--d': 2 }}>{v.sub}</p>
          {member && (
            <div className="vp-welcome hx-in" style={{ '--d': 3 }}>
              <span className="vp-welcome-badge">{TIER_ICONS.insider}{v.tiers.insider.name}</span>
              <span>{v.welcome.replace('{name}', member.name)}</span>
              <button type="button" onClick={signOut}>{v.signOut}</button>
            </div>
          )}
        </div>
      </section>

      {/* TIERS */}
      <section className="hub-section vp-section">
        <div className="container">
          <header className="hub-head" data-reveal>
            <span className="section-tag">{v.tiersTag}</span>
            <h2 className="hub-title">{v.tiersTitle}</h2>
          </header>
          <div className="vp-tiers">
            {['explorer', 'insider', 'founding'].map((key, i) => {
              const tier = v.tiers[key]
              const isCurrent = key === 'insider' && member
              return (
                <article key={key} className={`vp-tier vp-tier--${key}`} data-reveal style={{ '--d': i }}>
                  {tier.badge && <span className="vp-tier-badge">{tier.badge}</span>}
                  <span className="vp-tier-icon">{TIER_ICONS[key]}</span>
                  <h3>{tier.name}</h3>
                  <p className="vp-tier-price">{tier.price}</p>
                  <p className="vp-tier-note">{tier.note}</p>
                  <ul>
                    {tier.features.map((f) => <li key={f}><Check />{f}</li>)}
                  </ul>
                  {key === 'explorer' && (
                    <Link to="/#intelligence" className="btn btn-ghost hub-btn-round">{tier.cta}</Link>
                  )}
                  {key === 'insider' && (isCurrent
                    ? <span className="vp-tier-current"><Check />{tier.current}</span>
                    : <button type="button" className="btn btn-primary hub-btn-round" onClick={() => goEnroll(false)}>{tier.cta} <ArrowRight /></button>)}
                  {key === 'founding' && (member?.founding
                    ? <span className="vp-tier-current"><Check />{tier.joined}</span>
                    : <button type="button" className="btn btn-ghost hub-btn-round" onClick={() => goEnroll(true)}>{tier.cta}</button>)}
                </article>
              )
            })}
          </div>
        </div>
      </section>

      {/* LIBRARY */}
      <section className="hub-section vp-section">
        <div className="container">
          <header className="hub-head" data-reveal>
            <span className="section-tag">{v.libraryTag}</span>
            <h2 className="hub-title">{v.libraryTitle}</h2>
            <p className="hub-sub">{v.librarySub}</p>
          </header>
          <div className="vp-library">
            {STUDIES.map((s, i) => {
              const open = s.status === 'live' && s.access === 'insider' && member
              return (
                <article key={s.id} className={`vp-study${open ? ' is-open' : ''}`} data-reveal style={{ '--d': i % 3 }}>
                  <div className="vp-study-meta">
                    <span className={`vp-access vp-access--${s.access}`}>{s.access === 'founding' ? <Lock /> : TIER_ICONS.insider}{v.access[s.access]}</span>
                    <span className={`vp-status vp-status--${s.status}`}>{v.status[s.status]}</span>
                    {s.minutes && <span className="vp-minutes">{v.minutes.replace('{n}', s.minutes)}</span>}
                  </div>
                  <h3>{s.title[language] || s.title.en}</h3>
                  <p>{s.summary[language] || s.summary.en}</p>
                  {s.status === 'live' && (open
                    ? <Link to={s.href} className="hub-link">{v.read} <ArrowRight /></Link>
                    : <button type="button" className="vp-unlock" onClick={() => goEnroll(false)}><Lock />{v.unlock}</button>)}
                </article>
              )
            })}
          </div>
          <div className="tr-cta" data-reveal>
            <span>{t('topicRequest.ctaText')}</span>
            <Link to="/#suggest" className="btn btn-ghost hub-btn-round">{t('topicRequest.cta')} <ArrowRight /></Link>
          </div>
        </div>
      </section>

      {/* ENROLL */}
      <section className="hub-section vp-section" id="enroll" ref={enrollRef}>
        <div className="container">
          <div className="vault vp-enroll" data-reveal>
            <div className="vault-inner vp-enroll-inner">
              {member ? (
                <div className="vp-enrolled">
                  <span className="sp-check" aria-hidden="true">
                    <svg viewBox="0 0 52 52" width="56" height="56"><circle cx="26" cy="26" r="24" /><path d="M15 27l7 7 15-15" /></svg>
                  </span>
                  <h2 className="hub-title">{justJoined ? v.enroll.done : v.welcome.replace('{name}', member.name)}</h2>
                  <Link to={STUDIES[0].href} className="btn btn-primary hub-btn-round">{v.read} <ArrowRight /></Link>
                </div>
              ) : (
                <>
                  <div className="vault-copy">
                    <span className="section-tag">{v.enroll.tag}</span>
                    <h2 className="hub-title">{v.enroll.title}</h2>
                    <p className="vault-text">{v.enroll.sub}</p>
                    <ul className="vp-enroll-perks">
                      {v.tiers.insider.features.slice(1).map((f) => <li key={f}><Check />{f}</li>)}
                    </ul>
                  </div>
                  <form className="vp-form" onSubmit={submit} noValidate>
                    <label className="sp-field">
                      <span className="sp-label">{v.enroll.name}</span>
                      <input className="sp-input" type="text" autoComplete="name" maxLength={100} value={form.name} onChange={(e) => set('name', e.target.value)} />
                    </label>
                    <label className="sp-field">
                      <span className="sp-label">{v.enroll.email}</span>
                      <input className="sp-input" type="email" autoComplete="email" maxLength={120} value={form.email} onChange={(e) => set('email', e.target.value)} />
                    </label>
                    <span className="sp-label">{v.enroll.interests}</span>
                    <div className="sp-choices vp-interests">
                      {v.enroll.interestOptions.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          aria-pressed={form.interests.includes(opt)}
                          className={`sp-choice${form.interests.includes(opt) ? ' active' : ''}`}
                          onClick={() => toggleInterest(opt)}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                    <label className="vp-check">
                      <input type="checkbox" checked={form.briefing} onChange={(e) => set('briefing', e.target.checked)} />
                      <span>{v.enroll.briefing}</span>
                    </label>
                    <label className="vp-check">
                      <input type="checkbox" checked={form.founding} onChange={(e) => set('founding', e.target.checked)} />
                      <span>{v.enroll.founding}</span>
                    </label>
                    <input ref={honeypotRef} className="sp-hp" type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
                    {error && <p className="sp-error" role="alert">{v.enroll.errors[error]}</p>}
                    <button type="submit" className="btn btn-primary btn-lg hub-btn-round vp-submit" disabled={sending}>
                      {sending ? v.enroll.sending : <>{v.enroll.submit} <ArrowRight /></>}
                    </button>
                    <p className="sp-privacy">{v.enroll.privacy}</p>
                  </form>
                </>
              )}
            </div>
          </div>
          <p className="vp-note" data-reveal>{v.securityNote}</p>
        </div>
      </section>
    </div>
  )
}
