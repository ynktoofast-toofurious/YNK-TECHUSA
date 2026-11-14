import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'
import { ArrowRight } from '../components/Icons'
import RequestAccess from '../components/RequestAccess'
import useReveal from '../hooks/useReveal'
import { LIBRARY } from '../content/vault'
import { INTELLIGENCE } from '../content/latest'
import { hasFullAccess } from '../utils/fullAccess'

const ic = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true, viewBox: '0 0 24 24' }
const Check = () => <svg {...ic} width="14" height="14"><polyline points="20 6 9 17 4 12" /></svg>
const Lock = () => <svg {...ic} width="14" height="14"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>

const KIND_ICONS = {
  article: <svg {...ic} width="13" height="13"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="8" y1="13" x2="16" y2="13" /><line x1="8" y1="17" x2="13" y2="17" /></svg>,
  study: <svg {...ic} width="13" height="13"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>,
  dataset: <svg {...ic} width="13" height="13"><ellipse cx="12" cy="5" rx="8" ry="3" /><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5" /><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" /></svg>,
  prototype: <svg {...ic} width="13" height="13"><path d="M21 16V8a2 2 0 00-1-1.7l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.7l7 4a2 2 0 002 0l7-4a2 2 0 001-1.7z" /><polyline points="3.3 7 12 12 20.7 7" /><line x1="12" y1="22" x2="12" y2="12" /></svg>,
}

// Published articles join the curated studies, datasets and prototype briefings.
const ITEMS = [
  ...INTELLIGENCE.map((a) => ({ id: a.slug, kind: a.type === 'study' ? 'study' : 'article', status: 'live', href: `/latest/${a.slug}`, title: a.title, summary: a.summary })),
  ...LIBRARY,
]

export default function Vault() {
  const { t, language } = useLanguage()
  const v = t('vaultUi')
  const location = useLocation()
  const [selectedId, setSelectedId] = useState(() => new URLSearchParams(location.search).get('request') || '')
  const requestRef = useRef(null)
  const revealRef = useReveal([language])
  const label = (text) => text[language] || text.en
  const selected = ITEMS.find((i) => i.id === selectedId) || null

  useEffect(() => {
    if (location.hash === '#request' || new URLSearchParams(location.search).get('request')) {
      const timer = setTimeout(() => requestRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150)
      return () => clearTimeout(timer)
    }
  }, [location.hash, location.search])

  const choose = (id) => {
    setSelectedId(id)
    requestRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
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
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="hub-section vp-section">
        <div className="container">
          <header className="hub-head" data-reveal>
            <span className="section-tag">{v.howTag}</span>
          </header>
          <ol className="lib-steps">
            {v.how.map((step, i) => (
              <li key={step.t} data-reveal style={{ '--d': i }}>
                <span className="lib-step-num">0{i + 1}</span>
                <h3>{step.t}</h3>
                <p>{step.d}</p>
              </li>
            ))}
          </ol>
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
            {ITEMS.map((item, i) => {
              const unlocked = hasFullAccess(item.id)
              return (
                <article key={item.id} className={`vp-study${unlocked ? ' is-open' : ''}`} data-reveal style={{ '--d': i % 3 }}>
                  <div className="vp-study-meta">
                    <span className={`vp-access vp-access--${item.kind}`}>{KIND_ICONS[item.kind]}{v.kinds[item.kind]}</span>
                    <span className={`vp-status vp-status--${item.status}`}>{v.status[item.status]}</span>
                    {unlocked && <span className="vp-status vp-status--live">{v.unlocked}</span>}
                    {item.minutes && <span className="vp-minutes">{v.minutes.replace('{n}', item.minutes)}</span>}
                  </div>
                  <h3>{label(item.title)}</h3>
                  <p>{label(item.summary)}</p>
                  <div className="vp-actions">
                    {item.href && <Link to={item.href} className="hub-link">{unlocked ? v.open : v.preview} <ArrowRight /></Link>}
                    {!unlocked && (
                      <button type="button" className="vp-unlock" onClick={() => choose(item.id)}>
                        <Lock />{item.status === 'live' ? v.request : v.requestLater}
                      </button>
                    )}
                  </div>
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

      {/* REQUEST */}
      <section className="hub-section vp-section" id="request" ref={requestRef}>
        <div className="container">
          <div className="vault vp-enroll" data-reveal>
            <div className="vault-inner vp-enroll-inner">
              <div className="vault-copy">
                <span className="section-tag">{v.requestTag}</span>
                <h2 className="hub-title">{v.requestTitle}</h2>
                <p className="vault-text">{v.requestSub}</p>
                <ul className="vp-enroll-perks">
                  {v.how.map((step) => <li key={step.t}><Check />{step.t}</li>)}
                </ul>
              </div>
              <div className="vp-form">
                <label className="sp-field">
                  <span className="sp-label">{v.choose}</span>
                  <select className="sp-input" value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
                    <option value="">{v.choosePlaceholder}</option>
                    {ITEMS.map((item) => <option key={item.id} value={item.id}>{v.kinds[item.kind]}: {label(item.title)}</option>)}
                  </select>
                </label>
                {selected && (
                  <RequestAccess
                    key={selected.id}
                    item={{ type: selected.kind, id: selected.id, title: label(selected.title), path: selected.href || '/vault' }}
                  />
                )}
              </div>
            </div>
          </div>
          <p className="vp-note" data-reveal>{v.note}</p>
        </div>
      </section>
    </div>
  )
}
