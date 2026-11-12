import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'
import AIBall3D from '../components/AIBall3D'
import DemoChat from '../components/DemoChat'

const PILLARS = [
  {
    id: 'economy',
    label: 'Economy',
    title: 'Market & Wealth Telemetry',
    signal: 'Interactive Power BI snapshots on inflation, real estate shifts, and labor markets — the numbers behind the headlines.',
    breakdown: 'How the indicators connect: rates move housing velocity, housing moves hiring, hiring moves wages. One model, no media spin.',
    leverage: 'A clear dashboard and mental model to make smarter financial, career, and investment moves.',
    assets: ['Power BI market snapshots', 'Indicator glossary', 'Executive summary briefs'],
  },
  {
    id: 'politics',
    label: 'Politics',
    title: 'Policy & Capital Flows',
    signal: 'Data-driven tracking of legislation, infrastructure spending, and global trade shifts.',
    breakdown: 'Star-schema government models — branches, institutions, geography, and positions — that show who holds power and where capital moves.',
    leverage: 'See regulatory headwinds and government subsidies before they reach your sector.',
    assets: ['Government power-structure models', 'Policy tracking dashboards', 'DAX measure library'],
  },
  {
    id: 'business',
    label: 'Business Systems',
    title: 'Systems, Cloud & Brand Scale',
    signal: 'Real-world teardowns of enterprise automation, cloud architecture, and high-converting brand ecosystems.',
    breakdown: 'Live ecosystems we power — RNB Events, YB Printing, and serverless applications on AWS — dissected layer by layer.',
    leverage: 'Downloadable blueprints to automate your workflows and elevate your own brand.',
    assets: ['Serverless architecture blueprints', 'Brand ecosystem teardowns', 'Automation workflow templates'],
  },
  {
    id: 'insider',
    label: 'Insider Knowledge',
    title: 'The Unfiltered Vault',
    signal: 'Behind-the-curtain engineering notes, SQL & Python scripts, data lifecycle frameworks, and executive briefs.',
    breakdown: 'How high-level architecture is built from scratch: ingestion, modeling, governance, and BI — step by step.',
    leverage: 'A self-paced masterclass for students, analysts, and recruiters who want to see real work, not slides.',
    assets: ['SQL & Python templates', 'Data lifecycle frameworks', 'Executive dossiers'],
  },
  {
    id: 'community',
    label: 'Community Pulse',
    title: 'The YNK Collective',
    signal: 'Live sentiment polls — “Where is the data pointing next?” — open research challenges, and curated mastermind threads.',
    breakdown: 'Readers become contributors. Every poll and challenge feeds the next study the platform publishes.',
    leverage: 'Your voice shapes the research agenda — and you get first access to what it uncovers.',
    assets: ['Sentiment polls', 'Open research challenges', 'Community roundtables'],
  },
]

const METHOD = [
  { n: '01', title: 'Study the Data', text: 'Every brief strips away noise in favor of verified pipelines and visual models.' },
  { n: '02', title: 'Unlock the Playbook', text: 'Access the exact architectures, code frameworks, and business systems inside the Vault.' },
  { n: '03', title: 'Apply & Lead', text: 'Take the model, the template, or the system — and put it to work in your own world.' },
]

const VAULT_ITEMS = ['Raw datasets', 'Python / SQL templates', 'Executive dossiers', 'Community roundtables']

export default function Home() {
  const { t } = useLanguage()
  const [active, setActive] = useState(PILLARS[0].id)
  const pillar = PILLARS.find((p) => p.id === active)

  const jumpToPillar = (id) => {
    setActive(id)
    const el = document.getElementById('pillars')
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 120, behavior: 'smooth' })
  }

  return (
    <div className="hub">
      <div className="hub-glow hub-glow-a" aria-hidden="true"></div>
      <div className="hub-glow hub-glow-b" aria-hidden="true"></div>

      {/* HERO - single viewport */}
      <section className="hero hero-full" id="hero">
        <div className="hero-split">
          {/* LEFT - 3D Ball + Demo Chat */}
          <div className="hero-ball-col">
            <div className="hero-ball-wrap">
              <AIBall3D />
            </div>
            <DemoChat />
          </div>

          {/* RIGHT - Who We Are */}
          <div className="hero-text-col">
            <div className="hero-who">
              <span className="hero-who-tag">{t('intro.tag')}</span>

              <h1 className="hero-who-headline">
                Decode the Signal.<br />
                <span className="text-gradient">Own the Leverage.</span>
              </h1>

              <p className="hero-who-lead">{t('intro.lead')}</p>

              <div className="hub-pill-bar hub-pill-bar-left">
                {PILLARS.map((p, i) => (
                  <button key={p.id} type="button" className="hub-pill" onClick={() => jumpToPillar(p.id)}>
                    {String(i + 1).padStart(2, '0')} · {p.label}
                  </button>
                ))}
              </div>

              <div className="hero-ctas">
                <Link to="/consultants" className="btn btn-primary btn-lg hub-btn-round">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                  Step Inside the Vault
                </Link>
                <Link to="/request-quote" className="btn btn-secondary btn-lg hub-btn-round">
                  Request Access
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PILLARS - Signal / Breakdown / Leverage */}
      <section className="hub-section" id="pillars">
        <div className="container">
          <div className="hub-head">
            <span className="section-tag">Five Pillars · One Rhythm</span>
            <h2 className="hub-title">The Signal <span className="hub-arrow">→</span> The Breakdown <span className="hub-arrow">→</span> <span className="text-gradient">Your Leverage</span></h2>
            <p className="hub-sub">Pick a pillar. See what the data actually says, how the system works, and what you can do with it today.</p>
          </div>

          <div className="hub-pill-bar" role="tablist" aria-label="Pillars">
            {PILLARS.map((p, i) => (
              <button
                key={p.id}
                type="button"
                role="tab"
                aria-selected={active === p.id}
                className={`hub-pill${active === p.id ? ' active' : ''}`}
                onClick={() => setActive(p.id)}
              >
                {String(i + 1).padStart(2, '0')} · {p.label}
              </button>
            ))}
          </div>

          <div className="hub-featured" key={pillar.id}>
            <article className="hub-card hub-card-main">
              <span className="hub-step">{pillar.label} // Featured Study</span>
              <h3>{pillar.title}</h3>

              <div className="hub-steps">
                <div>
                  <span className="hub-step">The Signal</span>
                  <p>{pillar.signal}</p>
                </div>
                <div>
                  <span className="hub-step">The Breakdown</span>
                  <p>{pillar.breakdown}</p>
                </div>
              </div>

              <div className="hub-leverage">
                <strong>Your Leverage:</strong> {pillar.leverage}
              </div>
            </article>

            <aside className="hub-card">
              <span className="hub-step">Inside This Pillar</span>
              <ul className="hub-list">
                {pillar.assets.map((a) => <li key={a}>{a}</li>)}
              </ul>
              <Link to="/consultants" className="hub-link">Unlock in the Vault →</Link>
            </aside>
          </div>
        </div>
      </section>

      {/* THE YNK METHOD */}
      <section className="hub-section">
        <div className="container">
          <div className="hub-head">
            <span className="section-tag">The YNK Method</span>
            <h2 className="hub-title">How you grow here</h2>
          </div>
          <div className="hub-method">
            {METHOD.map((m) => (
              <div key={m.n} className="hub-card">
                <span className="hub-num">{m.n}</span>
                <h3>{m.title}</h3>
                <p>{m.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* THE VAULT */}
      <section className="hub-section" id="vault">
        <div className="container">
          <div className="hub-card hub-vault">
            <span className="section-tag">The YNK Vault · Inner Circle</span>
            <h2 className="hub-title">Real tools. Real architecture. <span className="text-gradient">Yours to use.</span></h2>
            <p className="hub-sub">A member space for builders, executives, and thinkers who want the raw material — not the recap.</p>
            <div className="hub-pill-bar">
              {VAULT_ITEMS.map((v) => <span key={v} className="hub-pill hub-pill-static">{v}</span>)}
            </div>
            <div className="hero-ctas hub-center">
              <Link to="/consultants" className="btn btn-primary btn-lg hub-btn-round">Step Inside the Vault</Link>
              <Link to="/request-quote" className="btn btn-secondary btn-lg hub-btn-round">Request Access</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
