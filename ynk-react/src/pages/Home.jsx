import { useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'
import AIBall3D from '../components/AIBall3D'
import DemoChat from '../components/DemoChat'
import LatestCard from '../components/LatestCard'
import { ArrowRight } from '../components/Icons'
import useReveal from '../hooks/useReveal'
import { LATEST } from '../content/latest'

const svgProps = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
}

const STEP_ICONS = [
  <svg key="discover" {...svgProps} viewBox="0 0 24 24" width="22" height="22"><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>,
  <svg key="decode" {...svgProps} viewBox="0 0 24 24" width="22" height="22"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /><line x1="14" y1="4" x2="10" y2="20" /></svg>,
  <svg key="connect" {...svgProps} viewBox="0 0 24 24" width="22" height="22"><circle cx="5" cy="6" r="2.5" /><circle cx="19" cy="6" r="2.5" /><circle cx="12" cy="18" r="2.5" /><line x1="7.2" y1="7.3" x2="10.6" y2="16" /><line x1="16.8" y1="7.3" x2="13.4" y2="16" /><line x1="7.5" y1="6" x2="16.5" y2="6" /></svg>,
  <svg key="empower" {...svgProps} viewBox="0 0 24 24" width="22" height="22"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>,
]

function DeskVisual({ index }) {
  if (index === 0) {
    return (
      <svg className="desk-visual" viewBox="0 0 240 90" aria-hidden="true">
        <defs>
          <linearGradient id="dv-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#29B5E8" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#29B5E8" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[22, 45, 68].map((y) => <line key={y} x1="0" y1={y} x2="240" y2={y} className="dv-grid" />)}
        <path className="dv-area" d="M0 70 L30 62 L60 66 L90 48 L120 52 L150 34 L180 40 L210 22 L240 26 L240 90 L0 90 Z" fill="url(#dv-area)" />
        <path className="dv-line" d="M0 70 L30 62 L60 66 L90 48 L120 52 L150 34 L180 40 L210 22 L240 26" />
        <circle className="dv-dot" cx="210" cy="22" r="4" />
      </svg>
    )
  }
  if (index === 1) {
    const nodes = [[30, 45], [80, 20], [85, 70], [140, 40], [190, 18], [200, 68], [120, 80]]
    const links = [[0, 1], [0, 2], [1, 3], [2, 3], [3, 4], [3, 5], [2, 6], [6, 5], [1, 4]]
    return (
      <svg className="desk-visual" viewBox="0 0 240 90" aria-hidden="true">
        {links.map(([a, b], i) => (
          <line key={i} className="dv-link" style={{ '--i': i }} x1={nodes[a][0]} y1={nodes[a][1]} x2={nodes[b][0]} y2={nodes[b][1]} />
        ))}
        {nodes.map(([x, y], i) => <circle key={i} className="dv-node" style={{ '--i': i }} cx={x} cy={y} r={i === 3 ? 6 : 4} />)}
      </svg>
    )
  }
  const bars = [28, 44, 36, 58, 50, 70, 64]
  return (
    <svg className="desk-visual" viewBox="0 0 240 90" aria-hidden="true">
      {bars.map((h, i) => (
        <rect key={i} className="dv-bar" style={{ '--i': i }} x={12 + i * 32} y={86 - h} width="18" height={h} rx="4" />
      ))}
    </svg>
  )
}

function spotlight(e) {
  const r = e.currentTarget.getBoundingClientRect()
  e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`)
  e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`)
}

function Words({ text, start = 0 }) {
  return text.split(' ').map((w, i) => (
    <span key={`${w}-${i}`} className="hx-word" style={{ '--d': start + i }}>{w}&nbsp;</span>
  ))
}

export default function Home() {
  const { t, language } = useLanguage()
  const location = useLocation()
  const revealRef = useReveal([language])
  const progressRef = useRef(null)

  const h = t('home')
  const titleAWords = h.titleA.split(' ').length
  const newest = LATEST[0]
  const announceInner = (
    <>
      <span className="hx-announce-badge">{t('latestUi.announce')}</span>
      <span className="hx-announce-text">{newest.title[language] || newest.title.en}</span>
      <ArrowRight size={12} />
    </>
  )

  useEffect(() => {
    const bar = progressRef.current
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      if (bar) bar.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!location.hash) return
    const id = location.hash.slice(1)
    const timer = setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120)
    return () => clearTimeout(timer)
  }, [location.hash])

  const jump = (e, id) => {
    e.preventDefault()
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="hub" ref={revealRef}>
      <div className="hub-progress" ref={progressRef} aria-hidden="true" />
      <div className="hub-bg" aria-hidden="true">
        <div className="hub-glow hub-glow-a" />
        <div className="hub-glow hub-glow-b" />
        <div className="hub-grid" />
      </div>

      {/* HERO */}
      <section className="hx" id="hero">
        <div className="hx-inner">
          <div className="hx-copy">
            {newest.native
              ? <a href={newest.href} className="hx-announce hx-in" style={{ '--d': 0 }}>{announceInner}</a>
              : <Link to={newest.href} className="hx-announce hx-in" style={{ '--d': 0 }}>{announceInner}</Link>}
            <span className="hx-eyebrow hx-in" style={{ '--d': 1 }}>
              <span className="hx-pulse" aria-hidden="true" />
              {h.eyebrow}
            </span>
            <h1 className="hx-title" key={language}>
              <span className="hx-line"><Words text={h.titleA} start={1} /></span>
              <span className="hx-line hx-line--accent"><Words text={h.titleB} start={1 + titleAWords} /></span>
            </h1>
            <p className="hx-lead hx-in" style={{ '--d': 8 }}>{h.lead}</p>
            <div className="hx-ctas hx-in" style={{ '--d': 10 }}>
              <a href="#intelligence" className="btn btn-primary btn-lg hub-btn-round" onClick={(e) => jump(e, 'intelligence')}>
                {h.ctaExplore}
                <ArrowRight />
              </a>
              <a href="#vault" className="btn btn-ghost btn-lg hub-btn-round" onClick={(e) => jump(e, 'vault')}>
                <svg {...svgProps} viewBox="0 0 24 24" width="15" height="15"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
                {h.ctaVault}
              </a>
            </div>
            <p className="hx-tagline hx-in" style={{ '--d': 12 }}>{h.tagline}</p>
          </div>

          <div className="hx-visual hx-in" style={{ '--d': 4 }}>
            <div className="hx-orb">
              <svg className="hx-rings" viewBox="0 0 400 400" aria-hidden="true">
                <g className="hx-ring hx-ring--1">
                  <circle cx="200" cy="200" r="190" />
                  <circle className="hx-node" cx="200" cy="10" r="4" />
                  <circle className="hx-node" cx="390" cy="200" r="3" />
                </g>
                <g className="hx-ring hx-ring--2">
                  <circle cx="200" cy="200" r="160" />
                  <circle className="hx-node" cx="40" cy="200" r="3.5" />
                  <circle className="hx-node" cx="313" cy="313" r="3" />
                </g>
                <g className="hx-ring hx-ring--3">
                  <circle cx="200" cy="200" r="128" />
                  <circle className="hx-node" cx="200" cy="328" r="3" />
                </g>
              </svg>
              <div className="hx-core" aria-hidden="true" />
              <div className="hx-ball"><AIBall3D /></div>
              {h.chips.map((chip, i) => (
                <span key={chip} className={`hx-chip hx-chip--${i + 1}`}>
                  <svg viewBox="0 0 36 14" width="36" height="14" aria-hidden="true">
                    <polyline points={['0,11 7,8 14,9 21,5 28,6 36,2', '0,9 7,10 14,6 21,7 28,3 36,4', '0,12 7,9 14,10 21,6 28,7 36,3'][i]} />
                  </svg>
                  {chip}
                </span>
              ))}
            </div>
          </div>
        </div>

        <a href="#intelligence" className="hx-scroll" onClick={(e) => jump(e, 'intelligence')}>
          <span className="hx-mouse" aria-hidden="true"><span /></span>
          {h.scroll}
        </a>
      </section>

      {/* THE INTELLIGENCE DESK */}
      <section className="hub-section" id="intelligence">
        <div className="container">
          <header className="hub-head" data-reveal>
            <span className="section-tag">{h.desk.tag}</span>
            <h2 className="hub-title">{h.desk.title1}<br /><span className="text-gradient">{h.desk.title2}</span></h2>
            <p className="hub-sub">{h.desk.sub}</p>
          </header>
          <div className="desk-grid">
            {h.desk.cards.map((card, i) => (
              <article key={i} className="desk-card" data-reveal style={{ '--d': i }} onMouseMove={spotlight}>
                <div className="desk-top">
                  <span className="desk-num">0{i + 1}</span>
                  <span className="desk-kicker">{card.kicker}</span>
                </div>
                <DeskVisual index={i} />
                <h3 className="desk-q">{card.q}</h3>
                <p className="desk-text">{card.text}</p>
                <span className="status-pill"><span className="status-dot" />{h.desk.status}</span>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* THE LATEST */}
      <section className="hub-section" id="latest">
        <div className="container">
          <header className="hub-head" data-reveal>
            <span className="section-tag">{t('latestUi.tag')}</span>
            <h2 className="hub-title">{t('latestUi.title1')}<br /><span className="text-gradient">{t('latestUi.title2')}</span></h2>
            <p className="hub-sub">{t('latestUi.sub')}</p>
          </header>
          <div className="lt-home" key={language}>
            <LatestCard item={LATEST[0]} featured />
            <div className="lt-home-side">
              {LATEST.slice(1, 3).map((item, i) => (
                <LatestCard key={item.id} item={item} style={{ '--d': i + 1 }} />
              ))}
            </div>
          </div>
          <div className="lt-home-more" data-reveal>
            <Link to="/latest" className="btn btn-ghost hub-btn-round">{t('latestUi.viewAll')} <ArrowRight /></Link>
          </div>
        </div>
      </section>

      {/* THE YNK METHOD */}
      <section className="hub-section" id="method">
        <div className="container">
          <header className="hub-head" data-reveal>
            <span className="section-tag">{h.method.tag}</span>
            <h2 className="hub-title">{h.method.title1}<br /><span className="text-gradient">{h.method.title2}</span></h2>
            <p className="hub-sub">{h.method.sub}</p>
          </header>
          <div className="method" data-reveal>
            <div className="method-track" aria-hidden="true"><span /></div>
            <ol className="method-steps">
              {h.method.steps.map((step, i) => (
                <li key={i} className="method-step" style={{ '--d': i }}>
                  <span className="method-icon">{STEP_ICONS[i]}</span>
                  <span className="method-num">0{i + 1}</span>
                  <h3>{step.t}.</h3>
                  <p>{step.d}</p>
                </li>
              ))}
            </ol>
          </div>
          <p className="method-closing" data-reveal>{h.method.closing}</p>
        </div>
      </section>

      {/* THE INSIDER VAULT */}
      <section className="hub-section" id="vault">
        <div className="container">
          <div className="vault" data-reveal>
            <div className="vault-inner">
              <div className="vault-copy">
                <span className="section-tag">{h.vault.tag}</span>
                <h2 className="hub-title">{h.vault.title}</h2>
                <p className="hub-sub">{h.vault.sub}</p>
                <p className="vault-text">{h.vault.text}</p>
                <p className="vault-motto">{h.vault.motto}</p>
                <div className="vault-actions">
                  <span className="status-pill"><span className="status-dot" />{h.vault.status}</span>
                  <Link to="/consultants" className="hub-link">{h.vault.cta} <ArrowRight /></Link>
                </div>
              </div>
              <ul className="vault-list">
                {h.vault.items.map((item, i) => (
                  <li key={item} style={{ '--d': i }}>
                    <span className="vault-lock" aria-hidden="true">
                      <svg {...svgProps} viewBox="0 0 24 24" width="16" height="16"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* COMMUNITY & EMPOWERMENT */}
      <section className="hub-section" id="community">
        <div className="container community">
          <div className="community-copy" data-reveal>
            <span className="section-tag">{h.community.tag}</span>
            <h2 className="hub-title">{h.community.title1}<br /><span className="text-gradient">{h.community.title2}</span></h2>
            <p className="hub-sub">{h.community.sub}</p>
            <p className="vault-text">{h.community.text}</p>
            <span className="status-pill"><span className="status-dot" />{h.community.status}</span>
          </div>
          <div className="community-prompts" aria-hidden="true">
            {h.community.prompts.map((p, i) => (
              <div key={i} className="prompt-bubble" data-reveal style={{ '--d': i + 1 }}>
                <svg {...svgProps} viewBox="0 0 24 24" width="18" height="18"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>
                <span>{p}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* YNK TECH SOLUTIONS */}
      <section className="hub-section" id="solutions">
        <div className="container solutions">
          <div className="solutions-copy" data-reveal>
            <span className="section-tag">{h.solutions.tag}</span>
            <h2 className="hub-title">{h.solutions.title1}<br /><span className="text-gradient">{h.solutions.title2}</span></h2>
            <p className="vault-text">{h.solutions.text}</p>
            <ul className="caps">
              {h.solutions.caps.map((c) => <li key={c}>{c}</li>)}
            </ul>
            <p className="vault-motto">{h.solutions.motto}</p>
            <div className="hx-ctas">
              <Link to="/start-project" className="btn btn-primary hub-btn-round">{t('hubNav.startProject')} <ArrowRight /></Link>
              <Link to="/it-services" className="btn btn-ghost hub-btn-round">{h.solutions.ctaIT}</Link>
              <Link to="/branding" className="btn btn-ghost hub-btn-round">{h.solutions.ctaBrand}</Link>
            </div>
          </div>
          <div className="solutions-chat" data-reveal style={{ '--d': 2 }}>
            <span className="solutions-chat-label"><span className="hx-pulse" aria-hidden="true" />{h.solutions.chatLabel}</span>
            <DemoChat />
          </div>
        </div>
      </section>
    </div>
  )
}
