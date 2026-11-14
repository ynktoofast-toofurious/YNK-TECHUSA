import { Link } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'
import { ArrowLeft, ArrowRight } from '../components/Icons'
import useReveal from '../hooks/useReveal'
import RequestAccess from '../components/RequestAccess'
import { useFullAccess } from '../utils/fullAccess'

const DIM_POS = [[200, 40], [370, 120], [320, 290], [80, 290], [30, 120]]

function StarSchema({ s }) {
  return (
    <svg className="st-schema" viewBox="0 0 400 340" role="img" aria-label={s.s2Title}>
      {DIM_POS.map(([x, y], i) => (
        <line key={i} className="st-link" style={{ '--i': i }} x1="200" y1="170" x2={x} y2={y} />
      ))}
      <g className="st-fact">
        <rect x="120" y="140" width="160" height="60" rx="14" />
        <text x="200" y="164" className="st-fact-label">{s.factLabel}</text>
        <text x="200" y="184" className="st-fact-name">{s.fact}</text>
      </g>
      {DIM_POS.map(([x, y], i) => (
        <g key={s.dims[i]} className="st-dim" style={{ '--i': i }}>
          <rect x={x - 58} y={y - 18} width="116" height="36" rx="18" />
          <text x={x} y={y + 5}>{s.dims[i]}</text>
        </g>
      ))}
    </svg>
  )
}

export default function DrcStudy() {
  const { t, language } = useLanguage()
  const s = t('study')
  const a = t('accessUi')
  const access = useFullAccess('drc-government')
  const member = access.unlocked
  const revealRef = useReveal([language, member])
  const max = Math.max(...s.values)
  const total = s.values.reduce((a, b) => a + b, 0)

  return (
    <div className="hub st-page" ref={revealRef}>
      <div className="hub-bg" aria-hidden="true">
        <div className="hub-glow hub-glow-a" />
        <div className="hub-grid" />
      </div>

      <article className="st-article">
        <div className="container st-container">
          <Link to="/vault" className="st-back hx-in" style={{ '--d': 0 }}><ArrowLeft />{s.back}</Link>
          <span className="section-tag hx-in" style={{ '--d': 1 }}>{s.kicker}</span>
          <h1 className="st-title hx-in" style={{ '--d': 2 }}>{s.title}</h1>
          <p className="st-dek hx-in" style={{ '--d': 3 }}>{s.dek}</p>

          <div className="st-stats hx-in" style={{ '--d': 4 }}>
            {s.stats.map((stat) => (
              <div key={stat.l} className="st-stat">
                <strong>{stat.v}</strong>
                <span>{stat.l}</span>
              </div>
            ))}
          </div>

          {access.checking && <p className="ar-status" role="status">{a.checking}</p>}
          {!member ? (
            <div className="st-locked hx-in" style={{ '--d': 5 }}>
              <div className="st-locked-fade" aria-hidden="true">
                <h2>{s.s1Title}</h2>
                <p>{s.s1}</p>
              </div>
              <div className="st-locked-card">
                {access.invalid && <p className="sp-error" role="alert">{a.invalid}</p>}
                <span className="section-tag">{a.tag}</span>
                <h2>{s.locked.title}</h2>
                <p>{s.locked.text}</p>
                <RequestAccess item={{ type: 'study', id: 'drc-government', title: s.title, path: '/vault/drc-government' }} />
              </div>
            </div>
          ) : (
            <>
              <section className="st-block" data-reveal>
                <h2>{s.s1Title}</h2>
                <p>{s.s1}</p>
              </section>

              <section className="st-block" data-reveal>
                <h2>{s.s2Title}</h2>
                <p>{s.s2}</p>
                <figure className="st-figure"><StarSchema s={s} /></figure>
              </section>

              <section className="st-block" data-reveal>
                <h2>{s.s3Title}</h2>
                <figure className="st-figure st-chart">
                  <figcaption>{s.chartTitle}</figcaption>
                  {s.roles.map((role, i) => (
                    <div key={role} className="st-bar-row">
                      <span className="st-bar-label">{role}</span>
                      <span className="st-bar-track">
                        <span className="st-bar" style={{ '--w': s.values[i] / max, '--i': i }} />
                      </span>
                      <span className="st-bar-value">{s.values[i]}</span>
                    </div>
                  ))}
                  <div className="st-bar-total"><span>Total</span><strong>{total}</strong></div>
                </figure>
                <ol className="st-findings">
                  {s.findings.map((f, i) => <li key={i}><span>0{i + 1}</span>{f}</li>)}
                </ol>
              </section>

              <section className="st-block" data-reveal>
                <h2>{s.s4Title}</h2>
                <p>{s.s4}</p>
              </section>

              <section className="st-block" data-reveal>
                <h2>{s.s5Title}</h2>
                <p>{s.s5}</p>
                <ul className="st-sources">
                  {s.sources.map((src) => (
                    <li key={src.url}><a href={src.url} target="_blank" rel="noopener noreferrer">{src.label} <ArrowRight size={12} /></a></li>
                  ))}
                </ul>
              </section>

              <aside className="st-founding" data-reveal>
                <span className="vp-access vp-access--dataset">{t('vaultUi.kinds.dataset')}</span>
                <p>{s.founding}</p>
                <Link to="/vault?request=drc-dataset#request" className="hub-link">{s.foundingCta} <ArrowRight /></Link>
              </aside>
            </>
          )}
        </div>
      </article>
    </div>
  )
}
